/*
Node-sandbox smoke test for 15_TruthEngine.js.

IMPORTANT BOUNDARY, same as 11_Schema_Test.js: this file verifies LOGIC
only -- argument/header validation, column mapping, the order of
platform calls, lock hygiene, UCR3 routing -- against a hand-built FAKE
platform. It does NOT and CANNOT verify real Google Sheets or
LockService behavior.

Three behaviors of the fake are ASSUMPTIONS, not facts about real
Sheets, and every check that leans on one says so:
  (a) COERCION MODEL: a string written to a cell that is not formatted
      '@' is "re-typed" when it looks like a number, a date or a
      formula. This models what Personal Life OS's Known Limitation 11
      observed (LIVE GAS, date/time-shaped strings, in that project's own
      Spreadsheet). The number-shaped and formula-shaped parts are this
      file's extrapolation, not observed anywhere.
  (b) GRID BOUND: a setValues() past getMaxRows() throws. Pessimistic,
      unverified; it makes the grid-growth guard testable.
  (c) LOCK: a second waitLock() while the lock is held throws (as a
      timeout would). Models mutual exclusion; real LockService
      behavior is REAL_GAS_REQUIRED.
Every REAL_GAS_REQUIRED item is listed at the bottom of this file's
output, not folded into the pass/fail count above it.

Loads ONLY 60_Observability.js, 10_Config.js and 15_TruthEngine.js. If
15_TruthEngine.js secretly needed Schema/Identity/EventDefinitions/
Versioning, loading would fail or a check below would.
*/

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const capturedLogLines = [];
let mockProperties = {};
const ops = [];            // ordered record of every platform call that matters
let lockHeld = false;
let lockMode = 'normal';   // 'normal' | 'timeout' | 'release-throws'
let hooks = {};            // per-test fault injection
let fakeSpreadsheet = null;

// -- Fake sheet ------------------------------------------------------

function isBlank(v) {
  return v === '' || v === null || v === undefined;
}

// ASSUMPTION (a): see the header. A string in a non-'@' cell is
// re-typed according to its shape. Anything else is stored as given.
function coerce(value, format) {
  if (typeof value !== 'string' || value === '' || format === '@') {
    return value;
  }
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) {
    return Number(value);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return { coercedTo: 'date', from: value };
  }
  if (value.charAt(0) === '=') {
    return { coercedTo: 'formula', from: value };
  }
  return value;
}

function makeFakeSheet(initialRows, opts) {
  opts = opts || {};
  const rows = (initialRows || []).map(function(r) { return r.slice(); });
  const formats = {}; // "row,col" (1-based) -> format string
  let maxRows = opts.maxRows || 1000;

  function ensureRow(i) {
    while (rows.length <= i) { rows.push([]); }
  }

  return {
    _rows: rows,
    _formats: formats,
    getLastColumn: function() {
      let last = 0;
      rows.forEach(function(r) {
        for (let i = r.length - 1; i >= 0; i--) {
          if (!isBlank(r[i])) { last = Math.max(last, i + 1); break; }
        }
      });
      return last;
    },
    getLastRow: function() {
      let last = 0;
      rows.forEach(function(r, i) {
        if (r.some(function(v) { return !isBlank(v); })) { last = i + 1; }
      });
      return last;
    },
    getMaxRows: function() { return maxRows; },
    insertRowsAfter: function(pos, howMany) {
      ops.push('insertRowsAfter:' + pos + ',' + howMany);
      maxRows += howMany;
    },
    appendRow: function() {
      ops.push('appendRow');
      throw new Error('TruthEngine must not call appendRow()');
    },
    getRange: function(r, c, nr, nc) {
      nr = nr || 1;
      nc = nc || 1;
      return {
        getValues: function() {
          const out = [];
          for (let i = 0; i < nr; i++) {
            const line = [];
            for (let j = 0; j < nc; j++) {
              const v = (rows[r - 1 + i] || [])[c - 1 + j];
              line.push(v === undefined ? '' : v);
            }
            out.push(line);
          }
          return out;
        },
        setNumberFormat: function(fmt) {
          ops.push('setNumberFormat:' + r + ',' + c + ':' + fmt);
          for (let i = 0; i < nr; i++) {
            for (let j = 0; j < nc; j++) { formats[(r + i) + ',' + (c + j)] = fmt; }
          }
          return this;
        },
        setValues: function(values) {
          ops.push('setValues:' + r + ',' + c + ',' + nr + ',' + nc);
          if (hooks.setValuesThrows) { throw new Error(hooks.setValuesThrows); }
          // ASSUMPTION (b): a write past the grid throws.
          if (r - 1 + nr > maxRows) {
            throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
          }
          if (hooks.beforeWrite) {
            const hook = hooks.beforeWrite;
            hooks.beforeWrite = null;
            hook();
          }
          for (let i = 0; i < nr; i++) {
            ensureRow(r - 1 + i);
            for (let j = 0; j < nc; j++) {
              while (rows[r - 1 + i].length < c - 1 + j) { rows[r - 1 + i].push(''); }
              rows[r - 1 + i][c - 1 + j] = coerce(values[i][j], formats[(r + i) + ',' + (c + j)]);
            }
          }
        }
      };
    }
  };
}

