/*
Node-sandbox smoke test for 11_Schema.js.

IMPORTANT BOUNDARY, per the authorization: this file verifies LOGIC
only -- the decision-making in _compareHeaders_/ensureTab, Config
integration, and UCR3 routing -- using a hand-built FAKE
SpreadsheetApp. It does NOT and CANNOT verify real Google Sheets
behavior: whether SpreadsheetApp.openById() actually opens the
right file, whether insertSheet()/getSheetByName() behave exactly
as mocked here, or whether a real header write actually persists.
Every REAL_GAS_REQUIRED item is listed explicitly at the bottom of
this file's output, not folded into the pass/fail count above it.
*/

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const capturedLogLines = [];
let mockProperties = {};

// -- Fake SpreadsheetApp -------------------------------------------
// A deliberately simple in-memory model: a spreadsheet is a map of
// tabName -> array-of-rows (row 0 is headers once written). This is
// good enough to exercise Schema's own decision logic; it is NOT a
// stand-in for verifying real Sheets behavior.

function makeFakeSpreadsheet(initialTabs) {
  const tabs = initialTabs || {}; // tabName -> array of row-arrays

  function makeSheetHandle(tabName) {
    return {
      getLastColumn: function() {
        const rows = tabs[tabName];
        return (rows && rows[0]) ? rows[0].length : 0;
      },
      getRange: function(row, col, numRows, numCols) {
        return {
          getValues: function() {
            const rows = tabs[tabName];
            const line = (rows && rows[row - 1]) ? rows[row - 1] : [];
            return [line.slice(col - 1, col - 1 + numCols)];
          },
          setValues: function(values) {
            if (!tabs[tabName]) { tabs[tabName] = []; }
            const existing = tabs[tabName][row - 1] || [];
            const merged = existing.slice();
            for (let i = 0; i < values[0].length; i++) {
              merged[col - 1 + i] = values[0][i];
            }
            tabs[tabName][row - 1] = merged;
          }
        };
      }
    };
  }

  return {
    getSheetByName: function(tabName) {
      return tabs.hasOwnProperty(tabName) ? makeSheetHandle(tabName) : null;
    },
    insertSheet: function(tabName) {
      tabs[tabName] = [];
      return makeSheetHandle(tabName);
    },
    _tabs: tabs // test-only escape hatch to inspect final state
  };
}

let fakeSpreadsheet = makeFakeSpreadsheet();

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
  SpreadsheetApp: {
    openById: function(id) {
      assert.strictEqual(id, mockProperties.EXEC_OS_SPREADSHEET_ID, 'openById called with wrong id');
      return fakeSpreadsheet;
    }
  },
  console: console
};
vm.createContext(sandbox);

['60_Observability.js', '10_Config.js', '11_Schema.js'].forEach(function(filename) {
  const src = fs.readFileSync(__dirname + '/' + filename, 'utf8');
  vm.runInContext(src, sandbox, { filename: filename });
});

const Schema = vm.runInContext('Schema', sandbox);

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

// Values crossing the vm sandbox/main-realm boundary can be
// deepStrictEqual-unequal despite identical content, because each
// vm.Context has its own Array.prototype -- and which realm a given
// intermediate array ends up in is genuinely hard to predict by
// inspection (it follows whichever seed array a chain of .slice()
// calls started from). Round-tripping through JSON strips realm
// affiliation entirely and leaves only primitive values, which is
// what these tests actually care about comparing.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function reset(initialTabs) {
  mockProperties = { EXEC_OS_SPREADSHEET_ID: 'fake-spreadsheet-id' };
  capturedLogLines.length = 0;
  fakeSpreadsheet = makeFakeSpreadsheet(initialTabs);
  // Re-bind the sandbox's SpreadsheetApp.openById to the fresh fake.
  sandbox.SpreadsheetApp.openById = function(id) {
    return fakeSpreadsheet;
  };
}

const REF_HEADERS = Schema.KNOWN_SCHEMAS.Execution_References;

// -- missing tab -----------------------------------------------------

