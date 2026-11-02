/*
=====================================================================
EXECUTION OS — 13_EventDefinitions.js
=====================================================================
Layer:       Foundation (10-19), per 00_File_Map.js
Owns:        The legal Execution Event vocabulary query only. Does
              NOT own event persistence (16_EventLog.js's job), event
              creation, payload validation, replay, or migration.
Built:       2026-10-04, fifth real runtime file, per this specific
              authorization (13_EventDefinitions.js only).

GOVERNANCE SOURCE REVIEW, performed before writing any code (per this
authorization's explicit instruction not to start from a prior chat
summary or memory): re-read Execution_OS_Architecture_v0.8.md S2.4 and
Flows B/E/G directly, and grepped 00_ADR_Log.js for any ADR that locks
an event vocabulary -- none exists. No ADR has ever formally Accepted
a specific set of Execution Event type strings. What exists is textual
precedent in the Architecture doc, and that precedent is NOT uniform
in strength -- the four known strings split into two real tiers:

  CONFIRMED (named in S2.4's disambiguation list AND in a definite,
  unhedged Flow description):
    - goal.created              (S2.4 list + Flow B: ".. -> 发布
      Execution Event `goal.created`" -- stated as what the flow
      does, no hedge word)
    - review.completed          (S2.4 list + Flow E: "..落定为正式
      Review 记录 + 发布 `review.completed` 事件" -- same, no hedge)

  OBSERVED (weaker evidence -- named once, or named only inside an
  explicit hedge):
    - execution_project.status_changed   (S2.4 list only; no
      corroborating Flow description found anywhere in the doc)
    - execution.reference_completed      (Flow G: "Execution 发布
      自己的 Execution Event（**如** `execution.reference_completed`
      ..)" -- the word "如" (e.g./such as) is the Architecture doc's
      OWN hedge, explicitly signalling this string is illustrative,
      not a committed name. Important nuance: the underlying
      MECHANISM this would represent -- Execution publishes an event
      when a Reference is marked complete, Domain decides whether to
      act on it -- IS Accepted, as ADR-007. ADR-007's own Decision
      text names "an Execution Event" generically; it does not commit
      to this specific string. So the mechanism is Accepted; this
      exact spelling of its name is not.)

Per this authorization's explicit instruction not to invent
completeness ("不要为了让 registry 看起来完整而创造未来事件"), this
file does NOT silently promote the OBSERVED pair to the same status
as the CONFIRMED pair, and does NOT invent any event beyond these
four real, found strings -- e.g. the extensions this project's own
Implementation Master Plan proposed in an earlier round
(execution_project.created/started/progressed/cancelled/blocked,
waiting.created/resolved) are NOT included here; those were always
explicitly Proposed, never Accepted, and adding them now -- even
though they follow the same naming convention -- would be exactly
the "look complete" overreach this authorization warns against.

Public contract: isLegalEventType(eventType) answers the governance-
facing question "has this type passed the CONFIRMED bar" -- true only
for the two CONFIRMED entries. It is deliberately NOT "is this string
known to this file at all" -- an OBSERVED entry is real, found
evidence, but this file does not have the authority to decide it is
governance-legal on that evidence alone. getEvidence(eventType)
exposes WHY, for exactly this kind of reasoning to stay inspectable
in code rather than living only in this comment: it returns
EVIDENCE.CONFIRMED / EVIDENCE.OBSERVED / null (not found at all),
never collapsing the distinction into a single boolean. Both
functions are read-only queries against a frozen registry; nothing
here can register, mutate, replay, or persist an event.

Per UEF v1.12's real Event Contract rule (S3, re-read this
checkpoint): event-type values are an append-only contract, and a
retired one is marked removed rather than deleted from the record.
Nothing is being retired today, but KNOWN_EVENTS's shape (an object
per event, not a bare string) is chosen so a future status such as
'REMOVED' has somewhere to go without restructuring the registry.

Depends on:  60_Observability.js (AlertService, UCR3) only.
Called by:   16_EventLog.js, once built, to validate an event type
              before writing it.
Writes a Sheet?        No.
Must use TruthEngine?  No.
Must use AlertService? Structurally yes (try/catch per UCR3), though
              neither function's normal path -- including a "no, not
              found" answer -- is itself an error; AlertService only
              fires if something genuinely unexpected happens.

UCR1 (IIFE) and UCR2 (private functions prefixed `_`) applied,
matching the prior four files. No Google-runtime global is
referenced anywhere in this file.
=====================================================================
*/

const EventDefinitions = (function() {

  const MODULE = 'EventDefinitions';

  const EVIDENCE = Object.freeze({
    CONFIRMED: 'CONFIRMED',
    OBSERVED: 'OBSERVED'
  });

  const KNOWN_EVENTS = Object.freeze({
    'goal.created': Object.freeze({
      evidence: EVIDENCE.CONFIRMED,
      source: 'Architecture S2.4 list + Flow B (definite usage, no hedge)'
    }),
    'review.completed': Object.freeze({
      evidence: EVIDENCE.CONFIRMED,
      source: 'Architecture S2.4 list + Flow E (definite usage, no hedge)'
    }),
    'execution_project.status_changed': Object.freeze({
      evidence: EVIDENCE.OBSERVED,
      source: 'Architecture S2.4 list only; no corroborating Flow found'
    }),
    'execution.reference_completed': Object.freeze({
      evidence: EVIDENCE.OBSERVED,
      source: 'Architecture Flow G, explicitly hedged with "\u5982" (e.g.) -- ' +
          'the underlying publish-on-completion mechanism is ADR-007-Accepted, ' +
          'this exact string is the doc\'s own illustrative example of it, not a locked name'
    })
  });

  /**
   * Whether eventType has passed the CONFIRMED evidentiary bar --
   * the governance-facing "is this legal" question. An OBSERVED
   * entry, or any string not in KNOWN_EVENTS at all, both answer
   * false here; use getEvidence() to tell those two apart.
   * @param {*} eventType
   * @return {boolean}
   */
  function isLegalEventType(eventType) {
    try {
      return typeof eventType === 'string' &&
          Object.prototype.hasOwnProperty.call(KNOWN_EVENTS, eventType) &&
          KNOWN_EVENTS[eventType].evidence === EVIDENCE.CONFIRMED;
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'isLegalEventType', { eventType: eventType }, e.message));
    }
  }

  /**
   * What this file actually knows about eventType, without
   * collapsing CONFIRMED and OBSERVED into the same answer.
   * @param {*} eventType
   * @return {?string} EVIDENCE.CONFIRMED, EVIDENCE.OBSERVED, or null
   *     if eventType isn't in KNOWN_EVENTS at all (including any
   *     non-string input).
   */
  function getEvidence(eventType) {
    try {
      if (typeof eventType !== 'string' || !Object.prototype.hasOwnProperty.call(KNOWN_EVENTS, eventType)) {
        return null;
      }
      return KNOWN_EVENTS[eventType].evidence;
    } catch (e) {
      throw new Error(AlertService.log('ERROR', MODULE, 'getEvidence', { eventType: eventType }, e.message));
    }
  }

  return {
    EVIDENCE: EVIDENCE,
    KNOWN_EVENTS: KNOWN_EVENTS,
    isLegalEventType: isLegalEventType,
    getEvidence: getEvidence
  };

})();
