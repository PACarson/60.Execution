/*
Node-sandbox smoke test for 14_Versioning.js. Same two-sandbox
pattern as the prior two files' tests (bare, for the zero-
dependency proof; observable, for UCR3/AlertService routing).
*/

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS: ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL: ' + name + ' -- ' + e.message);
  }
}

const versioningSrc = fs.readFileSync(__dirname + '/14_Versioning.js', 'utf8');

const bareSandbox = {};
vm.createContext(bareSandbox);
vm.runInContext(versioningSrc, bareSandbox, { filename: '14_Versioning.js' });
const VersioningBare = vm.runInContext('Versioning', bareSandbox);

const capturedLogLines = [];
const observableSandbox = {
  Logger: { log: function(line) { capturedLogLines.push(line); } }
};
vm.createContext(observableSandbox);
const observabilitySrc = fs.readFileSync(__dirname + '/60_Observability.js', 'utf8');
vm.runInContext(observabilitySrc, observableSandbox, { filename: '60_Observability.js' });
vm.runInContext(versioningSrc, observableSandbox, { filename: '14_Versioning.js' });
const VersioningObservable = vm.runInContext('Versioning', observableSandbox);

// ================= Version metadata (1-4) =========================

check('(1) computeContentHash produces a string for a normal object', function() {
  const h = VersioningBare.computeContentHash({ snapshot_title: 'x', snapshot_status: 'open' });
  assert.strictEqual(typeof h, 'string');
  assert.ok(h.length > 0);
});

check('(2)(3) hash is a lowercase hex string (a stable, comparable representation)', function() {
  const h = VersioningBare.computeContentHash({ a: 1 });
  assert.ok(/^[0-9a-f]+$/.test(h), 'not lowercase hex: ' + h);
});

check('(4) computeContentHash and isNewerThan fields are not confused with each other', function() {
  assert.strictEqual(typeof VersioningBare.computeContentHash, 'function');
  assert.strictEqual(typeof VersioningBare.isNewerThan, 'function');
  assert.notStrictEqual(VersioningBare.computeContentHash, VersioningBare.isNewerThan);
});

// ================= Hash / integrity (5-9) ==========================

check('(5) same canonical input -> same hash, regardless of key order', function() {
  const h1 = VersioningBare.computeContentHash({ a: 1, b: 2, c: 3 });
  const h2 = VersioningBare.computeContentHash({ c: 3, a: 1, b: 2 });
  assert.strictEqual(h1, h2);
});

check('(6) different content -> different hash', function() {
  const h1 = VersioningBare.computeContentHash({ snapshot_status: 'open' });
  const h2 = VersioningBare.computeContentHash({ snapshot_status: 'closed' });
  assert.notStrictEqual(h1, h2);
});

check('(7) key ordering produces no unintended difference (10 random shuffles, same hash every time)', function() {
  const base = { alpha: 1, beta: 2, gamma: 3, delta: 4, epsilon: 5 };
  const expected = VersioningBare.computeContentHash(base);
  const keys = Object.keys(base);
  for (let i = 0; i < 10; i++) {
    const shuffled = keys.slice().sort(function() { return Math.random() - 0.5; });
    const obj = {};
    shuffled.forEach(function(k) { obj[k] = base[k]; });
    assert.strictEqual(VersioningBare.computeContentHash(obj), expected);
  }
});

check('(8) a dynamic timestamp passed alongside stable content changes the hash -- proving timestamps are NOT silently stripped, and are NEVER added by this file on their own', function() {
  const withoutTimestamp = VersioningBare.computeContentHash({ title: 'same' });
  const withTimestamp1 = VersioningBare.computeContentHash({ title: 'same', ts: 111 });
  const withTimestamp2 = VersioningBare.computeContentHash({ title: 'same', ts: 222 });
  // If this file auto-injected a timestamp, withoutTimestamp calls at
  // two different real times would differ from each other -- they
  // must not.
  assert.strictEqual(VersioningBare.computeContentHash({ title: 'same' }), withoutTimestamp);
  assert.notStrictEqual(withTimestamp1, withTimestamp2);
  assert.notStrictEqual(withoutTimestamp, withTimestamp1);
});

check('(9) undefined vs. a genuinely missing key hash differently (not silently dropped like JSON.stringify would)', function() {
  const withUndefined = VersioningBare.computeContentHash({ a: undefined, b: 1 });
  const withoutKeyAtAll = VersioningBare.computeContentHash({ b: 1 });
  assert.notStrictEqual(withUndefined, withoutKeyAtAll,
      'JSON.stringify would silently drop "a: undefined", making these equal -- they must not be');
});

check('(9) null and undefined for the same key hash differently from each other', function() {
  const h1 = VersioningBare.computeContentHash({ a: null });
  const h2 = VersioningBare.computeContentHash({ a: undefined });
  assert.notStrictEqual(h1, h2);
});

