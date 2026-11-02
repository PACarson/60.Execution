/*
=====================================================================
EXECUTION OS — 11_Schema.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        Bootstrap / structural schema only — opening the
              independent Spreadsheet (ADR-012), creating tabs that
              don't exist yet, and verifying/extending headers on
              tabs that do. Idempotent by design: safe to run any
              number of times.
Built:       2026-09-16, third real runtime file, per this specific
              authorization (11_Schema.js only).

NO TruthEngine dependency, by design, per the Foundation Dependency
Reconciliation: this file creates Sheet STRUCTURE (insertSheet,
header rows). It never appends a data row — that's UCR6/TruthEngine's
job, owned by whichever Engine actually persists an entity or event.
Schema and TruthEngine are siblings under Config, not each other's
dependents; the only relationship between them is bootstrap
sequencing (Schema's tab-creation happens before any Engine's first
real write), not a code-level call.

NO SPECULATIVE SCHEMA: the only schema this file hardcodes is
Execution_References, because ADR-008/010 already locked its exact
field set (Architecture doc S3.2, re-verified against the primary
text this checkpoint, not from memory — see the field list below).
Every other entity (Vision, Goal, Execution Project, Waiting, Review,
Execution Event) is owned by its own Engine, which hasn't been
authorized yet — this file does not invent their business fields.
Instead it exposes a generic ensureTab(tabName, headers) any future
Engine can call with its OWN schema once it exists, so no single
file ends up centrally dictating every entity's fields.

Depends on:  10_Config.js (Spreadsheet ID), 60_Observability.js
              (AlertService, UCR3).
Called by:   Foundation bootstrap; later, any Engine that wants to
              verify/create its own tab via ensureTab().
Writes a Sheet?        Yes — structure only (insertSheet, header
              rows). Never a data row.
Must use TruthEngine?  No — see above.
Must use AlertService? Yes — every public function below.

Schema-mismatch policy (Unexpected Schema, per the authorization):
  - Missing tab               -> CREATE, write full expected headers.
  - Existing tab, no headers  -> WRITE headers (same as missing).
  - Existing headers are an exact prefix of expected, nothing extra
    beyond that                -> VERIFIED, no change.
  - Existing headers match expected at every shared position, but
    expected has MORE trailing headers than actual has             -> SAFE
    ADDITIVE REPAIR: append only the missing trailing headers,
    matching UEF's own Schema Contract rule (append-only, no column
    reuse, blank <> 0 on old rows for the new columns). Never
    reorders or rewrites an existing column.
  - Any existing header that doesn't match what's expected at that
    same position               -> HARD STOP. Throws with the exact
    column/position/value mismatch. No destructive migration is
    designed or attempted — this needs a human decision.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied
throughout, matching the prior two files.
=====================================================================
*/

