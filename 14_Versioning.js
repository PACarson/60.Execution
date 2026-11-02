/*
=====================================================================
EXECUTION OS — 14_Versioning.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        Two generic, caller-agnostic primitives: a stable
              content-fingerprint hash, and a timestamp comparison.
              Nothing else.
Built:       2026-10-05, sixth real runtime file, per this specific
              authorization (14_Versioning.js only).

GOVERNANCE SOURCE REVIEW, performed before writing any code: re-read
ADR-010 and Execution_OS_Architecture_v0.8.md S3.2 directly, not from
memory or a prior round's summary. Found something more specific and
more narrow than a general "versioning" concept:

  - S3.2's exact words for `snapshot_hash`: "Execution 本地计算的内容
    指纹（对 snapshot_* 字段取 hash），用于低成本判断'这次同步内容是
    否真的变了'" -- a content fingerprint taken ONLY over the
    snapshot_* fields, for ONE purpose: cheaply telling whether a
    re-sync's content actually changed. Not a general entity-
    versioning scheme.
  - ADR-010's Decision is explicit that the hash and the timestamp
    comparison are TWO SEPARATE mechanisms ("Execution 自己计算
    snapshot_hash + 用事件时间戳与 last_synced_at 比较") -- the
    timestamp is never folded into the hash. This file keeps that
    separation: computeContentHash() hashes exactly what the caller
    passes it, nothing more, so a dynamic timestamp never
    contaminates a content hash unless the caller mistakenly includes
    one in the fields object -- which is the caller's choice to avoid,
    not something this file silently adds or strips.
  - Line 728 of the Architecture doc explicitly lists an earlier idea
    -- a dedicated "Reference 版本追踪" (version-tracking) mechanism
    -- as SUPERSEDED, replaced by exactly this simpler snapshot_hash +
    timestamp approach. There was never a request for a bigger
    versioning system; the opposite was explicitly decided.

Given that, and per this authorization's explicit instruction not to
design without a real requirement ("没有真实 requirement 就不要设
计"): a prior round's own proposal to also give this file a generic
"schema-version stamp" is NOT carried forward here. That idea came
from this project's own earlier speculation during the Foundation
Dependency Reconciliation, not from any ADR or Architecture-doc
evidence -- nothing found this checkpoint supports it, so it is left
out rather than implemented on the strength of an earlier guess.
Concurrency control is DEFERRED, unchanged from the Foundation
Dependency Reconciliation's own conclusion and re-confirmed by this
review -- no new evidence for it was found either.

This file does NOT hardcode "snapshot_title/status/due" or anything
else Reference-specific. The caller (eventually 17_ReferenceBase.js /
26_ReferenceEngine.js) decides which fields matter for its own
content-hash purpose and passes them in; this file only knows how to
hash "whatever object you gave me," generically -- consistent with
not owning entity persistence or Reference's own field knowledge.

Hash design (Section 8 of the authorization, answered explicitly):
  1. Input: any plain object the caller passes to computeContentHash.
     Not Reference-specific; works for any field set.
  2. Canonicalization: keys are sorted alphabetically before hashing,
     so {a:1,b:2} and {b:2,a:1} -- the same logical content, built in
     a different order -- hash identically. Values are stringified
     individually rather than via JSON.stringify, specifically to
     avoid JSON.stringify's own undefined-dropping behavior (point 5
     below).
  3. Same logical input -> same hash: yes, guaranteed by the sort.
  4. Key ordering: neutralized by the sort in (2).
  5. undefined / null / empty: each gets its own explicit marker
     (\u0002UNDEFINED\u0002 / \u0002NULL\u0002) rather than being
     silently dropped. This matters because plain JSON.stringify
     SILENTLY OMITS object properties whose value is undefined --
     {a: undefined, b: 1} and {b: 1} would otherwise hash identically
     even though they are different inputs (one explicitly has a key
     the other lacks entirely). An empty object hashes to a fixed,
     distinct value (the hash of an empty canonical string).
  6. Timestamp as hash input: never added automatically -- see the
     governance review above. If a caller passes a timestamp field
     in on purpose, that is the caller's decision, not this file's.

This is a non-cryptographic hash (FNV-1a, 32-bit) -- adequate and
honestly scoped for "cheaply tell whether content changed," the
actual stated purpose, not for security or guaranteed collision-
freedom. A rare FNV-1a collision between two DIFFERENT contents is a
known, accepted property of this algorithm; ADR-010's own design
already treats this as a low-cost heuristic, not a correctness
guarantee, so this file doesn't pretend otherwise.

Ownership boundaries (Section 5), restated as implemented: Version
!= Identity (no ID generation anywhere here); Version != Event (no
event creation); Hash != Truth (computeContentHash returns a value
for the CALLER to compare and store if it wants to -- this file
persists nothing and is not consulted as an authority on any
entity's real state).

Depends on:  60_Observability.js (AlertService, UCR3) only.
Called by:   17_ReferenceBase.js / 26_ReferenceEngine.js, once built,
              for ADR-010's snapshot_hash and last_synced_at
              comparison. Potentially other Engines later, for the
              same two generic primitives, on whatever fields they
              choose.
Writes a Sheet?        No.
Must use TruthEngine?  No.
Must use AlertService? Structurally yes (try/catch per UCR3); a
              valid call never reaches the catch block.
Does NOT use:  SpreadsheetApp, PropertiesService, LockService,
              EventLog, TruthEngine, Schema, Identity -- none of
              these are needed for either primitive, and none are
              referenced anywhere in this file.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied,
matching the prior five files. No Google-runtime global is
referenced anywhere in this file.
=====================================================================
*/

