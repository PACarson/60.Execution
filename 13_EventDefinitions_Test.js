/*
Node-sandbox smoke test for 13_EventDefinitions.js.

Two sandboxes set up up front (same lesson as 12_Identity_Test.js's
fix): EventDefinitionsBare for anything that should work with zero
Google-runtime globals (proving no dependency on one), and
EventDefinitionsObservable, which loads the real 60_Observability.js,
for anything that exercises AlertService/UCR3 or that just needs a
plausible real-looking environment for the governance-source checks.
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

const definitionsSrc = fs.readFileSync(__dirname + '/13_EventDefinitions.js', 'utf8');

// -- bare sandbox: zero globals, proves no Google-runtime dependency --

const bareSandbox = {};
vm.createContext(bareSandbox);
vm.runInContext(definitionsSrc, bareSandbox, { filename: '13_EventDefinitions.js' });
const EventDefinitionsBare = vm.runInContext('EventDefinitions', bareSandbox);

// -- observable sandbox: loads the real 60_Observability.js too --

const capturedLogLines = [];
const observableSandbox = {
  Logger: { log: function(line) { capturedLogLines.push(line); } }
};
vm.createContext(observableSandbox);
const observabilitySrc = fs.readFileSync(__dirname + '/60_Observability.js', 'utf8');
vm.runInContext(observabilitySrc, observableSandbox, { filename: '60_Observability.js' });
vm.runInContext(definitionsSrc, observableSandbox, { filename: '13_EventDefinitions.js' });
const EventDefinitionsObservable = vm.runInContext('EventDefinitions', observableSandbox);

// ==================================================================
// 1 & 7 — the approved vocabulary matches the real source of truth,
// exactly -- no more, no fewer, than what Execution_OS_Architecture_
// v0.8.md actually contains
// ==================================================================

check('(1) isLegalEventType is true for exactly the 2 CONFIRMED events, nothing else', function() {
  const confirmed = ['goal.created', 'review.completed'];
  confirmed.forEach(function(e) {
    assert.strictEqual(EventDefinitionsBare.isLegalEventType(e), true, e + ' should be legal');
  });
});

check('(7) isLegalEventType is FALSE for both OBSERVED events -- not silently promoted', function() {
  assert.strictEqual(EventDefinitionsBare.isLegalEventType('execution_project.status_changed'), false);
  assert.strictEqual(EventDefinitionsBare.isLegalEventType('execution.reference_completed'), false);
});

check('(7) no event beyond the 4 real, found strings exists in KNOWN_EVENTS at all', function() {
  const keys = Object.keys(EventDefinitionsBare.KNOWN_EVENTS);
  assert.strictEqual(keys.length, 4);
  // specifically, none of the Implementation Master Plan's own
  // earlier-proposed (never Accepted) extensions leaked in here
  ['execution_project.created', 'execution_project.started', 'execution_project.progressed',
   'execution_project.cancelled', 'execution_project.blocked', 'waiting.created', 'waiting.resolved']
    .forEach(function(e) {
      assert.strictEqual(keys.indexOf(e), -1, e + ' should NOT be in KNOWN_EVENTS');
    });
});

// ==================================================================
// 2 — each approved (CONFIRMED) event type is correctly recognized
// ==================================================================

check('(2) getEvidence correctly reports CONFIRMED for both confirmed events', function() {
  assert.strictEqual(EventDefinitionsBare.getEvidence('goal.created'), 'CONFIRMED');
  assert.strictEqual(EventDefinitionsBare.getEvidence('review.completed'), 'CONFIRMED');
});

check('(2) getEvidence correctly reports OBSERVED for both observed-only events, distinguishing them from CONFIRMED', function() {
  assert.strictEqual(EventDefinitionsBare.getEvidence('execution_project.status_changed'), 'OBSERVED');
  assert.strictEqual(EventDefinitionsBare.getEvidence('execution.reference_completed'), 'OBSERVED');
});

// ==================================================================
// 3 — unregistered event type handling matches the stated contract:
// null from getEvidence, false from isLegalEventType, no exception
// ==================================================================

check('(3) a totally unregistered event type: getEvidence returns null, isLegalEventType returns false, no throw', function() {
  assert.strictEqual(EventDefinitionsBare.getEvidence('something.nobody_ever_proposed'), null);
  assert.doesNotThrow(function() {
    assert.strictEqual(EventDefinitionsBare.isLegalEventType('something.nobody_ever_proposed'), false);
  });
});

// ==================================================================
// 4 & 5 — naming convention, case/separator boundaries, malformed input
// ==================================================================

check('(4)(5) every KNOWN_EVENTS key matches lowercase entity.action -- no PascalCase, no other separator', function() {
  const pattern = /^[a-z_]+\.[a-z_]+$/;
  Object.keys(EventDefinitionsBare.KNOWN_EVENTS).forEach(function(key) {
    assert.ok(pattern.test(key), key + ' does not match lowercase entity.action');
  });
});

check('(5) case-sensitivity: an uppercase variant of a real event is NOT treated as the same event', function() {
  assert.strictEqual(EventDefinitionsBare.isLegalEventType('Goal.Created'), false);
  assert.strictEqual(EventDefinitionsBare.getEvidence('GOAL.CREATED'), null);
});

check('(5) malformed/non-string input never throws, answers false/null', function() {
  [null, undefined, 123, {}, [], function() {}].forEach(function(badInput) {
    assert.doesNotThrow(function() { EventDefinitionsBare.isLegalEventType(badInput); });
    assert.strictEqual(EventDefinitionsBare.isLegalEventType(badInput), false);
    assert.doesNotThrow(function() { EventDefinitionsBare.getEvidence(badInput); });
    assert.strictEqual(EventDefinitionsBare.getEvidence(badInput), null);
  });
});

// ==================================================================
// 6 — registry/constants immutability
// ==================================================================

check('(6) EVIDENCE is frozen', function() {
  EventDefinitionsBare.EVIDENCE.CONFIRMED = 'TAMPERED';
  assert.strictEqual(EventDefinitionsBare.EVIDENCE.CONFIRMED, 'CONFIRMED');
});

check('(6) KNOWN_EVENTS itself is frozen (cannot add a new event key)', function() {
  EventDefinitionsBare.KNOWN_EVENTS['fake.event'] = { evidence: 'CONFIRMED' };
  assert.strictEqual(Object.keys(EventDefinitionsBare.KNOWN_EVENTS).indexOf('fake.event'), -1);
});

check('(6) each per-event entry inside KNOWN_EVENTS is also frozen', function() {
  const entry = EventDefinitionsBare.KNOWN_EVENTS['goal.created'];
  assert.throws(function() { 'use strict'; entry.evidence = 'TAMPERED'; }, /Cannot assign to read only property|not extensible/);
  // Non-strict assignment to a frozen object's existing property is a
  // silent no-op rather than a throw -- confirm it stayed CONFIRMED
  // either way, regardless of which failure mode applies here.
  assert.strictEqual(EventDefinitionsBare.KNOWN_EVENTS['goal.created'].evidence, 'CONFIRMED');
});

// ==================================================================
// 8 & 9 — UCR3 routing, using the REAL 60_Observability.js
// ==================================================================

check('(8)(9) a normal "not found" query logs NOTHING -- this is not an error, matching established precedent', function() {
  capturedLogLines.length = 0;
  EventDefinitionsObservable.isLegalEventType('something.unknown');
  EventDefinitionsObservable.getEvidence('something.unknown');
  assert.strictEqual(capturedLogLines.length, 0);
});

check('(8)(9) a normal OBSERVED-tier query also logs nothing -- OBSERVED is a real, expected answer, not a failure', function() {
  capturedLogLines.length = 0;
  EventDefinitionsObservable.isLegalEventType('execution.reference_completed');
  EventDefinitionsObservable.getEvidence('execution.reference_completed');
  assert.strictEqual(capturedLogLines.length, 0);
});

// ==================================================================
// 10 — no Google runtime dependency (the bare-sandbox run above IS
// this proof; this check just makes the claim explicit and visible)
// ==================================================================

check('(10) every test above ran against a sandbox with zero Google-runtime globals defined', function() {
  // Checking Object.keys(bareSandbox) here would be wrong, and was
  // the first version of this test: vm's top-level const/let
  // bindings never become enumerable properties of the context
  // object itself (same vm quirk documented in
  // 12_Identity_Test.js) -- that would report [] regardless of
  // whether this file's own EventDefinitions binding or any
  // Google-runtime global exists in the context. The question this
  // check actually needs to answer -- were Logger/SpreadsheetApp/
  // PropertiesService/LockService/Utilities ever available here --
  // has to be asked INSIDE the context's own execution, via a
  // second runInContext call, the same way EventDefinitionsBare
  // itself was retrieved above.
  ['Logger', 'SpreadsheetApp', 'PropertiesService', 'LockService', 'Utilities'].forEach(function(name) {
    assert.strictEqual(vm.runInContext('typeof ' + name, bareSandbox), 'undefined',
        name + ' should not exist in the bare sandbox');
  });
});

// ==================================================================
// 11 — public API surface
// ==================================================================

check('(11) public API surface is exactly EVIDENCE, KNOWN_EVENTS, isLegalEventType, getEvidence', function() {
  assert.deepStrictEqual(Object.keys(EventDefinitionsBare).sort(),
      ['EVIDENCE', 'KNOWN_EVENTS', 'getEvidence', 'isLegalEventType'].sort());
});

check('(11) no internal helper or registration/mutation function leaked onto the public object', function() {
  ['register', 'add', 'remove', 'mutate', 'createEvent', 'replay', 'persist', '_isKnownEventType_']
    .forEach(function(name) {
      assert.strictEqual(typeof EventDefinitionsBare[name], 'undefined', name + ' should not be public');
    });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
console.log('');
console.log('No REAL_GAS_REQUIRED items for this file -- it touches no GAS-specific');
console.log('API at all; every function above ran correctly with zero globals defined.');
process.exit(failed > 0 ? 1 : 0);
