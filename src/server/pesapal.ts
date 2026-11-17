export type PesaPalEnvironment = 'sandbox' | 'live';

export interface PesaPalConfig {
  env: PesaPalEnvironment;
  consumerKey: string;
  consumerSecret: string;
  ipnId?: string;
}

export interface PesaPalSubmitOrderInput {
  orderId: string;
  currency: string;
  amount: number;
  description: string;
  callbackUrl: string;
  ipnUrl: string;
  billingAddress: {
    emailAddress: string;
    phoneNumber?: string;
    firstName: string;
    lastName?: string;
    line1?: string;
    city?: string;
    countryCode?: string;
  };
}

export interface PesaPalSubmitOrderResult {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}

export interface PesaPalTransactionStatus {
  orderTrackingId: string;
  merchantReference: string;
  statusCode: number;
  statusDescription: string;
  normalizedStatus: 'COMPLETED' | 'FAILED' | 'INVALID' | 'REVERSED' | 'PENDING';
  amount: number;
  currency: string;
  paymentMethod?: string;
  confirmationCode?: string;
}

export class PesaPalNotConfiguredError extends Error {
  readonly code = 'PESAPAL_NOT_CONFIGURED';
  readonly status = 503;

  constructor(
    message = 'Server-side PesaPal credentials (PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET) are not configured.'
  ) {
    super(message);
    this.name = 'PesaPalNotConfiguredError';
  }
}

export class PesaPalApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 502, details?: unknown) {
    super(message);
    this.name = 'PesaPalApiError';
    this.status = status;
    this.details = details;
  }
}

export function getPesaPalBaseUrl(env: PesaPalEnvironment): string {
  return env === 'live' ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';
}

export function readPesaPalConfigFromEnv(): PesaPalConfig | null {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY?.trim() || '';
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET?.trim() || '';
  if (!consumerKey || !consumerSecret) {
    return null;
  }

  const rawEnv = (process.env.PESAPAL_ENV || 'sandbox').trim().toLowerCase();
  const env: PesaPalEnvironment = rawEnv === 'live' || rawEnv === 'production' ? 'live' : 'sandbox';
  const ipnId = process.env.PESAPAL_IPN_ID?.trim() || undefined;

  return {
    env,
    consumerKey,
    consumerSecret,
    ipnId,
  };
}

export function normalizePesaPalStatus(
  statusCode: unknown,
  description: unknown
): PesaPalTransactionStatus['normalizedStatus'] {
  const code = typeof statusCode === 'number' ? statusCode : Number(statusCode);
  const desc = typeof description === 'string' ? description.trim().toLowerCase() : '';

  if (code === 1 || desc === 'completed') return 'COMPLETED';
  if (code === 2 || desc === 'failed') return 'FAILED';
  if (code === 3 || desc === 'reversed') return 'REVERSED';
  if (code === 0 || desc === 'invalid') return 'INVALID';
  return 'PENDING';
}

export interface PesaPalClientOptions {
  config?: PesaPalConfig | null;
  fetchFn?: typeof fetch;
}

export class PesaPalClient {
  private readonly explicitConfig?: PesaPalConfig | null;
  private readonly fetchFn: typeof fetch;
  private cachedToken: { token: string; expiresAt: number } | null = null;
  private tokenPromise: Promise<string> | null = null;
  private cachedIpnByUrl = new Map<string, string>();

