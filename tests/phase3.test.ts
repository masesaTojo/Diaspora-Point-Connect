import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve(process.cwd(), 'src');

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

test('adminStorage.ts is completely removed and never imported anywhere in src/', () => {
  const legacyPath = path.join(srcDir, 'lib', 'adminStorage.ts');
  assert.equal(fs.existsSync(legacyPath), false, 'adminStorage.ts must be deleted');

  const files = walkFiles(srcDir);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      content,
      /adminStorage/,
      `Unexpected adminStorage reference in ${path.relative(process.cwd(), file)}`
    );
  }
});

test('No hardcoded mockAdminAlerts, mockUsers usage, or legacy localStorage domain keys remain in pages/components/contexts', () => {
  const files = walkFiles(srcDir);
  for (const file of files) {
    const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
    if (rel === 'src/lib/mockData.ts') continue;

    const content = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /mockAdminAlerts/, `mockAdminAlerts found in ${rel}`);
    assert.doesNotMatch(content, /mockUsers/, `mockUsers found in ${rel}`);
    assert.doesNotMatch(content, /localStorage\.(get|set|remove)Item\(['"]dpc_orders['"]/, `localStorage dpc_orders found in ${rel}`);
    assert.doesNotMatch(content, /localStorage\.(get|set|remove)Item\(['"]dpc_audit_logs['"]/, `localStorage dpc_audit_logs found in ${rel}`);
    assert.doesNotMatch(content, /localStorage\.(get|set|remove)Item\(['"]dpc_recipients['"]/, `localStorage dpc_recipients found in ${rel}`);
    assert.doesNotMatch(content, /localStorage\.(get|set|remove)Item\(['"]dpc_stock_movements['"]/, `localStorage dpc_stock_movements found in ${rel}`);

    if (rel !== 'src/lib/firebaseSeeder.ts') {
      assert.doesNotMatch(content, /mockDrivers/, `mockDrivers found in ${rel}`);
    }
  }
});
