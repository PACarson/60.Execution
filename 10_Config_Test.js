/*
Node-sandbox smoke test for 10_Config.js. Same approach as
60_Observability_Test.js: vm.runInContext + a second same-context
evaluation to retrieve top-level const bindings (Node's vm module
doesn't expose them as sandbox object properties).

Loads 60_Observability.js FIRST, in the same context, since Config
depends on AlertService for UCR3 — this mirrors how GAS itself
shares one global scope across a project's concatenated files.
*/

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const capturedLogLines = [];
let mockProperties = {};

const sandbox = {
  Logger: { log: function(line) { capturedLogLines.push(line); } },
  PropertiesService: {
    getScriptProperties: function() {
      return {
        getProperty: function(key) {
          return Object.prototype.hasOwnProperty.call(mockProperties, key) ? mockProperties[key] : null;
        }
      };
    }
  },
  console: console
};
vm.createContext(sandbox);

const observabilitySrc = fs.readFileSync(__dirname + '/60_Observability.js', 'utf8');
vm.runInContext(observabilitySrc, sandbox, { filename: '60_Observability.js' });

const configSrc = fs.readFileSync(__dirname + '/10_Config.js', 'utf8');
vm.runInContext(configSrc, sandbox, { filename: '10_Config.js' });

const Config = vm.runInContext('Config', sandbox);

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

function resetProperties(overrides) {
  mockProperties = overrides || {};
  capturedLogLines.length = 0;
}

// -- getSpreadsheetId --------------------------------------------

check('getSpreadsheetId: valid configuration retrieval', function() {
  resetProperties({ EXEC_OS_SPREADSHEET_ID: 'abc123' });
  assert.strictEqual(Config.getSpreadsheetId(), 'abc123');
});

check('getSpreadsheetId: reflects a changed property (proves not hardcoded)', function() {
  resetProperties({ EXEC_OS_SPREADSHEET_ID: 'first-id' });
  assert.strictEqual(Config.getSpreadsheetId(), 'first-id');
  mockProperties.EXEC_OS_SPREADSHEET_ID = 'second-id';
  assert.strictEqual(Config.getSpreadsheetId(), 'second-id');
});

check('getSpreadsheetId: missing required configuration throws', function() {
  resetProperties({});
  assert.throws(function() { Config.getSpreadsheetId(); }, /Config: Spreadsheet ID is not set/);
});

check('getSpreadsheetId: missing configuration routes through AlertService (UCR3)', function() {
  resetProperties({});
  try { Config.getSpreadsheetId(); } catch (e) {}
  assert.strictEqual(capturedLogLines.length, 1);
  assert.ok(capturedLogLines[0].includes('[ERROR] Config.getSpreadsheetId'));
});

// -- getActiveAiAdapter -------------------------------------------

check('getActiveAiAdapter: valid configuration retrieval', function() {
  resetProperties({ EXEC_OS_ACTIVE_AI_ADAPTER: 'PERSONAL_AI_CORE' });
  assert.strictEqual(Config.getActiveAiAdapter(), 'PERSONAL_AI_CORE');
});

check('getActiveAiAdapter: default behavior when unset (explicitly supported by ADR-015)', function() {
  resetProperties({});
  assert.strictEqual(Config.getActiveAiAdapter(), Config.AI_ADAPTERS.DIRECT_LLM);
});

check('getActiveAiAdapter: invalid configuration falls back to default, does not throw', function() {
  resetProperties({ EXEC_OS_ACTIVE_AI_ADAPTER: 'NOT_A_REAL_ADAPTER' });
  assert.doesNotThrow(function() { Config.getActiveAiAdapter(); });
  assert.strictEqual(Config.getActiveAiAdapter(), Config.AI_ADAPTERS.DIRECT_LLM);
});

check('getActiveAiAdapter: invalid configuration routes a WARN through AlertService', function() {
  resetProperties({ EXEC_OS_ACTIVE_AI_ADAPTER: 'NOT_A_REAL_ADAPTER' });
  Config.getActiveAiAdapter();
  assert.strictEqual(capturedLogLines.length, 1);
  assert.ok(capturedLogLines[0].includes('[WARN] Config.getActiveAiAdapter'));
});

// -- getTelegramBotToken -------------------------------------------

check('getTelegramBotToken: valid configuration retrieval', function() {
  resetProperties({ EXEC_OS_TELEGRAM_BOT_TOKEN: 'fake-token-value' });
  assert.strictEqual(Config.getTelegramBotToken(), 'fake-token-value');
});

check('getTelegramBotToken: unset token returns null, does not throw (no bot exists yet)', function() {
  resetProperties({});
  assert.doesNotThrow(function() { Config.getTelegramBotToken(); });
  assert.strictEqual(Config.getTelegramBotToken(), null);
});

// -- contract shape -------------------------------------------------

check('PROPERTY_KEYS and AI_ADAPTERS are frozen', function() {
  Config.AI_ADAPTERS.DIRECT_LLM = 'TAMPERED';
  assert.strictEqual(Config.AI_ADAPTERS.DIRECT_LLM, 'DIRECT_LLM');
  Config.PROPERTY_KEYS.SPREADSHEET_ID = 'TAMPERED';
  assert.strictEqual(Config.PROPERTY_KEYS.SPREADSHEET_ID, 'EXEC_OS_SPREADSHEET_ID');
});

check('no setter is exposed on the public contract', function() {
  assert.strictEqual(typeof Config.setSpreadsheetId, 'undefined');
  assert.strictEqual(typeof Config.setActiveAiAdapter, 'undefined');
  assert.strictEqual(typeof Config.setTelegramBotToken, 'undefined');
});

// -- boundary: no Sheet access, no external calls -------------------

check('no unexpected Sheet access (SpreadsheetApp left undefined, nothing throws)', function() {
  resetProperties({ EXEC_OS_SPREADSHEET_ID: 'x', EXEC_OS_TELEGRAM_BOT_TOKEN: 'y' });
  // SpreadsheetApp is intentionally never defined in this sandbox.
  // If Config referenced it anywhere, these calls would throw
  // "SpreadsheetApp is not defined" instead of returning cleanly.
  assert.doesNotThrow(function() {
    Config.getSpreadsheetId();
    Config.getActiveAiAdapter();
    Config.getTelegramBotToken();
  });
});

check('no unexpected external calls (UrlFetchApp left undefined, nothing throws)', function() {
  resetProperties({ EXEC_OS_SPREADSHEET_ID: 'x' });
  // Same reasoning as above, for UrlFetchApp.
  assert.doesNotThrow(function() { Config.getSpreadsheetId(); });
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