function makeFakeSpreadsheet(tabs) {
  return {
    getSheetByName: function(name) {
      ops.push('getSheetByName:' + name);
      return Object.prototype.hasOwnProperty.call(tabs, name) ? tabs[name] : null;
    },
    insertSheet: function() {
      ops.push('insertSheet');
      throw new Error('TruthEngine must not create a tab');
    }
  };
}

// -- Sandbox -----------------------------------------------------------

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
      ops.push('openById:' + id);
      return fakeSpreadsheet;
    },
    flush: function() {
      ops.push('flush');
      if (hooks.flushThrows) { throw new Error(hooks.flushThrows); }
    },
    create: function() {
      ops.push('SpreadsheetApp.create');
      throw new Error('TruthEngine must not create a Spreadsheet');
    },
    getActiveSpreadsheet: function() {
      ops.push('getActiveSpreadsheet');
      throw new Error('TruthEngine must not use the active Spreadsheet');
    },
    openByUrl: function() {
      ops.push('openByUrl');
      throw new Error('TruthEngine must not open a Spreadsheet by URL');
    }
  },
  // ASSUMPTION (c): see the header.
  LockService: {
    getScriptLock: function() {
      ops.push('getScriptLock');
      return {
        waitLock: function(ms) {
          ops.push('waitLock:' + ms);
          if (lockMode === 'timeout' || lockHeld) {
            throw new Error('Lock timeout: another process was holding the lock for too long.');
          }
          lockHeld = true;
        },
        releaseLock: function() {
          ops.push('releaseLock');
          lockHeld = false;
          if (lockMode === 'release-throws') { throw new Error('releaseLock failed (simulated)'); }
        }
      };
    },
    getDocumentLock: function() {
      ops.push('getDocumentLock');
      throw new Error('TruthEngine must use the script lock');
    },
    getUserLock: function() {
      ops.push('getUserLock');
      throw new Error('TruthEngine must use the script lock');
    }
  },
  console: console
};
vm.createContext(sandbox);

['60_Observability.js', '10_Config.js', '15_TruthEngine.js'].forEach(function(filename) {
  const src = fs.readFileSync(__dirname + '/' + filename, 'utf8');
  vm.runInContext(src, sandbox, { filename: filename });
});

const TruthEngine = vm.runInContext('TruthEngine', sandbox);

// -- Harness ---------------------------------------------------------------

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

// Each vm context has its own Array.prototype; round-tripping through
// JSON strips realm affiliation so deepStrictEqual compares content.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function rowsOf(sheet) {
  return plain(sheet._rows);
}

function reset(tabs) {
  mockProperties = { EXEC_OS_SPREADSHEET_ID: 'fake-spreadsheet-id' };
  capturedLogLines.length = 0;
  ops.length = 0;
  lockHeld = false;
  lockMode = 'normal';
  hooks = {};
  fakeSpreadsheet = makeFakeSpreadsheet(tabs || {});
}

function count(prefix) {
  return ops.filter(function(o) { return o.indexOf(prefix) === 0; }).length;
}

function first(prefix) {
  return ops.findIndex(function(o) { return o.indexOf(prefix) === 0; });
}

function openedIds() {
  return ops.filter(function(o) { return o.indexOf('openById:') === 0; });
}

// Strips block and line comments so source-level checks look at what
// the code DOES, not at what the header says about it.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
}
const engineSrc = fs.readFileSync(__dirname + '/15_TruthEngine.js', 'utf8');
const engineCode = stripComments(engineSrc);

// ================= A. Contract and structural boundaries ================

check('(1) API: the public contract is exactly { append }', function() {
  assert.deepStrictEqual(Object.keys(TruthEngine), ['append']);
  assert.strictEqual(typeof TruthEngine.append, 'function');
});

check('(2) API: append takes (tabName, record) -- there is no Spreadsheet-ID parameter', function() {
  assert.strictEqual(TruthEngine.append.length, 2);
});

check('(3) API: a third argument cannot redirect the write to another Spreadsheet', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' }, 'some-other-spreadsheet-id');
  assert.deepStrictEqual(openedIds(), ['openById:fake-spreadsheet-id']);
});

check('(4) Dependencies: works with only Config + AlertService loaded (Schema/Identity/EventDefinitions/Versioning absent)', function() {
  ['Schema', 'Identity', 'EventDefinitions', 'Versioning'].forEach(function(name) {
    assert.strictEqual(vm.runInContext('typeof ' + name, sandbox), 'undefined', name + ' should not be loaded here');
  });
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  assert.strictEqual(TruthEngine.append('T', { a: 'x' }).rowNumber, 2);
});

