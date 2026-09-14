/*
Node-sandbox smoke test for 60_Observability.js. Not a GAS runtime
file — this is a verification tool only, run via `node`, not clasp.
Stubs the one Apps Script global (Logger) this file touches, per the
same "read the .js files directly" approach used elsewhere in this
ecosystem (see [[reminder-os]]'s own run_reminder_tests.js precedent).
*/

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const capturedLogLines = [];
const sandbox = {
  Logger: { log: function(line) { capturedLogLines.push(line); } },
  console: console
};
vm.createContext(sandbox);

const src = fs.readFileSync(__dirname + '/60_Observability.js', 'utf8');
vm.runInContext(src, sandbox, { filename: '60_Observability.js' });

// Node's vm module does not expose top-level const/let bindings as
// properties of the sandbox object (only var/function declarations
// get that treatment) -- this is a real quirk of the harness, not of
// the file under test. A second evaluation in the SAME context
// resolves the lexical binding correctly, matching how GAS itself
// shares one global scope across a project's concatenated files.
const AlertService = vm.runInContext('AlertService', sandbox);
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

check('LEVELS exposes INFO/WARN/ERROR', function() {
  assert.strictEqual(AlertService.LEVELS.INFO, 'INFO');
  assert.strictEqual(AlertService.LEVELS.WARN, 'WARN');
  assert.strictEqual(AlertService.LEVELS.ERROR, 'ERROR');
});

check('LEVELS is frozen (cannot be mutated)', function() {
  AlertService.LEVELS.INFO = 'TAMPERED';
  assert.strictEqual(AlertService.LEVELS.INFO, 'INFO');
});

check('log() with valid ERROR level returns "module: msg"', function() {
  const result = AlertService.log('ERROR', 'Config', 'getSpreadsheetId', {}, 'Spreadsheet ID not found');
  assert.strictEqual(result, 'Config: Spreadsheet ID not found');
});

check('log() with INFO level returns msg unchanged (no module prefix)', function() {
  const result = AlertService.log('INFO', 'Config', 'init', {}, 'Config loaded');
  assert.strictEqual(result, 'Config loaded');
});

check('log() writes exactly one line to Logger per call', function() {
  const before = capturedLogLines.length;
  AlertService.log('WARN', 'Schema', 'verifyTabs', { tab: 'Goals' }, 'Tab missing, creating');
  assert.strictEqual(capturedLogLines.length, before + 1);
});

check('log() line includes module, func, and a timestamp', function() {
  capturedLogLines.length = 0;
  AlertService.log('ERROR', 'Identity', 'generateId', { prefix: 'GOAL' }, 'boom');
  const line = capturedLogLines[0];
  assert.ok(line.includes('Identity.generateId'), 'missing module.func: ' + line);
  assert.ok(line.includes('boom'), 'missing msg: ' + line);
  assert.ok(/\[\d{4}-\d{2}-\d{2}T/.test(line), 'missing ISO timestamp: ' + line);
});

check('invalid level does not throw, coerces to ERROR shape', function() {
  const result = AlertService.log('NOT_A_LEVEL', 'Config', 'foo', {}, 'bar');
  assert.strictEqual(result, 'Config: bar');
});

check('undefined/null module, func, msg do not throw', function() {
  const result = AlertService.log('ERROR', undefined, null, {}, undefined);
  assert.strictEqual(result, 'UnknownModule: (no message)');
});

check('circular input object does not throw (JSON.stringify guard)', function() {
  const circular = {};
  circular.self = circular;
  assert.doesNotThrow(function() {
    AlertService.log('ERROR', 'Ref', 'sync', circular, 'circular test');
  });
});

check('log() never throws regardless of input shape', function() {
  assert.doesNotThrow(function() { AlertService.log(); });
  assert.doesNotThrow(function() { AlertService.log(123, [], function(){}, Symbol('x'), {}); });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