const Versioning = (function() {

  const MODULE = 'Versioning';

  const FNV_OFFSET_BASIS = 0x811c9dc5;
  const FNV_PRIME = 0x01000193;

  function _fnv1a_(str) {
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
    // >>> 0 forces an unsigned 32-bit reading before the hex
    // conversion; toString(16) alone could otherwise print a
    // leading '-' for a negative-looking signed value.
    return (hash >>> 0).toString(16);
  }

  function _encodeValue_(value) {
    if (value === undefined) {
      return '\u0002UNDEFINED\u0002';
    }
    if (value === null) {
      return '\u0002NULL\u0002';
    }
    return String(value);
  }

  function _canonicalize_(fields) {
    if (fields === null || typeof fields !== 'object' || Array.isArray(fields)) {
      throw new Error('computeContentHash requires a plain object, got ' +
          (fields === null ? 'null' : typeof fields));
    }
    return Object.keys(fields).sort().map(function(key) {
      return key + '\u0001' + _encodeValue_(fields[key]);
    }).join('\u0003');
  }

  function _toEpochMillis_(timestamp) {
    // Duck-typed on purpose, not "instanceof Date": a strict
    // instanceof check fails for a Date constructed in a different
    // JS realm than this code is running in (e.g. across a vm
    // sandbox boundary, which is exactly how this was caught -- the
    // test harness builds its sample Dates in the host realm, this
    // file runs in a loaded-script realm). Checking for a getTime
    // method is the more robust test either way: it accepts any
    // real Date regardless of which realm constructed it, and any
    // future Date-like object with the same interface, without
    // weakening what counts as "a Date" in the cases that matter.
    if (timestamp && typeof timestamp.getTime === 'function') {
      return timestamp.getTime();
    }
    if (typeof timestamp === 'number') {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      const parsed = Date.parse(timestamp);
      if (isNaN(parsed)) {
        throw new Error('Could not parse timestamp string: ' + JSON.stringify(timestamp));
      }
      return parsed;
    }
    throw new Error('Unsupported timestamp type: ' + typeof timestamp +
        ' (expected a Date, an epoch-millisecond number, or a parseable string)');
  }

  /**
   * A stable content fingerprint over exactly the fields given --
   * never anything added automatically (no timestamp, no identity).
   * Same logical content, any key order, same hash. Different
   * content (including undefined/null vs. a missing key) -- almost
   * certainly a different hash, with FNV-1a's ordinary, accepted
   * non-cryptographic collision odds.
   * @param {!Object} fields A plain object; arrays and null are
   *     rejected since "content fingerprint of an array" isn't a
   *     need this file has real evidence for yet.
   * @return {string} An 8-or-fewer-character lowercase hex string.
   */
  function computeContentHash(fields) {
    try {
      return _fnv1a_(_canonicalize_(fields));
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'computeContentHash', { fields: fields }, e.message));
    }
  }

  /**
   * Whether timestampA is strictly later than timestampB, per
   * ADR-010's "discard events timestamped before last_synced_at"
   * rule. Accepts a Date, an epoch-millisecond number, or any
   * string Date.parse() can read -- callers aren't required to
   * normalize their own representation first.
   * @param {(Date|number|string)} timestampA
   * @param {(Date|number|string)} timestampB
   * @return {boolean}
   */
  function isNewerThan(timestampA, timestampB) {
    try {
      return _toEpochMillis_(timestampA) > _toEpochMillis_(timestampB);
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'isNewerThan',
          { timestampA: timestampA, timestampB: timestampB }, e.message));
    }
  }

  return {
    computeContentHash: computeContentHash,
    isNewerThan: isNewerThan
  };

})();