  constructor(options: PesaPalClientOptions = {}) {
    this.explicitConfig = options.config;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private requireConfig(): PesaPalConfig {
    const cfg = this.explicitConfig !== undefined ? this.explicitConfig : readPesaPalConfigFromEnv();
    if (!cfg) {
      throw new PesaPalNotConfiguredError();
    }
    return cfg;
  }

  isConfigured(): boolean {
    const cfg = this.explicitConfig !== undefined ? this.explicitConfig : readPesaPalConfigFromEnv();
    return Boolean(cfg?.consumerKey && cfg?.consumerSecret);
  }

  async getAccessToken(): Promise<string> {
    const cfg = this.requireConfig();
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.token;
    }

    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = (async () => {
      const baseUrl = getPesaPalBaseUrl(cfg.env);
      const response = await this.fetchFn(`${baseUrl}/api/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumer_key: cfg.consumerKey,
          consumer_secret: cfg.consumerSecret,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok || !data.token || data.error) {
        throw new PesaPalApiError(
          `PesaPal authentication failed (${response.status}).`,
          502,
          data.error ?? data
        );
      }

      const token = String(data.token);
      const expiryRaw = typeof data.expiryDate === 'string' ? Date.parse(data.expiryDate) : NaN;
      const expiresAt = Number.isFinite(expiryRaw) ? expiryRaw : Date.now() + 4 * 60_000;
      this.cachedToken = { token, expiresAt };
      return token;
    })().finally(() => {
      this.tokenPromise = null;
    });

    return this.tokenPromise;
  }

  async resolveIpnId(ipnUrl: string): Promise<string> {
    const cfg = this.requireConfig();
    if (cfg.ipnId) return cfg.ipnId;

    const existing = this.cachedIpnByUrl.get(ipnUrl);
    if (existing) return existing;

    const token = await this.getAccessToken();
    const baseUrl = getPesaPalBaseUrl(cfg.env);
    const response = await this.fetchFn(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'GET',
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || !data.ipn_id || data.error) {
      throw new PesaPalApiError(
        `Failed to register PesaPal IPN listener (${response.status}).`,
        502,
        data.error ?? data
      );
    }

    const ipnId = String(data.ipn_id);
    this.cachedIpnByUrl.set(ipnUrl, ipnId);
    return ipnId;
  }

  async submitOrderRequest(input: PesaPalSubmitOrderInput): Promise<PesaPalSubmitOrderResult> {
    const cfg = this.requireConfig();
    const token = await this.getAccessToken();
    const notificationId = await this.resolveIpnId(input.ipnUrl);
    const baseUrl = getPesaPalBaseUrl(cfg.env);

    const response = await this.fetchFn(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: input.orderId,
        currency: input.currency,
        amount: Math.round(input.amount * 100) / 100,
        description: input.description.slice(0, 100),
        callback_url: input.callbackUrl,
        notification_id: notificationId,
        billing_address: {
          email_address: input.billingAddress.emailAddress,
          phone_number: input.billingAddress.phoneNumber || '',
          country_code: input.billingAddress.countryCode || 'KE',
          first_name: input.billingAddress.firstName,
          last_name: input.billingAddress.lastName || '',
          line_1: input.billingAddress.line1 || '',
          city: input.billingAddress.city || 'Nairobi',
        },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || !data.order_tracking_id || !data.redirect_url || data.error) {
      throw new PesaPalApiError(
        `PesaPal order submission failed (${response.status}).`,
        502,
        data.error ?? data
      );
    }

    return {
      orderTrackingId: String(data.order_tracking_id),
      merchantReference: String(data.merchant_reference || input.orderId),
      redirectUrl: String(data.redirect_url),
    };
  }

  async getTransactionStatus(orderTrackingId: string): Promise<PesaPalTransactionStatus> {
    const cfg = this.requireConfig();
    const token = await this.getAccessToken();
    const baseUrl = getPesaPalBaseUrl(cfg.env);

    const url = new URL(`${baseUrl}/api/Transactions/GetTransactionStatus`);
    url.searchParams.set('orderTrackingId', orderTrackingId);

    const response = await this.fetchFn(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || data.error) {
      throw new PesaPalApiError(
        `PesaPal transaction verification failed (${response.status}).`,
        502,
        data.error ?? data
      );
    }

    const statusCode = Number(data.status_code ?? -1);
    const statusDescription = String(
      data.payment_status_description || data.status || 'Unknown'
    );

    return {
      orderTrackingId,
      merchantReference: String(data.merchant_reference || ''),
      statusCode,
      statusDescription,
      normalizedStatus: normalizePesaPalStatus(statusCode, statusDescription),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency || 'USD').toUpperCase(),
      paymentMethod: data.payment_method ? String(data.payment_method) : undefined,
      confirmationCode: data.confirmation_code ? String(data.confirmation_code) : undefined,
    };
  }
}
