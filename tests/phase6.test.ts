import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

test('SEO robots.txt and sitemap.xml exist and protect admin/api paths', () => {
  const robots = readProjectFile('public/robots.txt');
  assert.match(robots, /Disallow:\s*\/admin/);
  assert.match(robots, /Disallow:\s*\/api\//);
  assert.match(robots, /Sitemap:\s*\/sitemap\.xml/);

  const sitemap = readProjectFile('public/sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const loc of ['/shop', '/gift-builder', '/track', '/about', '/support', '/faq']) {
    assert.match(sitemap, new RegExp(`<loc>${loc}</loc>`), `Expected ${loc} in sitemap.xml`);
  }
});

test('App.tsx exposes route aliases, branded 404 page, and Account.tsx links to /track', () => {
  const appSrc = readProjectFile('src/App.tsx');
  assert.match(appSrc, /path="track"/);
  assert.match(appSrc, /path="track-order"/);
  assert.match(appSrc, /path="how-it-works"/);
  assert.match(appSrc, /404 — Page Not Found/);
  assert.match(appSrc, /Browse Gift Catalog/);

  const accountSrc = readProjectFile('src/pages/customer/Account.tsx');
  assert.doesNotMatch(accountSrc, /to=\{`\/track-order/);
  assert.match(accountSrc, /to=\{`\/track\?orderId=/);
});

test('GiftBuilder integrates saved Kenya recipients quick-select for verified users', () => {
  const giftBuilderSrc = readProjectFile('src/pages/customer/GiftBuilder.tsx');
  assert.match(giftBuilderSrc, /Quick Select Saved Recipient in Kenya/);
  assert.match(giftBuilderSrc, /'recipients'/);
});