check('(5) Boundaries (code only, comments stripped): no appendRow, no tab/Spreadsheet creation, no delete/clear, no other lock or Spreadsheet entry point', function() {
  assert.ok(/function append\(/.test(engineCode), 'sanity: stripped code still has append()');
  assert.ok(!/GOVERNANCE SOURCE REVIEW/.test(engineCode), 'sanity: the header comment was stripped');
  [
    /\bappendRow\s*\(/, /\binsertSheet\s*\(/, /\bdeleteSheet\s*\(/, /SpreadsheetApp\.create\s*\(/,
    /getActiveSpreadsheet\s*\(/, /openByUrl\s*\(/, /\.clear\w*\s*\(/,
    /\.delete(Row|Rows|Column|Columns)\s*\(/, /\.setFormula\w*\s*\(/,
    /getDocumentLock\s*\(/, /getUserLock\s*\(/
  ].forEach(function(re) {
    assert.ok(!re.test(engineCode), 'forbidden pattern present in code: ' + re);
  });
});

check('(6) Schema-agnostic (code only): no entity field name and no tab name appears in the engine', function() {
  [
    'reference_id', 'source_domain', 'source_entity', 'snapshot_', 'execution_priority',
    'ai_recommended_priority', 'execution_state', 'created_at', 'last_synced_at',
    'event_id', 'event_type', 'goal_id', 'Execution_References', 'Execution_Events',
    'AI_Suggestions_Log', 'Waiting_Items'
  ].forEach(function(name) {
    assert.ok(engineCode.indexOf(name) === -1, 'engine code mentions "' + name + '"');
  });
});

check('(7) Dependencies (code only): calls Config + AlertService; no call into Schema/Identity/EventDefinitions/Versioning, no direct Script Properties / cache / network', function() {
  assert.ok(/Config\.getSpreadsheetId\s*\(/.test(engineCode));
  assert.ok(/AlertService\.log\s*\(/.test(engineCode));
  [
    /\bSchema\.(ensureTab|ensureKnownSchemas|verifyTabHeaders|KNOWN_SCHEMAS)/,
    /\bIdentity\.generateId/,
    /\bEventDefinitions\.(isLegalEventType|getEvidence|KNOWN_EVENTS|EVIDENCE)/,
    /\bVersioning\.(computeContentHash|isNewerThan)/,
    /PropertiesService/, /CacheService/, /UrlFetchApp/
  ].forEach(function(re) {
    assert.ok(!re.test(engineCode), 'forbidden dependency pattern present in code: ' + re);
  });
});

// ================= B. Append and mapping ================================

check('(8) Append: one row lands directly below the existing data; existing rows are untouched', function() {
  const sheet = makeFakeSheet([['a', 'b'], ['1', '2'], ['3', '4']]);
  reset({ T: sheet });
  const before = rowsOf(sheet);
  const result = TruthEngine.append('T', { a: 'x', b: 'y' });
  assert.deepStrictEqual(plain(result), { tabName: 'T', rowNumber: 4 });
  const after = rowsOf(sheet);
  assert.strictEqual(after.length, 4);
  assert.deepStrictEqual(after.slice(0, 3), before);
  assert.deepStrictEqual(after[3], ['x', 'y']);
});

check('(9) Mapping: header-name-driven -- record key order does not matter, no column number is hard-coded', function() {
  const sheet = makeFakeSheet([['gamma', 'alpha', 'beta']]);
  reset({ T: sheet });
  TruthEngine.append('T', { beta: 'B', gamma: 'G', alpha: 'A' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['G', 'A', 'B']);
});

check('(10) Mapping: fields missing from the record become blank cells; the row is exactly as wide as the header', function() {
  const sheet = makeFakeSheet([['a', 'b', 'c', 'd']]);
  reset({ T: sheet });
  TruthEngine.append('T', { b: 'only-b' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['', 'only-b', '', '']);
});

check('(11) Return: { tabName, rowNumber } -- row 2 for a header-only tab, row 5 under three data rows', function() {
  let sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  assert.deepStrictEqual(plain(TruthEngine.append('T', { a: 'x' })), { tabName: 'T', rowNumber: 2 });
  sheet = makeFakeSheet([['a'], ['1'], ['2'], ['3']]);
  reset({ T: sheet });
  assert.deepStrictEqual(plain(TruthEngine.append('T', { a: 'x' })), { tabName: 'T', rowNumber: 5 });
});

check('(12) Append: two consecutive appends land on consecutive rows; the second does not overwrite the first', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  const r1 = TruthEngine.append('T', { a: 'first' });
  const r2 = TruthEngine.append('T', { a: 'second' });
  assert.strictEqual(r1.rowNumber, 2);
  assert.strictEqual(r2.rowNumber, 3);
  assert.deepStrictEqual(rowsOf(sheet), [['a'], ['first'], ['second']]);
});

check('(13) Schema-agnostic: works on a tab whose header names this file has never heard of', function() {
  const sheet = makeFakeSheet([['qq_unheard_1', 'qq_unheard_2']]);
  reset({ Whatever_Tab: sheet });
  TruthEngine.append('Whatever_Tab', { qq_unheard_2: 'two', qq_unheard_1: 'one' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['one', 'two']);
});

check('(14) Mapping: blank header cells between named columns are tolerated and written blank', function() {
  const sheet = makeFakeSheet([['a', '', 'c']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'A', c: 'C' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['A', '', 'C']);
});

check('(15) Mapping: headers named "constructor"/"toString" work as ordinary names, and are never answered from Object.prototype', function() {
  const sheet = makeFakeSheet([['constructor', 'toString', 'plain']]);
  reset({ T: sheet });
  TruthEngine.append('T', { constructor: 'C', toString: 'S', plain: 'P' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['C', 'S', 'P']);
  const noSuchHeaders = makeFakeSheet([['plain']]);
  reset({ T: noSuchHeaders });
  assert.throws(function() { TruthEngine.append('T', { constructor: 'C' }); }, /no column named "constructor"/);
  assert.throws(function() { TruthEngine.append('T', { toString: 'S' }); }, /no column named "toString"/);
  assert.strictEqual(count('setValues'), 0);
});

check('(16) Mapping: an own "__proto__" key (as JSON.parse produces) is just an unknown field -- no prototype pollution', function() {
  const sheet = makeFakeSheet([['plain']]);
  reset({ T: sheet });
  const odd = JSON.parse('{"__proto__": "x", "plain": "ok"}');
  assert.ok(Object.prototype.hasOwnProperty.call(odd, '__proto__'), 'sanity: key is an own property');
  assert.throws(function() { TruthEngine.append('T', odd); }, /no column named "__proto__"/);
  assert.strictEqual(({}).x, undefined);
  assert.strictEqual(vm.runInContext('({}).x', sandbox), undefined);
  assert.strictEqual(count('setValues'), 0);
});

// ================= C. Value and argument validation =====================

check('(17) Values: null and undefined become blank cells', function() {
  const sheet = makeFakeSheet([['a', 'b', 'c']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x', b: null, c: undefined });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['x', '', '']);
});

check('(18) Values: numbers and booleans keep their native types and get no plain-text format', function() {
  const sheet = makeFakeSheet([['n', 'z', 't', 'f']]);
  reset({ T: sheet });
  TruthEngine.append('T', { n: 42, z: 0, t: true, f: false });
  const row = sheet._rows[1];
  assert.strictEqual(row[0], 42);
  assert.strictEqual(row[1], 0);
  assert.strictEqual(row[2], true);
  assert.strictEqual(row[3], false);
  assert.strictEqual(count('setNumberFormat'), 0);
});

check('(19) Values: object, array, Date, function, symbol, bigint, NaN, Infinity are each rejected by field name, and nothing is written', function() {
  const bad = [
    ['object', { x: 1 }], ['array', [1, 2]], ['date', new Date()], ['function', function() {}],
    ['symbol', Symbol('s')], ['bigint', BigInt(10)], ['NaN', NaN],
    ['Infinity', Infinity], ['-Infinity', -Infinity]
  ];
  bad.forEach(function(pair) {
    const sheet = makeFakeSheet([['a', 'b']]);
    reset({ T: sheet });
    const before = JSON.stringify(sheet._rows);
    assert.throws(function() { TruthEngine.append('T', { a: 'ok', b: pair[1] }); },
        /unsupported value\(s\) -- "b":/, 'type ' + pair[0] + ' was not rejected by name');
    assert.strictEqual(JSON.stringify(sheet._rows), before, 'something was written for ' + pair[0]);
    assert.strictEqual(count('setValues'), 0, 'setValues called for ' + pair[0]);
  });
});

check('(20) Values: every bad field is reported in one message, not just the first', function() {
  const sheet = makeFakeSheet([['a', 'b', 'c']]);
  reset({ T: sheet });
  assert.throws(function() { TruthEngine.append('T', { a: {}, b: [], c: 'fine' }); }, function(err) {
    return /"a":/.test(err.message) && /"b":/.test(err.message) && !/"c":/.test(err.message);
  });
});

check('(21) Values: a record whose values are all blank is rejected (its row would be invisible to getLastRow(), so the next append would overwrite it)', function() {
  const sheet = makeFakeSheet([['a', 'b']]);
  reset({ T: sheet });
  [{ a: null }, { a: '', b: null }, { a: undefined }].forEach(function(rec) {
    assert.throws(function() { TruthEngine.append('T', rec); }, /no non-blank value/);
  });
  assert.strictEqual(count('setValues'), 0);
});

check('(22) Arguments: an empty record is rejected', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  assert.throws(function() { TruthEngine.append('T', {}); }, /record has no fields/);
});

check('(23) Arguments: a record that is not a plain object (null, undefined, array, string, number, Date, boolean) is rejected', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  [null, undefined, [], 'str', 42, new Date(), true].forEach(function(bad) {
    assert.throws(function() { TruthEngine.append('T', bad); }, /record must be a plain object/);
  });
  assert.strictEqual(count('setValues'), 0);
});

check('(24) Arguments: a tabName that is not a non-empty string (undefined, null, "", "   ", 42, {}, []) is rejected', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  [undefined, null, '', '   ', 42, {}, []].forEach(function(bad) {
    assert.throws(function() { TruthEngine.append(bad, { a: 'x' }); }, /tabName must be a non-empty string/);
  });
  assert.strictEqual(count('setValues'), 0);
});

// ================= D. Tab and header validation =========================

check('(25) Validation: an unknown field is rejected -- names the field and the tab, writes nothing, releases the lock', function() {
  const sheet = makeFakeSheet([['a', 'b']]);
  reset({ T: sheet });
  const before = JSON.stringify(sheet._rows);
  assert.throws(function() { TruthEngine.append('T', { a: 'x', typo_field: 'y' }); },
      /tab "T" has no column named "typo_field"/);
  assert.strictEqual(JSON.stringify(sheet._rows), before);
  assert.strictEqual(count('setValues'), 0);
  assert.strictEqual(count('setNumberFormat'), 0, 'no format may be applied for a rejected record');
  assert.strictEqual(count('releaseLock'), 1);
  assert.strictEqual(lockHeld, false);
});

check('(26) Validation: several unknown fields are all listed', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  assert.throws(function() { TruthEngine.append('T', { x1: 'p', x2: 'q', a: 'ok' }); },
      /no column named "x1", "x2"/);
});

check('(27) Validation: header names match exactly -- case differences and stray spaces are rejected', function() {
  const sheet = makeFakeSheet([['name']]);
  reset({ T: sheet });
  ['Name', ' name', 'name ', 'NAME'].forEach(function(key) {
    const rec = {};
    rec[key] = 'v';
    assert.throws(function() { TruthEngine.append('T', rec); }, /has no column named/);
  });
  assert.strictEqual(count('setValues'), 0);
});

check('(28) Validation: a missing tab is rejected and never created', function() {
  reset({});
  assert.throws(function() { TruthEngine.append('Nope', { a: 'x' }); }, /tab "Nope" does not exist/);
  assert.strictEqual(count('insertSheet'), 0);
  assert.strictEqual(count('releaseLock'), 1);
});

check('(29) Validation: a tab with no header row is rejected before any write or format call', function() {
  const empty = makeFakeSheet([]);
  reset({ T: empty });
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); }, /no header row/);
  const blankRowOne = makeFakeSheet([[], ['stray', 'content']]);
  reset({ T: blankRowOne });
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); }, /no header row/);
  assert.strictEqual(count('setValues'), 0);
  assert.strictEqual(count('setNumberFormat'), 0);
});

check('(30) Validation: a duplicated header name blocks only records that use it', function() {
  const sheet = makeFakeSheet([['a', 'dup', 'dup']]);
  reset({ T: sheet });
  assert.throws(function() { TruthEngine.append('T', { dup: 'x' }); }, /more than one column named "dup"/);
  assert.strictEqual(count('setValues'), 0);
  TruthEngine.append('T', { a: 'fine' });
  assert.deepStrictEqual(rowsOf(sheet)[1], ['fine', '', '']);
});

// ================= E. Config integration and Domain isolation ==========

check('(31) Isolation: opens exactly one Spreadsheet -- Config\'s -- and no other Spreadsheet entry point is used', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  mockProperties.EXEC_OS_SPREADSHEET_ID = 'config-says-this-one';
  TruthEngine.append('T', { a: 'x' });
  assert.deepStrictEqual(openedIds(), ['openById:config-says-this-one']);
  ['SpreadsheetApp.create', 'getActiveSpreadsheet', 'openByUrl', 'insertSheet'].forEach(function(name) {
    assert.strictEqual(count(name), 0, name + ' was called');
  });
});

check('(32) Isolation: a changed Script Property applies on the next call (nothing is cached or hard-coded)', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' });
  mockProperties.EXEC_OS_SPREADSHEET_ID = 'second-id';
  TruthEngine.append('T', { a: 'y' });
  assert.deepStrictEqual(openedIds(), ['openById:fake-spreadsheet-id', 'openById:second-id']);
});

check('(33) Config: a missing Spreadsheet ID surfaces Config\'s own message, before the lock is taken, with nothing written', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  delete mockProperties.EXEC_OS_SPREADSHEET_ID;
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); }, /Spreadsheet ID is not set/);
  assert.strictEqual(count('getScriptLock'), 0);
  assert.strictEqual(count('openById'), 0);
  assert.strictEqual(count('setValues'), 0);
});

// ================= F. Lock ==============================================

check('(34) Lock: the script lock is used -- never the document or user lock', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' });
  assert.strictEqual(count('getScriptLock'), 1);
  assert.strictEqual(count('getDocumentLock'), 0);
  assert.strictEqual(count('getUserLock'), 0);
});

check('(35) Lock: waitLock is called once, with a positive finite timeout', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' });
  assert.strictEqual(count('waitLock'), 1);
  const ms = Number(ops[first('waitLock')].split(':')[1]);
  assert.ok(Number.isFinite(ms) && ms > 0, 'timeout was ' + ms);
  console.log('      (info) LOCK_WAIT_MS actually used: ' + ms + ' -- PROPOSED value P3, not evidenced');
});

check('(36) Lock: strict order -- lock, open, write, flush, release (flush BEFORE release, per the official docs)', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' });
  const order = ['getScriptLock', 'waitLock', 'openById', 'setValues', 'flush', 'releaseLock'].map(first);
  order.forEach(function(i) { assert.ok(i >= 0, 'a platform call is missing: ' + JSON.stringify(ops)); });
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i - 1] < order[i], 'out of order: ' + JSON.stringify(ops));
  }
});