check('missing tab: creates it with full expected headers', function() {
  reset({});
  const result = Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.strictEqual(result.action, 'CREATED');
  // Cross-realm note: fakeSpreadsheet is built in this (main) realm,
  // but REF_HEADERS came out of the vm sandbox via vm.runInContext --
  // assert.deepStrictEqual treats same-content arrays from different
  // vm realms as unequal (different Array.prototype). Array.from()
  // here copies REF_HEADERS's values into a plain main-realm array
  // so the comparison is meaningful instead of a realm artifact.
  assert.deepStrictEqual(plain(fakeSpreadsheet._tabs['Execution_References'][0]), plain(REF_HEADERS));
});

check('missing tab: logs INFO via AlertService', function() {
  reset({});
  Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.ok(capturedLogLines.some(function(l) { return l.includes('[INFO] Schema.ensureTab'); }));
});

// -- existing tab, no header row --------------------------------------

check('existing empty tab: writes headers, does not recreate the tab', function() {
  reset({ Execution_References: [] });
  const result = Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.strictEqual(result.action, 'HEADERS_WRITTEN');
  assert.deepStrictEqual(plain(fakeSpreadsheet._tabs['Execution_References'][0]), plain(REF_HEADERS));
});

// -- existing tab, exact match -----------------------------------------

check('idempotency: running twice on an already-correct tab makes no change', function() {
  reset({ Execution_References: [REF_HEADERS.slice()] });
  const before = JSON.stringify(fakeSpreadsheet._tabs);
  const result1 = Schema.ensureTab('Execution_References', REF_HEADERS);
  const result2 = Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.strictEqual(result1.action, 'VERIFIED');
  assert.strictEqual(result2.action, 'VERIFIED');
  assert.strictEqual(JSON.stringify(fakeSpreadsheet._tabs), before);
});

check('does not destroy existing data rows below the header', function() {
  const existingDataRow = ['REF-001', 'FinanceOS', 'Task', 'T-1', 'title', 'open', '', 'h', 1, null, 'Today', 't1', 't2'];
  reset({ Execution_References: [REF_HEADERS.slice(), existingDataRow] });
  Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.deepStrictEqual(plain(fakeSpreadsheet._tabs['Execution_References'][1]), plain(existingDataRow));
});

// -- existing tab, extendable (safe additive repair) --------------------

check('extendable: appends only the missing trailing headers, existing ones untouched', function() {
  const partial = REF_HEADERS.slice(0, 5); // first 5 columns only
  reset({ Execution_References: [partial] });
  const result = Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.strictEqual(result.action, 'HEADERS_EXTENDED');
  assert.deepStrictEqual(plain(result.added), plain(REF_HEADERS.slice(5)));
  assert.deepStrictEqual(plain(fakeSpreadsheet._tabs['Execution_References'][0]), plain(REF_HEADERS));
});

check('extendable: logs WARN via AlertService (this is a real gap being closed, not routine)', function() {
  const partial = REF_HEADERS.slice(0, 5);
  reset({ Execution_References: [partial] });
  Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.ok(capturedLogLines.some(function(l) { return l.includes('[WARN] Schema.ensureTab'); }));
});

check('extendable does not touch a data row', function() {
  const partial = REF_HEADERS.slice(0, 5);
  const existingDataRow = ['REF-001', 'FinanceOS', 'Task', 'T-1', 'title'];
  reset({ Execution_References: [partial, existingDataRow] });
  Schema.ensureTab('Execution_References', REF_HEADERS);
  assert.deepStrictEqual(plain(fakeSpreadsheet._tabs['Execution_References'][1]), plain(existingDataRow));
});

// -- existing tab, mismatch (hard stop) ---------------------------------

check('mismatch: throws, does not write anything', function() {
  const wrong = REF_HEADERS.slice();
  wrong[2] = 'totally_wrong_column_name';
  reset({ Execution_References: [wrong] });
  const before = JSON.stringify(fakeSpreadsheet._tabs);
  assert.throws(function() { Schema.ensureTab('Execution_References', REF_HEADERS); },
      /column 3/);
  assert.strictEqual(JSON.stringify(fakeSpreadsheet._tabs), before);
});

