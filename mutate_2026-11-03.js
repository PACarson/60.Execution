// Execution OS scratch tool -- extended copy of mutate.js, 2026-11-03. NOT part of the repository.
// 46 planted defects in 15_TruthEngine.js (the 28 of mutate.js plus 18 for P10 and P11), one at a time,
// each in a throw-away copy; the failing-check reader also accepts labels such as 45b.
// Usage: node mutate_2026-11-03.js <projectDir> <workRoot>
// Result on 2026-11-03 against the changed 15_TruthEngine.js and its 67-check test: 46 mutations, 0 survived.
// Mutation check for 15_TruthEngine.js: apply ONE deliberate defect to a COPY of the
// engine, run the real test file against it, and report which checks catch it.
// A mutation that no check catches means a check is vacuous or a behavior is untested.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const projectDir = process.argv[2];
const workRoot = process.argv[3];

const engine = fs.readFileSync(path.join(projectDir, '15_TruthEngine.js'), 'utf8');

const M = [];
function mut(name, pairs) { M.push({ name: name, pairs: pairs }); }

mut('use appendRow() instead of setValues', [[
  "sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);", "sheet.appendRow(row);"]]);
mut('never apply the plain-text format', [[
  "sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);", "void column;"]]);
mut('apply the plain-text format AFTER the write', [
  ["    plainTextColumns.forEach(function(column) {\n      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);\n    });\n", ""],
  ["sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);",
   "sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);\n    plainTextColumns.forEach(function(column) { sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT); });"]]);
mut('skip flush', [["    SpreadsheetApp.flush();\n", ""]]);
mut('flush AFTER releasing the lock', [
  ["    SpreadsheetApp.flush();\n", ""],
  ["      lock.releaseLock();\n    } catch (e) {\n      AlertService.log('WARN'", "      lock.releaseLock();\n      SpreadsheetApp.flush();\n    } catch (e) {\n      AlertService.log('WARN'"]]);
mut('no lock at all', [["const lock = _acquireLock_();", "const lock = { releaseLock: function() {} };"]]);
mut('silently drop unknown fields (the sibling behaviour)', [["        unknown.push(field);", "        void field;"]]);
mut('no grid growth', [["sheet.insertRowsAfter(maxRows, targetRow - maxRows); // PROPOSED P7", "void maxRows;"]]);
mut('stringify unsupported values instead of rejecting', [[
  "return { problem: 'unsupported type \"' + _typeName_(value) + '\"' };", "return { cell: String(value), protect: true };"]]);
mut('log field values on failure', [[
  "fieldNames: _isPlainObject_(record) ? Object.keys(record) : _typeName_(record)",
  "fieldNames: _isPlainObject_(record) ? Object.keys(record) : _typeName_(record), values: record"]]);
mut('do not release the lock when the locked section throws', [[
  "      try {\n        return _appendLocked_(spreadsheetId, tabName, prepared);\n      } finally {\n        _releaseLock_(lock, tabName);\n      }",
  "      const result = _appendLocked_(spreadsheetId, tabName, prepared);\n      _releaseLock_(lock, tabName);\n      return result;"]]);
mut('allow an all-blank record', [["if (!hasContent) {", "if (false) {"]]);
mut('plain-object header index (prototype names leak)', [["const index = Object.create(null);", "const index = {};"]]);
mut('accept a Spreadsheet-ID override argument', [
  ["function append(tabName, record) {", "function append(tabName, record, spreadsheetIdOverride) {"],
  ["const spreadsheetId = Config.getSpreadsheetId();", "const spreadsheetId = spreadsheetIdOverride || Config.getSpreadsheetId();"]]);
mut('take the lock BEFORE reading Config', [[
  "      const spreadsheetId = Config.getSpreadsheetId();\n      const lock = _acquireLock_();",
  "      const lock = _acquireLock_();\n      const spreadsheetId = Config.getSpreadsheetId();"]]);
