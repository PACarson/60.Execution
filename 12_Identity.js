/*
=====================================================================
EXECUTION OS — 12_Identity.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        Canonical ID generation only. Stateless by design.
Built:       2026-09-27 (approx.), fourth real runtime file, per
              this specific authorization (12_Identity.js only).

SOURCE-OF-TRUTH CHECK PERFORMED BEFORE WRITING ANY CODE (per this
authorization's own instruction not to guess a format from memory):
grepped 00_File_Map.js, 00_Project_State.js, and
Execution_OS_Architecture_v0.8.md for an existing ID-format lock.
Result: none exists. The Architecture doc's own S3.2 calls
`reference_id` "Execution 生成的稳定 ID" -- a stable, Execution-
generated ID -- but never specifies its string format. A prefix
scheme (GOAL-/XPRJ-/REF-/WAIT-/VIS-) was floated as a PROPOSAL in
the 2026-09-12 Foundation Dependency Reconciliation, but no
subsequent authorization ever accepted it -- it is not governance
evidence, just an earlier suggestion. This file therefore does not
hardcode any entity-specific prefix; see "Public API" below for what
that means concretely.

Stateless, by design, per this authorization:
  - No Sheet-backed counter, no PropertiesService counter, no
    LockService, no global mutable sequence, no cross-file ID
    registry, no persistence of any generated ID. This file
    generates an ID and returns it; it never remembers having done
    so.
  - Format: {PREFIX}-{base36 timestamp}-{6-char random suffix}.
    Deterministic prefix (caller-supplied) + timestamp component +
    a random suffix wide enough that same-millisecond rapid calls
    still don't collide in practice (36^6 ~= 2.18 billion
    combinations per millisecond bucket) -- collision-resistant
    without any shared counter to coordinate.
  - Deliberately uses only Date.now() and Math.random() -- no
    Utilities.getUuid() or any other GAS-specific global. This
    isn't just "avoids the explicitly excluded APIs" (SpreadsheetApp/
    PropertiesService/LockService/TruthEngine/EventLog/Schema) --
    it means this file references NO platform-specific global at
    all, so "testable without the Google runtime" is true by
    construction, not just by omission.

Ownership:
  OWNS:      canonical ID generation, ID format construction, prefix
             format validation (structural only -- see below).
  DOES NOT OWN: entity records, Spreadsheet writes, event
             persistence, schema, versioning, business rules,
             planning, AI, Telegram.

Public API is deliberately ONE function. No known-entity-prefix
registry is built here, on purpose: Vision/Goal/Execution Project/
Waiting/Reference don't have Engines yet (Slice 1+), and hardcoding
their prefixes now would be exactly the speculative-schema mistake
already avoided in 11_Schema.js, applied to a different file.
Instead, generateId(prefix) validates the prefix's STRUCTURE only
(non-empty, a plausible short uppercase code) -- not membership in a
business-entity list that doesn't exist yet. Whichever Engine
eventually owns GOAL/XPRJ/etc. decides its own prefix and calls this
function with it; this file doesn't need to know what those prefixes
will be.

Depends on:  nothing. Not even 60_Observability.js is a hard
             dependency for the success path (see UCR3 note below) --
             it's only called on the one failure path this file has.
Called by:   every future Engine, once it exists, that needs a new
             entity ID.
Writes a Sheet?        No.
Must use TruthEngine?  No.
Must use AlertService? On the failure path only -- see below.

UCR3 note, decided deliberately rather than assumed: UCR3's actual
text is "every public function wraps in try/catch -> AlertService.log
-> user-facing error message" -- it describes the CATCH-block
behavior, not a requirement to log on every success. The established
precedent in 10_Config.js/11_Schema.js is the same: log on error
always, log WARN on a notable-but-recoverable fallback, log nothing
on a clean, routine success. generateId() is expected to be called
often (every entity creation, once Engines exist) -- logging INFO on
every single successful call would be noisy and inconsistent with
that precedent, not a correct application of UCR3. So: try/catch is
present (structurally satisfying UCR3), AlertService.log('ERROR', ...)
fires only when the prefix is rejected; nothing is logged on success.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied,
matching the prior three files.
=====================================================================
*/

const Identity = (function() {

  const MODULE = 'Identity';

  // Structural validation only -- not a business-entity registry.
  // 1-10 uppercase letters/digits, must start with a letter. Chosen
  // to comfortably fit every prefix shape seen anywhere in this
  // project's own discussion (GOAL, XPRJ, REF, WAIT, VIS, TSK) and
  // in the wider ecosystem's TSK-xxx precedent, without asserting
  // any of those specific strings are the real, final choice.
  const PREFIX_PATTERN = /^[A-Z][A-Z0-9]{0,9}$/;

  const RANDOM_SUFFIX_LENGTH = 6;
  const RANDOM_SUFFIX_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

  function _isValidPrefix_(prefix) {
    return typeof prefix === 'string' && PREFIX_PATTERN.test(prefix);
  }

  function _timestampComponent_() {
    return Date.now().toString(36);
  }

  function _randomSuffix_() {
    let result = '';
    for (let i = 0; i < RANDOM_SUFFIX_LENGTH; i++) {
      result += RANDOM_SUFFIX_ALPHABET.charAt(
          Math.floor(Math.random() * RANDOM_SUFFIX_ALPHABET.length));
    }
    return result;
  }

  /**
   * Generates a new canonical ID for the given prefix. Stateless --
   * calling this twice with the same prefix never coordinates with
   * itself; collision resistance comes from the timestamp + random
   * suffix combination, not from tracking what's been issued before.
   * @param {string} prefix A short, structurally-valid prefix
   *     (1-10 uppercase letters/digits, starting with a letter).
   *     This file does not maintain or check a list of "real"
   *     entity prefixes -- that decision belongs to whichever
   *     Engine calls this.
   * @return {string} e.g. "GOAL-M4F3A1-x7q2p9"
   */
  function generateId(prefix) {
    try {
      if (!_isValidPrefix_(prefix)) {
        throw new Error('Invalid prefix: expected 1-10 uppercase letters/digits ' +
            'starting with a letter, got ' + JSON.stringify(prefix));
      }
      return prefix + '-' + _timestampComponent_() + '-' + _randomSuffix_();
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'generateId', { prefix: prefix }, e.message));
    }
  }

  return {
    generateId: generateId
  };

})();
