/*
=====================================================================
EXECUTION OS — ADR LOG (project-local, per UEF S0.7)
=====================================================================
15 ADRs, ADR-000 through ADR-014, all Status: Accepted except where
noted. "Accepted" here means Steven confirmed the decision across
this design conversation — either directly or by relaying a second
AI's drafted recommendation without objection across multiple
rounds. See checkpoint/handoff doc for the honest provenance note:
almost none of these were confirmed in Steven's own freestanding
prose ("yes, I approve X") — most came via relayed second-AI text
that Steven transmitted without changes. Treat "Accepted" as
"sufficiently confirmed to proceed," not as "personally
adjudicated word-for-word" — flagged for the next window's judgment.

Full Evidence/Context/Options detail for each entry lives in
Execution_OS_Architecture_v0.8.md section 9. This file is the
authoritative INDEX + DECISION record; that file is the reasoning
record. Do not let the two drift (EP2) — if one is edited, check
the other.
=====================================================================

ADR-000 — Why Execution OS is a separate GAS project
  Status: Accepted | Date: 2026-07-25
  Decision: Independent GAS project (Option C), not a module inside
  Personal AI Core or Productivity OS.
  Evidence caveat: NOT verified against Personal AI Core / Productivity
  OS's actual code this session — based on Domain Ownership (P7)
  reasoning only.

ADR-001 — UEF / Blueprint adoption approach
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option C — UEF fully adopted; Blueprint selectively
  adopted (capability nodes reused, Domain-Data-Ownership assumption
  skipped).

ADR-002 — Reference-Only data ownership model
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — strict Reference-only, cached snapshot fields
  only, never a full local copy of Domain data.

ADR-003 — Cross-Domain integration mechanism (zero modification)
  Status: Accepted | Date: 2026-07-25
  Decision: Option C — event subscription as primary + scheduled
  reconciliation as backstop, all mapping logic on Execution's side
  only (Domain Adapter Registry).

ADR-004 — Today/Week View/Dashboard are computed, not persisted
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — computed on demand; only manual Pin/Snooze
  overrides are persisted.

ADR-005 — AI Suggestion Metadata + separate AI_Suggestions_Log
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — Metadata block on created records, PLUS a
  separate append-only log capturing every suggestion including
  rejected ones (Metadata alone can't answer "why wasn't this
  adopted" since rejected suggestions never become records).

ADR-006 — File numbering convention
  Status: Accepted | Date: 2026-07-25
  Decision: Option A — Rider OS's proven `00_` two-digit prefix
  (Tier 1 evidence), not Finance OS's proposed 900/100 block scheme
  (Tier 3, unbuilt).

ADR-007 — Completion write-back mechanism
  Status: Accepted | Date: 2026-07-25
  Decision: Option C — Execution publishes its own Execution Event;
  the Domain decides whether to subscribe and write its own state.
  Execution never writes directly to a Domain's Sheet.

ADR-008 — Execution Reference Contract finalized
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option B — lock the minimum field set now (see schema in
  Architecture doc S3.2), additive-only extension from here.

ADR-009 — Project renamed to "Execution OS"
  Status: Accepted (Steven confirmed), EXECUTED | Date: 2026-07-25
  Decision: Option B — renamed from "Life Execution OS." Reasons:
  scope was never just "Life"; near-zero rename cost pre-code;
  name collision with the separately-proposed "Personal Life OS"
  Domain; room for future Decision Engine-type capabilities without
  a second rename.

ADR-010 — Reference sync integrity (snapshot_hash + timestamp, not a Domain-exposed version number)
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — Execution computes its own snapshot_hash and
  compares event timestamps against last_synced_at; does NOT require
  any Domain to expose a new version-counter field (would violate
  BR-8's zero-modification promise).

ADR-011 — Waiting Item: Reason x Party two-axis model
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — split `reason` (closed enum: External_Response
  / Approval / Time / Dependency / Manual_Hold) from `party` (open
  text), replacing the original "categorize by who you're waiting on"
  approach, which doesn't scale and had an unclear Time/External-Event
  boundary.

ADR-012 — Execution OS uses an independent Spreadsheet
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option B — Execution OS's own Spreadsheet, read-only
  access to the Domain-shared backend, never writes to it. Reasoning
  is ownership-boundary, not performance. Evidence caveat: the
  specific tab list attributed to the shared backend (Events, Tasks,
  ActiveTasks, ArchiveTasks, TaskStatistics, TaskFilters,
  ReminderRules, ReminderOccurrences, ReminderHistory) was supplied
  by Steven/relayed content, not independently verified against live
  code this session.

ADR-013 — Execution OS's AI calls route through Personal AI Core
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option B — no direct Claude/ChatGPT/Gemini calls from
  Execution OS; routes through Personal AI Core. Open item: whether
  Personal AI Core currently has a reusable centralized AI-calling
  layer is NOT verified — this decision assumes it will exist or be
  built, not that it already does.

ADR-014 — Version Dependency declaration adopted
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — this project's documents explicitly declare
  a minimum UEF/Blueprint version they depend on (see header of
  00_Project_Constitution.js and the Architecture doc). Motivated by
  a real, observed instance of drift (Blueprint's Governance node
  citing UEF v1.1 after UEF had moved to v1.3).
  IMPORTANT UPDATE FOR NEXT WINDOW: ecosystem memory (outside this
  window) now indicates UEF has since advanced to v1.4 and v1.5,
  including a D8 decision that changed the ecosystem file-extension
  default from .txt to .js. This fully explains, after the fact, the
  .txt-vs-.js conflict this window spent real effort flagging as
  unresolved — it wasn't a contradiction, it was this window reading
  an older UEF version (v1.3) than the one where the change actually
  happened (v1.5). NOT independently verified against the actual
  v1.4/v1.5 text in this window (those files were never uploaded
  here) — treat as reported-but-unverified until read directly.

---------------------------------------------------------------------
CANDIDATE ARCHITECTURE PRINCIPLES — NOT ADRs, NOT ACCEPTED, NOT
BINDING ON THIS OR ANY OTHER PROJECT. Recorded here only so they are
not lost. Each requires real code + (per Blueprint's own evidence
bar) at least two independent projects before being proposed to
Blueprint or UEF.
---------------------------------------------------------------------

CANDIDATE 1 — Domain OS is the sole Producer of Business State;
Execution OS is the sole Producer of Execution State; the two never
overlap. (Likely a Blueprint candidate, not UEF — describes
component data ownership, not engineering process. Zero code
evidence exists for this pattern anywhere yet.)

CANDIDATE 2 — Domain OS may own "AI Capability" (its own business
logic for calling AI); "AI Infrastructure" (Prompt Registry, Memory,
Model Router, Cost Control, Audit, Cache, Rate Limit) is centralized
in Personal AI Core. Explicitly NOT "no Domain may call AI directly"
(that version was considered and rejected as too strong/not
Execution OS's call to make). Zero Domain has built an AI Capability
module yet (Finance OS's 906_AI_Integration is still a proposal).

CANDIDATE 3 — AI Contract: a standardized interface between AI
Capability and AI Infrastructure (Request/Context/Memory Scope/Model
Hint in; Response/Confidence/Reasoning Summary/Cost/Latency out) so
Domain code never changes when the underlying model provider does.
Explicitly deferred until at least two Domains (e.g. Finance OS and
News OS) actually build and use AI Capability against this pattern.
*/