mut('validate the arguments only AFTER taking the lock', [[
  "      const prepared = _prepare_(tabName, record);\n      const spreadsheetId = Config.getSpreadsheetId();\n      const lock = _acquireLock_();\n      try {\n        return _appendLocked_(spreadsheetId, tabName, prepared);",
  "      const spreadsheetId = Config.getSpreadsheetId();\n      const lock = _acquireLock_();\n      try {\n        const prepared = _prepare_(tabName, record);\n        return _appendLocked_(spreadsheetId, tabName, prepared);"]]);
mut('releaseLock() failure rethrown', [[
  "    } catch (e) {\n      AlertService.log('WARN', MODULE, 'append', { tabName: tabName },",
  "    } catch (e) {\n      throw e;\n      AlertService.log('WARN', MODULE, 'append', { tabName: tabName },"]]);
mut('off-by-one target row (overwrite last row)', [["const targetRow = sheet.getLastRow() + 1;", "const targetRow = sheet.getLastRow();"]]);
mut('positional mapping (ignore header names)', [[
  "row[placement.column] = converted.cell;", "row[prepared.fields.indexOf(placement.field)] = converted.cell;"]]);
mut('trim field names before matching headers', [["const hits = headerIndex[field];", "const hits = headerIndex[String(field).trim()];"]]);
mut('create a missing tab', [[
  "const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(tabName);",
  "const ss = SpreadsheetApp.openById(spreadsheetId);\n    const sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);"]]);
mut('accept a duplicated header name', [["} else if (hits.length > 1) {", "} else if (false) {"]]);
mut('protect only number-looking strings (shape guessing)', [[
  "return { cell: value, protect: value !== '' };", "return { cell: value, protect: /^[-+]?\\d/.test(value) };"]]);
mut('use the document lock', [["const lock = LockService.getScriptLock();", "const lock = LockService.getDocumentLock();"]]);
mut('waitLock(0)', [["lock.waitLock(LOCK_WAIT_MS);", "lock.waitLock(0);"]]);
mut('swallow a lock timeout and write anyway', [[
  "throw new Error('could not acquire the script lock within ' + LOCK_WAIT_MS + ' ms: ' + e.message);", "void e;"]]);
mut('hard-coded Spreadsheet ID', [["SpreadsheetApp.openById(spreadsheetId)", "SpreadsheetApp.openById('hard-coded-id')"]]);
mut('call Schema from the engine', [[
  "const headerIndex = _indexHeaders_(", "void Schema; const headerIndex = _indexHeaders_("]]);


// ---- 2026-11-03: mutants for P10 (per-cell length guard) and P11 (apostrophe prefix) ----
mut('P10: no length check at all', [["if (writtenLength > MAX_CELL_CHARS) {", "if (false) {"]]);
mut('P10: limit one too low (49999)', [["const MAX_CELL_CHARS = 50000;", "const MAX_CELL_CHARS = 49999;"]]);
mut('P10: limit one too high (50001)', [["const MAX_CELL_CHARS = 50000;", "const MAX_CELL_CHARS = 50001;"]]);
mut('P10: length ignores the P11 apostrophe', [[
  "const writtenLength = value.length + (marked ? TEXT_MARKER.length : 0);", "const writtenLength = value.length;"]]);
mut('P10: length checked only AFTER the lock is taken', [
  ["if (writtenLength > MAX_CELL_CHARS) {", "if (false) {"],
  ["    const placements = _resolveColumns_(tabName, prepared.fields, headerIndex);\n",
   "    const placements = _resolveColumns_(tabName, prepared.fields, headerIndex);\n" +
   "    placements.forEach(function(p) { const c = prepared.cells[p.field].cell; if (typeof c === 'string' && c.length > MAX_CELL_CHARS) { throw new Error('too long (checked under the lock)'); } });\n"]]);
mut('P10: type advice shown for every problem', [["if (wrongType) {", "if (true) {"]]);
mut('P10: length advice never shown', [["if (tooLong) {", "if (false) {"]]);
mut('P10: the message quotes the start of the text', [[
  "problem: 'a string of ' + writtenLength", "problem: 'a string (' + value.slice(0, 30) + ') of ' + writtenLength"]]);