check('(37) Lock: released after every kind of failure that happens under the lock (unknown field, missing tab, write error, flush error)', function() {
  const scenarios = [
    function() { reset({ T: makeFakeSheet([['a']]) }); return function() { TruthEngine.append('T', { nope: 'x' }); }; },
    function() { reset({}); return function() { TruthEngine.append('Missing', { a: 'x' }); }; },
    function() { reset({ T: makeFakeSheet([['a']]) }); hooks.setValuesThrows = 'write failed (simulated)'; return function() { TruthEngine.append('T', { a: 'x' }); }; },
    function() { reset({ T: makeFakeSheet([['a']]) }); hooks.flushThrows = 'flush failed (simulated)'; return function() { TruthEngine.append('T', { a: 'x' }); }; }
  ];
  scenarios.forEach(function(make, i) {
    const run = make();
    assert.throws(run, /TruthEngine:/, 'scenario ' + i + ' did not fail as intended');
    assert.strictEqual(count('waitLock'), 1, 'scenario ' + i + ': waitLock count');
    assert.strictEqual(count('releaseLock'), 1, 'scenario ' + i + ': releaseLock count');
    assert.strictEqual(lockHeld, false, 'scenario ' + i + ': lock still held');
  });
});

check('(38) Lock: a lock timeout is a UCR3 error naming the timeout -- no Spreadsheet access, no write, and no release of a lock never acquired', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  lockMode = 'timeout';
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); }, /could not acquire the script lock within \d+ ms/);
  assert.strictEqual(count('openById'), 0);
  assert.strictEqual(count('setValues'), 0);
  assert.strictEqual(count('releaseLock'), 0);
  assert.ok(capturedLogLines.some(function(l) { return l.indexOf('[ERROR] TruthEngine.append') !== -1; }));
});

