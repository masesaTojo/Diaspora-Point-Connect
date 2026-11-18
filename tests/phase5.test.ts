import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApiApp } from '../src/server/app.ts';
import { buildCsvContent, csvEscape } from '../src/lib/csv.ts';

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

test('All PWA manifest icons and index.html icon assets exist and are non-empty', () => {
  const requiredAssets = [
    'public/logo.png',
    'public/pwa-192x192.png',
    'public/pwa-512x512.png',
    'public/pwa-maskable-512x512.png',
    'public/apple-touch-icon.png',
    'public/favicon.ico',
  ];

  for (const asset of requiredAssets) {
    const abs = path.resolve(process.cwd(), asset);
    assert.ok(fs.existsSync(abs), `Expected PWA/icon asset to exist: ${asset}`);
    const stat = fs.statSync(abs);
    assert.ok(stat.size > 100, `Expected asset ${asset} to be non-empty (${stat.size} bytes)`);
  }

  const indexHtml = readProjectFile('index.html');
  assert.doesNotMatch(indexHtml, /\/vite\.svg/, 'index.html should not reference non-existent /vite.svg');
  assert.match(indexHtml, /<meta name="theme-color" content="#002147"/);
  assert.match(indexHtml, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
  assert.match(indexHtml, /<script type="application\/ld\+json">/);

  const ldMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, 'Expected Schema.org JSON-LD block in index.html');
  const parsedLd = JSON.parse(ldMatch[1]);
  assert.equal(parsedLd['@type'], 'OnlineStore');
  assert.equal(parsedLd.name, 'Diaspora Point Connect');
});

test('CSV helper safely escapes quotes and protects against spreadsheet formula injection', () => {
  assert.equal(csvEscape('Ochieng, "Sam"'), '"Ochieng, ""Sam"""');
  assert.equal(csvEscape('=SUM(A1:A5)'), '"\'=SUM(A1:A5)"');
  assert.equal(csvEscape('+254712345678'), '"\'+254712345678"');

  const csv = buildCsvContent(['Order ID', 'Total'], [['ORD-1', '120.50']]);
  assert.equal(csv, '"Order ID","Total"\r\n"ORD-1","120.50"');
});

test('Orders and Analytics pages use shared RFC-4180 CSV export helper', () => {
  const ordersSrc = readProjectFile('src/pages/admin/Orders.tsx');
  assert.match(ordersSrc, /downloadCsvFile/);
  assert.match(ordersSrc, /Proof of Delivery/);

  const analyticsSrc = readProjectFile('src/pages/admin/Analytics.tsx');
  assert.match(analyticsSrc, /downloadCsvFile/);
  assert.match(analyticsSrc, /Export Report/);
});

test('ShopContext consumes authoritative /api/fx-rates endpoint', () => {
  const shopContextSrc = readProjectFile('src/contexts/ShopContext.tsx');
  assert.match(shopContextSrc, /fetch\('\/api\/fx-rates'\)/);
  assert.doesNotMatch(shopContextSrc, /open\.er-api\.com/);
});

test('GET /api/fx-rates returns supported FX rates with security headers', async () => {
  const app = createApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/fx-rates`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('permissions-policy'));
    const body = (await res.json()) as {
      ok: boolean;
      base: string;
      rates: Record<string, number>;
    };
    assert.equal(body.ok, true);
    assert.equal(body.base, 'USD');
    assert.equal(body.rates.USD, 1);
    assert.ok(typeof body.rates.KES === 'number' && body.rates.KES > 0);
    assert.ok(typeof body.rates.GBP === 'number' && body.rates.GBP > 0);
    assert.ok(typeof body.rates.EUR === 'number' && body.rates.EUR > 0);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
