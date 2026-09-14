/*
=====================================================================
EXECUTION OS — 60_Observability.js
=====================================================================
Layer:       Cross-Cutting (60-69), per 00_File_Map.js
Owns:        AlertService — the UCR3 logging contract only.
Built:       2026-09-12, first real runtime file in this project.
             Chronologically first in Slice 0 (per the Foundation
             Dependency Reconciliation): every other Foundation file
             calls AlertService.log() from its own first public
             function, so this has to exist before any of them,
             regardless of its "60" category number. Not a
             renumbering — file stays owned at 60 in 00_File_Map.js.

Scope (per the explicit 2026-09-12 authorization — do not expand):
  IN:  the single UCR3 contract, AlertService.log(level, module,
       func, input, msg), returning a user-facing message string.
  OUT: telemetry framework, metrics platform, cost tracking, tracing
       framework, external logging service, AI audit infrastructure.
       None of these have any evidence of being needed yet — adding
       them now would be exactly the speculative build-out UEF's
       EP3 (anti-premature-engineering) and this session's own
       instructions both rule out.

Depends on: nothing (see Foundation Dependency Reconciliation —
            confirmed zero-dependency, alongside 10_Config.js).
Called by:  every other file in this project, from Slice 0 onward.
Writes a Sheet?      No.
Must use TruthEngine? No — not a Sheet-write concern.
Must use AlertService? N/A — this file IS AlertService. Applying
            UCR3 reflexively to log() itself would be circular (the
            error handler calling itself on its own failure), so
            log()'s own body is written to be robust by construction
            instead — see _safeStringify_ below for the one place
            that's actually load-bearing (JSON.stringify throws on
            circular objects, which is a real, common failure mode,
            not a speculative one).

UCR1 (IIFE module pattern) and UCR2 (private functions prefixed `_`)
applied throughout.
=====================================================================
*/

const AlertService = (function() {

  // Public constant — the only three levels UCR3's contract needs.
  // Not user-configurable; adding more without evidence of a real
  // need would be scope creep on this file's one job.
  const LEVELS = Object.freeze({
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
  });

  function _isValidLevel_(level) {
    return level === LEVELS.INFO || level === LEVELS.WARN || level === LEVELS.ERROR;
  }

  // JSON.stringify throws on circular references and on some
  // special values (e.g. BigInt) — a real failure mode for an
  // arbitrary "input" argument, not a hypothetical one. This is the
  // one piece of defensive coding in this file that has a concrete
  // justification; nothing else here is guarded beyond that.
  function _safeStringify_(value) {
    if (value === undefined) {
      return 'undefined';
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }

  function _timestamp_() {
    return new Date().toISOString();
  }

  // Full, unredacted line for the Apps Script execution log —
  // this is the debugging-facing side of the contract.
  function _formatLogLine_(level, module, func, input, msg) {
    return '[' + _timestamp_() + '] [' + level + '] ' +
        module + '.' + func +
        ' | input=' + _safeStringify_(input) +
        ' | msg=' + msg;
  }

  // The sanitized, caller-facing side of the contract. No attempt
  // at deep redaction — there is no evidence yet that "msg" carries
  // anything sensitive, and building a redaction system against a
  // problem that hasn't been observed would itself be speculative.
  // What this DOES guarantee: a consistent, module-attributed shape
  // for ERROR, and the message passed through unchanged for
  // INFO/WARN, which are not error-reporting cases.
  function _userFacingMessage_(level, module, msg) {
    if (level === LEVELS.ERROR) {
      return module + ': ' + msg;
    }
    return msg;
  }

  /**
   * AlertService.log — the UCR3 contract.
   * @param {string} level  One of LEVELS.INFO / LEVELS.WARN / LEVELS.ERROR.
   *                        An invalid value is treated as ERROR rather
   *                        than thrown on, since a logging call that
   *                        itself throws would defeat its own purpose.
   * @param {string} module The calling file's module name, e.g. "Config".
   * @param {string} func   The calling public function's name.
   * @param {*} input       Whatever was passed into the function that
   *                        failed — for debugging context. May be
   *                        undefined.
   * @param {string} msg    The error/info description.
   * @return {string} A user-facing message the caller can surface
   *                  (e.g. in a Telegram reply, or as a thrown
   *                  Error's message).
   */
  function log(level, module, func, input, msg) {
    const safeLevel = _isValidLevel_(level) ? level : LEVELS.ERROR;
    const safeModule = module ? String(module) : 'UnknownModule';
    const safeFunc = func ? String(func) : 'unknownFunction';
    const safeMsg = msg !== undefined && msg !== null ? String(msg) : '(no message)';

    Logger.log(_formatLogLine_(safeLevel, safeModule, safeFunc, input, safeMsg));

    return _userFacingMessage_(safeLevel, safeModule, safeMsg);
  }

  return {
    LEVELS: LEVELS,
    log: log
  };

})();