check('(39) Lock: bad arguments are rejected before the lock is taken (cheap rejects add no contention)', function() {
  reset({});
  [['T', null], ['', { a: 1 }], ['T', {}], ['T', { a: {} }]].forEach(function(args) {
    assert.throws(function() { TruthEngine.append(args[0], args[1]); }, /TruthEngine:/);
  });
  assert.strictEqual(count('getScriptLock'), 0);
  assert.strictEqual(count('waitLock'), 0);
});

check('(40) Contention (logic only, ASSUMPTION c): while writer 1 holds the lock mid-write, writer 2 cannot enter -- and writer 1 still writes exactly once', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  let secondWriterError = null;
  hooks.beforeWrite = function() {
    try { TruthEngine.append('T', { a: 'second' }); } catch (e) { secondWriterError = e; }
  };
  const result = TruthEngine.append('T', { a: 'first' });
  assert.ok(secondWriterError, 'second writer should have been refused');
  assert.ok(/script lock/.test(secondWriterError.message), 'unexpected error: ' + secondWriterError.message);
  assert.strictEqual(result.rowNumber, 2);
  assert.deepStrictEqual(rowsOf(sheet), [['a'], ['first']]);
  assert.strictEqual(count('openById'), 1, 'second writer must not have reached the Spreadsheet');
  assert.strictEqual(count('waitLock'), 2);
  assert.strictEqual(count('releaseLock'), 1, 'only the writer that held the lock releases it');
});

