/*
=====================================================================
EXECUTION OS — 90_UnitTests.js
=====================================================================
Layer:       Testing (90-99), per 00_File_Map.js
Owns:        runTruthEngineGate(): the real-Apps-Script verification gate
              for 15_TruthEngine.js, and nothing else. It turns the
              REAL_GAS_REQUIRED items that ONE execution can observe into
              evidence, and says plainly which ones it cannot.
Built:       2026-10-29, final revision 2026-10-31 (redundant comparisons
              removed after the gate itself was mutation-tested), per the
              owner's explicit request of 2026-10-27 ("先做1，然后做2":
              step 1 was the deployment configuration, step 2 is this
              GAS-native verification file). One file; no other file's
              behavior was changed to build it.

WHY IT EXISTS
  15_TruthEngine_Test.js checks logic against a hand-built fake of
  Sheets and LockService, and three behaviors of that fake are
  assumptions. The owner's working practice is that every OS is made to
  work in real Apps Script (recorded in 00_Project_Constitution.js; whether
  it becomes a Definition-of-Done rule is open item 9 in
  00_Project_State.js). This file is how the owner observes the real
  platform: run one function by hand, read the Execution log. Pattern
  taken from Personal Life OS's run...Gate() functions (READ-ONLY
  sibling, file 59_Tests_DueTimePlainTextProtection.js).

HOW TO RUN
  1. Script Properties: EXEC_OS_SPREADSHEET_ID must hold Execution OS's
     OWN Spreadsheet (ADR-012), never a Domain OS's.
  2. In the Apps Script editor open this file, choose runTruthEngineGate
     in the function list and press Run. Authorize when asked.
  3. Open the Execution log and copy the whole log back. Lines tagged
     ERROR from TruthEngine.append between checks are the engine's own
     failure logging for failures this gate provokes ON PURPOSE (unknown
     column, oversize cell, lock timeout); they are not a problem.
  Run time is not known yet. The run stops starting new check groups
  after NO_NEW_GROUP_AFTER_MS, and the clean-up always runs. Apps Script
  stops any execution at 6 minutes (documented quota, not re-fetched
  this session).

WHAT IT WRITES
  Only four temporary tabs it creates itself, named
  ZZ_EXEC_GATE_<stamp>_<role>, and it deletes them at the end of the
  same run. Every row under test goes through TruthEngine.append. The
  gate writes to the Spreadsheet directly only to (a) create each temp
  tab and its header row, (b) write the CONTROL rows into its own
  control tab, (c) make one raw out-of-grid write on its own grid tab,
  (d) delete the temp tabs. It never touches any other tab. This is a
  test-scaffolding exception to "TruthEngine is the only file that
  writes a Sheet" (15_TruthEngine.js header); the owner has not yet
  confirmed it, see open item 15 in 00_Project_State.js.
  Schema.ensureTab was deliberately NOT used to make the temp tabs: it
  would put an unverified second file inside a gate about TruthEngine,
  and a Schema defect could then pass for a TruthEngine result.
  If a run is killed (6-minute limit, closed editor), temp tabs may stay
  behind. The next run lists them (PRE.leftover) and never deletes a tab
  it did not create in that same run.

GUARD (best effort). The run STOPS, before touching anything, if the
  configured Spreadsheet already contains a tab named exactly like one
  of the Domain OS tabs in DOMAIN_TAB_NAMES, because that would mean
  EXEC_OS_SPREADSHEET_ID points at a Domain Spreadsheet (BR-10, ADR-012).
  The list is copied from 00_File_Map.js (Domain-shared backend
  evidence, 2026-10-25); File_Map is the source and wins if they ever
  differ. Duplicating it here is a deliberate EP2 exception for a safety
  stop. The three Reminder names are second-hand there.

PRE-FLIGHT (no writes). Before it creates anything, the run also checks
  that the script lock is free (one waitLock and one release). If another
  execution holds it, every engine call would time out for a reason that
  has nothing to do with TruthEngine, so the run STOPS and says so.

STATUSES
  PASS          the expectation held, compared strictly.
  FAIL          the expectation did not hold. Read the detail first: it
                may be a TruthEngine defect, a platform behavior the
                engine does not guard against, or a wrong assumption
                in this gate. This file does not decide which.
  INCONCLUSIVE  the check could not tell (a precondition failed, or the
                gate's own scaffolding threw). Not a verdict on TruthEngine.
  SKIPPED       not run (time limit, or a precondition that makes it
                meaningless); the reason is printed.
  INFO          an observation (timings, platform facts). Never a verdict.
  Strictness follows the sibling gate: read-backs are direct comparisons
  of type and value. No canonicalizing, no instanceof-Date tolerance.
  Timings are never PASS/FAIL, because this file has no evidence for a
  threshold and will not invent one.

EVIDENCE TIERS (what each API name rests on)
  OFFICIAL DOCS, fetched 2026-10-28 and 2026-10-29
  (developers.google.com/apps-script/reference):
    Lock: waitLock(ms) returns void and throws an Error on timeout;
    releaseLock() has no effect if the lock was not acquired; the lock is
    released automatically when the script terminates; "call
    SpreadsheetApp.flush() prior to releasing the lock"; hasLock(). The
    page does NOT say what a second lock object does while the first one
    holds the script lock inside one execution, so the gate observes it.
    Spreadsheet: getSheets, getSheetByName, deleteSheet, getName,
    getSpreadsheetLocale, getSpreadsheetTimeZone (descriptions read).
    Sheet: deleteRows(rowPosition, howMany) (description read).
  TYPE DECLARATIONS (@types/google-apps-script, DefinitelyTyped commit
  3a0a6ff of 2026-10-28; a secondary mirror of the official reference):
    Spreadsheet.insertSheet(sheetName), Sheet.getMaxRows(), Sheet.
    insertRowsAfter(afterPosition, howMany), Sheet.getName/getRange/
    getLastRow/getLastColumn, Range.getValues/getDisplayValues/
    getNumberFormats/setNumberFormat/setValues.
  OBSERVED in the sibling's source (Personal Life OS, READ-ONLY; its owner
  says it runs in real GAS): setNumberFormat('@'), insertSheet(name),
  getMaxRows(), getSheetByName, getRange, getLastRow, getLastColumn,
  waitLock/releaseLock.
  NOT read on the official page this session: the Range.getDisplayValues
  and Range.getNumberFormats entries, and Spreadsheet.insertSheet. If one
  of those names were wrong the affected group reports INCONCLUSIVE with
  a "not a function" message; it cannot be mistaken for a TruthEngine
  verdict.
  PROPOSED (this file's own choices): the shape lists, the probe sizes,
  the five-append latency sample, NO_NEW_GROUP_AFTER_MS, LOCK_PROBE_WAIT_MS,
  the 50000-character probe (the per-cell limit figure comes from Google's
  Sheets limits page as remembered, NOT re-fetched: the check only needs
  a size past any plausible limit, and what the platform does is the
  observation).

COVERS (items from 15_TruthEngine_Test.js's REAL_GAS_REQUIRED list)
  - Plain-text protection in Execution's own Spreadsheet, including
    number-, date-, formula- and boolean-shaped strings (PT).
  - Native number/boolean types and blanks are not turned into text (NT).
  - setValues() past getMaxRows(): what the platform does, and that the
    engine's grid growth works (GR).
  - A very large string (OS).
  - Per-append latency in one execution, no contention (LAT).
  - Lock released after success and after failure, and the lock-timeout
    path, but only when the platform refuses a second lock object inside
    one execution (LK).

NOT VERIFIED BY THIS GATE (printed again at the end of every run)
  - Mutual exclusion between TWO overlapping executions, the reason the
    lock exists. Needs two executions started at about the same time.
  - That flushing before releaseLock() makes the next lock holder's
    getLastRow() see the new row: same reason.
  - getLastRow() on real, long-lived tabs (pre-formatted blank rows,
    stray content far below the data): this gate only uses fresh tabs.
  - Latency under contention; any locale or time zone other than the one
    printed at the start; any other file (Schema, EventLog, ...).
  - BR-10 beyond the tab-name guard above.

STATUS: NOT LIVE-GAS VERIFIED until the owner runs it and the log is
  reviewed. Before that it has only been exercised in the Node sandbox
  (90_UnitTests_Test.js) against a fake platform whose behaviors are
  ASSUMPTIONS; the gate's purpose is to observe reality, so a sandbox
  pass says nothing about reality.

Depends on:  60_Observability.js (AlertService), 10_Config.js (Spreadsheet
              ID), 15_TruthEngine.js (the subject).
Called by:   nothing. Run by hand.
Writes a Sheet?        Only its own ZZ_EXEC_GATE_ temp tabs (see above).
Must use TruthEngine?  Every row under test does. Exceptions listed above.
Must use AlertService? Only for the pre-flight STOP line. A test harness
              reports instead of throwing; UCR3 governs production paths.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied. There is
exactly ONE top-level function, runTruthEngineGate, because the editor's
Run list shows only top-level function declarations whose names do not
end in an underscore (documented Apps Script convention, not re-fetched
this session).
=====================================================================
*/