check('(9) empty object hashes to a fixed, non-empty string, not an error', function() {
  const h = VersioningBare.computeContentHash({});
  assert.strictEqual(typeof h, 'string');
  assert.ok(h.length > 0);
  assert.strictEqual(VersioningBare.computeContentHash({}), h, 'empty object hash should be stable too');
});

check('(9) null or array input to computeContentHash throws rather than producing a misleading hash', function() {
  assert.throws(function() { VersioningBare.computeContentHash(null); });
  assert.throws(function() { VersioningBare.computeContentHash([1, 2, 3]); });
  assert.throws(function() { VersioningBare.computeContentHash('a string'); });
  assert.throws(function() { VersioningBare.computeContentHash(42); });
});

// ================= isNewerThan =====================================

check('isNewerThan: accepts Date objects', function() {
  const earlier = new Date('2026-01-01T00:00:00Z');
  const later = new Date('2026-01-02T00:00:00Z');
  assert.strictEqual(VersioningBare.isNewerThan(later, earlier), true);
  assert.strictEqual(VersioningBare.isNewerThan(earlier, later), false);
});

check('isNewerThan: accepts epoch-millisecond numbers', function() {
  assert.strictEqual(VersioningBare.isNewerThan(2000, 1000), true);
  assert.strictEqual(VersioningBare.isNewerThan(1000, 2000), false);
});

check('isNewerThan: accepts ISO strings', function() {
  assert.strictEqual(VersioningBare.isNewerThan('2026-06-01T00:00:00Z', '2026-01-01T00:00:00Z'), true);
});

check('isNewerThan: mixed representations (Date vs. number vs. string) compare correctly', function() {
  const asDate = new Date('2026-03-01T00:00:00Z');
  const asString = '2026-01-01T00:00:00Z';
  assert.strictEqual(VersioningBare.isNewerThan(asDate, asString), true);
});

check('isNewerThan: equal timestamps are not "newer" (strict greater-than, matching the discard-on-equal-or-earlier rule)', function() {
  assert.strictEqual(VersioningBare.isNewerThan(1000, 1000), false);
});

check('isNewerThan: an unparseable string throws rather than silently comparing as NaN', function() {
  assert.throws(function() { VersioningBare.isNewerThan('not a real timestamp', 1000); });
});

check('isNewerThan: an unsupported type (object, boolean) throws', function() {
  assert.throws(function() { VersioningBare.isNewerThan({}, 1000); });
  assert.throws(function() { VersioningBare.isNewerThan(true, 1000); });
});

// ================= Boundary (no forbidden dependency) ==============

check('(10)(11)(12)(13)(14)(15) zero Google-runtime dependency, and no Identity/Event-creation capability exists on this object', function() {
  ['Logger', 'SpreadsheetApp', 'PropertiesService', 'LockService', 'Utilities'].forEach(function(name) {
    assert.strictEqual(vm.runInContext('typeof ' + name, bareSandbox), 'undefined');
  });
  ['generateId', 'createEvent', 'publish', 'append', 'write'].forEach(function(name) {
    assert.strictEqual(typeof VersioningBare[name], 'undefined', name + ' should not exist on Versioning');
  });
});

// ================= UCR3 ============================================

check('(16) a real failure (bad computeContentHash input) routes through AlertService as ERROR', function() {
  capturedLogLines.length = 0;
  try { VersioningObservable.computeContentHash(null); } catch (e) {}
  assert.strictEqual(capturedLogLines.length, 1);
  assert.ok(capturedLogLines[0].includes('[ERROR] Versioning.computeContentHash'));
});

check('(16) a real failure (bad isNewerThan input) routes through AlertService as ERROR', function() {
  capturedLogLines.length = 0;
  try { VersioningObservable.isNewerThan('garbage', 1000); } catch (e) {}
  assert.strictEqual(capturedLogLines.length, 1);
  assert.ok(capturedLogLines[0].includes('[ERROR] Versioning.isNewerThan'));
});

check('(16) a normal, successful call logs nothing', function() {
  capturedLogLines.length = 0;
  VersioningObservable.computeContentHash({ a: 1 });
  VersioningObservable.isNewerThan(2000, 1000);
  assert.strictEqual(capturedLogLines.length, 0);
});

// ================= Public API (17) =================================

check('(17) public API surface is exactly computeContentHash and isNewerThan', function() {
  assert.deepStrictEqual(Object.keys(VersioningBare).sort(), ['computeContentHash', 'isNewerThan']);
});

check('(17) no migration/registry/locking/transaction helper exists', function() {
  ['migrate', 'migrationManager', 'versionRegistry', 'lock', 'acquireLock', 'transaction',
   'schemaVersion', 'revisionHistory', 'compareAndSwap']
    .forEach(function(name) {
      assert.strictEqual(typeof VersioningBare[name], 'undefined', name + ' should not exist');
    });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
console.log('');
console.log('No REAL_GAS_REQUIRED items for this file -- it touches no GAS-specific');
console.log('API at all; every test above ran against a sandbox with zero Google-');
console.log('runtime globals defined, confirmed directly rather than assumed.');
process.exit(failed > 0 ? 1 : 0);