check('(41) Lock: a releaseLock() failure AFTER a completed write does not turn the append into a failure -- it returns normally and logs a WARN', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  lockMode = 'release-throws';
  const result = TruthEngine.append('T', { a: 'x' });
  assert.deepStrictEqual(plain(result), { tabName: 'T', rowNumber: 2 });
  assert.deepStrictEqual(rowsOf(sheet), [['a'], ['x']]);
  assert.ok(capturedLogLines.some(function(l) { return l.indexOf('[WARN] TruthEngine.append') !== -1; }));
  assert.ok(!capturedLogLines.some(function(l) { return l.indexOf('[ERROR]') !== -1; }));
});

// ================= G. Plain-text protection (ASSUMPTION a) ==============

function appendShapes(values) {
  const headers = values.map(function(v, i) { return 'c' + i; });
  const sheet = makeFakeSheet([headers]);
  reset({ T: sheet });
  const rec = {};
  values.forEach(function(v, i) { rec['c' + i] = v; });
  TruthEngine.append('T', rec);
  return sheet._rows[1];
}

check('(42) Plain text: number-shaped strings (incl. hash-like hex that can be all digits) are stored as the same strings', function() {
  const values = ['00123', '1e5', '12345678', '0', '1.50', '-7', '+3', '12e4'];
  const row = appendShapes(values);
  assert.deepStrictEqual(row.map(function(v) { return typeof v; }), values.map(function() { return 'string'; }));
  assert.deepStrictEqual(plain(row), values);
});

