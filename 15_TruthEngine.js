/*
=====================================================================
EXECUTION OS — 15_TruthEngine.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        The single write path for a data row into Execution OS's
              own Spreadsheet: one validated, locked, append-only row
              write per call. Schema-agnostic on purpose.
Built:       2026-10-26, seventh real runtime file, per this specific
              authorization (15_TruthEngine.js only).
Changed:     2026-11-03, at the owner's explicit go-ahead, after the first
              real Apps Script run of the gate (90_UnitTests.js) found two
              defects in this file. Added P10 (per-cell length guard) and
              P11 (apostrophe prefix for a leading "=" or apostrophe) and
              updated the evidence notes below. The write sequence is
              otherwise unchanged. The new behavior has been exercised only
              in the Node sandbox; the next real run of the gate is its
              first test on the real platform.

GOVERNANCE SOURCE REVIEW, performed before writing any code (per
ADR-018's Checkpoint Integrity Gate and this project's standing "no
design without a real requirement" rule). Every tier below says where a
statement comes from, so evidence and choice stay distinguishable.

CONFIRMED -- governance text in this repository, re-read this
checkpoint:
  - 00_File_Map.js, 15_TruthEngine.js entry: "Generic validated safe
    append/write owner, per UCR6 -- every Engine's data-row append goes
    through this file, not its own raw appendRow(). Schema-agnostic on
    purpose: it does not know or enforce any entity's field shape, only
    that an append is locked and safe."
  - 00_File_Map.js (11_Schema / 16_EventLog / 17_ReferenceBase entries)
    and the Checkpoint Handoff 2026-10-08 S7: Schema and TruthEngine
    are siblings that depend only on Config, with no code dependency
    between them; 16_EventLog.js calls this file after validating the
    event type; 17_ReferenceBase.js has no Sheet access, a Runtime-layer
    Engine writes References through this file.
  - Architecture v0.8 S6.1: Execution_Events and AI_Suggestions_Log are
    append-only event logs.
  - ADR-012 (Accepted), Architecture S6.3 and BR-10: Execution OS has
    its own independent Spreadsheet and never writes to a Domain's
    Sheet/Tab.
  - Constitution, PLATFORM CONSTRAINTS (UEF v1.12 S2): no multi-
    statement transactions; LockService is per-script only.

NOT AVAILABLE -- UCR6's own text. UEF v1.12 is not in this repository
and no file here quotes more than the File_Map line above. Conformance
to UCR6 is therefore checked against that paraphrase only; "validated"
and "safe" are not defined beyond it, so the concrete rules below are
this file's reading of them (PROPOSED), not UCR6 text.

OBSERVED -- Personal Life OS source, READ-ONLY, a sibling project in
the same ecosystem. None of this was observed in Execution's own
Spreadsheet:
  - 00_Known_Limitations.js, Known Limitation 11 (entries dated
    2026-09-24, marked LIVE GAS VERIFIED in that project, scoped to
    date/time-shaped strings): Sheets re-types a string on write
    according to its content unless the cell is plain text. appendRow()
    ignores a plain-text format set beforehand; setNumberFormat('@')
    followed by getRange().setValues() on the same cell keeps the
    string. Its stated conclusion: the protection belongs in the write
    path itself, not in pre-formatted ranges that eventually run out.
  - 05_SheetUtils.js upsertRowByKey_: header-name-driven column mapping
    and the write mechanism above. NOT copied: it silently ignores a
    key that matches no header. This file rejects instead, because a
    silent drop is silent data loss.
  - 09_IdempotencyManager.js: LockService.getScriptLock() + waitLock(ms)
    is the ecosystem's lock pattern.
  - 02_EventBus.js: two projects may append to one SHARED tab at the
    same time. Not Execution's case: its tabs live in its own
    Spreadsheet (ADR-012) and only this script writes them, which is
    why a per-script lock is the right scope here. It would NOT be for
    a Domain's shared tab -- and this file never touches one.

OFFICIAL DOCS -- developers.google.com/apps-script/reference/lock/lock
and .../spreadsheet/sheet, fetched 2026-10-25:
  - Lock.releaseLock(): call SpreadsheetApp.flush() before releasing,
    so pending spreadsheet changes are committed while exclusive access
    is still held; no effect if the lock was never acquired.
  - Lock.waitLock(ms): throws if the lock is not acquired in time; no
    maximum wait is stated.
  - Sheet.getLastRow(): "the position of the last row that has
    content". Sheet.appendRow(): "Appends a row to the bottom of the
    current data region in the sheet."
  - NOT found in the pages read, so UNVERIFIED: whether setValues() on a
    range past the sheet's last grid row grows the grid or throws;
    whether a string starting with "=" is parsed as a formula inside a
    plain-text cell. (Both are listed in the test file's
    REAL_GAS_REQUIRED section.)
    [Updated 2026-11-03: both are now OBSERVED, see the next section:
    the platform grows the grid by itself, and a leading "=" IS read as a
    formula even inside a plain-text cell.]

OBSERVED IN REAL APPS SCRIPT -- this project's own gate, 90_UnitTests.js
(GATE_VERSION 2026-10-31), run once, 2026-11-03 06:59 Asia/Kuala_Lumpur
(2026-11-02T22:59Z), against Execution's own Spreadsheet "60.Execution"
(one tab; locale en_US; Spreadsheet time zone Asia/Shanghai; script time
zone Asia/Singapore). Evidence: the owner's copy of that Execution log.
Result: PASS 5, FAIL 2, INCONCLUSIVE 2, SKIPPED 1, INFO 4, 17010 ms.
  - Control: the same 36 probe strings written WITHOUT the plain-text
    format -- 23 of 36 were re-typed by the Spreadsheet (leading zeros,
    scientific notation, all-digit and digits-e-digits hash-like,
    trailing-zero decimal, negative integer, thousands separator,
    percent, currency, parenthesised number, ISO date, clock time,
    fractions, slashed dates, month and day, 12-hour time, small
    exponent, TRUE and false as text, two formulas, a leading
    apostrophe). The protection is needed.
  - P6 as written kept 33 of the 36: every number-, date-, time-, hash-
    and TRUE/false-shaped string. The 3 it did not keep: a string
    starting with "=" is evaluated as a formula EVEN in a '@' cell
    ("=1+1" read back as the number 2, a SUM formula as 3), and a first-
    character apostrophe is consumed ("'quoted" read back as "quoted").
  - Numbers, booleans and blanks kept their native types and got no
    plain-text format.
  - A raw setValues() one row past the grid was ACCEPTED and the grid
    grew (4 to 5 rows): the platform copes by itself. The engine's own
    growth step also worked (grid 3 to 4).
  - A 50001-character string made setValues() fail with "Your input
    contains more than the maximum of 50000 characters in a single
    cell.", and the failed call still left a row behind (getLastRow()
    went from 2 to 3; the log does not say which cells landed). This
    file had no length check, so the failure surfaced mid-write.
  - Five consecutive appends landed on consecutive rows. Time per append
    with no contention: 554 to 929 ms over eight timed calls (the five
    13-string-cell appends: min 652, avg 778, max 929 ms), with no clear
    relation to the number of string cells.
  - Within ONE execution a second getScriptLock() object acquired the
    lock while the first still held it, so "released after success",
    "released after failure" and the lock-timeout path cannot be
    observed in a single execution (INCONCLUSIVE, INCONCLUSIVE,
    SKIPPED). Mutual exclusion between two overlapping executions, and
    flush-before-release, remain UNOBSERVED.

PROPOSED -- this file's own choices. P1 to P9 were not evidenced by
anything above when they were made; the 2026-11-03 observations bear on
P3, P6 and P7 and are the evidence for P10 and P11 (each says so).
Each is isolated (one constant or one private function) so it can be
changed without touching the rest. (P10 and P11 are one constant each
plus a few lines in _toCell_; P10 also adjusts the advice in the
message that _prepare_ throws.)
  P1  Public API is ONE function, append(tabName, record). It takes a
      tab name only, never a Spreadsheet ID: the Spreadsheet is always
      Config's, so a write to a Domain Spreadsheet is structurally
      impossible through this file. The one thing this cannot catch is
      EXEC_OS_SPREADSHEET_ID itself being pointed at a Domain
      Spreadsheet -- a Config/operator error, undetectable here without
      hard-coding Domain tab names (which would break schema-
      agnosticism and EP2: Personal Life OS owns those names).
  P2  Append-only: no update, upsert or delete. File_Map says
      "append/write", but the only real evidence is for appends (the
      two append-only logs, Reference creation). An update-by-key path
      -- Reference re-sync will eventually need one -- has no real
      caller yet, so it is deferred under EP3 to the checkpoint that
      has one.
  P3  LOCK_WAIT_MS = 10000. Not evidenced (the sibling's one concrete
      value is 2000 ms for a user-facing gate). Chosen to outlast a few
      queued writes, since one write makes several Sheet calls.
      [Observed 2026-11-03: one append took 554 to 929 ms with no
      contention, so 10000 ms covers about ten queued appends of that
      length. Behavior under contention is unobserved.]
  P4  Return value { tabName, rowNumber } -- the minimum a caller or a
      test needs in order to verify the write.
  P5  Generic validation only, no entity knowledge. tabName is a
      non-empty string; record is a plain object with at least one
      field; every record key matches a header EXACTLY (case-sensitive,
      no trimming); a header name the record uses is not duplicated on
      the tab; values are string / finite number / boolean / null /
      undefined (null and undefined become a blank cell); at least one
      value is non-blank. Anything else -- objects, arrays, Dates,
      NaN/Infinity, functions -- is rejected, not coerced: a caller that
      wants to store a payload serializes it itself (dates as ISO
      strings, payloads via JSON.stringify). This file does not pick a
      serialization for it.
  P6  Every non-empty string cell is written as plain text:
      setNumberFormat('@') on that one cell, then a single setValues
      for the row -- the mechanism Known Limitation 11 verified in the
      sibling. The choice is by JS value type, never by field name, so
      it needs no schema knowledge. Numbers, booleans and blanks keep
      their native types; a caller that wants a numeric cell must pass
      a number, not a numeric-looking string. Relevance here: a content
      hash from 14_Versioning.computeContentHash is unpadded lowercase
      hex and can be all digits; an ISO timestamp is date-shaped.
      That Execution's Spreadsheet re-types those exact shapes is NOT
      observed. Guessing which shapes are dangerous is the failure mode
      Known Limitation 11 documents, hence every non-empty string.
      [Updated 2026-11-03: now OBSERVED in Execution's own Spreadsheet,
      see above. The mechanism keeps every number-, date-, time- and
      hash-shaped string, but NOT a leading "=" or a leading apostrophe;
      P11 adds a prefix for those two.]
  P7  Defensive grid growth: if the target row is past getMaxRows(),
      insert the missing row(s) first, because a write past the grid may
      throw (unverified, see above). Costs nothing when there is room.
      [Observed 2026-11-03: the platform grows the grid by itself for a
      raw write one row past it, so this guard is not needed there. It
      stays: it works (gate group GR) and costs nothing when there is
      room. Whether to remove it (EP3) is the owner's call.]
  P8  No read-back after the write: it would add I/O to every append
      (EP3). The returned rowNumber lets a caller, or a real-GAS gate,
      verify.
  P9  Log hygiene: a failure logs the tab name and the field NAMES,
      never field values, because values can carry user-typed text.
  P10 Per-cell length guard (added 2026-11-03). A string whose WRITTEN
      length is over MAX_CELL_CHARS (50000) is rejected in the argument
      validation -- before the lock and before any Sheet call -- naming
      the field and the length, never the text (P9). Evidence: OBSERVED
      (above): the platform refuses a longer cell, but only after part
      of the row has landed, so checking first is the only way this file
      can avoid that partial row. The written length is one more for a
      string that gets the P11 apostrophe. Not observed: that exactly
      50000 is accepted (the gate probes 50001 only; the figure is the
      platform's own wording). Length here is JavaScript string length
      (UTF-16 units); the platform's counting unit is not known, so a
      string of characters outside the basic plane may be refused a
      little early, and a unit that counted more than this file does
      could let one through that the platform then refuses, with the
      partial row again. Any OTHER platform failure inside setValues()
      that lands part of a row is also still possible; see DOES NOT OWN.
  P11 Apostrophe prefix (added 2026-11-03). A string whose first
      character is "=" or an apostrophe is written with one apostrophe
      in front. Evidence: OBSERVED (above): with '@' set and one
      setValues(), a leading "=" is still read as a formula and a leading
      apostrophe is still consumed. NOT observed: that this prefix makes
      the platform keep such text as typed. It is the usual way to enter
      text that starts with "=" in Sheets and it fits the observed
      consumption of an apostrophe, but the next real run of the gate
      (group PT.A) is the test. If the prefix does not work, the
      fallback is to reject such strings. Chosen by the first character
      of the VALUE, never by field name or column, like P6. If the
      platform consumes the prefix, a reader gets the original text back.
      Not covered, and not probed: a string that starts with "+", "-" or
      "@" and goes on like an expression (the gate's probes there were
      "+3" and "-7", both kept as typed). If a later run shows one of
      those being evaluated, the first-character rule in
      _needsTextMarker_ is the one place to widen.

Write sequence (everything after step 3 runs inside the lock, and any
failure still releases it):
  1. validate the arguments (no Sheet, no lock), including the per-cell
     length limit (P10)
  2. read Config's Spreadsheet ID (fails fast if unset, before the lock)
  3. take the script lock
  4. open the Spreadsheet; find the tab (must already exist); read row
     1; resolve every record key to exactly one column or reject
  5. target row = getLastRow() + 1; grow the grid if that is past
     getMaxRows()
  6. '@' on each non-empty string cell of that row; ONE setValues for
     the whole row (a string that starts with "=" or an apostrophe goes
     in with one apostrophe in front, P11)
  7. SpreadsheetApp.flush(), then release the lock

DOES NOT OWN (so none of it is here): schema and headers (11_Schema.js
-- this file never creates a tab and never touches a header); field
meaning or which fields are required (each Engine); the event
vocabulary (13_EventDefinitions.js, checked by 16_EventLog.js before it
calls this); idempotency, de-duplication and retries (the caller: an
error AFTER the write, e.g. a failed flush, leaves the outcome
ambiguous, and this file is not idempotent); reads (no evidenced owner
yet -- 16_EventLog's "append/read" must settle where its read half
lives; this file exposes none, per EP3); atomicity across rows or tabs
(none exists on this platform); cleaning up a partly written row after
a platform failure inside setValues() (the gate saw one on 2026-11-03;
P10 removes that one cause; this file is append-only and deletes
nothing).

Depends on:  10_Config.js (Spreadsheet ID) and 60_Observability.js
              (AlertService, UCR3). NOT 11_Schema.js, 12_Identity.js,
              13_EventDefinitions.js or 14_Versioning.js.
Called by:   16_EventLog.js and the Runtime-layer Reference engine,
              once built (neither exists yet).
Writes a Sheet?        Yes -- the only file in the project that may.
              One row per call, only to a tab that already exists,
              only in Config's Spreadsheet.
Must use TruthEngine?  N/A -- this file IS TruthEngine.
Must use AlertService? Yes, on every failure path (UCR3). Nothing is
              logged on a clean success, matching the precedent in
              10/11/12/13. WARN is used once: releaseLock() failing
              after the write has already completed.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied,
matching the prior six files.
=====================================================================
*/