const UnitTests = (function() {

  const MODULE = 'UnitTests';
  const GATE_VERSION = '2026-10-31';

  // Every tab this file creates, writes or deletes starts with this.
  const TEMP_TAB_PREFIX = 'ZZ_EXEC_GATE_';

  // PROPOSED. No new check group starts after this much run time, which
  // leaves room for the longest group and the clean-up inside Apps
  // Script's 6-minute limit.
  const NO_NEW_GROUP_AFTER_MS = 200000;

  // PROPOSED. How long the lock probes wait for the script lock.
  const LOCK_PROBE_WAIT_MS = 1000;

  // PROPOSED. See the header: only needs to be past any plausible limit.
  const OVERSIZE_PROBE_CHARS = 50001;

  const LATENCY_APPENDS = 5;

  const S = Object.freeze({
    PASS: 'PASS',
    FAIL: 'FAIL',
    INFO: 'INFO',
    INCONCLUSIVE: 'INCONCLUSIVE',
    SKIPPED: 'SKIPPED'
  });

  // Copied from 00_File_Map.js (see the GUARD paragraph in the header).
  const DOMAIN_TAB_NAMES = Object.freeze([
    'Events', 'Tasks', 'ActiveTasks', 'ArchiveTasks', 'TaskStatistics',
    'TaskFilters', 'Projects', 'Workflows', 'Timeline', 'Notes', 'Reviews',
    'BusinessRules', 'WorkflowTemplates', 'TaskViewOrder',
    'ReminderRules', 'ReminderOccurrences', 'ReminderHistory'
  ]);

  // ---- test data -------------------------------------------------------
  // Strings whose shape a spreadsheet may re-type when it parses input.
  // Labels are unique across both sets and contain no percent sign
  // (Logger.log treats percent sequences as format directives when it
  // is given more than one argument; labels are only ever logged alone).
  // The CJK and emoji text is written with escapes so no editor or
  // archive can change its encoding.

  function _shape_(label, value) {
    return { label: label, value: value };
  }

  const SHAPES_A = Object.freeze([
    _shape_('leading zeros', '00123'),
    _shape_('scientific notation', '1e5'),
    _shape_('all-digit hash-like', '12345678'),
    _shape_('digits-e-digits hash-like', '123e4567'),
    _shape_('trailing-zero decimal', '0.10'),
    _shape_('negative integer', '-7'),
    _shape_('explicit plus sign', '+3'),
    _shape_('thousands separator', '1,000'),
    _shape_('percent literal', '50%'),
    _shape_('currency literal', '$12.50'),
    _shape_('parenthesised number', '(123)'),
    _shape_('hex literal', '0x1F'),
    _shape_('ISO date', '2026-10-25'),
    _shape_('ISO timestamp', '2026-10-25T10:20:30.000Z'),
    _shape_('clock time', '14:30'),
    _shape_('fraction or short date', '3/4'),
    _shape_('formula', '=1+1'),
    _shape_('formula with function', '=SUM(1,2)'),
    _shape_('TRUE as text', 'TRUE'),
    _shape_('false as text', 'false'),
    _shape_('leading and trailing spaces', '  padded  '),
    _shape_('embedded newline', 'line1\nline2'),
    _shape_('leading apostrophe', '\'quoted'),
    _shape_('CJK and emoji', '\u76EE\u6807\uFF1A\u672C\u5B63\u5EA6 Q4 \uD83D\uDE42')
  ]);

  const SHAPES_B = Object.freeze([
    _shape_('20-digit number', '12345678901234567890'),
    _shape_('UUID', '123e4567-e89b-12d3-a456-426614174000'),
    _shape_('JSON text', '{"a":1,"b":[1,2]}'),
    _shape_('id-like text', 'REF-0001'),
    _shape_('slashed digits', '1/2/3'),
    _shape_('month and day', 'Mar 5'),
    _shape_('year-first slashes', '2026/10/25'),
    _shape_('month-first slashes', '10/25/2026'),
    _shape_('12-hour time', '12:00 PM'),
    _shape_('small exponent', '1e-3'),
    _shape_('error literal', '#N/A'),
    _shape_('at-sign text', '@home')
  ]);

  function _pad2_(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function _shapeColumn_(index) {
    return 's' + _pad2_(index + 1);
  }

  const W_HEADERS = Object.freeze(['m'].concat(SHAPES_A.map(function(shape, i) {
    return _shapeColumn_(i);
  })));

  const T_HEADERS = Object.freeze(['m', 'n', 'z', 't', 'f', 'neg', 'big',
      'blank_null', 'blank_undef', 'blank_empty'].concat(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function(k) { return 'f' + _pad2_(k); })));

  const G_HEADERS = Object.freeze(['g1', 'g2', 'g3']);

  const NOT_VERIFIED_LINES = Object.freeze([
    'Mutual exclusion between TWO overlapping executions (the reason the lock exists): needs two executions started at about the same time.',
    'That flushing before releaseLock() makes the next lock holder\'s getLastRow() see the new row: same reason.',
    'getLastRow() on real, long-lived tabs (pre-formatted blank rows, stray content far below the data): this gate only uses fresh tabs.',
    'Latency under contention; any locale or time zone other than the one printed at the start; any file other than 15_TruthEngine.js.',
    'BR-10 beyond the tab-name guard.'
  ]);

  // ---- small helpers ---------------------------------------------------

  function _now_() {
    return Date.now();
  }

  function _log_(line) {
    Logger.log(line);
  }

  function _note_(line) {
    Logger.log('      ' + line);
  }

  // Realm-independent type name (same approach as 15_TruthEngine.js).
  function _typeName_(value) {
    if (value === null) {
      return 'null';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (typeof value === 'object') {
      return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    }
    return typeof value;
  }

  // Short, log-safe rendering of a value read back from a sheet.
  function _show_(value) {
    const type = _typeName_(value);
    let text;
    if (type === 'string') {
      text = JSON.stringify(value);
    } else if (type === 'date') {
      text = isNaN(value.getTime()) ? 'Date (invalid)' : 'Date ' + value.toISOString();
    } else {
      text = type + ' ' + String(value);
    }
    return text.length > 70 ? text.slice(0, 67) + '...' : text;
  }

  function _describeError_(e) {
    if (e && e.message !== undefined) {
      return (e.name && e.name !== 'Error' ? e.name + ': ' : '') + String(e.message);
    }
    return String(e);
  }

  function _releaseQuietly_(lock) {
    try {
      lock.releaseLock();
    } catch (e) {
      _note_('(releaseLock threw: ' + _describeError_(e) + ' -- the lock is released when the execution ends)');
    }
  }

  // ---- report ----------------------------------------------------------

  function _newReport_() {
    return {
      verdict: null,
      abortReason: null,
      startedAtMs: _now_(),
      elapsedMs: 0,
      checks: [],
      counts: { PASS: 0, FAIL: 0, INFO: 0, INCONCLUSIVE: 0, SKIPPED: 0 },
      cleanup: null
    };
  }

  function _record_(report, id, status, title, detail) {
    report.checks.push({ id: id, status: status, title: title, detail: detail || '' });
    report.counts[status] += 1;
    _log_('[' + status + '] ' + id + ' ' + title + (detail ? ' -- ' + detail : ''));
  }

  function _banner_() {
    _log_('========== Execution OS: TruthEngine real-GAS gate (90_UnitTests.js, ' + GATE_VERSION + ') ==========');
    _log_('Subject: 15_TruthEngine.js only. Target: the Spreadsheet in Script Property EXEC_OS_SPREADSHEET_ID.');
    _log_('Writes: only temporary tabs named ' + TEMP_TAB_PREFIX + '<stamp>_<role>, created and deleted by this run.');
    _log_('Tags: PASS / FAIL / INCONCLUSIVE / SKIPPED are verdicts; INFO is an observation.');
    _log_('ERROR lines from TruthEngine.append between checks are failures this gate provokes on purpose.');
    _log_('');
  }

  // ---- pre-flight (no writes) -----------------------------------------

  function _stop_(message) {
    const error = new Error(message);
    error.gateStop = true;
    return error;
  }

  // One acquire and release of the script lock, before anything is written.
  function _preflightLock_() {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(LOCK_PROBE_WAIT_MS);
    } catch (e) {
      throw _stop_('the script lock could not be taken within ' + LOCK_PROBE_WAIT_MS + ' ms (' +
          _describeError_(e) + '). Another execution of this script holds it. ' +
          'Wait for it to finish and run the gate again.');
    }
    _releaseQuietly_(lock);
  }

  function _preflight_(report) {
    let spreadsheetId;
    try {
      spreadsheetId = Config.getSpreadsheetId();
    } catch (e) {
      throw _stop_('the Spreadsheet ID could not be read: ' + _describeError_(e) +
          '. Set Script Property EXEC_OS_SPREADSHEET_ID to Execution OS\'s own Spreadsheet and run again.');
    }

    let ss;
    try {
      ss = SpreadsheetApp.openById(spreadsheetId);
    } catch (e) {
      throw _stop_('the Spreadsheet named by EXEC_OS_SPREADSHEET_ID could not be opened: ' + _describeError_(e));
    }

    const tabNames = ss.getSheets().map(function(sheet) { return sheet.getName(); });

    const domainHits = DOMAIN_TAB_NAMES.filter(function(name) {
      return tabNames.indexOf(name) !== -1;
    });
    if (domainHits.length > 0) {
      throw _stop_('the configured Spreadsheet has tab(s) named like Domain OS tabs (' +
          domainHits.join(', ') + '). Execution OS has its own Spreadsheet and never writes to a Domain\'s ' +
          '(ADR-012, BR-10), so this gate will not run here. Check EXEC_OS_SPREADSHEET_ID.');
    }

    _preflightLock_();

    _log_('Spreadsheet: "' + ss.getName() + '", ' + tabNames.length + ' tab(s); locale ' +
        ss.getSpreadsheetLocale() + '; Spreadsheet time zone ' + ss.getSpreadsheetTimeZone() +
        '; script time zone ' + Session.getScriptTimeZone());
    _log_('Results below hold for this locale and time zone only.');

    const leftovers = tabNames.filter(function(name) {
      return name.indexOf(TEMP_TAB_PREFIX) === 0;
    });
    if (leftovers.length > 0) {
      _record_(report, 'PRE.leftover', S.INFO, 'temp tabs from an earlier run are still present',
          leftovers.join(', ') + '. This gate never deletes a tab it did not create in the same run; ' +
          'delete them by hand once you have looked at them.');
    }
    return { ss: ss, tabCountBefore: tabNames.length };
  }

  // ---- context and temp tabs ------------------------------------------

  function _newContext_(ss, tabCountBefore) {
    return {
      ss: ss,
      tabCountBefore: tabCountBefore,
      stamp: new Date().toISOString().replace(/[^0-9A-Z]/g, ''),
      created: [],      // every temp tab this run made, in creation order
      tabs: {},         // role -> { name, sheet, headers }
      heldLocks: [],    // every lock object this run took, for the final release
      timings: []       // { label, cells, ms } for the latency summary
    };
  }

  function _createTab_(ctx, role, headers) {
    const name = TEMP_TAB_PREFIX + ctx.stamp + '_' + role;
    const sheet = ctx.ss.insertSheet(name);
    ctx.created.push({ name: name, sheet: sheet });  // before any other call: clean-up must see it
    sheet.getRange(1, 1, 1, headers.length).setValues([headers.slice()]);
    return { name: name, sheet: sheet, headers: headers };
  }

  function _createTabs_(ctx) {
    ctx.tabs.W = _createTab_(ctx, 'W', W_HEADERS);   // wide row of string shapes
    ctx.tabs.C = _createTab_(ctx, 'C', W_HEADERS);   // control for W
    ctx.tabs.T = _createTab_(ctx, 'T', T_HEADERS);   // types, blanks, oversize, latency, locks
    ctx.tabs.G = _createTab_(ctx, 'G', G_HEADERS);   // grid growth
    _log_('Created ' + ctx.created.length + ' temporary tabs: ' +
        ctx.created.map(function(tab) { return tab.name; }).join(', '));
    _log_('');
  }

  // ---- calling the subject --------------------------------------------

  // Never throws: an engine exception becomes { ok: false, message }.
  function _callEngine_(tabName, record) {
    const startedAt = _now_();
    try {
      const result = TruthEngine.append(tabName, record);
      return { ok: true, result: result, ms: _now_() - startedAt };
    } catch (e) {
      return { ok: false, message: _describeError_(e), ms: _now_() - startedAt };
    }
  }

  function _readBack_(sheet, rowNumber, numCols) {
    const range = sheet.getRange(rowNumber, 1, 1, numCols);
    return {
      values: range.getValues()[0],
      display: range.getDisplayValues()[0],
      formats: range.getNumberFormats()[0]
    };
  }

  function _validReturn_(call, tabName) {
    return call.ok && call.result && call.result.tabName === tabName &&
        typeof call.result.rowNumber === 'number' && call.result.rowNumber >= 2 &&
        Math.floor(call.result.rowNumber) === call.result.rowNumber;
  }

  // ---- PT: plain-text protection ---------------------------------------

  // The same strings written the way the engine must NOT write them: a
  // plain setValues with no plain-text format. It shows which shapes this
  // Spreadsheet really re-types, so a PASS below is not vacuous.
  function _runControl_(ctx) {
    const sheet = ctx.tabs.C.sheet;
    const retyped = [];
    const kept = [];
    [SHAPES_A, SHAPES_B].forEach(function(shapes, setIndex) {
      const rowNumber = setIndex + 2;
      const row = ['control-' + (setIndex === 0 ? 'A' : 'B')].concat(shapes.map(function(shape) {
        return shape.value;
      }));
      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      SpreadsheetApp.flush();
      const back = sheet.getRange(rowNumber, 1, 1, row.length).getValues()[0];
      shapes.forEach(function(shape, i) {
        const value = back[i + 1];
        if (typeof value === 'string' && value === shape.value) {
          kept.push(shape.label);
        } else {
          retyped.push(shape.label);
        }
      });
    });
    return { retyped: retyped, kept: kept, discriminates: retyped.length > 0 };
  }

  function _recordFromShapes_(marker, shapes) {
    const record = { m: marker };
    shapes.forEach(function(shape, i) {
      record[_shapeColumn_(i)] = shape.value;
    });
    return record;
  }

  function _checkShapeAppend_(ctx, report, spec) {
    const tab = spec.tab;
    const sheet = tab.sheet;
    const expectedRow = sheet.getLastRow() + 1;
    const call = _callEngine_(tab.name, _recordFromShapes_(spec.marker, spec.shapes));
    ctx.timings.push({ label: spec.id, cells: spec.shapes.length + 1, ms: call.ms });

    if (!call.ok) {
      _record_(report, spec.id, S.FAIL, spec.title, 'the engine threw: ' + call.message);
      return;
    }
    if (!_validReturn_(call, tab.name)) {
      _record_(report, spec.id, S.FAIL, spec.title,
          'the engine returned ' + JSON.stringify(call.result) + ', expected { tabName: ' +
          JSON.stringify(tab.name) + ', rowNumber: a whole number >= 2 }');
      return;
    }

    const rowNumber = call.result.rowNumber;
    const problems = [];
    if (rowNumber !== expectedRow) {
      problems.push('returned rowNumber ' + rowNumber + ', expected getLastRow()+1 = ' + expectedRow);
    }
    const back = _readBack_(sheet, rowNumber, tab.headers.length);
    if (back.values[0] !== spec.marker) {
      problems.push('the marker is not in the returned row: found ' + _show_(back.values[0]));
    }
    const lastRowNow = sheet.getLastRow();
    if (lastRowNow !== rowNumber) {
      problems.push('getLastRow() is ' + lastRowNow + ' after the append, not the returned row ' + rowNumber);
    }

    const preserved = [];
    const notPreserved = [];
    spec.shapes.forEach(function(shape, i) {
      const column = i + 1;
      const issues = [];
      const value = back.values[column];
      if (value !== shape.value) {
        issues.push('getValues() gives ' + _show_(value));
      }
      if (back.display[column] !== shape.value) {
        issues.push('getDisplayValues() gives ' + _show_(back.display[column]));
      }
      if (back.formats[column] !== '@') {
        issues.push('number format is ' + _show_(back.formats[column]));
      }
      if (issues.length === 0) {
        preserved.push(shape.label);
      } else {
        notPreserved.push(shape.label + ': ' + issues.join('; '));
      }
    });

    if (problems.length > 0 || notPreserved.length > 0) {
      notPreserved.forEach(function(line) {
        _note_('not preserved -- ' + line);
      });
      _record_(report, spec.id, S.FAIL, spec.title,
          problems.concat(notPreserved.length > 0
              ? [notPreserved.length + ' of ' + spec.shapes.length + ' shapes not preserved (listed above)']
              : []).join('; '));
      return;
    }
    if (!spec.control.discriminates) {
      _record_(report, spec.id, S.INCONCLUSIVE, spec.title,
          'all ' + spec.shapes.length + ' shapes came back unchanged, but the control re-typed none of them, ' +
          'so this run cannot show that the plain-text format is what kept them intact');
      return;
    }
    const protectedLabels = preserved.filter(function(label) {
      return spec.control.retyped.indexOf(label) !== -1;
    });
    _record_(report, spec.id, S.PASS, spec.title,
        preserved.length + '/' + spec.shapes.length + ' came back as the identical string ' +
        '(getValues, getDisplayValues, format @); ' + protectedLabels.length +
        ' of them were re-typed in the control, so the protection did real work for them. ' +
        'Row ' + rowNumber + ', ' + call.ms + ' ms.');
  }

  function _groupPlainText_(ctx, report) {
    const control = _runControl_(ctx);
    const total = control.retyped.length + control.kept.length;
    _record_(report, 'PT.control', S.INFO, 'the same strings written WITHOUT the plain-text format',
        control.retyped.length + ' of ' + total + ' were re-typed by this Spreadsheet' +
        (control.retyped.length > 0 ? ' (' + control.retyped.join('; ') + ')' : '') +
        '. The other ' + control.kept.length + ' stay strings either way.');
    if (!control.discriminates) {
      _note_('No shape was re-typed, so the PT checks below can only end INCONCLUSIVE or FAIL.');
    }
    _checkShapeAppend_(ctx, report, {
      id: 'PT.A', title: 'engine append, ' + SHAPES_A.length + ' string shapes in one row',
      tab: ctx.tabs.W, shapes: SHAPES_A, marker: 'GATE-PT-A-' + ctx.stamp, control: control
    });
    _checkShapeAppend_(ctx, report, {
      id: 'PT.B', title: 'engine append, ' + SHAPES_B.length + ' more string shapes in a second row',
      tab: ctx.tabs.W, shapes: SHAPES_B, marker: 'GATE-PT-B-' + ctx.stamp, control: control
    });
  }

  // ---- NT: native types and blanks -------------------------------------

  function _groupNativeTypes_(ctx, report) {
    const tab = ctx.tabs.T;
    const sheet = tab.sheet;
    const marker = 'GATE-NT-' + ctx.stamp;
    const expectedRow = sheet.getLastRow() + 1;
    const record = {
      m: marker, n: 42, z: 0, t: true, f: false, neg: -1.5, big: 1234567890123,
      blank_null: null, blank_undef: undefined, blank_empty: ''
    };
    const call = _callEngine_(tab.name, record);
    ctx.timings.push({ label: 'NT', cells: 1, ms: call.ms });
    if (!call.ok) {
      _record_(report, 'NT', S.FAIL, 'numbers, booleans and blanks', 'the engine threw: ' + call.message);
      return;
    }
    if (!_validReturn_(call, tab.name)) {
      _record_(report, 'NT', S.FAIL, 'numbers, booleans and blanks',
          'the engine returned ' + JSON.stringify(call.result));
      return;
    }

    const rowNumber = call.result.rowNumber;
    const problems = [];
    if (rowNumber !== expectedRow) {
      problems.push('returned rowNumber ' + rowNumber + ', expected ' + expectedRow);
    }
    const back = _readBack_(sheet, rowNumber, tab.headers.length);
    const indexOf = function(name) { return tab.headers.indexOf(name); };
    if (back.values[indexOf('m')] !== marker) {
      problems.push('marker not in the returned row: ' + _show_(back.values[indexOf('m')]));
    }
    [['n', 42], ['z', 0], ['t', true], ['f', false], ['neg', -1.5], ['big', 1234567890123]].forEach(function(pair) {
      const value = back.values[indexOf(pair[0])];
      if (value !== pair[1]) {
        problems.push(pair[0] + ': expected ' + _show_(pair[1]) + ', getValues() gives ' + _show_(value));
      }
      if (back.formats[indexOf(pair[0])] === '@') {
        problems.push(pair[0] + ' was given the plain-text format');
      }
    });
    ['blank_null', 'blank_undef', 'blank_empty'].forEach(function(name) {
      const value = back.values[indexOf(name)];
      if (value !== '') {
        problems.push(name + ': expected a blank cell, getValues() gives ' + _show_(value));
      }
      if (back.formats[indexOf(name)] === '@') {
        problems.push(name + ' was given the plain-text format');
      }
    });
    if (back.formats[indexOf('m')] !== '@') {
      problems.push('the marker string cell is not plain text: ' + _show_(back.formats[indexOf('m')]));
    }

    if (problems.length > 0) {
      _record_(report, 'NT', S.FAIL, 'numbers, booleans and blanks', problems.join('; '));
      return;
    }
    _record_(report, 'NT', S.PASS, 'numbers, booleans and blanks',
        'numbers and booleans kept their native types and no plain-text format; null, undefined and an empty ' +
        'string left blank cells; the string cell is plain text. Row ' + rowNumber + '.');
  }

  // ---- GR: grid growth -------------------------------------------------

  function _groupGrid_(ctx, report) {
    const tab = ctx.tabs.G;
    const sheet = tab.sheet;

    const maxNow = sheet.getMaxRows();
    if (maxNow > 3) {
      sheet.deleteRows(4, maxNow - 3);
    }
    const maxAfterShrink = sheet.getMaxRows();
    if (maxAfterShrink !== 3) {
      _record_(report, 'GR', S.INCONCLUSIVE, 'grid growth',
          'could not shrink the grid tab to 3 rows (getMaxRows() is ' + maxAfterShrink + ' after deleteRows)');
      return;
    }

    const problems = [];
    const markers = [];
    const rowNumbers = [];
    for (let i = 0; i < 3; i++) {
      const marker = 'GATE-GR-' + (i + 1) + '-' + ctx.stamp;
      const call = _callEngine_(tab.name, { g1: marker });
      if (!call.ok) {
        problems.push('append ' + (i + 1) + ' threw: ' + call.message +
            (i === 2 ? ' (this is the append that needs a row past the grid)' : ''));
        break;
      }
      if (!_validReturn_(call, tab.name)) {
        problems.push('append ' + (i + 1) + ' returned ' + JSON.stringify(call.result));
        break;
      }
      markers.push(marker);
      rowNumbers.push(call.result.rowNumber);
      if (call.result.rowNumber !== i + 2) {
        problems.push('append ' + (i + 1) + ' landed on row ' + call.result.rowNumber + ', expected ' + (i + 2));
      }
    }

    if (problems.length === 0) {
      markers.forEach(function(marker, i) {
        const value = sheet.getRange(rowNumbers[i], 1).getValue();
        if (value !== marker) {
          problems.push('row ' + rowNumbers[i] + ' holds ' + _show_(value) + ', expected the marker of append ' + (i + 1));
        }
      });
    }

    if (problems.length > 0) {
      _record_(report, 'GR', S.FAIL, 'grid growth when the tab is full', problems.join('; '));
    } else {
      _record_(report, 'GR', S.PASS, 'grid growth when the tab is full',
          'a tab with a 3-row grid took appends on rows 2, 3 and 4; the third needed a row past the grid ' +
          'and succeeded; earlier rows intact; getMaxRows() is now ' + sheet.getMaxRows() + '.');
    }

    // Raw platform probe: what does the platform itself do on a write one
    // row past the grid? Observation only; the engine's guard stays.
    const gridBefore = sheet.getMaxRows();
    let outcome;
    try {
      sheet.getRange(gridBefore + 1, 1, 1, 1).setValues([['raw-probe']]);
      outcome = 'the write was ACCEPTED';
    } catch (e) {
      outcome = 'the write THREW: ' + _describeError_(e);
    }
    const gridAfter = sheet.getMaxRows();
    _record_(report, 'GR.raw', S.INFO, 'a raw setValues one row past the grid (no engine involved)',
        outcome + '; getMaxRows() went from ' + gridBefore + ' to ' + gridAfter +
        (outcome.indexOf('THREW') !== -1
            ? '. So a write past the grid does fail here, and the engine\'s growth step is needed.'
            : '. So this platform copes with a write past the grid by itself.'));
  }

  // ---- OS: a very large string -----------------------------------------

  function _groupOversize_(ctx, report) {
    const tab = ctx.tabs.T;
    const sheet = tab.sheet;
    const big = 'x'.repeat(OVERSIZE_PROBE_CHARS);
    const marker = 'GATE-OS-' + ctx.stamp;
    const before = sheet.getLastRow();
    const call = _callEngine_(tab.name, { m: marker, f01: big });
    const title = 'a ' + OVERSIZE_PROBE_CHARS + '-character string';

    if (!call.ok) {
      const problems = [];
      const lastRowNow = sheet.getLastRow();
      if (lastRowNow !== before) {
        problems.push('the engine threw but getLastRow() moved from ' + before + ' to ' + lastRowNow);
      }
      const follow = _callEngine_(tab.name, { m: 'GATE-OS-FOLLOW-' + ctx.stamp, f01: 'follow-up' });
      if (!_validReturn_(follow, tab.name)) {
        problems.push('the next normal append failed: ' + (follow.ok ? JSON.stringify(follow.result) : follow.message));
      }
      if (problems.length > 0) {
        _record_(report, 'OS', S.FAIL, title, problems.join('; '));
      } else {
        const text = call.message.length > 140 ? call.message.slice(0, 137) + '...' : call.message;
        _record_(report, 'OS', S.PASS, title,
            'refused with an error and nothing was written; the next normal append succeeded on row ' +
            follow.result.rowNumber + ' (so the lock was released). Error: ' + text);
      }
      return;
    }

    if (!_validReturn_(call, tab.name)) {
      _record_(report, 'OS', S.FAIL, title, 'the engine returned ' + JSON.stringify(call.result));
      return;
    }
    const column = tab.headers.indexOf('f01') + 1;
    const stored = sheet.getRange(call.result.rowNumber, column).getValue();
    if (typeof stored === 'string' && stored.length === OVERSIZE_PROBE_CHARS && stored === big) {
      _record_(report, 'OS', S.INFO, title,
          'the platform ACCEPTED and returned all ' + OVERSIZE_PROBE_CHARS + ' characters, so a per-cell limit ' +
          'at or below that size is not enforced for this write.');
    } else {
      _record_(report, 'OS', S.FAIL, title,
          'the engine reported success, but the cell holds ' +
          (typeof stored === 'string' ? stored.length + ' characters' : _show_(stored)) +
          ' instead of ' + OVERSIZE_PROBE_CHARS + ': data was changed silently.');
    }
  }

  // ---- LAT: per-append latency -----------------------------------------

  function _latencyRecord_(marker, run) {
    const record = { m: marker };
    for (let k = 1; k <= 12; k++) {
      record['f' + _pad2_(k)] = 'probe ' + (run + 1) + '.' + k + ' ' + 'abcdefghijklmnopqrstuvwxyz'.slice(0, 10 + k);
    }
    return record;
  }

  function _groupLatency_(ctx, report) {
    const tab = ctx.tabs.T;
    const sheet = tab.sheet;
    const problems = [];
    const landed = [];
    let expected = sheet.getLastRow() + 1;

    for (let i = 0; i < LATENCY_APPENDS; i++) {
      const marker = 'GATE-LAT-' + (i + 1) + '-' + ctx.stamp;
      const call = _callEngine_(tab.name, _latencyRecord_(marker, i));
      ctx.timings.push({ label: 'LAT ' + (i + 1), cells: 13, ms: call.ms });
      if (!call.ok) {
        problems.push('append ' + (i + 1) + ' threw: ' + call.message);
        break;
      }
      if (!_validReturn_(call, tab.name)) {
        problems.push('append ' + (i + 1) + ' returned ' + JSON.stringify(call.result));
        break;
      }
      if (call.result.rowNumber !== expected) {
        problems.push('append ' + (i + 1) + ' landed on row ' + call.result.rowNumber + ', expected ' + expected);
      }
      landed.push({ marker: marker, rowNumber: call.result.rowNumber });
      expected = call.result.rowNumber + 1;
    }
    landed.forEach(function(entry) {
      const value = sheet.getRange(entry.rowNumber, 1).getValue();
      if (value !== entry.marker) {
        problems.push('row ' + entry.rowNumber + ' holds ' + _show_(value) + ', expected its own marker');
      }
    });

    if (problems.length > 0) {
      _record_(report, 'LAT', S.FAIL, LATENCY_APPENDS + ' consecutive appends in one execution', problems.join('; '));
    } else {
      _record_(report, 'LAT', S.PASS, LATENCY_APPENDS + ' consecutive appends in one execution',
          'each landed on the row after the previous one, rows ' + landed[0].rowNumber + ' to ' +
          landed[landed.length - 1].rowNumber + ', each marker in its own row. (One execution cannot show the ' +
          'flush-before-release effect across executions.)');
    }

    const sampled = ctx.timings.filter(function(entry) { return entry.label.indexOf('LAT ') === 0; });
    const msList = sampled.map(function(entry) { return entry.ms; });
    const sum = msList.reduce(function(a, b) { return a + b; }, 0);
    const summary = msList.length > 0
        ? msList.length + ' appends of 13 string cells: min ' + Math.min.apply(null, msList) +
          ' ms, avg ' + Math.round(sum / msList.length) + ' ms, max ' + Math.max.apply(null, msList) + ' ms. '
        : '';
    _record_(report, 'LAT.time', S.INFO, 'time per TruthEngine.append, one execution, no contention',
        summary + 'All timed calls: ' + ctx.timings.map(function(entry) {
          return entry.label + ' (' + entry.cells + ' string cells) ' + entry.ms + ' ms';
        }).join('; ') + '. For scale: the engine waits up to its LOCK_WAIT_MS for the lock (10000 in ' +
        '15_TruthEngine.js, PROPOSED P3).');
  }

  // ---- LK: locks -------------------------------------------------------

  function _lockIsFree_(ctx) {
    const probe = LockService.getScriptLock();
    ctx.heldLocks.push(probe);
    const startedAt = _now_();
    try {
      probe.waitLock(LOCK_PROBE_WAIT_MS);
    } catch (e) {
      return { free: false, message: _describeError_(e), ms: _now_() - startedAt };
    }
    _releaseQuietly_(probe);
    return { free: true, ms: _now_() - startedAt };
  }

  function _groupLocks_(ctx, report) {
    const tab = ctx.tabs.T;
    const sheet = tab.sheet;

    // (1) Does the platform let a second lock object in while the first
    // one holds the script lock, inside this one execution? Uses waitLock
    // on fresh objects, exactly how the engine takes the lock.
    const first = LockService.getScriptLock();
    const second = LockService.getScriptLock();
    ctx.heldLocks.push(first, second);
    let firstGot = false;
    let secondGot = false;
    let message = '';
    let waitedMs = 0;
    try {
      first.waitLock(LOCK_PROBE_WAIT_MS);
      firstGot = true;
    } catch (e) {
      message = _describeError_(e);
    }
    if (!firstGot) {
      _record_(report, 'LK', S.INCONCLUSIVE, 'script lock checks',
          'the gate could not take the script lock within ' + LOCK_PROBE_WAIT_MS + ' ms (' + message +
          '). Either another execution holds it, or an earlier TruthEngine.append in this run did not ' +
          'release it (look for "could not acquire the script lock" failures above).');
      return;
    }
    try {
      const startedAt = _now_();
      try {
        second.waitLock(LOCK_PROBE_WAIT_MS);
        secondGot = true;
      } catch (e) {
        message = _describeError_(e);
      }
      waitedMs = _now_() - startedAt;
    } finally {
      if (secondGot) {
        _releaseQuietly_(second);
      }
      _releaseQuietly_(first);
    }
    const reentrant = secondGot;
    const identity = ' getScriptLock() returned ' +
        (first === second ? 'the SAME object twice' : 'two different objects') + '.';
    _record_(report, 'LK.reentrancy', S.INFO, 'a second lock object while the first one holds the script lock',
        reentrant
            ? 'ACQUIRED: the platform lets one execution take the script lock twice, so the checks that need a ' +
              'lock this execution can be refused by are inconclusive or skipped below.' + identity
            : 'REFUSED after ' + waitedMs + ' ms (' + message + '): one execution cannot take the script ' +
              'lock twice, so the checks below can use it.' + identity);

    // (2) Released after a successful append?
    const okCall = _callEngine_(tab.name, { m: 'GATE-LK-OK-' + ctx.stamp, f01: 'lock probe after a success' });
    let releaseProblem = null;
    if (!_validReturn_(okCall, tab.name)) {
      releaseProblem = 'the append used for this check failed: ' + (okCall.ok ? JSON.stringify(okCall.result) : okCall.message);
      _record_(report, 'LK.release', S.FAIL, 'lock released after a successful append', releaseProblem);
    } else if (reentrant) {
      _record_(report, 'LK.release', S.INCONCLUSIVE, 'lock released after a successful append',
          'a fresh lock object can always get the lock here, so that cannot show the engine released it');
    } else {
      const free = _lockIsFree_(ctx);
      if (free.free) {
        _record_(report, 'LK.release', S.PASS, 'lock released after a successful append',
            'a fresh lock object took the script lock right after the append returned (' + free.ms + ' ms)');
      } else {
        releaseProblem = 'append returned, but a fresh lock object could not take the script lock within ' +
            LOCK_PROBE_WAIT_MS + ' ms (' + free.message + '): the engine did not release it';
        _record_(report, 'LK.release', S.FAIL, 'lock released after a successful append', releaseProblem);
      }
    }

    // (3) Released after a FAILED append (the failure happens under the lock).
    const failCall = _callEngine_(tab.name, { no_such_column: 'x' });
    if (failCall.ok) {
      _record_(report, 'LK.releaseFail', S.FAIL, 'lock released after a failed append',
          'an unknown column was accepted: ' + JSON.stringify(failCall.result));
      releaseProblem = releaseProblem || 'unknown column accepted';
    } else if (reentrant) {
      _record_(report, 'LK.releaseFail', S.INCONCLUSIVE, 'lock released after a failed append',
          'the append failed as intended, but a fresh lock object can always get the lock here');
    } else {
      const freeAfterFail = _lockIsFree_(ctx);
      if (freeAfterFail.free) {
        _record_(report, 'LK.releaseFail', S.PASS, 'lock released after a failed append',
            'an unknown column was refused and a fresh lock object took the script lock right after');
      } else {
        releaseProblem = releaseProblem || 'lock still held after a failed append';
        _record_(report, 'LK.releaseFail', S.FAIL, 'lock released after a failed append',
            'the append failed as intended, but a fresh lock object could not take the script lock within ' +
            LOCK_PROBE_WAIT_MS + ' ms (' + freeAfterFail.message + ')');
      }
    }

    // (4) The lock-timeout path: the gate holds the lock, the engine must
    // time out. Meaningful only if the platform refuses a second holder.
    if (reentrant) {
      _record_(report, 'LK.timeout', S.SKIPPED, 'engine lock-timeout path',
          'needs a lock this execution can be refused by, and the platform lets one execution take it twice. ' +
          'Exercising the timeout needs a second execution running at the same time.');
      return;
    }
    if (releaseProblem) {
      _record_(report, 'LK.timeout', S.SKIPPED, 'engine lock-timeout path',
          'an earlier lock check failed (' + releaseProblem + '), so the lock state is not trustworthy');
      return;
    }
    const holder = LockService.getScriptLock();
    ctx.heldLocks.push(holder);
    let held = false;
    try {
      holder.waitLock(LOCK_PROBE_WAIT_MS);
      held = true;
    } catch (e) {
      message = _describeError_(e);
    }
    if (!held) {
      _record_(report, 'LK.timeout', S.INCONCLUSIVE, 'engine lock-timeout path',
          'the gate could not take the lock to hold it (' + message + ')');
      return;
    }
    const lastRowBefore = sheet.getLastRow();
    let timeoutCall;
    try {
      timeoutCall = _callEngine_(tab.name, { m: 'GATE-LK-TIMEOUT-' + ctx.stamp, f01: 'must not be written' });
    } finally {
      _releaseQuietly_(holder);
    }

    const problems = [];
    if (timeoutCall.ok) {
      problems.push('the engine APPENDED while another lock object held the script lock, although the probe ' +
          'above showed a second lock object is refused: the engine is not waiting for the script lock');
    } else {
      const match = /could not acquire the script lock within (\d+) ms/.exec(timeoutCall.message);
      if (!match) {
        problems.push('the engine threw, but not the lock-timeout error: ' + timeoutCall.message);
      }
    }
    const lastRowAfter = sheet.getLastRow();
    if (!timeoutCall.ok && lastRowAfter !== lastRowBefore) {
      problems.push('a row was written (getLastRow() went from ' + lastRowBefore + ' to ' + lastRowAfter +
          ') although the engine reported an error');
    }
    const afterRelease = _callEngine_(tab.name, { m: 'GATE-LK-AFTER-' + ctx.stamp, f01: 'after the timeout' });
    if (!_validReturn_(afterRelease, tab.name)) {
      problems.push('after the gate released the lock, the next append failed: ' +
          (afterRelease.ok ? JSON.stringify(afterRelease.result) : afterRelease.message));
    } else if (afterRelease.result.rowNumber !== lastRowAfter + 1) {
      problems.push('after the gate released the lock, the next append landed on row ' +
          afterRelease.result.rowNumber + ', expected ' + (lastRowAfter + 1));
    }

    if (problems.length > 0) {
      _record_(report, 'LK.timeout', S.FAIL, 'engine lock-timeout path', problems.join('; '));
    } else {
      const configured = /within (\d+) ms/.exec(timeoutCall.message)[1];
      _record_(report, 'LK.timeout', S.PASS, 'engine lock-timeout path',
          'while the gate held the lock the engine threw the lock-timeout error after ' + timeoutCall.ms +
          ' ms (it names ' + configured + ' ms as its wait), wrote nothing, and appended normally once the lock ' +
          'was released.');
    }
  }

  // ---- clean-up and summary --------------------------------------------

  function _cleanup_(ctx, report) {
    ctx.heldLocks.forEach(function(lock) { _releaseQuietly_(lock); });

    const problems = [];
    const names = ctx.created.map(function(tab) { return tab.name; });
    ctx.created.slice().reverse().forEach(function(tab) {
      try {
        ctx.ss.deleteSheet(tab.sheet);
      } catch (e) {
        problems.push('could not delete ' + tab.name + ': ' + _describeError_(e));
      }
    });

    let remaining = [];
    let tabCountAfter = null;
    try {
      const nowNames = ctx.ss.getSheets().map(function(sheet) { return sheet.getName(); });
      tabCountAfter = nowNames.length;
      remaining = names.filter(function(name) { return nowNames.indexOf(name) !== -1; });
    } catch (e) {
      problems.push('could not list the tabs to verify the clean-up: ' + _describeError_(e));
    }
    if (remaining.length > 0) {
      problems.push('still present, delete by hand: ' + remaining.join(', '));
    }
    if (tabCountAfter !== null && tabCountAfter !== ctx.tabCountBefore) {
      problems.push('the Spreadsheet has ' + tabCountAfter + ' tab(s), it had ' + ctx.tabCountBefore + ' before the run');
    }

    report.cleanup = { created: names, remaining: remaining, ok: problems.length === 0 };
    _log_('');
    if (problems.length === 0) {
      _record_(report, 'CL', S.PASS, 'clean-up',
          names.length + ' temp tab(s) deleted; the Spreadsheet has ' + tabCountAfter + ' tab(s), as before the run.');
    } else {
      _record_(report, 'CL', S.FAIL, 'clean-up', problems.join('; '));
    }
  }

  function _finish_(report) {
    report.elapsedMs = _now_() - report.startedAtMs;
    const c = report.counts;
    if (report.abortReason) {
      report.verdict = 'ABORTED';
    } else if (c.FAIL > 0) {
      report.verdict = 'FAIL';
    } else if (c.INCONCLUSIVE + c.SKIPPED > 0) {
      report.verdict = 'INCOMPLETE';
    } else {
      report.verdict = 'PASS';
    }

    _log_('');
    _log_('========== RESULT ==========');
    _log_('PASS ' + c.PASS + ' | FAIL ' + c.FAIL + ' | INCONCLUSIVE ' + c.INCONCLUSIVE +
        ' | SKIPPED ' + c.SKIPPED + ' | INFO ' + c.INFO + ' | ' + report.elapsedMs + ' ms');
    report.checks.forEach(function(check) {
      if (check.status === S.FAIL || check.status === S.INCONCLUSIVE || check.status === S.SKIPPED) {
        _log_('  ' + check.status + ': ' + check.id + ' ' + check.title);
      }
    });
    if (report.verdict === 'ABORTED') {
      _log_('RESULT: ABORTED before any write -- ' + report.abortReason);
    } else if (report.verdict === 'FAIL') {
      _log_('RESULT: FAIL -- ' + c.FAIL + ' check(s) failed; the detail is above. Send the whole log back.');
    } else if (report.verdict === 'INCOMPLETE') {
      _log_('RESULT: INCOMPLETE -- nothing failed, but ' + (c.INCONCLUSIVE + c.SKIPPED) +
          ' check(s) could not be concluded or were skipped (listed above).');
    } else {
      _log_('RESULT: PASS -- every check this gate ran passed. That is NOT "TruthEngine is verified in GAS":');
      _log_('the items below are still open.');
    }
    _log_('');
    _log_('NOT VERIFIED BY THIS GATE:');
    NOT_VERIFIED_LINES.forEach(function(line, i) {
      _log_('  ' + (i + 1) + '. ' + line);
    });
    _log_('');
    _log_('Copy this whole log back. Nothing here has been run before in real Apps Script.');
  }

  // ---- the gate --------------------------------------------------------

  function runTruthEngineGate() {
    const report = _newReport_();
    _banner_();
    let ctx = null;
    try {
      const pre = _preflight_(report);
      ctx = _newContext_(pre.ss, pre.tabCountBefore);
      _createTabs_(ctx);
      _runGroup_(ctx, report, 'PT', 'plain-text protection', _groupPlainText_);
      _runGroup_(ctx, report, 'NT', 'numbers, booleans and blanks', _groupNativeTypes_);
      _runGroup_(ctx, report, 'GR', 'grid growth', _groupGrid_);
      _runGroup_(ctx, report, 'OS', 'a very large string', _groupOversize_);
      _runGroup_(ctx, report, 'LAT', 'latency', _groupLatency_);
      _runGroup_(ctx, report, 'LK', 'script lock', _groupLocks_);
    } catch (e) {
      if (e && e.gateStop) {
        report.abortReason = e.message;
        AlertService.log('ERROR', MODULE, 'runTruthEngineGate', {}, e.message);
      } else {
        _record_(report, 'SETUP', S.INCONCLUSIVE, 'gate setup',
            'unexpected error before the checks could run: ' + _describeError_(e));
      }
    } finally {
      if (ctx) {
        try {
          _cleanup_(ctx, report);
        } catch (e) {
          _record_(report, 'CL', S.FAIL, 'clean-up', 'the clean-up itself threw: ' + _describeError_(e));
        }
      }
    }
    _finish_(report);
    return report;
  }

  function _runGroup_(ctx, report, id, title, fn) {
    if (_now_() - report.startedAtMs > NO_NEW_GROUP_AFTER_MS) {
      _record_(report, id, S.SKIPPED, title,
          'not started: more than ' + NO_NEW_GROUP_AFTER_MS + ' ms of the run had already passed');
      return;
    }
    try {
      fn(ctx, report);
    } catch (e) {
      _record_(report, id, S.INCONCLUSIVE, title,
          'the gate itself could not finish this group (' + _describeError_(e) + '). ' +
          'That points at the gate scaffolding or a platform call, not at TruthEngine.');
    }
  }

  return {
    runTruthEngineGate: runTruthEngineGate
  };

})();

// The only top-level function: the Apps Script editor's Run list shows
// top-level function declarations, not members of the module above.
function runTruthEngineGate() {
  return UnitTests.runTruthEngineGate();
}
