/*
Node-sandbox smoke test for 12_Identity.js.

Two sandboxes, both set up near the top before any check() runs:
  1. IdentityBare -- ZERO globals defined, not even Logger -- proves
     "no Google runtime dependency" is true by construction for the
     SUCCESS path, not just by omission of the explicitly excluded
     APIs (SpreadsheetApp/PropertiesService/LockService/TruthEngine/
     EventLog/Schema).
  2. IdentityObservable -- loads the real 60_Observability.js too,
     for every test that exercises the FAILURE path (rejections, and
     the explicit UCR3-routing checks), since that path is the only
     place 12_Identity.js calls AlertService.

The two were originally split so the bare-sandbox setup ran first
and the observable one was built later, with every rejection test
using the bare one. That was wrong: rejecting an invalid prefix goes
through the catch block, which calls AlertService -- so those tests
need IdentityObservable, not IdentityBare. The mistake surfaced as
soon as this ran against the real 60_Observability.js (every
rejection test failed with "AlertService is not defined" instead of
the expected message) rather than the bare sandbox's stand-in. Fixed
by building both sandboxes up front and using the right one per
test, based on which path each test actually exercises.
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

const identitySrc = fs.readFileSync(__dirname + '/12_Identity.js', 'utf8');

// ==================================================================
// Part 1 — success path, NO globals defined at all (proves G)
// ==================================================================

const bareSandbox = {}; // intentionally empty -- no Logger, nothing
vm.createContext(bareSandbox);
vm.runInContext(identitySrc, bareSandbox, { filename: '12_Identity.js' });
const IdentityBare = vm.runInContext('Identity', bareSandbox);

// Part 2's sandbox is set up here too (rather than further down) so
// that the rejection tests below -- which, on reflection, exercise
// the FAILURE path and so legitimately need AlertService per this
// file's own documented design -- can use IdentityObservable instead
// of IdentityBare. Using IdentityBare for them was the actual bug
// found when this test was first run against the real
// 60_Observability.js: every rejection case threw "AlertService is
// not defined" instead of the expected "Invalid prefix" message,
// because IdentityBare's sandbox never loaded AlertService at all.
// That is a correct reflection of this file's real dependency
// structure (success path needs nothing, failure path needs
// AlertService) -- the bug was in which sandbox the test picked, not
// in 12_Identity.js.
const capturedLogLines = [];
const observableSandbox = {
  Logger: { log: function(line) { capturedLogLines.push(line); } }
};
vm.createContext(observableSandbox);
const observabilitySrc = fs.readFileSync(__dirname + '/60_Observability.js', 'utf8');
vm.runInContext(observabilitySrc, observableSandbox, { filename: '60_Observability.js' });
vm.runInContext(identitySrc, observableSandbox, { filename: '12_Identity.js' });
const IdentityObservable = vm.runInContext('Identity', observableSandbox);

check('(G) generateId succeeds with zero globals defined -- no Google runtime needed', function() {
  const id = IdentityBare.generateId('GOAL');
  assert.strictEqual(typeof id, 'string');
});

check('(A)(B) valid ID generation has the correct prefix and shape', function() {
  const id = IdentityBare.generateId('GOAL');
  assert.ok(/^GOAL-[0-9a-z]+-[0-9a-z]{6}$/.test(id), 'unexpected shape: ' + id);
  assert.ok(id.startsWith('GOAL-'));
});

check('(C) format validation: rejects empty string', function() {
  assert.throws(function() { IdentityObservable.generateId(''); }, /Invalid prefix/);
});

check('(C)(F) format validation: rejects lowercase', function() {
  assert.throws(function() { IdentityObservable.generateId('goal'); }, /Invalid prefix/);
});

check('(C)(F) format validation: rejects a prefix with a hyphen already in it', function() {
  assert.throws(function() { IdentityObservable.generateId('GOAL-X'); }, /Invalid prefix/);
});

check('(C)(F) format validation: rejects non-string input (number)', function() {
  assert.throws(function() { IdentityObservable.generateId(123); }, /Invalid prefix/);
});

check('(C)(F) format validation: rejects non-string input (null/undefined)', function() {
  assert.throws(function() { IdentityObservable.generateId(null); }, /Invalid prefix/);
  assert.throws(function() { IdentityObservable.generateId(undefined); }, /Invalid prefix/);
});

check('(C)(F) format validation: rejects a prefix over 10 characters', function() {
  assert.throws(function() { IdentityObservable.generateId('WAYTOOLONGPREFIX'); }, /Invalid prefix/);
});

check('(C) format validation: accepts a 10-character prefix (boundary)', function() {
  assert.doesNotThrow(function() { IdentityBare.generateId('ABCDEFGHIJ'); });
});

check('(C) format validation: accepts a single-letter prefix (boundary)', function() {
  assert.doesNotThrow(function() { IdentityBare.generateId('X'); });
});

check('(D) repeated generation with the same prefix never repeats (1000 calls)', function() {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const id = IdentityBare.generateId('GOAL');
    assert.ok(!seen.has(id), 'collision at call ' + i + ': ' + id);
    seen.add(id);
  }
  assert.strictEqual(seen.size, 1000);
});

check('(D) rapid back-to-back calls in the same millisecond do not collide', function() {
  // Generate as many as possible within a single Date.now() tick to
  // specifically stress the same-millisecond case, not just "1000
  // calls sometime during the test run".
  const seen = new Set();
  const startMs = Date.now();
  let count = 0;
  while (Date.now() === startMs && count < 5000) {
    const id = IdentityBare.generateId('GOAL');
    assert.ok(!seen.has(id), 'same-millisecond collision: ' + id);
    seen.add(id);
    count++;
  }
  assert.ok(count > 0, 'loop did not run within the millisecond -- test is inconclusive, not failing');
});

check('(E) different prefixes are distinguished correctly', function() {
  const goalId = IdentityBare.generateId('GOAL');
  const refId = IdentityBare.generateId('REF');
  assert.ok(goalId.startsWith('GOAL-'));
  assert.ok(refId.startsWith('REF-'));
  assert.notStrictEqual(goalId, refId);
});

check('(I) public API surface is exactly generateId -- nothing else exposed', function() {
  assert.deepStrictEqual(Object.keys(IdentityBare), ['generateId']);
});

check('(I) no internal helper leaked onto the public object', function() {
  assert.strictEqual(typeof IdentityBare._isValidPrefix_, 'undefined');
  assert.strictEqual(typeof IdentityBare._timestampComponent_, 'undefined');
  assert.strictEqual(typeof IdentityBare._randomSuffix_, 'undefined');
  assert.strictEqual(typeof IdentityBare.PREFIX_PATTERN, 'undefined');
});

// ==================================================================
// Part 2 — failure path, which does need AlertService (UCR3 routing)
// (sandbox for this was already set up above, alongside Part 1's,
// so the rejection tests earlier in this file could use it too)
// ==================================================================

check('(H) invalid prefix routes through AlertService as ERROR (UCR3)', function() {
  capturedLogLines.length = 0;
  try { IdentityObservable.generateId('bad'); } catch (e) {}
  assert.strictEqual(capturedLogLines.length, 1);
  assert.ok(capturedLogLines[0].includes('[ERROR] Identity.generateId'));
});

check('(H) valid generation on the SAME loaded instance logs nothing at all', function() {
  capturedLogLines.length = 0;
  IdentityObservable.generateId('GOAL');
  assert.strictEqual(capturedLogLines.length, 0);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
console.log('');
console.log('No REAL_GAS_REQUIRED items for this file -- generateId() never touches');
console.log('SpreadsheetApp, PropertiesService, LockService, or any other GAS-specific');
console.log('API. Part 1 above ran with zero globals defined at all, which is the');
console.log('strongest form of that claim this environment can demonstrate.');
process.exit(failed > 0 ? 1 : 0);