const Schema = (function() {

  const MODULE = 'Schema';

  // The one schema this file actually knows, because it's already
  // locked by governance (ADR-008/010), re-verified against
  // Execution_OS_Architecture_v0.8.md S3.2 directly this checkpoint:
  // reference_id, source_domain, source_entity_type, source_entity_id,
  // snapshot_title, snapshot_status, snapshot_due, snapshot_hash,
  // execution_priority, ai_recommended_priority, execution_state,
  // created_at, last_synced_at -- in that order, matching the
  // Architecture doc's own table.
  const KNOWN_SCHEMAS = Object.freeze({
    Execution_References: Object.freeze([
      'reference_id', 'source_domain', 'source_entity_type', 'source_entity_id',
      'snapshot_title', 'snapshot_status', 'snapshot_due', 'snapshot_hash',
      'execution_priority', 'ai_recommended_priority', 'execution_state',
      'created_at', 'last_synced_at'
    ])
  });

  function _openSpreadsheet_() {
    return SpreadsheetApp.openById(Config.getSpreadsheetId());
  }

  function _readHeaderRow_(sheet) {
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) {
      return [];
    }
    return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  function _writeHeaderRow_(sheet, headers, startColumn) {
    sheet.getRange(1, startColumn || 1, 1, headers.length).setValues([headers]);
  }

  // Compares what's actually on the sheet against what's expected.
  // Pure function, no Sheet access -- kept separate from ensureTab
  // so the decision logic itself is directly testable without a
  // Spreadsheet at all.
  function _compareHeaders_(actualHeaders, expectedHeaders) {
    const sharedLength = Math.min(actualHeaders.length, expectedHeaders.length);
    for (let i = 0; i < sharedLength; i++) {
      if (actualHeaders[i] !== expectedHeaders[i]) {
        return {
          status: 'MISMATCH',
          conflictAt: i,
          actualValue: actualHeaders[i],
          expectedValue: expectedHeaders[i],
          missing: []
        };
      }
    }
    if (actualHeaders.length >= expectedHeaders.length) {
      return { status: 'MATCH', conflictAt: null, missing: [] };
    }
    return {
      status: 'EXTENDABLE',
      conflictAt: null,
      missing: expectedHeaders.slice(actualHeaders.length)
    };
  }

  /**
   * Idempotently ensures a tab exists with at least the given
   * headers, following the schema-mismatch policy documented above.
   * Any Engine may call this with its own tab name and header list
   * once it has one -- this file does not decide what those are for
   * anything beyond Execution_References.
   * @param {string} tabName
   * @param {!Array<string>} expectedHeaders
   * @return {{tabName: string, action: string, added: (Array|undefined)}}
   */
  function ensureTab(tabName, expectedHeaders) {
    try {
      if (!tabName) {
        throw new Error('tabName is required');
      }
      if (!Array.isArray(expectedHeaders) || expectedHeaders.length === 0) {
        throw new Error('expectedHeaders must be a non-empty array');
      }

      const spreadsheet = _openSpreadsheet_();
      let sheet = spreadsheet.getSheetByName(tabName);

      if (!sheet) {
        sheet = spreadsheet.insertSheet(tabName);
        _writeHeaderRow_(sheet, expectedHeaders, 1);
        AlertService.log('INFO', MODULE, 'ensureTab', { tabName: tabName },
            'Created missing tab with ' + expectedHeaders.length + ' header(s)');
        return { tabName: tabName, action: 'CREATED' };
      }

      const actualHeaders = _readHeaderRow_(sheet);

      if (actualHeaders.length === 0) {
        _writeHeaderRow_(sheet, expectedHeaders, 1);
        AlertService.log('INFO', MODULE, 'ensureTab', { tabName: tabName },
            'Existing tab had no header row; wrote ' + expectedHeaders.length + ' header(s)');
        return { tabName: tabName, action: 'HEADERS_WRITTEN' };
      }

      const comparison = _compareHeaders_(actualHeaders, expectedHeaders);

      if (comparison.status === 'MATCH') {
        return { tabName: tabName, action: 'VERIFIED' };
      }

      if (comparison.status === 'EXTENDABLE') {
        const startColumn = actualHeaders.length + 1;
        _writeHeaderRow_(sheet, comparison.missing, startColumn);
        AlertService.log('WARN', MODULE, 'ensureTab',
            { tabName: tabName, added: comparison.missing },
            'Tab was missing ' + comparison.missing.length +
            ' trailing header(s); appended additively, existing columns untouched');
        return { tabName: tabName, action: 'HEADERS_EXTENDED', added: comparison.missing };
      }

      // MISMATCH: hard stop. Nothing is written. No destructive
      // repair is attempted -- this is exactly the case the
      // authorization says needs a human decision, not automation.
      throw new Error('Tab "' + tabName + '" column ' + (comparison.conflictAt + 1) +
          ' is "' + comparison.actualValue + '", expected "' + comparison.expectedValue +
          '" -- refusing to modify an existing column');
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'ensureTab', { tabName: tabName }, e.message));
    }
  }

  /**
   * Runs ensureTab for every schema this file actually knows about
   * (currently just Execution_References). Does not invent schemas
   * for anything else -- see file header, No Speculative Schema.
   * @return {!Array<Object>}
   */
  function ensureKnownSchemas() {
    const schemaNames = Object.keys(KNOWN_SCHEMAS);
    const results = [];
    for (let i = 0; i < schemaNames.length; i++) {
      // ensureTab already logs and sanitizes on failure; letting its
      // error propagate here avoids double-logging the same failure
      // under two different function names.
      results.push(ensureTab(schemaNames[i], KNOWN_SCHEMAS[schemaNames[i]]));
    }
    return results;
  }

  /**
   * Read-only check -- reports whether a tab's headers match, but
   * never writes anything. For callers that want to inspect state
   * without triggering ensureTab's repair behavior.
   * @param {string} tabName
   * @param {!Array<string>} expectedHeaders
   * @return {{exists: boolean, matches: boolean, actualHeaders: Array}}
   */
  function verifyTabHeaders(tabName, expectedHeaders) {
    try {
      const spreadsheet = _openSpreadsheet_();
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return { exists: false, matches: false, actualHeaders: [] };
      }
      const actualHeaders = _readHeaderRow_(sheet);
      const comparison = _compareHeaders_(actualHeaders, expectedHeaders);
      return {
        exists: true,
        matches: comparison.status === 'MATCH',
        actualHeaders: actualHeaders
      };
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'verifyTabHeaders', { tabName: tabName }, e.message));
    }
  }

  return {
    KNOWN_SCHEMAS: KNOWN_SCHEMAS,
    ensureTab: ensureTab,
    ensureKnownSchemas: ensureKnownSchemas,
    verifyTabHeaders: verifyTabHeaders
  };

})();