check('(43) Plain text: date-shaped strings (plain date, ISO timestamp) are stored as the same strings', function() {
  const values = ['2026-10-25', '2026-10-25T10:20:30.000Z', '2026-10-25 10:20'];
  const row = appendShapes(values);
  assert.deepStrictEqual(plain(row), values);
});

check('(44) Plain text: a string starting with "=" is stored as text, not as a formula', function() {
  const values = ['=1+1', '=IMPORTXML("https://example.invalid","//a")'];
  const row = appendShapes(values);
  assert.deepStrictEqual(plain(row), values);
});

check('(45) Control (proves checks 42-44 are not vacuous): in the fake, WITHOUT the plain-text format, the same shapes ARE re-typed', function() {
  const sheet = makeFakeSheet([['a', 'b', 'c']]);
  reset({ T: sheet });
  sheet.getRange(2, 1, 1, 3).setValues([['00123', '2026-10-25', '=1+1']]);
  assert.strictEqual(typeof sheet._rows[1][0], 'number');
  assert.strictEqual(sheet._rows[1][1].coercedTo, 'date');
  assert.strictEqual(sheet._rows[1][2].coercedTo, 'formula');
});

check('(46) Plain text: \'@\' is applied to each non-empty string cell BEFORE the row\'s setValues -- and only to those', function() {
  const sheet = makeFakeSheet([['s1', 'n', 'b', 'blank', 's2', 'empty']]);
  reset({ T: sheet });
  TruthEngine.append('T', { s1: 'text', n: 5, b: true, blank: null, s2: 'more', empty: '' });
  const formatOps = ops.filter(function(o) { return o.indexOf('setNumberFormat') === 0; });
  assert.deepStrictEqual(formatOps, ['setNumberFormat:2,1:@', 'setNumberFormat:2,5:@']);
  const lastFormat = Math.max.apply(null, ops.map(function(o, i) { return o.indexOf('setNumberFormat') === 0 ? i : -1; }));
  assert.ok(lastFormat < first('setValues'), 'a format call came after the write: ' + JSON.stringify(ops));
});

check('(47) Plain text: only the target row is touched -- no other row is formatted, existing rows are unchanged', function() {
  const sheet = makeFakeSheet([['a', 'b'], ['keep1', 'keep2'], ['keep3', 'keep4']]);
  reset({ T: sheet });
  const before = rowsOf(sheet).slice(0, 3);
  TruthEngine.append('T', { a: 'x', b: 'y' });
  const formattedRows = Object.keys(sheet._formats).map(function(k) { return k.split(',')[0]; });
  assert.ok(formattedRows.length > 0);
  assert.ok(formattedRows.every(function(r) { return r === '4'; }), 'formatted rows: ' + formattedRows);
  assert.deepStrictEqual(rowsOf(sheet).slice(0, 3), before);
});

check('(48) Mechanism: appendRow() is never called on a successful append (sibling evidence: it ignores a plain-text format)', function() {
  const sheet = makeFakeSheet([['a', 'b']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x', b: 'y' });
  assert.strictEqual(count('appendRow'), 0);
  assert.strictEqual(count('setValues'), 1, 'exactly one setValues per append');
});

// ================= H. Grid growth (ASSUMPTION b) ========================

check('(49) Grid: when the tab is full, the missing row is inserted BEFORE the write (the fake throws on a write past the grid)', function() {
  const sheet = makeFakeSheet([['a'], ['1'], ['2']], { maxRows: 3 });
  reset({ T: sheet });
  const result = TruthEngine.append('T', { a: 'new' });
  assert.strictEqual(result.rowNumber, 4);
  const grow = first('insertRowsAfter:3,1');
  assert.ok(grow >= 0, 'grid was not grown: ' + JSON.stringify(ops));
  assert.ok(grow < first('setValues'), 'grid growth must come before the write');
  assert.deepStrictEqual(rowsOf(sheet)[3], ['new']);
});

check('(50) Grid: when there is room, no rows are inserted', function() {
  const sheet = makeFakeSheet([['a'], ['1']], { maxRows: 1000 });
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'new' });
  assert.strictEqual(count('insertRowsAfter'), 0);
});

