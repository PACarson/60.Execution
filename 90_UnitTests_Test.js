/*
Node-sandbox test for 90_UnitTests.js (the real-GAS gate for 15_TruthEngine.js).

IMPORTANT BOUNDARY: this verifies the GATE'S OWN LOGIC only: that it
reports PASS when the platform behaves as expected, and FAIL /
INCONCLUSIVE / SKIPPED / ABORTED, with the right words, when the platform
or the engine does not. It does NOT and CANNOT show what real Google
Sheets or LockService do. That is the whole reason the gate exists.

The fake platform below is a set of ASSUMPTIONS written as code, except
where a line says OBSERVED. Each one is a knob so the gate can be run
against its opposite:
  - coercion: how a Sheets-like store re-types a string written to a cell.
    'faithful' is the model of Execution's own Spreadsheet as the two real
    gate runs showed it (OBSERVED: run 1, 2026-11-03 06:59 MYT; run 2,
    2026-11-05 00:29 MYT): in a plain-text cell a leading apostrophe is
    consumed and a leading "=" is evaluated; in any other cell the same
    two happen, and 23 of the gate's 36 string shapes are re-typed
    (check 2 pins that list). 'none' never re-types and never consumes an
    apostrophe; 'atIgnored' ignores the plain-text format; 'displayTrims'
    shows plain-text cells trimmed.
  - gridMode: a write past the grid throws ('throw') or grows it ('grow').
  - cellLimit: a 50001-character write throws, truncates, is accepted, or
    fails half-way ('partial'). Since P10 the engine refuses such a cell
    before it reaches the platform, so this knob only matters for an
    engine WITHOUT P10 (checks 19a, 37a and 43i build one).
  - lockMode: 'exclusive' (a second lock object is refused while one is
    held), 'reentrant' (always granted), 'held-elsewhere' (always refused).
  - latency per call type, on a fake clock, so timings are deterministic.
Which of these the real platform does is exactly what the gate reports.

Engine variants WITHOUT P10 (the length guard) or P11 (the apostrophe
marker) are built by the same exact-string replacement as the mutants. The
two protections now sit between the gate's shapes and the platform, so the
checks that need the platform's own reaction to a raw "=", a raw leading
apostrophe or an oversize cell need an engine that does not have them.

Every engine and gate source is loaded fresh into its own vm context per
run, so runs cannot influence each other. Engine MUTANTS are made by
exact-string replacement of 15_TruthEngine.js (each replacement must
match exactly once), then run through the unchanged gate.

Loads ONLY 60_Observability.js, 10_Config.js, 15_TruthEngine.js and
90_UnitTests.js.
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const FILES = ['60_Observability.js', '10_Config.js', '15_TruthEngine.js', '90_UnitTests.js'];
const SRC = {};
FILES.forEach(function(file) {
  SRC[file] = fs.readFileSync(path.join(__dirname, file), 'utf8');
});
const FILE_MAP_SRC = fs.readFileSync(path.join(__dirname, '00_File_Map.js'), 'utf8');

const SPREADSHEET_ID = 'fake-exec-spreadsheet-id-0123456789';
const SPREADSHEET_NAME = 'Execution OS (fake)';
const RealDate = Date;

// ======================= fake platform ====================================

const BASE_LATENCY = {
  openById: 400, insertSheet: 900, deleteSheet: 700, setValues: 300,
  setNumberFormat: 150, flush: 200, deleteRows: 400, insertRowsAfter: 300,
  read: 60, default: 20
};

function tick(model, kind) {
  const table = Object.assign({}, BASE_LATENCY, model.opts.latency);
  model.clock.now += (kind in table ? table[kind] : table.default);
}

function isBlank(value) {
  return value === '' || value === null || value === undefined;
}

const NUMERIC = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const DATEISH = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}:\d{2}(:\d{2})?( ?[AP]M)?$/i,
  /^\d{1,2}\/\d{1,2}(\/\d{1,4})?$/,
  /^\d{4}\/\d{1,2}\/\d{1,2}$/,
  /^[A-Z][a-z]{2} \d{1,2}$/
];

function parseNumberish(s) {
  if (s.charAt(0) === '+') { return undefined; }   // OBSERVED for "+3" only; the rest is a guess
  if (/^\d{16,}$/.test(s)) { return undefined; }   // OBSERVED for 20 digits only; 15 is a guess
  if (NUMERIC.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) { return Number(s.replace(/,/g, '')); }
  if (/^[-+]?\d+(\.\d+)?%$/.test(s)) { return Number(s.slice(0, -1)) / 100; }
  if (/^\$\d+(\.\d+)?$/.test(s)) { return Number(s.slice(1)); }
  if (/^\(\d+(\.\d+)?\)$/.test(s)) { return -Number(s.slice(1, -1)); }
  return undefined;
}

function evalFormula(s) {
  let m = /^=(\d+)\+(\d+)$/.exec(s);
  if (m) { return Number(m[1]) + Number(m[2]); }
  m = /^=SUM\((\d+),(\d+)\)$/.exec(s);
  if (m) { return Number(m[1]) + Number(m[2]); }
  return 0;
}

// Returns the value the fake store keeps for a string written to a cell.
// OBSERVED (real gate runs 1 and 2): a leading apostrophe is consumed and a
// leading "=" is evaluated, in a plain-text cell as well as in any other.
// OBSERVED (run 2, a cell without the plain-text format): exactly 23 of the
// gate's 36 shapes were re-typed. The patterns below reproduce those 36
// results and are a GUESS for any other string: "+3" stayed a string, so a
// leading "+" is never re-typed here; "2026-10-25" was re-typed but the same
// date with a time was not; "12345678901234567890" stayed a string while an
// 8-digit one did not, so 16 or more digits stay a string here (15 is the
// usual spreadsheet limit; the real threshold was not observed).
function coerceString(s, plainText, mode) {
  if (mode === 'none') { return s; }
  if (s.charAt(0) === '\'') { return s.slice(1); }
  if (s.charAt(0) === '=') { return evalFormula(s); }
  if (plainText && mode !== 'atIgnored') { return s; }
  const n = parseNumberish(s);
  if (n !== undefined) { return n; }
  for (let i = 0; i < DATEISH.length; i++) {
    if (DATEISH[i].test(s)) { return new RealDate(86400000); }
  }
  if (/^(true|false)$/i.test(s)) { return s.toLowerCase() === 'true'; }
  return s;
}

function addTab(model, name, rows) {
  const data = {
    name: name,
    rows: rows.map(function(r) { return r.slice(); }),
    formats: {},
    maxRows: 1000,
    maxCols: 26
  };
  model.tabs.push(data);
  return data;
}

function makeModel(opts) {
  const o = Object.assign({
    coercion: 'faithful', gridMode: 'throw', cellLimit: 'throw', lockMode: 'exclusive',
    latency: {}, propertyId: SPREADSHEET_ID, extraTabs: [], missing: [],
    failInsertSheetAt: 0, failDeleteSheetFor: null, foreignTabAfterOps: 0,
    insertRowsAfterThrows: null, deleteRowsThrows: null, deleteRowsNoShrink: false,
    openThrows: null, releaseThrows: false, sameLockObject: false, failGateLastRowWhileLocked: false,
    failHeaderWriteFor: null
  }, opts || {});
  const model = {
    opts: o, clock: { now: Date.UTC(2026, 9, 29, 8, 0, 0) }, ops: [], logs: [], violations: [],
    tabs: [], viewCount: 0, lockHeld: false, insertCount: 0, foreignAdded: false,
    oversizeAttempts: 0   // how many setValues calls reached the platform with a cell over 50000 characters
  };
  addTab(model, 'Sheet1', []);
  addTab(model, 'Execution_References', [['reference_id', 'source_domain'], ['r1', 'd1'], ['r2', 'd2']]);
  o.extraTabs.forEach(function(name) { addTab(model, name, []); });
  return model;
}

function pushOp(model, entry) {
  model.ops.push(entry);
  if (model.opts.foreignTabAfterOps && !model.foreignAdded && model.ops.length >= model.opts.foreignTabAfterOps) {
    model.foreignAdded = true;
    addTab(model, 'Added_By_Someone_Else', []);
  }
}

function lastRowOf(data) {
  let last = 0;
  data.rows.forEach(function(row, i) {
    if (row.some(function(v) { return !isBlank(v); })) { last = i + 1; }
  });
  return last;
}

function lastColOf(data) {
  let last = 0;
  data.rows.forEach(function(row) {
    for (let i = row.length - 1; i >= 0; i--) {
      if (!isBlank(row[i])) { last = Math.max(last, i + 1); break; }
    }
  });
  return last;
}

function shiftFormats(data, fromRow, delta) {
  const next = {};
  Object.keys(data.formats).forEach(function(key) {
    const parts = key.split(',');
    const r = Number(parts[0]);
    if (delta < 0 && r >= fromRow && r < fromRow - delta) { return; }
    next[(r >= fromRow ? r + delta : r) + ',' + parts[1]] = data.formats[key];
  });
  data.formats = next;
}

function outsideGrid() {
  return new Error('The coordinates of the range are outside the dimensions of the sheet.');
}

function makeSheet(model, data, view) {
  const o = model.opts;
  function op(name, extra) {
    pushOp(model, Object.assign({ op: name, tab: data.name, view: view }, extra || {}));
  }
  function forbidden(name) {
    return function() {
      model.violations.push('sheet.' + name);
      throw new Error('forbidden call: sheet.' + name + '()');
    };
  }

  function makeRange(r, c, nr, nc) {
    nr = nr === undefined ? 1 : nr;
    nc = nc === undefined ? 1 : nc;
    if (!(Number.isInteger(r) && r >= 1 && Number.isInteger(c) && c >= 1 &&
          Number.isInteger(nr) && nr >= 1 && Number.isInteger(nc) && nc >= 1)) {
      throw new Error('The coordinates or dimensions of the range are invalid.');
    }
    function inGrid() { return r + nr - 1 <= data.maxRows && c + nc - 1 <= data.maxCols; }
    function cell(i, j) {
      const row = data.rows[r - 1 + i];
      const v = row ? row[c - 1 + j] : undefined;
      return v === undefined ? '' : v;
    }
    function display(v) {
      if (isBlank(v)) { return ''; }
      if (typeof v === 'string') { return o.coercion === 'displayTrims' ? v.trim() : v; }
      if (typeof v === 'boolean') { return v ? 'TRUE' : 'FALSE'; }
      if (Object.prototype.toString.call(v) === '[object Date]') { return v.toISOString().slice(0, 10); }
      return String(v);
    }
    const range = {
      getValues: function() {
        tick(model, 'read');
        if (!inGrid()) { throw outsideGrid(); }
        const out = [];
        for (let i = 0; i < nr; i++) {
          const line = [];
          for (let j = 0; j < nc; j++) { line.push(cell(i, j)); }
          out.push(line);
        }
        return out;
      },
      getValue: function() {
        tick(model, 'read');
        if (!inGrid()) { throw outsideGrid(); }
        return cell(0, 0);
      },
      getDisplayValues: function() {
        tick(model, 'read');
        if (!inGrid()) { throw outsideGrid(); }
        const out = [];
        for (let i = 0; i < nr; i++) {
          const line = [];
          for (let j = 0; j < nc; j++) { line.push(display(cell(i, j))); }
          out.push(line);
        }
        return out;
      },
      getNumberFormats: function() {
        tick(model, 'read');
        if (!inGrid()) { throw outsideGrid(); }
        const out = [];
        for (let i = 0; i < nr; i++) {
          const line = [];
          for (let j = 0; j < nc; j++) { line.push(data.formats[(r + i) + ',' + (c + j)] || '0.###############'); }
          out.push(line);
        }
        return out;
      },
      setNumberFormat: function(format) {
        tick(model, 'setNumberFormat');
        op('setNumberFormat', { r: r, c: c, nr: nr, nc: nc, format: format });
        if (!inGrid()) { throw outsideGrid(); }
        for (let i = 0; i < nr; i++) {
          for (let j = 0; j < nc; j++) { data.formats[(r + i) + ',' + (c + j)] = format; }
        }
        return range;
      },
      setValues: function(values) {
        tick(model, 'setValues');
        op('setValues', { r: r, c: c, nr: nr, nc: nc });
        if (o.failHeaderWriteFor && r === 1 && view === 1 && new RegExp(o.failHeaderWriteFor).test(data.name)) {
          throw new Error('header write failed (simulated)');
        }
        if (!inGrid()) {
          if (o.gridMode === 'grow') {
            data.maxRows = Math.max(data.maxRows, r + nr - 1);
            data.maxCols = Math.max(data.maxCols, c + nc - 1);
          } else {
            throw outsideGrid();
          }
        }
        if (!Array.isArray(values) || values.length !== nr) {
          throw new Error('The number of rows in the data does not match the number of rows in the range.');
        }
        values.forEach(function(line) {
          if (!Array.isArray(line) || line.length !== nc) {
            throw new Error('The number of columns in the data does not match the number of columns in the range.');
          }
        });
        const tooBig = function(v) { return typeof v === 'string' && v.length > 50000; };
        const oversizeError = function() {
          return new Error('Your input contains more than the maximum of 50000 characters in a single cell.');
        };
        const storeAll = function(skipOversize) {
          values.forEach(function(line, i) {
            line.forEach(function(v, j) {
              if (skipOversize && tooBig(v)) { return; }
              let value = v;
              if (typeof value === 'string') {
                if (tooBig(value) && o.cellLimit === 'truncate') { value = value.slice(0, 50000); }
                value = value === '' ? '' : coerceString(value, data.formats[(r + i) + ',' + (c + j)] === '@', o.coercion);
              }
              while (data.rows.length < r + i) { data.rows.push([]); }
              const row = data.rows[r - 1 + i];
              while (row.length < c - 1 + j) { row.push(''); }
              row[c - 1 + j] = value;
            });
          });
        };
        const anyTooBig = values.some(function(line) { return line.some(tooBig); });
        if (anyTooBig) { model.oversizeAttempts += 1; }
        if (anyTooBig && o.cellLimit === 'throw') { throw oversizeError(); }  // atomic: nothing stored
        // OBSERVED in real run 1 (an engine without P10): the platform refused the
        // cell with this error but the rest of the row was already stored.
        if (anyTooBig && o.cellLimit === 'partial') { storeAll(true); throw oversizeError(); }  // non-atomic
        storeAll(false);
        return range;
      },
      clear: forbidden('range.clear'),
      clearContent: forbidden('range.clearContent'),
      setFormula: forbidden('range.setFormula')
    };
    (o.missing || []).forEach(function(name) { delete range[name]; });
    return range;
  }

  const sheet = {
    _data: data,
    getName: function() { tick(model, 'read'); return data.name; },
    getLastRow: function() {
      tick(model, 'read');
      if (o.failGateLastRowWhileLocked && view === 1 && model.lockHeld) {
        throw new Error('getLastRow failed while the lock was held (simulated)');
      }
      return lastRowOf(data);
    },
    getLastColumn: function() { tick(model, 'read'); return lastColOf(data); },
    getMaxRows: function() { tick(model, 'read'); return data.maxRows; },
    getRange: function(r, c, nr, nc) { tick(model, 'default'); return makeRange(r, c, nr, nc); },
    deleteRows: function(pos, howMany) {
      tick(model, 'deleteRows');
      op('deleteRows', { pos: pos, howMany: howMany });
      if (o.deleteRowsThrows) { throw new Error(o.deleteRowsThrows); }
      if (!(pos >= 1) || !(howMany >= 1) || pos > data.maxRows) { throw new Error('The row index is outside the sheet.'); }
      const actual = Math.min(howMany, data.maxRows - pos + 1);
      if (actual >= data.maxRows) { throw new Error('You can\'t delete all the rows on the sheet.'); }
      data.rows.splice(pos - 1, actual);
      shiftFormats(data, pos, -actual);
      if (!o.deleteRowsNoShrink) { data.maxRows -= actual; }
    },
    insertRowsAfter: function(pos, howMany) {
      tick(model, 'insertRowsAfter');
      op('insertRowsAfter', { pos: pos, howMany: howMany });
      if (o.insertRowsAfterThrows) { throw new Error(o.insertRowsAfterThrows); }
      if (!(pos >= 0) || !(howMany >= 1) || pos > data.maxRows) { throw new Error('The row index is outside the sheet.'); }
      while (data.rows.length < pos) { data.rows.push([]); }
      const blanks = [];
      for (let i = 0; i < howMany; i++) { blanks.push([]); }
      data.rows.splice.apply(data.rows, [pos, 0].concat(blanks));
      shiftFormats(data, pos + 1, howMany);
      data.maxRows += howMany;
      return sheet;
    },
    // The sibling's observation: appendRow ignores a plain-text format.
    appendRow: function(values) {
      model.violations.push('sheet.appendRow');
      const target = lastRowOf(data) + 1;
      if (target > data.maxRows) { data.maxRows = target; }
      while (data.rows.length < target) { data.rows.push([]); }
      data.rows[target - 1] = values.map(function(v) {
        return typeof v === 'string' && v !== '' ? coerceString(v, false, o.coercion) : v;
      });
      return sheet;
    },
    clear: forbidden('clear'),
    clearContents: forbidden('clearContents'),
    deleteColumns: forbidden('deleteColumns'),
    deleteRow: forbidden('deleteRow')
  };
  return sheet;
}

function makeView(model, viewId) {
  const o = model.opts;
  const wrappers = new Map();
  function wrap(data) {
    if (!wrappers.has(data)) { wrappers.set(data, makeSheet(model, data, viewId)); }
    return wrappers.get(data);
  }
  return {
    getName: function() { tick(model, 'read'); return SPREADSHEET_NAME; },
    getSpreadsheetLocale: function() { tick(model, 'read'); return 'en_US'; },
    getSpreadsheetTimeZone: function() { tick(model, 'read'); return 'Asia/Singapore'; },
    getSheets: function() { tick(model, 'read'); return model.tabs.map(wrap); },
    getSheetByName: function(name) {
      tick(model, 'read');
      const hit = model.tabs.filter(function(t) { return t.name === name; })[0];
      return hit ? wrap(hit) : null;
    },
    insertSheet: function(name) {
      tick(model, 'insertSheet');
      model.insertCount += 1;
      if (o.failInsertSheetAt && model.insertCount === o.failInsertSheetAt) {
        throw new Error('Service Spreadsheets failed while accessing document (simulated)');
      }
      if (model.tabs.some(function(t) { return t.name === name; })) {
        throw new Error('A sheet with the name "' + name + '" already exists. Please enter another name.');
      }
      const data = addTab(model, name, []);
      pushOp(model, { op: 'insertSheet', tab: name, view: viewId });
      return wrap(data);
    },
    deleteSheet: function(sheet) {
      tick(model, 'deleteSheet');
      const data = sheet._data;
      if (o.failDeleteSheetFor && new RegExp(o.failDeleteSheetFor).test(data.name)) {
        throw new Error('Unable to delete the sheet (simulated)');
      }
      if (model.tabs.length === 1) { throw new Error('You can\'t delete the only sheet in a spreadsheet.'); }
      model.tabs.splice(model.tabs.indexOf(data), 1);
      pushOp(model, { op: 'deleteSheet', tab: data.name, view: viewId });
    }
  };
}

function makeLock(model) {
  const state = { mine: false };
  return {
    waitLock: function(ms) {
      pushOp(model, { op: 'waitLock', ms: ms });
      if (state.mine) { return; } // official docs: no effect if this object already holds the lock
      const mode = model.opts.lockMode;
      if (mode === 'held-elsewhere' || (mode === 'exclusive' && model.lockHeld)) {
        model.clock.now += ms;
        throw new Error('Lock timeout: another process was holding the lock for too long.');
      }
      if (mode === 'exclusive') { model.lockHeld = true; }
      state.mine = true;
    },
    releaseLock: function() {
      pushOp(model, { op: 'releaseLock' });
      if (!state.mine) { return; }
      state.mine = false;
      if (model.opts.lockMode === 'exclusive') { model.lockHeld = false; }
      if (model.opts.releaseThrows) { throw new Error('releaseLock failed (simulated)'); }
    },
    hasLock: function() { return state.mine; }
  };
}

function makeSandbox(model) {
  function FakeDate() {
    const args = Array.prototype.slice.call(arguments);
    if (!(this instanceof FakeDate)) { return new RealDate(model.clock.now).toString(); }
    if (args.length === 0) { return new RealDate(model.clock.now); }
    return new (Function.prototype.bind.apply(RealDate, [null].concat(args)))();
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = function() { return model.clock.now; };
  FakeDate.UTC = RealDate.UTC;
  FakeDate.parse = RealDate.parse;

  function forbiddenGlobal(name) {
    return function() {
      model.violations.push(name);
      throw new Error('forbidden call: ' + name + '()');
    };
  }

  return {
    Date: FakeDate,
    Logger: { log: function(line) { model.logs.push(String(line)); } },
    console: {
      log: forbiddenGlobal('console.log'), warn: forbiddenGlobal('console.warn'),
      error: forbiddenGlobal('console.error')
    },
    Session: { getScriptTimeZone: function() { return 'Asia/Singapore'; } },
    PropertiesService: {
      getScriptProperties: function() {
        return {
          getProperty: function(key) {
            return key === 'EXEC_OS_SPREADSHEET_ID' && model.opts.propertyId !== null ? model.opts.propertyId : null;
          }
        };
      }
    },
    SpreadsheetApp: {
      openById: function(id) {
        tick(model, 'openById');
        if (model.opts.openThrows) { throw new Error(model.opts.openThrows); }
        model.viewCount += 1;
        pushOp(model, { op: 'openById', view: model.viewCount });
        return makeView(model, model.viewCount);
      },
      flush: function() { tick(model, 'flush'); pushOp(model, { op: 'flush' }); },
      create: forbiddenGlobal('SpreadsheetApp.create'),
      getActiveSpreadsheet: forbiddenGlobal('SpreadsheetApp.getActiveSpreadsheet'),
      getActive: forbiddenGlobal('SpreadsheetApp.getActive'),
      openByUrl: forbiddenGlobal('SpreadsheetApp.openByUrl')
    },
    LockService: {
      getScriptLock: function() {
        if (model.opts.sameLockObject) {
          if (!model.sharedLock) { model.sharedLock = makeLock(model); }
          return model.sharedLock;
        }
        return makeLock(model);
      },
      getDocumentLock: forbiddenGlobal('LockService.getDocumentLock'),
      getUserLock: forbiddenGlobal('LockService.getUserLock')
    }
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

// Runs the gate once in a fresh context. opts.sources replaces file text
// (used for mutants); everything else is a platform knob.
function runGate(opts) {
  opts = opts || {};
  const model = makeModel(opts);
  const before = {};
  model.tabs.forEach(function(t) { before[t.name] = JSON.stringify([t.rows, t.formats, t.maxRows]); });
  const sandbox = makeSandbox(model);
  vm.createContext(sandbox);
  FILES.forEach(function(file) {
    const text = opts.sources && opts.sources[file] !== undefined ? opts.sources[file] : SRC[file];
    vm.runInContext(text, sandbox, { filename: file });
  });
  const startedAt = model.clock.now;
  const report = plain(vm.runInContext('runTruthEngineGate()', sandbox));
  return {
    report: report, model: model, logs: model.logs, before: before, sandbox: sandbox,
    clockDelta: model.clock.now - startedAt
  };
}

// ======================= harness ============================================

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

function find(report, id) {
  const hits = report.checks.filter(function(c) { return c.id === id; });
  assert.ok(hits.length > 0, 'no check with id ' + id + '; ids: ' + report.checks.map(function(c) { return c.id; }).join(', '));
  return hits[hits.length - 1];
}

function statusMap(report) {
  const out = {};
  report.checks.forEach(function(c) { out[c.id] = c.status; });
  return out;
}

function nonPass(report) {
  const out = {};
  report.checks.forEach(function(c) {
    if (c.status !== 'PASS' && c.status !== 'INFO') { out[c.id] = c.status; }
  });
  return out;
}

function writeOps(model, view) {
  const writes = ['insertSheet', 'deleteSheet', 'setValues', 'setNumberFormat', 'deleteRows', 'insertRowsAfter'];
  return model.ops.filter(function(o) {
    return writes.indexOf(o.op) !== -1 && (view === undefined || (view === 'gate' ? o.view === 1 : o.view !== 1));
  });
}

function mutate(src, find, replacement) {
  const first = src.indexOf(find);
  assert.ok(first !== -1, 'mutation target not found: ' + find.slice(0, 60));
  assert.strictEqual(src.indexOf(find, first + find.length), -1, 'mutation target is not unique: ' + find.slice(0, 60));
  return src.slice(0, first) + replacement + src.slice(first + find.length);
}

function engineWith(find, replacement) {
  return { sources: { '15_TruthEngine.js': mutate(SRC['15_TruthEngine.js'], find, replacement) } };
}

// Several replacements on the same engine, applied in order; each must still
// match exactly once in the text as it stands at that point.
function engineWithAll(pairs) {
  let text = SRC['15_TruthEngine.js'];
  pairs.forEach(function(pair) { text = mutate(text, pair[0], pair[1]); });
  return { sources: { '15_TruthEngine.js': text } };
}

// The engine WITHOUT P10 (the per-cell length guard) and WITHOUT P11 (the
// apostrophe marker). If 15_TruthEngine.js is ever reworded so an anchor moves
// or repeats, mutate() fails these loudly instead of the suite quietly testing
// the wrong engine.
const NO_P10 = ['if (writtenLength > MAX_CELL_CHARS) {', 'if (false) {'];
const NO_P11 = ['return first === \'=\' || first === TEXT_MARKER;', 'return false;'];

// What the real Spreadsheet did with the 36 control strings written WITHOUT the
// plain-text format: these 23 were re-typed, in the gate's own order. OBSERVED:
// real run 1 (2026-11-03 06:59 MYT) and run 2 (2026-11-05 00:29 MYT) printed
// this same list, and 17 of 24 (PT.A) and 6 of 12 (PT.B) in the two rows.
const OBSERVED_RETYPED = ['leading zeros', 'scientific notation', 'all-digit hash-like',
  'trailing-zero decimal', 'negative integer', 'thousands separator', 'percent literal',
  'currency literal', 'parenthesised number', 'ISO date', 'clock time', 'fraction or short date',
  'formula', 'formula with function', 'TRUE as text', 'false as text', 'leading apostrophe',
  'slashed digits', 'month and day', 'year-first slashes', 'month-first slashes', '12-hour time',
  'small exponent'];

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
}

const BASELINE = runGate();
const ALL_IDS = ['PT.control', 'PT.A', 'PT.B', 'NT', 'GR', 'GR.raw', 'OS', 'LAT', 'LAT.time',
  'LK.reentrancy', 'LK.release', 'LK.releaseFail', 'LK.timeout', 'CL'];

// ================= A. Baseline on the faithful fake =========================

check('(1) Baseline: verdict PASS; every check present, in order, with the expected status', function() {
  const r = BASELINE.report;
  assert.strictEqual(r.verdict, 'PASS', JSON.stringify(nonPass(r)));
  assert.deepStrictEqual(r.checks.map(function(c) { return c.id; }), ALL_IDS);
  assert.deepStrictEqual(statusMap(r), {
    'PT.control': 'INFO', 'PT.A': 'PASS', 'PT.B': 'PASS', NT: 'PASS', GR: 'PASS', 'GR.raw': 'INFO',
    OS: 'PASS', LAT: 'PASS', 'LAT.time': 'INFO', 'LK.reentrancy': 'INFO', 'LK.release': 'PASS',
    'LK.releaseFail': 'PASS', 'LK.timeout': 'PASS', CL: 'PASS'
  });
  assert.deepStrictEqual(r.counts, { PASS: 10, FAIL: 0, INFO: 4, INCONCLUSIVE: 0, SKIPPED: 0 });
  assert.strictEqual(r.abortReason, null);
});

check('(2) Baseline: the fake\'s control reproduces the real Spreadsheet (OBSERVED, runs 1 and 2: the same 23 of 36 shapes re-typed, 17 of 24 in PT.A, 6 of 12 in PT.B), so a PASS cannot be vacuous', function() {
  const detail = find(BASELINE.report, 'PT.control').detail;
  const listed = /^23 of 36 were re-typed by this Spreadsheet \(([^)]*)\)\./.exec(detail);
  assert.ok(listed, detail);
  assert.deepStrictEqual(listed[1].split('; '), OBSERVED_RETYPED);
  const a = find(BASELINE.report, 'PT.A').detail;
  assert.ok(/^24\/24 came back as the identical string/.test(a), a);
  assert.ok(/17 of them were re-typed in the control/.test(a), a);
  const b = find(BASELINE.report, 'PT.B').detail;
  assert.ok(/^12\/12 came back/.test(b) && /6 of them were re-typed/.test(b), b);
});

check('(3) Clean-up: every temp tab is deleted, the tab list is exactly what it was, and CL says so', function() {
  const names = BASELINE.model.tabs.map(function(t) { return t.name; });
  assert.deepStrictEqual(names, ['Sheet1', 'Execution_References']);
  assert.strictEqual(BASELINE.report.cleanup.ok, true);
  assert.strictEqual(BASELINE.report.cleanup.created.length, 4);
  assert.deepStrictEqual(BASELINE.report.cleanup.remaining, []);
  assert.ok(BASELINE.report.cleanup.created.every(function(n) { return /^ZZ_EXEC_GATE_\d{8}T\d{9}Z_[WCTG]$/.test(n); }),
      JSON.stringify(BASELINE.report.cleanup.created));
});

check('(4) Isolation: existing tabs are byte-for-byte unchanged, and every write the run made targeted a ZZ_EXEC_GATE_ tab', function() {
  BASELINE.model.tabs.forEach(function(t) {
    assert.strictEqual(JSON.stringify([t.rows, t.formats, t.maxRows]), BASELINE.before[t.name], t.name + ' changed');
  });
  const writes = writeOps(BASELINE.model);
  assert.ok(writes.length > 50, 'sanity: expected many write ops, got ' + writes.length);
  writes.forEach(function(w) {
    assert.ok(/^ZZ_EXEC_GATE_/.test(w.tab), 'a write touched ' + w.tab + ' (' + w.op + ')');
  });
});

check('(5) Rows under test go through the engine: the gate\'s own Spreadsheet handle writes ONLY scaffolding', function() {
  const gate = writeOps(BASELINE.model, 'gate');
  const roleOf = function(w) { return w.tab.slice(-1); };
  const tally = {};
  gate.forEach(function(w) {
    const key = w.op + ':' + roleOf(w) + (w.op === 'setValues' ? ':r' + w.r : '');
    tally[key] = (tally[key] || 0) + 1;
  });
  assert.deepStrictEqual(tally, {
    'insertSheet:W': 1, 'insertSheet:C': 1, 'insertSheet:T': 1, 'insertSheet:G': 1,
    'setValues:W:r1': 1, 'setValues:C:r1': 1, 'setValues:T:r1': 1, 'setValues:G:r1': 1,
    'setValues:C:r2': 1, 'setValues:C:r3': 1,
    'deleteRows:G': 1, 'setValues:G:r5': 1,
    'deleteSheet:W': 1, 'deleteSheet:C': 1, 'deleteSheet:T': 1, 'deleteSheet:G': 1
  });
  const engine = writeOps(BASELINE.model, 'engine');
  assert.ok(engine.length > 0);
  engine.forEach(function(w) {
    assert.ok(['setNumberFormat', 'setValues', 'insertRowsAfter'].indexOf(w.op) !== -1, 'engine did ' + w.op);
    assert.ok(/_[WTG]$/.test(w.tab), 'engine wrote to ' + w.tab);
    if (w.op === 'setValues') { assert.ok(w.r >= 2 && w.nr === 1, 'engine setValues at row ' + w.r); }
  });
});

check('(6) No forbidden call anywhere: no appendRow, create, active/by-URL Spreadsheet, document/user lock, console, clear, setFormula', function() {
  assert.deepStrictEqual(BASELINE.model.violations, []);
});

check('(7) Log hygiene: the Spreadsheet ID never appears, the name does, the RESULT line and the NOT VERIFIED block are there, and exactly the 3 provoked engine ERROR lines appear', function() {
  const log = BASELINE.logs.join('\n');
  assert.ok(log.indexOf(SPREADSHEET_ID) === -1, 'the Spreadsheet ID leaked into the log');
  assert.ok(log.indexOf(SPREADSHEET_NAME) !== -1);
  assert.ok(/RESULT: PASS -- every check this gate ran passed\. That is NOT "TruthEngine is verified in GAS"/.test(log));
  assert.ok(/NOT VERIFIED BY THIS GATE:\n  1\. Mutual exclusion[\s\S]*\n  5\. BR-10 beyond the tab-name guard\./.test(log));
  const errors = BASELINE.logs.filter(function(l) { return l.indexOf('[ERROR] TruthEngine.append') !== -1; });
  assert.strictEqual(errors.length, 3, 'expected oversize + unknown column + lock timeout, got ' + errors.length);
  assert.ok(BASELINE.logs[0].indexOf('90_UnitTests.js') !== -1 && BASELINE.logs[0].indexOf('2026-10-31') !== -1);
});

check('(8) The top-level function returns the same report object the module builds, and is the only top-level function', function() {
  assert.strictEqual(vm.runInContext('typeof runTruthEngineGate', BASELINE.sandbox), 'function');
  const declared = (stripComments(SRC['90_UnitTests.js']).match(/^function\s+(\w+)/gm) || []);
  assert.deepStrictEqual(declared, ['function runTruthEngineGate']);
  assert.strictEqual(BASELINE.report.checks.length, ALL_IDS.length);
});

check('(9) Timings are deterministic on the fake clock: each string cell costs exactly one setNumberFormat call (25 and 13 cells)', function() {
  const slow = runGate({ latency: { setNumberFormat: 1150 } }); // +1000 ms per formatted cell
  const timings = function(res) {
    const detail = find(res.report, 'LAT.time').detail;
    const out = {};
    detail.replace(/([A-Z.]+(?: \d)?) \((\d+) string cells\) (\d+) ms/g, function(all, label, cells, ms) {
      out[label] = { cells: Number(cells), ms: Number(ms) };
      return all;
    });
    return out;
  };
  const a = timings(BASELINE);
  const b = timings(slow);
  assert.deepStrictEqual(Object.keys(a), ['PT.A', 'PT.B', 'NT', 'LAT 1', 'LAT 2', 'LAT 3', 'LAT 4', 'LAT 5']);
  Object.keys(a).forEach(function(label) {
    assert.strictEqual(b[label].ms - a[label].ms, a[label].cells * 1000, label);
  });
  assert.deepStrictEqual([a['PT.A'].cells, a['PT.B'].cells, a.NT.cells, a['LAT 1'].cells], [25, 13, 1, 13]);
  assert.ok(/5 appends of 13 string cells: min \d+ ms, avg \d+ ms, max \d+ ms/.test(find(BASELINE.report, 'LAT.time').detail));
  assert.ok(/LOCK_WAIT_MS for the lock \(10000 in 15_TruthEngine\.js, PROPOSED P3\)/.test(find(BASELINE.report, 'LAT.time').detail));
  assert.strictEqual(BASELINE.report.elapsedMs, BASELINE.clockDelta);
});

check('(10) Lock timeout: the report quotes the wait the engine itself names, and the measured time is at least that wait on the fake clock', function() {
  const d = find(BASELINE.report, 'LK.timeout').detail;
  const m = /after (\d+) ms \(it names (\d+) ms as its wait\)/.exec(d);
  assert.ok(m, d);
  assert.strictEqual(m[2], '10000');
  assert.ok(Number(m[1]) >= 10000, d);
  assert.ok(/wrote nothing, and appended normally once the lock was released/.test(d));
});

// ================= B. Platform variations ===================================

check('(11) Control that re-types nothing, with an engine WITHOUT P11 (a platform that never consumes an apostrophe cannot take the marker): PT.A and PT.B end INCONCLUSIVE (never PASS), verdict INCOMPLETE, no FAIL', function() {
  const r = runGate(Object.assign({ coercion: 'none' }, engineWithAll([NO_P11]))).report;
  assert.strictEqual(find(r, 'PT.A').status, 'INCONCLUSIVE');
  assert.strictEqual(find(r, 'PT.B').status, 'INCONCLUSIVE');
  assert.ok(/the control re-typed none of them/.test(find(r, 'PT.A').detail));
  assert.ok(/^0 of 36 were re-typed/.test(find(r, 'PT.control').detail));
  assert.strictEqual(r.verdict, 'INCOMPLETE');
  assert.strictEqual(r.counts.FAIL, 0);
});

check('(11a) The same platform with the real engine: PT.A FAILS on exactly the three shapes the P11 marker is put on (this platform does not consume it, so it shows), PT.B stays INCONCLUSIVE', function() {
  const res = runGate({ coercion: 'none' });
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/3 of 24 shapes not preserved/.test(a.detail), a.detail);
  const lines = res.logs.filter(function(l) { return /not preserved --/.test(l); });
  assert.strictEqual(lines.length, 3, lines.join(' | '));
  assert.ok(/not preserved -- formula: getValues\(\) gives "'=1\+1"/.test(lines[0]), lines[0]);
  assert.ok(/not preserved -- formula with function: getValues\(\) gives "'=SUM\(1,2\)"/.test(lines[1]), lines[1]);
  assert.ok(/not preserved -- leading apostrophe: getValues\(\) gives "''quoted"/.test(lines[2]), lines[2]);
  assert.strictEqual(find(res.report, 'PT.B').status, 'INCONCLUSIVE');
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(12) A platform that ignores the plain-text format: PT.A and PT.B FAIL, naming each shape that was re-typed (14 of 24 and 6 of 12); the three marker shapes survive, kept by P11 alone', function() {
  const res = runGate({ coercion: 'atIgnored' });
  const a = find(res.report, 'PT.A');
  const b = find(res.report, 'PT.B');
  assert.strictEqual(a.status, 'FAIL');
  assert.strictEqual(b.status, 'FAIL');
  assert.ok(/14 of 24 shapes not preserved/.test(a.detail), a.detail);
  assert.ok(/6 of 12 shapes not preserved/.test(b.detail), b.detail);
  const log = res.logs.join('\n');
  assert.ok(/not preserved -- leading zeros: getValues\(\) gives number 123/.test(log));
  assert.ok(/not preserved -- ISO date: getValues\(\) gives Date /.test(log));
  assert.ok(!/not preserved -- formula/.test(log), 'a formula shape should survive: the marker is consumed even in a cell without the format');
  assert.ok(!/not preserved -- leading apostrophe/.test(log));
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(12a) The same platform with an engine WITHOUT P11: 17 of 24 and 6 of 12, the formula evaluated and the apostrophe eaten too', function() {
  const res = runGate(Object.assign({ coercion: 'atIgnored' }, engineWithAll([NO_P11])));
  const a = find(res.report, 'PT.A');
  const b = find(res.report, 'PT.B');
  assert.strictEqual(a.status, 'FAIL');
  assert.strictEqual(b.status, 'FAIL');
  assert.ok(/17 of 24 shapes not preserved/.test(a.detail), a.detail);
  assert.ok(/6 of 12 shapes not preserved/.test(b.detail), b.detail);
  const log = res.logs.join('\n');
  assert.ok(/not preserved -- leading zeros: getValues\(\) gives number 123/.test(log));
  assert.ok(/not preserved -- formula: getValues\(\) gives number 2/.test(log));
  assert.ok(/not preserved -- leading apostrophe: getValues\(\) gives "quoted"/.test(log));
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(13) An engine WITHOUT P11 on the platform as run 1 OBSERVED it (a leading apostrophe eaten and "=" evaluated even in plain-text cells): PT.A fails on exactly those three shapes, PT.B passes', function() {
  const res = runGate(engineWithAll([NO_P11]));
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/3 of 24 shapes not preserved/.test(a.detail), a.detail);
  const lines = res.logs.filter(function(l) { return /not preserved --/.test(l); });
  assert.strictEqual(lines.length, 3, lines.join(' | '));
  assert.ok(/not preserved -- formula: getValues\(\) gives number 2; getDisplayValues\(\) gives "2"/.test(lines[0]), lines[0]);
  assert.ok(/not preserved -- formula with function: getValues\(\) gives number 3; getDisplayValues\(\) gives "3"/.test(lines[1]), lines[1]);
  assert.ok(/not preserved -- leading apostrophe: getValues\(\) gives "quoted"; getDisplayValues\(\) gives "quoted"/.test(lines[2]), lines[2]);
  assert.strictEqual(find(res.report, 'PT.B').status, 'PASS');
});

check('(14) A platform whose display trims plain-text cells: only the spaces shape fails, and the message names getDisplayValues()', function() {
  const res = runGate({ coercion: 'displayTrims' });
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/1 of 24 shapes not preserved/.test(a.detail), a.detail);
  assert.ok(res.logs.some(function(l) { return /not preserved -- leading and trailing spaces: getDisplayValues\(\) gives "padded"/.test(l); }));
});

check('(15) A platform that grows the grid by itself: GR still PASSES and GR.raw says the raw write was ACCEPTED; with the default it THREW', function() {
  const grow = runGate({ gridMode: 'grow' }).report;
  assert.strictEqual(find(grow, 'GR').status, 'PASS');
  assert.ok(/the write was ACCEPTED; getMaxRows\(\) went from 4 to 5\. So this platform copes/.test(find(grow, 'GR.raw').detail));
  const base = find(BASELINE.report, 'GR.raw').detail;
  assert.ok(/the write THREW: The coordinates of the range are outside the dimensions of the sheet\.; getMaxRows\(\) went from 4 to 4\. So a write past the grid does fail here, and the engine's growth step is needed\./.test(base), base);
});

check('(16) insertRowsAfter fails on the platform: GR FAILS and says it was the third append, the one that needs a row past the grid', function() {
  const r = runGate({ insertRowsAfterThrows: 'Service error: insertRowsAfter (simulated)' }).report;
  const g = find(r, 'GR');
  assert.strictEqual(g.status, 'FAIL');
  assert.ok(/append 3 threw: .*insertRowsAfter \(simulated\) \(this is the append that needs a row past the grid\)/.test(g.detail), g.detail);
  assert.strictEqual(r.verdict, 'FAIL');
});

check('(17) deleteRows throws (gate scaffolding): GR is INCONCLUSIVE, says it is the gate not TruthEngine, and the other groups still run to PASS', function() {
  const r = runGate({ deleteRowsThrows: 'deleteRows is not available (simulated)' }).report;
  const g = find(r, 'GR');
  assert.strictEqual(g.status, 'INCONCLUSIVE');
  assert.ok(/the gate itself could not finish this group \(deleteRows is not available \(simulated\)\)/.test(g.detail));
  assert.ok(/points at the gate scaffolding or a platform call, not at TruthEngine/.test(g.detail));
  ['PT.A', 'PT.B', 'NT', 'OS', 'LAT', 'LK.timeout', 'CL'].forEach(function(id) {
    assert.strictEqual(find(r, id).status, 'PASS', id);
  });
  assert.strictEqual(r.verdict, 'INCOMPLETE');
});

check('(18) deleteRows does not shrink the grid: GR is INCONCLUSIVE ("could not shrink"), not a verdict on the engine', function() {
  const r = runGate({ deleteRowsNoShrink: true }).report;
  const g = find(r, 'GR');
  assert.strictEqual(g.status, 'INCONCLUSIVE');
  assert.ok(/could not shrink the grid tab to 3 rows \(getMaxRows\(\) is 1000 after deleteRows\)/.test(g.detail), g.detail);
});

check('(19) Oversize cell, with P10: the engine refuses it before the platform sees it, so OS PASSES whatever the platform would have done (throw, truncate, accept, fail half-way) and no oversize write ever reaches it', function() {
  ['throw', 'truncate', 'accept', 'partial'].forEach(function(mode) {
    const res = runGate({ cellLimit: mode });
    const os = find(res.report, 'OS');
    assert.strictEqual(os.status, 'PASS', mode + ': ' + os.detail);
    assert.ok(/refused with an error and nothing was written; the next normal append succeeded on row \d+/.test(os.detail), os.detail);
    assert.ok(/a string of 50001 characters when written \(one cell holds at most 50000\)/.test(os.detail), os.detail);
    assert.strictEqual(res.model.oversizeAttempts, 0, mode + ': the platform was reached with an oversize cell');
  });
});

check('(19a) Oversize cell, with an engine WITHOUT P10: the platform decides -- throws -> PASS; truncates silently -> FAIL; accepts -> INFO (an observation, not a verdict)', function() {
  const noP10 = engineWithAll([NO_P10]);
  const thrown = runGate(noP10);
  const base = find(thrown.report, 'OS');
  assert.strictEqual(base.status, 'PASS');
  assert.ok(/refused with an error and nothing was written; the next normal append succeeded on row \d+ \(so the lock was released\)/.test(base.detail), base.detail);
  assert.ok(/Your input contains more than the maximum of 50000 characters in a single cell/.test(base.detail), base.detail);
  assert.strictEqual(thrown.model.oversizeAttempts, 1, 'here the oversize cell does reach the platform');
  const truncated = find(runGate(Object.assign({ cellLimit: 'truncate' }, noP10)).report, 'OS');
  assert.strictEqual(truncated.status, 'FAIL');
  assert.ok(/the cell holds 50000 characters instead of 50001: data was changed silently/.test(truncated.detail), truncated.detail);
  const accepted = find(runGate(Object.assign({ cellLimit: 'accept' }, noP10)).report, 'OS');
  assert.strictEqual(accepted.status, 'INFO');
  assert.ok(/ACCEPTED and returned all 50001 characters/.test(accepted.detail), accepted.detail);
});

check('(20) A platform that lets one execution take the script lock twice: the lock checks end INCONCLUSIVE / SKIPPED, nothing FAILS, verdict INCOMPLETE', function() {
  const r = runGate({ lockMode: 'reentrant' }).report;
  assert.ok(/ACQUIRED: the platform lets one execution take the script lock twice/.test(find(r, 'LK.reentrancy').detail));
  assert.strictEqual(find(r, 'LK.release').status, 'INCONCLUSIVE');
  assert.strictEqual(find(r, 'LK.releaseFail').status, 'INCONCLUSIVE');
  assert.strictEqual(find(r, 'LK.timeout').status, 'SKIPPED');
  assert.ok(/needs a second execution running at the same time/.test(find(r, 'LK.timeout').detail));
  assert.strictEqual(r.counts.FAIL, 0);
  assert.strictEqual(r.verdict, 'INCOMPLETE');
});

check('(21) Another execution holds the script lock: the run STOPS in pre-flight (ABORTED), writes nothing, creates nothing', function() {
  const res = runGate({ lockMode: 'held-elsewhere' });
  assert.strictEqual(res.report.verdict, 'ABORTED');
  assert.ok(/the script lock could not be taken within 1000 ms .* Another execution of this script holds it/.test(res.report.abortReason), res.report.abortReason);
  assert.deepStrictEqual(writeOps(res.model), []);
  assert.strictEqual(res.report.cleanup, null);
  assert.deepStrictEqual(res.model.tabs.map(function(t) { return t.name; }), ['Sheet1', 'Execution_References']);
});

check('(22) Time budget: once 200 s have passed no new group starts (SKIPPED, with the reason), the clean-up still runs and passes, verdict INCOMPLETE, no FAIL', function() {
  const res = runGate({ latency: { setNumberFormat: 20000 } });
  const r = res.report;
  assert.strictEqual(find(r, 'PT.A').status, 'PASS');
  ['NT', 'GR', 'OS', 'LAT', 'LK'].forEach(function(id) {
    const c = find(r, id);
    assert.strictEqual(c.status, 'SKIPPED', id);
    assert.ok(/not started: more than 200000 ms of the run had already passed/.test(c.detail), c.detail);
  });
  assert.strictEqual(find(r, 'CL').status, 'PASS');
  assert.deepStrictEqual(res.model.tabs.map(function(t) { return t.name; }), ['Sheet1', 'Execution_References']);
  assert.strictEqual(r.counts.FAIL, 0);
  assert.strictEqual(r.verdict, 'INCOMPLETE');
});

check('(23) Clean-up failure: a tab that cannot be deleted is named, reported FAIL, listed in cleanup.remaining; the other temp tabs are still deleted', function() {
  const res = runGate({ failDeleteSheetFor: '_C$' });
  const cl = find(res.report, 'CL');
  assert.strictEqual(cl.status, 'FAIL');
  assert.ok(/could not delete ZZ_EXEC_GATE_\S+_C: Unable to delete the sheet \(simulated\)/.test(cl.detail), cl.detail);
  assert.ok(/still present, delete by hand: ZZ_EXEC_GATE_\S+_C/.test(cl.detail), cl.detail);
  assert.strictEqual(res.report.cleanup.ok, false);
  assert.strictEqual(res.report.cleanup.remaining.length, 1);
  assert.deepStrictEqual(res.model.tabs.map(function(t) { return t.name.slice(-2); }), ['t1', 'es', '_C'].map(function(x, i) {
    return res.model.tabs[i].name.slice(-2);
  }));
  assert.strictEqual(res.model.tabs.length, 3);
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(24) Clean-up verification: a tab someone else added mid-run shows up as a tab-count mismatch (FAIL) instead of being deleted or ignored', function() {
  const res = runGate({ foreignTabAfterOps: 40 });
  const cl = find(res.report, 'CL');
  assert.strictEqual(cl.status, 'FAIL');
  assert.ok(/the Spreadsheet has 3 tab\(s\), it had 2 before the run/.test(cl.detail), cl.detail);
  assert.ok(res.model.tabs.some(function(t) { return t.name === 'Added_By_Someone_Else'; }), 'the foreign tab must be left alone');
});

check('(25) Setup failure: insertSheet throws on the third tab -> SETUP INCONCLUSIVE, the two tabs already made are deleted, no check group runs', function() {
  const res = runGate({ failInsertSheetAt: 3 });
  const s = find(res.report, 'SETUP');
  assert.strictEqual(s.status, 'INCONCLUSIVE');
  assert.ok(/unexpected error before the checks could run: Service Spreadsheets failed/.test(s.detail), s.detail);
  assert.strictEqual(res.report.cleanup.created.length, 2);
  assert.strictEqual(res.report.cleanup.ok, true);
  assert.deepStrictEqual(res.model.tabs.map(function(t) { return t.name; }), ['Sheet1', 'Execution_References']);
  assert.deepStrictEqual(res.report.checks.map(function(c) { return c.id; }), ['SETUP', 'CL']);
  assert.strictEqual(res.report.verdict, 'INCOMPLETE');
});

check('(25b) Setup failure AFTER a tab was created but BEFORE its header was written: that tab is still deleted (it was registered for clean-up first)', function() {
  const res = runGate({ failHeaderWriteFor: '_T$' });
  assert.strictEqual(find(res.report, 'SETUP').status, 'INCONCLUSIVE');
  assert.ok(/header write failed \(simulated\)/.test(find(res.report, 'SETUP').detail));
  assert.strictEqual(res.report.cleanup.created.length, 3);
  assert.strictEqual(res.report.cleanup.ok, true);
  assert.deepStrictEqual(res.model.tabs.map(function(t) { return t.name; }), ['Sheet1', 'Execution_References']);
});

check('(26) A platform call that does not exist (here getDisplayValues): the affected groups are INCONCLUSIVE with the TypeError text -- never a TruthEngine FAIL -- and unaffected groups still PASS', function() {
  const r = runGate({ missing: ['getDisplayValues'] }).report;
  ['PT', 'NT'].forEach(function(id) {
    const c = find(r, id);
    assert.strictEqual(c.status, 'INCONCLUSIVE', id);
    assert.ok(/is not a function/.test(c.detail), c.detail);
  });
  assert.strictEqual(r.counts.FAIL, 0);
  ['GR', 'OS', 'LAT', 'LK.timeout', 'CL'].forEach(function(id) { assert.strictEqual(find(r, id).status, 'PASS', id); });
});

check('(27) Pre-flight: Script Property not set -> ABORTED with the property name, no Spreadsheet opened, nothing written', function() {
  const res = runGate({ propertyId: null });
  assert.strictEqual(res.report.verdict, 'ABORTED');
  assert.ok(/Spreadsheet ID is not set/.test(res.report.abortReason) && /EXEC_OS_SPREADSHEET_ID/.test(res.report.abortReason), res.report.abortReason);
  assert.strictEqual(res.model.ops.length, 0);
  assert.deepStrictEqual(res.report.checks, []);
  assert.ok(res.logs.some(function(l) { return l.indexOf('[ERROR] UnitTests.runTruthEngineGate') !== -1; }));
});

check('(28) Pre-flight: the Spreadsheet cannot be opened -> ABORTED, nothing written', function() {
  const res = runGate({ openThrows: 'No item with the given ID could be found (simulated)' });
  assert.strictEqual(res.report.verdict, 'ABORTED');
  assert.ok(/could not be opened: No item with the given ID/.test(res.report.abortReason), res.report.abortReason);
  assert.deepStrictEqual(writeOps(res.model), []);
});

check('(29) Domain guard: each of the 17 Domain tab names makes the run STOP before any write, naming the tab', function() {
  const names = ['Events', 'Tasks', 'ActiveTasks', 'ArchiveTasks', 'TaskStatistics', 'TaskFilters', 'Projects',
    'Workflows', 'Timeline', 'Notes', 'Reviews', 'BusinessRules', 'WorkflowTemplates', 'TaskViewOrder',
    'ReminderRules', 'ReminderOccurrences', 'ReminderHistory'];
  assert.strictEqual(names.length, 17);
  names.forEach(function(name) {
    const res = runGate({ extraTabs: [name] });
    assert.strictEqual(res.report.verdict, 'ABORTED', name);
    assert.ok(res.report.abortReason.indexOf('(' + name + ')') !== -1, name + ': ' + res.report.abortReason);
    assert.ok(/ADR-012, BR-10/.test(res.report.abortReason));
    assert.deepStrictEqual(writeOps(res.model), [], name + ': a write happened');
    assert.strictEqual(res.model.ops.filter(function(o) { return o.op === 'waitLock'; }).length, 0, name + ': lock taken before the guard');
  });
});

check('(30) Domain guard is exact-match: near misses (events, Event, "Tasks ", Execution_Events) do not stop the run', function() {
  const res = runGate({ extraTabs: ['events', 'Event', 'Tasks ', 'Execution_Events'] });
  assert.strictEqual(res.report.verdict, 'PASS', JSON.stringify(nonPass(res.report)));
  assert.strictEqual(res.model.tabs.length, 6);
});

check('(31) A temp tab left by an earlier run is reported (PRE.leftover) and left alone; the run itself still PASSES', function() {
  const res = runGate({ extraTabs: ['ZZ_EXEC_GATE_20260101T000000000Z_W'] });
  const l = find(res.report, 'PRE.leftover');
  assert.strictEqual(l.status, 'INFO');
  assert.ok(/ZZ_EXEC_GATE_20260101T000000000Z_W\. This gate never deletes a tab it did not create/.test(l.detail), l.detail);
  assert.ok(res.model.tabs.some(function(t) { return t.name === 'ZZ_EXEC_GATE_20260101T000000000Z_W'; }));
  assert.strictEqual(res.report.verdict, 'PASS');
  assert.strictEqual(res.report.cleanup.created.length, 4);
});

check('(32a) Lock safety net: if the gate itself throws while it holds the lock, the group is INCONCLUSIVE and the clean-up still releases the lock', function() {
  const res = runGate({ failGateLastRowWhileLocked: true });
  const lk = find(res.report, 'LK');
  assert.strictEqual(lk.status, 'INCONCLUSIVE');
  assert.ok(/the gate itself could not finish this group \(getLastRow failed while the lock was held \(simulated\)\)/.test(lk.detail), lk.detail);
  assert.strictEqual(res.model.lockHeld, false, 'the script lock was left held after the run');
  assert.strictEqual(find(res.report, 'CL').status, 'PASS');
  assert.strictEqual(res.report.counts.FAIL, 0);
  assert.strictEqual(res.report.verdict, 'INCOMPLETE');
});

check('(32b) getScriptLock() handing out the SAME object: the probe says ACQUIRED and says why; the lock checks are INCONCLUSIVE / SKIPPED, never PASS; and with two objects the detail says so', function() {
  const same = runGate({ sameLockObject: true }).report;
  const d = find(same, 'LK.reentrancy').detail;
  assert.ok(/ACQUIRED: .* getScriptLock\(\) returned the SAME object twice\.$/.test(d), d);
  assert.strictEqual(find(same, 'LK.release').status, 'INCONCLUSIVE');
  assert.strictEqual(find(same, 'LK.timeout').status, 'SKIPPED');
  assert.strictEqual(same.counts.FAIL, 0);
  assert.ok(/REFUSED after \d+ ms .* getScriptLock\(\) returned two different objects\.$/.test(find(BASELINE.report, 'LK.reentrancy').detail), find(BASELINE.report, 'LK.reentrancy').detail);
});

// ================= C. Engine mutants: the gate must notice ===================

function expectStatuses(report, expected) {
  Object.keys(expected).forEach(function(id) {
    assert.strictEqual(find(report, id).status, expected[id], id + ': ' + find(report, id).detail);
  });
}

check('(32) MUTANT no plain-text format at all: PT.A, PT.B and NT FAIL; the rest still PASS', function() {
  const res = runGate(engineWith(
      '    plainTextColumns.forEach(function(column) {\n' +
      '      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);\n' +
      '    });\n', ''));
  expectStatuses(res.report, { 'PT.A': 'FAIL', 'PT.B': 'FAIL', NT: 'FAIL', GR: 'PASS', OS: 'PASS', LAT: 'PASS', 'LK.timeout': 'PASS' });
  assert.ok(/the marker string cell is not plain text/.test(find(res.report, 'NT').detail));
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(33) MUTANT format applied AFTER the write: PT.A and PT.B FAIL (the platform already re-typed the cells), NT PASSES -- the control is what makes this visible', function() {
  const res = runGate(engineWith(
      '    plainTextColumns.forEach(function(column) {\n' +
      '      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);\n' +
      '    });\n' +
      '    sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);\n',
      '    sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);\n' +
      '    plainTextColumns.forEach(function(column) {\n' +
      '      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);\n' +
      '    });\n'));
  expectStatuses(res.report, { 'PT.A': 'FAIL', 'PT.B': 'FAIL', NT: 'PASS' });
});

check('(34) MUTANT wrong rowNumber (+1): the checks that compare rows FAIL, and say which row was expected', function() {
  const res = runGate(engineWith('return { tabName: tabName, rowNumber: targetRow };', 'return { tabName: tabName, rowNumber: targetRow + 1 };'));
  expectStatuses(res.report, { 'PT.A': 'FAIL', 'PT.B': 'FAIL', NT: 'FAIL', GR: 'FAIL', LAT: 'FAIL', 'LK.timeout': 'FAIL' });
  assert.ok(/returned rowNumber 3, expected getLastRow\(\)\+1 = 2/.test(find(res.report, 'PT.A').detail), find(res.report, 'PT.A').detail);
});

check('(35) MUTANT no grid growth: GR FAILS on the third append; everything on roomy tabs still PASSES', function() {
  const res = runGate(engineWith('if (targetRow > maxRows) {', 'if (false) {'));
  expectStatuses(res.report, { GR: 'FAIL', 'PT.A': 'PASS', NT: 'PASS', OS: 'PASS', LAT: 'PASS' });
  assert.ok(/append 3 threw: .*outside the dimensions of the sheet/.test(find(res.report, 'GR').detail), find(res.report, 'GR').detail);
});

check('(36) MUTANT lock never released: the first append works, later ones time out (FAIL), and the lock group says an earlier append may not have released it', function() {
  const res = runGate(engineWith('        _releaseLock_(lock, tabName);\n      }\n    } catch (e) {', '      }\n    } catch (e) {'));
  expectStatuses(res.report, { 'PT.A': 'PASS', 'PT.B': 'FAIL', NT: 'FAIL', GR: 'FAIL', LK: 'INCONCLUSIVE' });
  assert.ok(/could not acquire the script lock within 10000 ms/.test(find(res.report, 'PT.B').detail));
  assert.ok(/an earlier TruthEngine\.append in this run did not release it/.test(find(res.report, 'LK').detail));
  assert.strictEqual(res.report.verdict, 'FAIL');
});

const LEAK_ON_FAILURE = [
  '      try {\n        return _appendLocked_(spreadsheetId, tabName, prepared);\n      } finally {\n        _releaseLock_(lock, tabName);\n      }\n',
  '      const out = _appendLocked_(spreadsheetId, tabName, prepared);\n      _releaseLock_(lock, tabName);\n      return out;\n'];

check('(37) MUTANT lock released only on success: LK.releaseFail FAILS and the timeout test is SKIPPED as untrustworthy -- and OS PASSES, because with P10 the oversize case is refused before the lock is taken (OS no longer shows a lock leak)', function() {
  const res = runGate(engineWithAll([LEAK_ON_FAILURE]));
  expectStatuses(res.report, { OS: 'PASS', 'LK.release': 'PASS', 'LK.releaseFail': 'FAIL', 'LK.timeout': 'SKIPPED' });
  assert.ok(/a fresh lock object could not take the script lock within 1000 ms/.test(find(res.report, 'LK.releaseFail').detail));
  assert.strictEqual(res.report.verdict, 'FAIL');
});

check('(37a) The same MUTANT in an engine WITHOUT P10 (as before 2026-11-03): the oversize case does take the lock and leaks it, so OS catches it first -- "the next normal append failed"', function() {
  const early = runGate(engineWithAll([NO_P10, LEAK_ON_FAILURE])).report;
  assert.strictEqual(find(early, 'OS').status, 'FAIL');
  assert.ok(/the next normal append failed/.test(find(early, 'OS').detail), find(early, 'OS').detail);
  assert.strictEqual(early.verdict, 'FAIL');
});

check('(38) MUTANT engine takes no lock: only LK.timeout FAILS ("APPENDED while another lock object held the script lock")', function() {
  const res = runGate(engineWith('const lock = _acquireLock_();', 'const lock = { releaseLock: function() {} };'));
  expectStatuses(res.report, { 'LK.timeout': 'FAIL', 'LK.release': 'PASS', 'LK.releaseFail': 'PASS', 'PT.A': 'PASS' });
  assert.ok(/the engine APPENDED while another lock object held the script lock/.test(find(res.report, 'LK.timeout').detail));
  assert.deepStrictEqual(nonPass(res.report), { 'LK.timeout': 'FAIL' });
});

check('(39) MUTANT appendRow instead of setValues: PT.A and PT.B FAIL (appendRow ignores the plain-text format), and the fake records the appendRow call', function() {
  const res = runGate(engineWith('sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);', 'sheet.appendRow(row);'));
  expectStatuses(res.report, { 'PT.A': 'FAIL', 'PT.B': 'FAIL' });
  assert.ok(res.model.violations.indexOf('sheet.appendRow') !== -1);
});

check('(40) MUTANT numbers written as text: NT FAILS and names the field', function() {
  const res = runGate(engineWith('? { cell: value, protect: false }', '? { cell: String(value), protect: true }'));
  expectStatuses(res.report, { NT: 'FAIL', 'PT.A': 'PASS' });
  assert.ok(/n: expected number 42, getValues\(\) gives "42"; n was given the plain-text format/.test(find(res.report, 'NT').detail), find(res.report, 'NT').detail);
});

check('(41) MUTANT booleans written as text: NT FAILS and names the field', function() {
  const res = runGate(engineWith("    if (typeof value === 'boolean') {\n      return { cell: value, protect: false };\n    }", "    if (typeof value === 'boolean') {\n      return { cell: String(value), protect: true };\n    }"));
  expectStatuses(res.report, { NT: 'FAIL' });
  assert.ok(/t: expected boolean true/.test(find(res.report, 'NT').detail), find(res.report, 'NT').detail);
});

check('(42) MUTANT unknown columns silently ignored: LK.releaseFail FAILS ("an unknown column was accepted") and the timeout test is SKIPPED', function() {
  const res = runGate(engineWith('if (unknown.length > 0) {', 'if (false) {'));
  expectStatuses(res.report, { 'LK.releaseFail': 'FAIL', 'LK.timeout': 'SKIPPED', 'LK.release': 'PASS' });
  assert.ok(/an unknown column was accepted/.test(find(res.report, 'LK.releaseFail').detail));
});

check('(43) MUTANT wrong lock type (document lock): every append fails, the gate surfaces the engine\'s error text as FAIL', function() {
  const res = runGate(engineWith('const lock = LockService.getScriptLock();', 'const lock = LockService.getDocumentLock();'));
  assert.strictEqual(find(res.report, 'PT.A').status, 'FAIL');
  assert.ok(/the engine threw: TruthEngine: forbidden call: LockService\.getDocumentLock\(\)/.test(find(res.report, 'PT.A').detail), find(res.report, 'PT.A').detail);
  assert.strictEqual(res.report.verdict, 'FAIL');
});

// Mutants built to isolate ONE gate check each (found by mutating the gate itself: a
// check the suite could not tell apart from its neighbours is not proven to work).

const NO_FORMAT_BLOCK =
    '    plainTextColumns.forEach(function(column) {\n' +
    '      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);\n' +
    '    });\n';

check('(43a) MUTANT corrupts only the marker string: PT.A FAILS on the marker check alone (no shape is reported)', function() {
  const res = runGate(engineWith('row[placement.column] = converted.cell;',
      'row[placement.column] = placement.field === \'m\' ? converted.cell + \'x\' : converted.cell;'));
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/the marker is not in the returned row: found "GATE-PT-A-\S+x"/.test(a.detail), a.detail);
  assert.ok(!/shapes not preserved/.test(a.detail), a.detail);
});

check('(43b) MUTANT leaves stray content below the new row: PT.A FAILS on getLastRow() alone', function() {
  const res = runGate(engineWith('    SpreadsheetApp.flush();\n',
      '    sheet.getRange(targetRow + 1, 1).setValues([[\'stray\']]);\n    SpreadsheetApp.flush();\n'));
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/getLastRow\(\) is 3 after the append, not the returned row 2/.test(a.detail), a.detail);
  assert.ok(!/marker is not in the returned row|shapes not preserved/.test(a.detail), a.detail);
});

check('(43c) MUTANT writes null/undefined as the text "null": NT FAILS on the blank-cell check', function() {
  const res = runGate(engineWith('    if (value === null || value === undefined) {\n      return { cell: \'\', protect: false };',
      '    if (value === null || value === undefined) {\n      return { cell: \'null\', protect: true };'));
  const nt = find(res.report, 'NT');
  assert.strictEqual(nt.status, 'FAIL');
  assert.ok(/blank_null: expected a blank cell, getValues\(\) gives "null"/.test(nt.detail), nt.detail);
});

check('(43d) MUTANT appends "x" to every string: GR and LAT FAIL on the marker read-back (rows are all right)', function() {
  const res = runGate(engineWith('return { cell: value, protect: value !== \'\' };',
      'return { cell: value === \'\' ? value : value + \'x\', protect: value !== \'\' };'));
  assert.ok(/row 2 holds "GATE-GR-1-\S+x", expected the marker of append 1/.test(find(res.report, 'GR').detail), find(res.report, 'GR').detail);
  assert.ok(/holds "GATE-LAT-1-\S+x", expected its own marker/.test(find(res.report, 'LAT').detail), find(res.report, 'LAT').detail);
  assert.ok(!/landed on row/.test(find(res.report, 'GR').detail + find(res.report, 'LAT').detail));
});

check('(43e) MUTANT leaves a blank row between appends (writes where it says): LAT FAILS on the consecutive-row check alone', function() {
  const res = runGate(engineWith('const targetRow = sheet.getLastRow() + 1;', 'const targetRow = sheet.getLastRow() + 2;'));
  const lat = find(res.report, 'LAT');
  assert.strictEqual(lat.status, 'FAIL');
  assert.ok(/append 1 landed on row \d+, expected \d+/.test(lat.detail), lat.detail);
  assert.ok(!/expected its own marker/.test(lat.detail), lat.detail);
});

check('(43f) MUTANT with a different timeout error text: LK.timeout FAILS ("not the lock-timeout error"), everything else PASSES', function() {
  const res = runGate(engineWith('\'could not acquire the script lock within \'', '\'lock problem within \''));
  const t = find(res.report, 'LK.timeout');
  assert.strictEqual(t.status, 'FAIL');
  assert.ok(/the engine threw, but not the lock-timeout error: TruthEngine: lock problem within 10000 ms/.test(t.detail), t.detail);
  assert.deepStrictEqual(nonPass(res.report), { 'LK.timeout': 'FAIL' });
});

check('(43g) MUTANT that writes anyway when it cannot get the lock, then reports the timeout: LK.timeout FAILS ("a row was written")', function() {
  const res = runGate(engineWith('const lock = _acquireLock_();',
      'let lock;\n      try { lock = _acquireLock_(); } catch (lockError) { _appendLocked_(spreadsheetId, tabName, prepared); throw lockError; }'));
  const t = find(res.report, 'LK.timeout');
  assert.strictEqual(t.status, 'FAIL');
  assert.ok(/a row was written \(getLastRow\(\) went from \d+ to \d+\) although the engine reported an error/.test(t.detail), t.detail);
  assert.deepStrictEqual(nonPass(res.report), { 'LK.timeout': 'FAIL' });
});

check('(43h) MUTANT without the plain-text format on a platform that never re-types: PT.A STILL FAILS, on the number format alone', function() {
  const res = runGate(Object.assign({ coercion: 'none' }, engineWith(NO_FORMAT_BLOCK, '')));
  const a = find(res.report, 'PT.A');
  assert.strictEqual(a.status, 'FAIL');
  assert.ok(/24 of 24 shapes not preserved/.test(a.detail), a.detail);
  assert.ok(res.logs.some(function(l) { return /not preserved -- leading zeros: number format is "0\.#+"/.test(l); }));
  assert.ok(!res.logs.some(function(l) { return /not preserved -- leading zeros: getValues\(\)/.test(l); }));
});

check('(43i) The platform as real run 1 OBSERVED it -- an oversize write fails HALF-WAY, the rest of the row stays behind -- with an engine WITHOUT P10: OS FAILS with the line the real log printed; with P10 the same platform is never reached', function() {
  const os = find(runGate(Object.assign({ cellLimit: 'partial' }, engineWithAll([NO_P10]))).report, 'OS');
  assert.strictEqual(os.status, 'FAIL');
  assert.strictEqual(os.detail, 'the engine threw but getLastRow() moved from 2 to 3');
  const guarded = runGate({ cellLimit: 'partial' });
  assert.strictEqual(find(guarded.report, 'OS').status, 'PASS');
  assert.strictEqual(guarded.model.oversizeAttempts, 0);
});

// ================= D. Known blind spots, stated as tests ====================

check('(44) BLIND SPOT, by design: an engine that never flushes still PASSES here -- one execution cannot show the flush-before-release effect (listed under NOT VERIFIED)', function() {
  const res = runGate(engineWith('    SpreadsheetApp.flush();\n', ''));
  assert.strictEqual(res.report.verdict, 'PASS', JSON.stringify(nonPass(res.report)));
  assert.ok(/That flushing before releaseLock\(\) makes the next lock holder's getLastRow\(\) see the new row/.test(res.logs.join('\n')));
});

check('(45) BLIND SPOT, by design: the gate REPORTS the engine\'s lock wait but does not judge it (a 1 ms wait still PASSES, with "names 1 ms" in the detail)', function() {
  const res = runGate(engineWith('const LOCK_WAIT_MS = 10000;', 'const LOCK_WAIT_MS = 1;'));
  assert.strictEqual(find(res.report, 'LK.timeout').status, 'PASS');
  assert.ok(/it names 1 ms as its wait/.test(find(res.report, 'LK.timeout').detail));
});

// ================= E. Source discipline of 90_UnitTests.js ==================

const gateSrc = SRC['90_UnitTests.js'];
const gateCode = stripComments(gateSrc);

check('(46) Source: runs in Apps Script as written -- no require, module, process, console, async, arrow functions or optional chaining in code', function() {
  assert.ok(/function runTruthEngineGate\(/.test(gateCode), 'sanity: comments stripped, code kept');
  [/\brequire\s*\(/, /\bmodule\.exports\b/, /\bprocess\./, /\bconsole\./, /\basync\b/, /\bawait\b/, /=>/, /\?\./].forEach(function(re) {
    assert.ok(!re.test(gateCode), 'forbidden pattern in code: ' + re);
  });
});

check('(47) Source: the block comment is closed once, and the code (comments stripped) is pure ASCII so no editor or archive can alter a string', function() {
  assert.strictEqual((gateSrc.match(/\*\//g) || []).length, 1, 'the header must contain exactly one comment terminator');
  assert.ok(!/[^\x00-\x7F]/.test(gateCode), 'non-ASCII character in code');
  assert.ok(/'\\u76EE\\u6807\\uFF1A\\u672C\\u5B63\\u5EA6 Q4 \\uD83D\\uDE42'/.test(gateCode), 'the CJK/emoji shape must be spelled with escapes');
});

check('(48) Source: top level is exactly one const (UnitTests) and one function (runTruthEngineGate)', function() {
  const names = (gateCode.match(/^(?:const|let|var|function|class)\s+\w+/gm) || []);
  assert.deepStrictEqual(names, ['const UnitTests', 'function runTruthEngineGate']);
});

check('(49) Source: no top-level name collides across the files Apps Script loads together (every .js not named *_Test.js or 00_*)', function() {
  const pushed = fs.readdirSync(__dirname).filter(function(f) {
    return /\.js$/.test(f) && !/_Test\.js$/.test(f) && !/^00_/.test(f);
  });
  assert.ok(pushed.indexOf('90_UnitTests.js') !== -1 && pushed.length === 8, pushed.join(', '));
  const owner = {};
  pushed.forEach(function(file) {
    const code = stripComments(fs.readFileSync(path.join(__dirname, file), 'utf8'));
    (code.match(/^(?:const|let|var|function|class)\s+\w+/gm) || []).forEach(function(decl) {
      const name = decl.split(/\s+/)[1];
      assert.ok(!owner[name], name + ' is declared in both ' + owner[name] + ' and ' + file);
      owner[name] = file;
    });
  });
});

check('(50) Source: the gate calls only platform methods from the checked list -- a new method name must be added here on purpose', function() {
  const used = {};
  (gateCode.match(/\.([A-Za-z_]\w*)\s*\(/g) || []).forEach(function(m) { used[m.slice(1, -1).trim()] = true; });
  const allowed = [
    // Apps Script platform and this project's own modules
    'getRange', 'getValues', 'getValue', 'getDisplayValues', 'getNumberFormats', 'setValues',
    'getLastRow', 'getMaxRows', 'deleteRows', 'insertSheet', 'deleteSheet', 'getSheets', 'getName',
    'getSpreadsheetLocale', 'getSpreadsheetTimeZone', 'openById', 'getScriptLock', 'waitLock',
    'releaseLock', 'flush', 'getScriptTimeZone', 'getSpreadsheetId', 'append', 'log', 'runTruthEngineGate',
    // plain JavaScript
    'map', 'filter', 'forEach', 'push', 'join', 'slice', 'indexOf', 'concat', 'reduce', 'apply',
    'freeze', 'toISOString', 'getTime', 'stringify', 'repeat', 'floor', 'min', 'max', 'round',
    'exec', 'replace', 'isArray', 'toString', 'toLowerCase', 'reverse', 'call', 'now'
  ];
  const unknown = Object.keys(used).filter(function(name) { return allowed.indexOf(name) === -1; });
  assert.deepStrictEqual(unknown, [], 'method(s) not on the checked list: ' + unknown.join(', '));
});

check('(51) Source: nothing the gate must never do appears in code -- no appendRow, create, active/by-URL Spreadsheet, document/user lock, clear, setFormula, insertRowsAfter, getId', function() {
  [
    /\bappendRow\s*\(/, /SpreadsheetApp\.create\s*\(/, /getActiveSpreadsheet\s*\(/, /SpreadsheetApp\.getActive\s*\(/,
    /openByUrl\s*\(/, /getDocumentLock\s*\(/, /getUserLock\s*\(/, /\.clear\w*\s*\(/, /\.setFormula\w*\s*\(/,
    /\.insertRowsAfter\s*\(/, /\.getId\s*\(/, /\.deleteColumn/, /\.deleteRow\s*\(/, /PropertiesService/, /UrlFetchApp/
  ].forEach(function(re) {
    assert.ok(!re.test(gateCode), 'forbidden pattern present in code: ' + re);
  });
});

check('(52) Source: every tab name the gate builds starts with the ZZ_EXEC_GATE_ prefix, and the Domain guard list equals the 17 names in 00_File_Map.js (EP2 drift guard)', function() {
  assert.ok(/const TEMP_TAB_PREFIX = 'ZZ_EXEC_GATE_';/.test(gateCode));
  assert.strictEqual((gateCode.match(/insertSheet\(/g) || []).length, 1, 'exactly one insertSheet call site');
  assert.ok(/const name = TEMP_TAB_PREFIX \+ ctx\.stamp/.test(gateCode));
  const block = /const DOMAIN_TAB_NAMES = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(gateCode);
  assert.ok(block, 'DOMAIN_TAB_NAMES not found');
  const listed = (block[1].match(/'([^']+)'/g) || []).map(function(s) { return s.slice(1, -1); });
  assert.strictEqual(listed.length, 17);
  assert.strictEqual(new Set(listed).size, 17);
  listed.forEach(function(name) {
    assert.ok(new RegExp('\\b' + name + '\\b').test(FILE_MAP_SRC), name + ' is not quoted in 00_File_Map.js');
  });
});

check('(53) Source: the header carries the sections a reader needs before running it', function() {
  [
    'HOW TO RUN', 'WHAT IT WRITES', 'PRE-FLIGHT (no writes)', 'STATUSES', 'EVIDENCE TIERS', 'COVERS',
    'NOT VERIFIED BY THIS GATE', 'STATUS: NOT LIVE-GAS VERIFIED', 'Writes a Sheet?', 'open item 15'
  ].forEach(function(phrase) {
    assert.ok(gateSrc.indexOf(phrase) !== -1, 'header lacks: ' + phrase);
  });
});

// ================= F. Replay of the two real runs ===========================
// OBSERVED: the gate has run twice in real Apps Script. Each check below feeds
// the same engine code and the platform behaviour that run showed into the
// gate and expects the statuses, counts and lines the real log printed. This
// shows the fake and the gate reproduce what really happened on those two
// runs. It says nothing about platform behaviour those runs did not show.

const RUN1_STATUSES = {
  'PT.control': 'INFO', 'PT.A': 'FAIL', 'PT.B': 'PASS', NT: 'PASS', GR: 'PASS', 'GR.raw': 'INFO',
  OS: 'FAIL', LAT: 'PASS', 'LAT.time': 'INFO', 'LK.reentrancy': 'INFO', 'LK.release': 'INCONCLUSIVE',
  'LK.releaseFail': 'INCONCLUSIVE', 'LK.timeout': 'SKIPPED', CL: 'PASS'
};

check('(54) Replay of real run 1 (2026-11-03 06:59 MYT): the engine as it was then (no P10, no P11) on the platform that run showed gives the same result -- PASS 5 / FAIL 2 / INCONCLUSIVE 2 / SKIPPED 1 / INFO 4, PT.A and OS the two FAILs', function() {
  const res = runGate(Object.assign({ gridMode: 'grow', lockMode: 'reentrant', cellLimit: 'partial' }, engineWithAll([NO_P10, NO_P11])));
  assert.deepStrictEqual(statusMap(res.report), RUN1_STATUSES);
  assert.deepStrictEqual(res.report.counts, { PASS: 5, FAIL: 2, INFO: 4, INCONCLUSIVE: 2, SKIPPED: 1 });
  assert.strictEqual(res.report.verdict, 'FAIL');
  const lines = res.logs.filter(function(l) { return /not preserved --/.test(l); });
  assert.deepStrictEqual(lines.map(function(l) { return l.replace(/^\s+/, '').split(':')[0]; }),
      ['not preserved -- formula', 'not preserved -- formula with function', 'not preserved -- leading apostrophe']);
  assert.strictEqual(find(res.report, 'OS').detail, 'the engine threw but getLastRow() moved from 2 to 3');
  assert.ok(/the write was ACCEPTED; getMaxRows\(\) went from 4 to 5\. So this platform copes with a write past the grid by itself\./.test(find(res.report, 'GR.raw').detail));
  assert.ok(/ACQUIRED: the platform lets one execution take the script lock twice/.test(find(res.report, 'LK.reentrancy').detail));
  assert.ok(/a fresh lock object can always get the lock here, so that cannot show the engine released it/.test(find(res.report, 'LK.release').detail));
});

check('(55) Replay of real run 2 (2026-11-05 00:29 MYT): the engine as it is now (P10 and P11) on the platform that run showed gives the same result -- PASS 7 / FAIL 0 / INCONCLUSIVE 2 / SKIPPED 1 / INFO 4, verdict INCOMPLETE', function() {
  const res = runGate({ gridMode: 'grow', lockMode: 'reentrant' });
  const expected = Object.assign({}, RUN1_STATUSES, { 'PT.A': 'PASS', OS: 'PASS' });
  assert.deepStrictEqual(statusMap(res.report), expected);
  assert.deepStrictEqual(res.report.counts, { PASS: 7, FAIL: 0, INFO: 4, INCONCLUSIVE: 2, SKIPPED: 1 });
  assert.strictEqual(res.report.verdict, 'INCOMPLETE');
  assert.ok(/^24\/24 came back as the identical string \(getValues, getDisplayValues, format @\); 17 of them were re-typed in the control, so the protection did real work for them\. Row 2, /.test(find(res.report, 'PT.A').detail), find(res.report, 'PT.A').detail);
  assert.ok(/^12\/12 came back as the identical string \(getValues, getDisplayValues, format @\); 6 of them were re-typed in the control, so the protection did real work for them\. Row 3, /.test(find(res.report, 'PT.B').detail), find(res.report, 'PT.B').detail);
  assert.ok(find(res.report, 'OS').detail.indexOf('refused with an error and nothing was written; the next normal append succeeded on row 3 (so the lock was released). Error: TruthEngine: record has unsupported value(s) -- "f01": a string of 50001 characters when written (one cell holds at most 50000). Nothing ') === 0,
      find(res.report, 'OS').detail);
  assert.strictEqual(res.model.oversizeAttempts, 0, 'the platform never saw the oversize cell');
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed (sandbox logic of the gate only)');
console.log('');
console.log('REAL_GAS_REQUIRED -- not verified by anything above, and cannot be from this environment:');
console.log('  - ALREADY OBSERVED in real Apps Script, and replayed above (checks 2, 54 and 55): 90_UnitTests.js runs');
console.log('    to the end (run 1 2026-11-03 06:59 MYT, run 2 2026-11-05 00:29 MYT) and calls getDisplayValues(),');
console.log('    getNumberFormats() and insertSheet(name) without error; which of the 36 shapes the Spreadsheet');
console.log('    re-types (23); that a write past the grid is accepted; that a 50001-character cell is refused (half-');
console.log('    written when the engine has no P10); that one execution can take the script lock twice');
console.log('  - STILL OPEN, needs real Apps Script: whatever those two runs did not show -- exactly 50000 characters');
console.log('    and the unit the limit counts in, strings starting with + - or @ beyond "+3", where the digit-string');
console.log('    cut-off lies (the fake guesses 16), long-lived tabs, and every lock check (all of which need two');
console.log('    executions running at the same time)');
console.log('  - the remaining ASSUMPTIONS in the fake (call latencies, lock fairness): each is a knob here so the');
console.log('    gate can be shown to react to the opposite');
console.log('');
console.log('NOT VERIFIABLE BY ANY GATE OF THIS KIND: mutual exclusion between two overlapping executions, and the');
console.log('flush-before-release effect on the next lock holder (checks 44 and 45 state the blind spots).');
process.exit(failed > 0 ? 1 : 0);