const TruthEngine = (function() {

  const MODULE = 'TruthEngine';

  // PROPOSED P3 -- see the file header.
  const LOCK_WAIT_MS = 10000;

  // PROPOSED P6. The sibling project verified this mechanism for
  // keeping a string a string; it is not yet verified in Execution's
  // own Spreadsheet.
  const PLAIN_TEXT_FORMAT = '@';

  // PROPOSED P10. The figure is the one the platform itself named when it
  // refused a longer cell (OBSERVED 2026-11-03: "more than the maximum of
  // 50000 characters in a single cell"). Exactly 50000 was not tried.
  const MAX_CELL_CHARS = 50000;

  // PROPOSED P11. The character put in front of a string that starts with
  // "=" or with this same character. Not yet shown to work on the real
  // platform; see the file header.
  const TEXT_MARKER = '\'';

  // A short, log-safe description of a value's type. Uses
  // Object.prototype.toString rather than instanceof so it also works
  // for values created in another JS realm (e.g. a Node vm sandbox).
  function _typeName_(value) {
    if (value === null) {
      return 'null';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (typeof value === 'object') {
      // '[object Date]' -> 'date', '[object Object]' -> 'object'
      return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
    }
    return typeof value;
  }

  function _isPlainObject_(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  function _quoteList_(names) {
    return names.map(function(name) { return '"' + name + '"'; }).join(', ');
  }

  // PROPOSED P11: true for a string that the platform would not keep as
  // typed even in a plain-text cell (OBSERVED 2026-11-03): one that starts
  // with "=" (read as a formula) or with the marker character itself (the
  // first one is consumed). Decided by the first character of the VALUE
  // only, never by field name or column. An empty string has no first
  // character and is never marked.
  function _needsTextMarker_(text) {
    const first = text.charAt(0);
    return first === '=' || first === TEXT_MARKER;
  }

  // Turns one caller-supplied value into { cell, protect } -- or
  // { problem } if it is not an accepted value (PROPOSED P5; for a string
  // that is too long, also tooLong: true, PROPOSED P10).
  // protect === true means "write this cell as plain text" (P6).
  function _toCell_(value) {
    if (value === null || value === undefined) {
      return { cell: '', protect: false };
    }
    if (typeof value === 'string') {
      // The length that matters is the one that will be written, so the
      // P11 marker counts. Only the length goes into the message, never
      // the text (P9).
      const marked = _needsTextMarker_(value);
      const writtenLength = value.length + (marked ? TEXT_MARKER.length : 0);
      if (writtenLength > MAX_CELL_CHARS) {
        return {
          problem: 'a string of ' + writtenLength + ' characters when written (one cell holds at most ' +
              MAX_CELL_CHARS + ')',
          tooLong: true
        };
      }
      if (marked) {
        return { cell: TEXT_MARKER + value, protect: true };
      }
      return { cell: value, protect: value !== '' };
    }
    if (typeof value === 'number') {
      return Number.isFinite(value)
          ? { cell: value, protect: false }
          : { problem: 'a non-finite number (' + String(value) + ')' };
    }
    if (typeof value === 'boolean') {
      return { cell: value, protect: false };
    }
    return { problem: 'unsupported type "' + _typeName_(value) + '"' };
  }

  // Pure argument validation: no Sheet, no lock. Returns
  // { fields, cells } where cells maps each field to its _toCell_ result.
  function _prepare_(tabName, record) {
    if (typeof tabName !== 'string' || tabName.trim() === '') {
      throw new Error('tabName must be a non-empty string, got ' +
          (typeof tabName === 'string' ? 'an empty or blank string' : _typeName_(tabName)));
    }
    if (!_isPlainObject_(record)) {
      throw new Error('record must be a plain object of {header name: value}, got ' +
          _typeName_(record));
    }
    const fields = Object.keys(record);
    if (fields.length === 0) {
      throw new Error('record has no fields; refusing to append an empty row');
    }

    // Null-prototype on purpose: a field literally named "__proto__"
    // (an own key, e.g. from JSON.parse) must be an ordinary entry,
    // not a write to the prototype.
    const cells = Object.create(null);
    const problems = [];
    let wrongType = false;
    let tooLong = false;
    let hasContent = false;
    fields.forEach(function(field) {
      const converted = _toCell_(record[field]);
      if (converted.problem) {
        problems.push('"' + field + '": ' + converted.problem);
        if (converted.tooLong) {
          tooLong = true;
        } else {
          wrongType = true;
        }
        return;
      }
      cells[field] = converted;
      if (converted.cell !== '') {
        hasContent = true;
      }
    });
    if (problems.length > 0) {
      // Each kind of problem gets only the advice that fits it.
      const advice = [];
      if (wrongType) {
        advice.push('Only string, finite number, boolean, null and undefined are accepted; ' +
            'serialize anything else (dates as ISO strings, payloads with JSON.stringify) before calling.');
      }
      if (tooLong) {
        advice.push('Nothing was written. Shorten the value, or keep the text elsewhere and store ' +
            'a reference to it.');
      }
      throw new Error('record has unsupported value(s) -- ' + problems.join('; ') + '. ' + advice.join(' '));
    }
    if (!hasContent) {
      // An all-blank row would not even count for getLastRow(), so the
      // "appended" row would not exist and the next append would land
      // on the same row. Refuse rather than return a fictitious rowNumber.
      throw new Error('record has no non-blank value; refusing to append an empty row');
    }
    return { fields: fields, cells: cells };
  }

  // header name -> array of 0-based column indexes. An array (not a
  // single index) so a duplicated header name is detectable.
  // Null-prototype so header names like "constructor" or "toString"
  // can never be answered from Object.prototype.
  function _indexHeaders_(headerRow) {
    const index = Object.create(null);
    headerRow.forEach(function(name, i) {
      if (typeof name !== 'string' || name === '') {
        return; // blank or non-text header cell: not addressable by name
      }
      if (!index[name]) {
        index[name] = [];
      }
      index[name].push(i);
    });
    return index;
  }

  // Maps every record field to exactly one column, or throws. Unknown
  // fields are rejected, never silently dropped (see OBSERVED above).
  function _resolveColumns_(tabName, fields, headerIndex) {
    const unknown = [];
    const ambiguous = [];
    const placements = [];
    fields.forEach(function(field) {
      const hits = headerIndex[field];
      if (!hits) {
        unknown.push(field);
      } else if (hits.length > 1) {
        ambiguous.push(field);
      } else {
        placements.push({ field: field, column: hits[0] });
      }
    });
    if (unknown.length > 0) {
      throw new Error('tab "' + tabName + '" has no column named ' + _quoteList_(unknown) +
          ' (names must match a header exactly, case-sensitive). Columns on this tab: ' +
          Object.keys(headerIndex).join(', '));
    }
    if (ambiguous.length > 0) {
      throw new Error('tab "' + tabName + '" has more than one column named ' +
          _quoteList_(ambiguous) + '; cannot tell which one to write');
    }
    return placements;
  }

  // Everything that touches the Sheet. Runs only while the lock is held.
  function _appendLocked_(spreadsheetId, tabName, prepared) {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(tabName);
    if (!sheet) {
      throw new Error('tab "' + tabName + '" does not exist in the Execution Spreadsheet; ' +
          'this file never creates a tab (that is 11_Schema.js\'s ensureTab)');
    }

    const numCols = sheet.getLastColumn();
    if (numCols < 1) {
      // getRange(1, 1, 1, 0) would throw a platform error; say what is wrong instead.
      throw new Error('tab "' + tabName + '" is empty (no header row); ' +
          'run 11_Schema.js\'s ensureTab first');
    }
    const headerIndex = _indexHeaders_(sheet.getRange(1, 1, 1, numCols).getValues()[0]);
    if (Object.keys(headerIndex).length === 0) {
      throw new Error('tab "' + tabName + '" has no named columns in row 1 (no header row); ' +
          'run 11_Schema.js\'s ensureTab first');
    }
    const placements = _resolveColumns_(tabName, prepared.fields, headerIndex);

    // Header-name-driven: no column number is hard-coded anywhere.
    const row = new Array(numCols).fill('');
    const plainTextColumns = [];
    placements.forEach(function(placement) {
      const converted = prepared.cells[placement.field];
      row[placement.column] = converted.cell;
      if (converted.protect) {
        plainTextColumns.push(placement.column);
      }
    });

    const targetRow = sheet.getLastRow() + 1;
    const maxRows = sheet.getMaxRows();
    if (targetRow > maxRows) {
      sheet.insertRowsAfter(maxRows, targetRow - maxRows); // PROPOSED P7
    }

    // PROPOSED P6: format first, then one setValues on the same row.
    // (appendRow() is deliberately not used -- see OBSERVED above.)
    plainTextColumns.forEach(function(column) {
      sheet.getRange(targetRow, column + 1).setNumberFormat(PLAIN_TEXT_FORMAT);
    });
    sheet.getRange(targetRow, 1, 1, numCols).setValues([row]);

    // Official docs: flush before releasing the lock, so the next lock
    // holder's getLastRow() sees this row.
    SpreadsheetApp.flush();

    return { tabName: tabName, rowNumber: targetRow };
  }

  function _acquireLock_() {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(LOCK_WAIT_MS);
    } catch (e) {
      throw new Error('could not acquire the script lock within ' + LOCK_WAIT_MS + ' ms: ' + e.message);
    }
    return lock;
  }

  // A failed release must not turn a finished append into a failure,
  // nor mask the real error from the locked section: the lock is also
  // released automatically when the execution ends (official docs).
  function _releaseLock_(lock, tabName) {
    try {
      lock.releaseLock();
    } catch (e) {
      AlertService.log('WARN', MODULE, 'append', { tabName: tabName },
          'releaseLock() failed after the append had already finished; ' +
          'the lock is released automatically when the execution ends: ' + e.message);
    }
  }

  // PROPOSED P9: tab name and field NAMES only, never values.
  function _logInput_(tabName, record) {
    return {
      tabName: typeof tabName === 'string' ? tabName : _typeName_(tabName),
      fieldNames: _isPlainObject_(record) ? Object.keys(record) : _typeName_(record)
    };
  }

  /**
   * Appends ONE row to a tab that already exists in Execution OS's own
   * Spreadsheet (the one Config points at). Locked, validated, and
   * schema-agnostic: it checks that every key in `record` is a header
   * on that tab, not what the fields mean.
   * @param {string} tabName An existing tab. Never created here.
   * @param {Object} record {header name: value}. Values may be string,
   *     finite number, boolean, null or undefined (the last two become
   *     a blank cell). Non-empty strings are stored as plain text, at
   *     most 50000 characters each (P10). A string that starts with "="
   *     or with an apostrophe is written with one apostrophe in front
   *     (P11); the platform is expected to consume it, so a reader gets
   *     the original text back.
   * @return {{tabName: string, rowNumber: number}} The 1-based sheet
   *     row that was written.
   * @throws {Error} (message already passed through AlertService) on
   *     invalid arguments (including a string over the cell limit,
   *     refused before anything is written), unknown/ambiguous columns,
   *     a missing tab or header, a lock timeout, or any Sheet/platform
   *     failure. After a failure that happens AFTER the write (e.g.
   *     flush), whether the row landed is not known to this file -- see
   *     DOES NOT OWN.
   */
  function append(tabName, record) {
    try {
      const prepared = _prepare_(tabName, record);
      const spreadsheetId = Config.getSpreadsheetId();
      const lock = _acquireLock_();
      try {
        return _appendLocked_(spreadsheetId, tabName, prepared);
      } finally {
        _releaseLock_(lock, tabName);
      }
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'append', _logInput_(tabName, record), e.message));
    }
  }

  return {
    append: append
  };

})();
