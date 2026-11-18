import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function readProjectFile(relPath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), 'utf8');
}

test('Cart uses live deliveryZones instead of hardcoded mock delivery fee and enforces inventory caps', () => {
  const cartSrc = readProjectFile('src/pages/customer/Cart.tsx');
  assert.doesNotMatch(cartSrc, /Simple mock fee/);
  assert.match(cartSrc, /deliveryZones/);
  assert.match(cartSrc, /atMaxStock/);
  assert.match(cartSrc, /aria-label=/);
});

test('ProductCard enforces inventory <= 0 out-of-stock guard and accessible aria-labels', () => {
  const cardSrc = readProjectFile('src/components/ui/ProductCard.tsx');
  assert.match(cardSrc, /product\.inventory <= 0/);
  assert.match(cardSrc, /Out of Stock/);
  assert.match(cardSrc, /aria-label=/);
  assert.match(cardSrc, /justAdded/);
});