// ================= I. Failure paths and UCR3 ============================

check('(51) Failure: a platform error during the write surfaces as a UCR3 error carrying the cause; the lock is released', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  hooks.setValuesThrows = 'Service Spreadsheets failed (simulated)';
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); },
      /TruthEngine: Service Spreadsheets failed \(simulated\)/);
  assert.strictEqual(lockHeld, false);
  assert.deepStrictEqual(rowsOf(sheet), [['a']]);
});

check('(52) Failure: a flush error is surfaced as an error even though the row already landed -- the outcome is AMBIGUOUS to this file, so callers must not retry blindly (documented in the header: not idempotent)', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  hooks.flushThrows = 'flush failed (simulated)';
  assert.throws(function() { TruthEngine.append('T', { a: 'x' }); }, /TruthEngine: flush failed/);
  assert.deepStrictEqual(rowsOf(sheet), [['a'], ['x']]);
  assert.strictEqual(lockHeld, false);
});

check('(53) UCR3: exactly one [ERROR] TruthEngine.append line per failed call; nothing at all is logged on a clean success', function() {
  const sheet = makeFakeSheet([['a']]);
  reset({ T: sheet });
  TruthEngine.append('T', { a: 'x' });
  assert.strictEqual(capturedLogLines.length, 0, 'success logged: ' + JSON.stringify(capturedLogLines));
  assert.throws(function() { TruthEngine.append('T', { nope: 'x' }); });
  const errors = capturedLogLines.filter(function(l) { return l.indexOf('[ERROR] TruthEngine.append') !== -1; });
  assert.strictEqual(errors.length, 1);
});

check('(54) UCR3 / log hygiene: a failure logs the tab name and field NAMES, never field values', function() {
  const sheet = makeFakeSheet([['known']]);
  reset({ T: sheet });
  assert.throws(function() { TruthEngine.append('T', { known: 'SECRET-VALUE-123', bogus_field: 'x' }); });
  assert.throws(function() { TruthEngine.append('T', { known: 'SECRET-VALUE-123', bad: { nested: 'SECRET-NESTED-456' } }); });
  const log = capturedLogLines.join('\n');
  assert.ok(log.indexOf('SECRET-VALUE-123') === -1, 'a field value leaked into the log');
  assert.ok(log.indexOf('SECRET-NESTED-456') === -1, 'a nested value leaked into the log');
  assert.ok(log.indexOf('bogus_field') !== -1, 'field names should be logged');
  assert.ok(log.indexOf('"T"') !== -1 || log.indexOf('tabName') !== -1, 'tab name should be logged');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed (sandbox logic only)');
console.log('');
console.log('REAL_GAS_REQUIRED -- not verified by anything above, and cannot be from this environment:');
console.log('  - LockService.getScriptLock().waitLock(): real mutual exclusion between two overlapping');
console.log('    executions, and the real timeout behavior/message (checks 34-41 only model it)');
console.log('  - that SpreadsheetApp.flush() before releaseLock() really makes the next lock holder\'s');
console.log('    getLastRow() see the new row (no overwritten row under concurrent triggers)');
console.log('  - setNumberFormat(\'@\') then setValues() really keeping, in EXECUTION\'S Spreadsheet:');
console.log('    "00123", "1e5", an all-digit hex hash, "2026-10-25", an ISO timestamp, and a leading "="');
console.log('    string as text (the sibling project verified date/time-shaped strings only, in its own');
console.log('    Spreadsheet); and that getValues() reads the same strings back');
console.log('  - whether setValues() past getMaxRows() throws or grows the grid, and that insertRowsAfter()');
console.log('    behaves as assumed (checks 49-50 only model the pessimistic case)');
console.log('  - getLastRow() on real tabs (pre-formatted blank rows, stray content far below the data)');
console.log('  - real per-append latency: one lock hold = (string columns + ~5) Sheet calls, against the');
console.log('    PROPOSED 10000 ms LOCK_WAIT_MS, under real contention');
console.log('  - the real cell-size limit and any other platform error on a very large string');
console.log('');
console.log('NOT VERIFIABLE FROM THIS REPOSITORY (not a GAS item):');
console.log('  - UCR6\'s primary text (UEF v1.12) is not available; conformance was checked only against');
console.log('    00_File_Map.js\'s paraphrase. "validated" and "safe" are this file\'s reading of it (PROPOSED).');
process.exit(failed > 0 ? 1 : 0);
