import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PesaPalApiError,
  PesaPalClient,
  PesaPalNotConfiguredError,
  getPesaPalBaseUrl,
  normalizePesaPalStatus,
} from '../src/server/pesapal.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

test('getPesaPalBaseUrl maps sandbox vs live environments accurately', () => {
  assert.equal(getPesaPalBaseUrl('sandbox'), 'https://cybqa.pesapal.com/pesapalv3');
  assert.equal(getPesaPalBaseUrl('live'), 'https://pay.pesapal.com/v3');
});

test('normalizePesaPalStatus maps status codes and descriptions reliably', () => {
  assert.equal(normalizePesaPalStatus(1, 'Completed'), 'COMPLETED');
  assert.equal(normalizePesaPalStatus(99, 'completed'), 'COMPLETED');
  assert.equal(normalizePesaPalStatus(2, 'Failed'), 'FAILED');
  assert.equal(normalizePesaPalStatus(3, 'Reversed'), 'REVERSED');
  assert.equal(normalizePesaPalStatus(0, 'Invalid'), 'INVALID');
  assert.equal(normalizePesaPalStatus(-1, 'Pending'), 'PENDING');
});

test('PesaPalClient fails closed with 503 PesaPalNotConfiguredError when credentials are absent', async () => {
  const client = new PesaPalClient({ config: null });
  assert.equal(client.isConfigured(), false);

  await assert.rejects(
    () => client.getAccessToken(),
    (err: unknown) => err instanceof PesaPalNotConfiguredError && err.status === 503
  );
  await assert.rejects(
    () =>
      client.submitOrderRequest({
        orderId: 'DPC-100001',
        currency: 'USD',
        amount: 45,
        description: 'Test Order',
        callbackUrl: 'https://example.com/callback',
        ipnUrl: 'https://example.com/ipn',
        billingAddress: {
          emailAddress: 'buyer@example.com',
          firstName: 'Test',
        },
      }),
    (err: unknown) => err instanceof PesaPalNotConfiguredError && err.status === 503
  );
  await assert.rejects(
    () => client.getTransactionStatus('trk-123'),
    (err: unknown) => err instanceof PesaPalNotConfiguredError && err.status === 503
  );
});

test('PesaPalClient caches OAuth tokens and coalesces concurrent token requests', async () => {
  let tokenCalls = 0;
  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/Auth/RequestToken')) {
      tokenCalls++;
      return jsonResponse({
        token: `tok-${tokenCalls}`,
        expiryDate: new Date(Date.now() + 5 * 60_000).toISOString(),
      });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const client = new PesaPalClient({
    config: { env: 'sandbox', consumerKey: 'key-1', consumerSecret: 'sec-1' },
    fetchFn: mockFetch,
  });

  const [t1, t2, t3] = await Promise.all([
    client.getAccessToken(),
    client.getAccessToken(),
    client.getAccessToken(),
  ]);
  assert.equal(t1, 'tok-1');
  assert.equal(t2, 'tok-1');
  assert.equal(t3, 'tok-1');
  assert.equal(tokenCalls, 1);

  const cached = await client.getAccessToken();
  assert.equal(cached, 'tok-1');
  assert.equal(tokenCalls, 1);
});

test('PesaPalClient registers IPN, submits order request, and parses transaction status', async () => {
  const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || 'GET';
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    calls.push({ url, method, body });

    if (url.endsWith('/api/Auth/RequestToken')) {
      return jsonResponse({
        token: 'pesapal-bearer-1',
        expiryDate: new Date(Date.now() + 5 * 60_000).toISOString(),
      });
    }
    if (url.endsWith('/api/URLSetup/RegisterIPN')) {
      return jsonResponse({ ipn_id: 'ipn-registered-99' });
    }
    if (url.endsWith('/api/Transactions/SubmitOrderRequest')) {
      return jsonResponse({
        order_tracking_id: 'trk-abc-123',
        merchant_reference: 'DPC-555000',
        redirect_url: 'https://cybqa.pesapal.com/iframe?id=trk-abc-123',
      });
    }
    if (url.includes('/api/Transactions/GetTransactionStatus')) {
      return jsonResponse({
        payment_method: 'Mpesa',
        amount: 65.5,
        currency: 'USD',
        status_code: 1,
        payment_status_description: 'Completed',
        confirmation_code: 'MPESA998877',
        merchant_reference: 'DPC-555000',
      });
    }
    return jsonResponse({ error: 'Not found' }, 404);
  };

  const client = new PesaPalClient({
    config: { env: 'sandbox', consumerKey: 'k', consumerSecret: 's' },
    fetchFn: mockFetch,
  });

  const submitRes = await client.submitOrderRequest({
    orderId: 'DPC-555000',
    currency: 'USD',
    amount: 65.5,
    description: 'Diaspora Point Connect Gift Order DPC-555000',
    callbackUrl: 'https://dpc.example/checkout?orderId=DPC-555000&pesapalCallback=1',
    ipnUrl: 'https://dpc.example/api/payments/pesapal/ipn',
    billingAddress: {
      emailAddress: 'sender@example.com',
      phoneNumber: '+15551234567',
      firstName: 'Amina',
      lastName: 'Otieno',
      line1: 'Westlands Rd',
      city: 'Nairobi',
      countryCode: 'KE',
    },
  });

  assert.equal(submitRes.orderTrackingId, 'trk-abc-123');
  assert.equal(submitRes.merchantReference, 'DPC-555000');
  assert.match(submitRes.redirectUrl, /cybqa\.pesapal\.com/);

  const registerCall = calls.find((c) => c.url.endsWith('/api/URLSetup/RegisterIPN'));
  assert.equal(registerCall?.body?.url, 'https://dpc.example/api/payments/pesapal/ipn');
  assert.equal(registerCall?.body?.ipn_notification_type, 'GET');

  const submitCall = calls.find((c) => c.url.endsWith('/api/Transactions/SubmitOrderRequest'));
  assert.equal(submitCall?.body?.notification_id, 'ipn-registered-99');
  assert.equal(submitCall?.body?.amount, 65.5);

  const txStatus = await client.getTransactionStatus('trk-abc-123');
  assert.equal(txStatus.normalizedStatus, 'COMPLETED');
  assert.equal(txStatus.amount, 65.5);
  assert.equal(txStatus.currency, 'USD');
  assert.equal(txStatus.paymentMethod, 'Mpesa');
  assert.equal(txStatus.confirmationCode, 'MPESA998877');
  assert.equal(txStatus.merchantReference, 'DPC-555000');
});

test('PesaPalClient throws PesaPalApiError on upstream gateway failures', async () => {
  const mockFetch: typeof fetch = async () =>
    jsonResponse({ error: { message: 'invalid_consumer_key' } }, 401);

  const client = new PesaPalClient({
    config: { env: 'sandbox', consumerKey: 'bad', consumerSecret: 'bad' },
    fetchFn: mockFetch,
  });

  await assert.rejects(
    () => client.getAccessToken(),
    (err: unknown) => err instanceof PesaPalApiError && err.status === 502
  );
});