check('mismatch: routes through AlertService as ERROR (UCR3)', function() {
  const wrong = REF_HEADERS.slice();
  wrong[2] = 'totally_wrong_column_name';
  reset({ Execution_References: [wrong] });
  try { Schema.ensureTab('Execution_References', REF_HEADERS); } catch (e) {}
  assert.ok(capturedLogLines.some(function(l) { return l.includes('[ERROR] Schema.ensureTab'); }));
});

// -- Config integration / invalid configuration --------------------------

check('missing Spreadsheet ID propagates Config\'s own error, does not swallow it', function() {
  reset({});
  delete mockProperties.EXEC_OS_SPREADSHEET_ID;
  assert.throws(function() { Schema.ensureTab('Execution_References', REF_HEADERS); },
      /Spreadsheet ID is not set/);
});

// -- No TruthEngine call --------------------------------------------------

check('does not actually call TruthEngine anywhere (not just absence of the word)', function() {
  const src = fs.readFileSync(__dirname + '/11_Schema.js', 'utf8');
  // A naive check for the bare word "TruthEngine" would also match
  // this file's own header comment explaining WHY there's no
  // dependency (see file header, "NO TruthEngine dependency, by
  // design"). What actually matters is whether the code calls it --
  // i.e. a "TruthEngine." usage pattern -- not whether the word
  // appears at all.
  assert.ok(!/TruthEngine\./.test(src), 'file should not call TruthEngine.<anything>');
});

// -- No speculative schema -------------------------------------------------

check('KNOWN_SCHEMAS contains only Execution_References, nothing else', function() {
  assert.deepStrictEqual(Object.keys(Schema.KNOWN_SCHEMAS), ['Execution_References']);
});

check('KNOWN_SCHEMAS.Execution_References is frozen (push throws, per spec, proving it)', function() {
  // Array.prototype.push on a non-extensible array throws per the
  // ECMAScript spec, in both strict and sloppy mode -- it isn't the
  // silent-no-op behavior a plain frozen OBJECT's property
  // assignment would have. A thrown TypeError here is exactly the
  // evidence that Object.freeze took effect, not a failure.
  assert.throws(function() {
    Schema.KNOWN_SCHEMAS.Execution_References.push('tampered');
  }, /object is not extensible/);
  assert.strictEqual(Schema.KNOWN_SCHEMAS.Execution_References.length, REF_HEADERS.length);
});

check('KNOWN_SCHEMAS itself is frozen (cannot add a new schema key)', function() {
  Schema.KNOWN_SCHEMAS.SomethingElse = ['x'];
  assert.deepStrictEqual(Object.keys(Schema.KNOWN_SCHEMAS), ['Execution_References']);
});

// -- ensureKnownSchemas convenience wrapper ---------------------------------

check('ensureKnownSchemas ensures every known tab in one call', function() {
  reset({});
  const results = Schema.ensureKnownSchemas();
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].tabName, 'Execution_References');
});

// -- verifyTabHeaders (read-only) --------------------------------------------

check('verifyTabHeaders reports a mismatch without writing anything', function() {
  const wrong = REF_HEADERS.slice();
  wrong[0] = 'wrong';
  reset({ Execution_References: [wrong] });
  const before = JSON.stringify(fakeSpreadsheet._tabs);
  const result = Schema.verifyTabHeaders('Execution_References', REF_HEADERS);
  assert.strictEqual(result.matches, false);
  assert.strictEqual(JSON.stringify(fakeSpreadsheet._tabs), before);
});

check('verifyTabHeaders reports exists:false for a tab that is not there', function() {
  reset({});
  const result = Schema.verifyTabHeaders('Execution_References', REF_HEADERS);
  assert.strictEqual(result.exists, false);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed (sandbox logic only)');
console.log('');
console.log('REAL_GAS_REQUIRED -- not verified by anything above, and cannot be from this environment:');
console.log('  - SpreadsheetApp.openById() actually opening the intended real Spreadsheet');
console.log('  - insertSheet() / getSheetByName() real behavior and quota limits');
console.log('  - a real header write via getRange().setValues() actually persisting');
console.log('  - behavior under real concurrent access (two triggers/executions at once)');
console.log('  - real Apps Script execution-time limits on a large existing sheet');
process.exit(failed > 0 ? 1 : 0);