mut('P11: no apostrophe prefix at all', [["if (marked) {", "if (false) {"]]);
mut('P11: prefix only for a leading "="', [["return first === '=' || first === TEXT_MARKER;", "return first === '=';"]]);
mut('P11: prefix only for a leading apostrophe', [["return first === '=' || first === TEXT_MARKER;", "return first === TEXT_MARKER;"]]);
mut('P11: prefix for every non-empty string (shape guessing the other way)', [[
  "return first === '=' || first === TEXT_MARKER;", "return text !== '';"]]);
mut('P11: prefix also for a leading + - or @', [[
  "return first === '=' || first === TEXT_MARKER;",
  "return first === '=' || first === TEXT_MARKER || first === '+' || first === '-' || first === '@';"]]);
mut('P11: two apostrophes as the prefix', [["const TEXT_MARKER = '\\'';", "const TEXT_MARKER = '\\'\\'';"]]);
mut('P11: the empty string is prefixed too', [[
  "return first === '=' || first === TEXT_MARKER;", "return text === '' || first === '=' || first === TEXT_MARKER;"]]);
mut('P11: a prefixed cell gets no plain-text format', [[
  "return { cell: TEXT_MARKER + value, protect: true };", "return { cell: TEXT_MARKER + value, protect: false };"]]);
mut('P11: the caller\'s record is modified', [[
  "      cells[field] = converted;\n",
  "      cells[field] = converted;\n      if (typeof record[field] === 'string' && converted.cell !== record[field]) { record[field] = converted.cell; }\n"]]);
mut('P11: the prefix is decided by the field name', [[
  "      const converted = _toCell_(record[field]);\n",
  "      const converted = _toCell_(record[field]);\n      if (field.charAt(0) === '=' && typeof converted.cell === 'string' && converted.cell !== '') { converted.cell = TEXT_MARKER + converted.cell; }\n"]]);

let survived = 0;
M.forEach(function(m, n) {
  let src = engine;
  for (const pair of m.pairs) {
    const occurrences = src.split(pair[0]).length - 1;
    if (occurrences !== 1) {
      console.log('M' + (n + 1) + ' [' + m.name + ']: MUTATION NOT APPLIED (found ' + occurrences + ' occurrences of the target text)');
      process.exitCode = 2;
      return;
    }
    src = src.replace(pair[0], function() { return pair[1]; });
  }
  const dir = path.join(workRoot, 'm' + (n + 1));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  ['60_Observability.js', '10_Config.js', '15_TruthEngine_Test.js'].forEach(function(f) {
    fs.copyFileSync(path.join(projectDir, f), path.join(dir, f));
  });
  fs.writeFileSync(path.join(dir, '15_TruthEngine.js'), src);
  const syntax = cp.spawnSync('node', ['--check', path.join(dir, '15_TruthEngine.js')], { encoding: 'utf8' });
  if (syntax.status !== 0) {
    console.log('M' + (n + 1) + ' [' + m.name + ']: INVALID SYNTAX -- not a meaningful mutation: ' + syntax.stderr.split('\n')[0]);
    process.exitCode = 2;
    return;
  }
  const run = cp.spawnSync('node', [path.join(dir, '15_TruthEngine_Test.js')], { encoding: 'utf8' });
  const out = run.stdout + run.stderr;
  const failing = (out.match(/^FAIL: \((\d+[a-z]*)\)/gm) || []).map(function(l) { return l.match(/\((\d+[a-z]*)\)/)[1]; });
  const passes = (out.match(/^PASS:/gm) || []).length;
  if (failing.length === 0 && run.status === 0) {
    survived++;
    console.log('M' + (n + 1) + ' [' + m.name + ']: *** SURVIVED *** (' + passes + ' passed, 0 failed)');
  } else if (failing.length === 0) {
    console.log('M' + (n + 1) + ' [' + m.name + ']: killed by a CRASH (exit ' + run.status + '), no individual check named -- weak evidence');
  } else {
    console.log('M' + (n + 1) + ' [' + m.name + ']: killed by checks ' + failing.join(','));
  }
});
console.log('\n' + M.length + ' mutations, ' + survived + ' survived');
