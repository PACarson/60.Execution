/*
=====================================================================
EXECUTION OS — ADR LOG (project-local, per UEF S0.7)
=====================================================================
18 ADRs, ADR-000 through ADR-017, all Status: Accepted except where
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
Execution_OS_Architecture_v0.8.md section 9 (ADR-000 through
ADR-014). ADR-015/016/017's full Context/Question/Options/Impact
detail lives inline below, since they postdate v0.8 and have not
yet been folded into the Architecture doc's section 9 — see
00_Project_State.js's open items for that pending sync. This file
is the authoritative INDEX + DECISION record; the Architecture doc
is the reasoning record. Do not let the two drift (EP2) — if one is
edited, check the other.

2026-09-12 UEF v1.12 full-text intake (Governance Reconciliation +
Post-Reconciliation Decision & Governance Closure, same day):
added `Related ADRs` and `Review Trigger` to every entry below per
UEF v1.12 S0.7's ADR shape (both fields were previously absent from
all 15 original entries — a documentation gap, not a decision
change). Values below are this session's honest reconstruction from
the actual decision content and dependencies described in each
entry and in the Architecture doc, not fabricated placeholders and
not carried over from any source that stated them explicitly
elsewhere (none did). Where a real cross-reference wasn't evident,
that is stated plainly rather than invented.
=====================================================================

ADR-000 — Why Execution OS is a separate GAS project
  Status: Accepted | Date: 2026-07-25
  Decision: Independent GAS project (Option C), not a module inside
  Personal AI Core or Productivity OS.
  Evidence caveat (2026-07-25): NOT verified against Personal AI Core
  / Productivity OS's actual code this session — based on Domain
  Ownership (P7) reasoning only.
  Evidence update (2026-09-12, Verified this round): Personal AI
  Core's real code (00_Core-main) shows a Telegram-webhook +
  Connector-Registry architecture with no in-process module-hosting
  concept; Personal Life OS (70_Personal-Life-main) is a mature,
  independently-deployed Domain OS with its own extensive schema,
  not shaped to host a non-Domain coordinator. Both support
  independent-project separation being the right call, now on real
  evidence rather than P7 reasoning alone.
  Related ADRs: First ADR — none precedes it. Every later ADR
  presupposes this one. Directly reinforced by ADR-017 (UEF scope
  is about engineering discipline, not Domain-Data-Ownership, so
  independence doesn't require being a Domain OS).
  Review Trigger: If a future review finds Personal AI Core's or a
  Domain OS's real architecture has evolved to make in-process
  hosting genuinely viable — not just theoretically possible.

ADR-001 — UEF / Blueprint adoption approach
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option C — UEF fully adopted; Blueprint selectively
  adopted (capability nodes reused, Domain-Data-Ownership assumption
  skipped).
  Related ADRs: Follows ADR-000. Its basis is made explicit, not
  changed, by ADR-017 (2026-09-12): UEF's own Scope line does not
  literally name Execution OS, so this adoption is a voluntary
  extension, not a claim that UEF's text already asserts
  jurisdiction here.
  Review Trigger: If UEF's own Scope line is ever amended to
  explicitly address (include or exclude) coordinator-type projects,
  or if Blueprint's two-independent-project evidence bar is ever met
  for a capability-node promotion this project is relying on.

ADR-002 — Reference-Only data ownership model
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — strict Reference-only, cached snapshot fields
  only, never a full local copy of Domain data.
  Related ADRs: Presupposed by ADR-008 (field set) and ADR-010 (sync
  integrity). Evidence update (2026-09-12, Verified this round):
  independently cross-confirmed — Personal Life OS's own
  00_Domain_Boundary.js carries a Carson-frozen Event Ownership
  Matrix that draws the same Execution/Domain line without having
  coordinated with this Constitution.
  Review Trigger: If a Domain's real architecture changes such that
  Reference-only becomes insufficient for an actual, not hypothetical,
  feature need.

ADR-003 — Cross-Domain integration mechanism (zero modification)
  Status: Accepted | Date: 2026-07-25
  Decision: Option C — event subscription as primary + scheduled
  reconciliation as backstop, all mapping logic on Execution's side
  only (Domain Adapter Registry).
  Evidence update (2026-09-12, Verified this round): the real
  EventBus (Productivity OS's 02_EventBus.js) is a shared Google
  Sheet each project's own local code appends to, not a push
  mechanism — "event subscription" in practice means the Domain
  Adapter Registry's Adapter reads that shared Sheet. The zero-
  modification principle holds; the word "subscription" should not
  be read as implying a message-queue-style push exists today.
  Related ADRs: Depends on ADR-002. Related to ADR-010 (sync
  mechanics), ADR-012 (Spreadsheet independence), and UCR7 (the
  Adapter this ADR already specifies is exactly UCR7's Infrastructure
  Adapter/Port isolation pattern, confirmed 2026-09-12 against UEF
  v1.12 S4's real text).
  Review Trigger: If UEF's own stated EventBus-as-future-Platform-
  Capability direction (S2, v1.7) is ever actually built, revisit
  whether "subscription" should be reworded from Adapter-reads-a-
  Sheet to a real push description.

ADR-004 — Today/Week View/Dashboard are computed, not persisted
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — computed on demand; only manual Pin/Snooze
  overrides are persisted.
  Related ADRs: None directly. Independently consistent with UEF
  v1.12's own EP4 principle and its Property OS "Overdue" example
  (confirmed 2026-09-12) — same reasoning, unconnected origin.
  Review Trigger: If View computation cost is ever measured as a
  real problem against GAS's execution-time limits — not
  hypothetical.

ADR-005 — AI Suggestion Metadata + separate AI_Suggestions_Log
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — Metadata block on created records, PLUS a
  separate append-only log capturing every suggestion including
  rejected ones (Metadata alone can't answer "why wasn't this
  adopted" since rejected suggestions never become records).
  Related ADRs: Depends on however ADR-013/ADR-015 resolve AI
  calling — any AI-generated suggestion's provenance ultimately
  traces through whichever provider path is in force.
  Review Trigger: When AI_Suggestions_Log's schema is actually built
  (not yet), check its field set against UEF v1.12's Event
  Completeness Principle (S2, v1.8) before finalizing.

ADR-006 — File numbering convention
  Status: Accepted | Date: 2026-07-25
  Decision: Option A — Rider OS's proven `00_` two-digit prefix
  (Tier 1 evidence), not Finance OS's proposed 900/100 block scheme
  (Tier 3, unbuilt).
  Related ADRs: None.
  Review Trigger: If a shared cross-project numbering directory ever
  becomes real and collides with another project's proposed scheme.

ADR-007 — Completion write-back mechanism
  Status: Accepted | Date: 2026-07-25
  Decision: Option C — Execution publishes its own Execution Event;
  the Domain decides whether to subscribe and write its own state.
  Execution never writes directly to a Domain's Sheet.
  Evidence update (2026-09-12): direction confirmed by Reminder OS's
  real, already-shipped Model A pattern (publish an event/signal,
  consumer reads its own authoritative record) — same shape as this
  ADR's decision, independently arrived at. New finding: under UEF
  v1.12's Platform Constraints (S2, v1.5, no multi-statement
  transactions on GAS+Sheets), publishing the event and the Domain's
  optional write are two independent, non-atomic operations. This
  was already true; it just wasn't stated anywhere until now.
  Related ADRs: Depends on ADR-002, ADR-003.
  Review Trigger: If a real (not theoretical) instance of the
  non-atomicity above is ever observed to cause a problem for this
  specific write pattern.

ADR-008 — Execution Reference Contract finalized
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option B — lock the minimum field set now (see schema in
  Architecture doc S3.2), additive-only extension from here.
  Related ADRs: Depends on ADR-002. Extended by ADR-010.
  Review Trigger: When a source Domain's actual event contracts are
  read field-by-field (not yet done), check against UEF v1.12's Event
  Completeness Principle (S2, v1.8); any resulting change must be
  additive-only per this ADR's own decision, not a redefinition.

ADR-009 — Project renamed to "Execution OS"
  Status: Accepted (Steven confirmed), EXECUTED | Date: 2026-07-25
  Decision: Option B — renamed from "Life Execution OS." Reasons:
  scope was never just "Life"; near-zero rename cost pre-code;
  name collision with the separately-proposed "Personal Life OS"
  Domain; room for future Decision Engine-type capabilities without
  a second rename.
  Related ADRs: None — naming decision.
  Review Trigger: None; executed, not a standing condition.

ADR-010 — Reference sync integrity (snapshot_hash + timestamp, not a Domain-exposed version number)
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — Execution computes its own snapshot_hash and
  compares event timestamps against last_synced_at; does NOT require
  any Domain to expose a new version-counter field (would violate
  BR-8's zero-modification promise).
  Related ADRs: Depends on ADR-002, ADR-008.
  Review Trigger: If a Domain OS is ever found to already expose its
  own reliable version-counter field despite BR-8, revisit whether
  relying on it would be preferable to Execution's own computed hash.

ADR-011 — Waiting Item: Reason x Party two-axis model
  Status: Accepted | Date: 2026-07-25
  Decision: Option B — split `reason` (closed enum: External_Response
  / Approval / Time / Dependency / Manual_Hold) from `party` (open
  text), replacing the original "categorize by who you're waiting on"
  approach, which doesn't scale and had an unclear Time/External-Event
  boundary.
  Related ADRs: None.
  Review Trigger: If a real Waiting Item's reason genuinely doesn't
  fit the closed enum once implementation exists and real data is
  observed.

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
  Evidence update (2026-09-12): the decision's direction (physical
  isolation reinforces ownership) is reinforced by UEF v1.12's own
  Platform Constraints framing. The tab-list evidence caveat above is
  UNCHANGED — still not independently verified this round either;
  Personal Life OS's actual code was read this round for other
  purposes (00_Domain_Boundary.js, 02_EventBus.js) but its full tab
  list was not specifically checked. Per Decision 4 (2026-09-12):
  do not infer this list from filenames or memory — mark Unknown /
  Not Verified until read directly (see 00_File_Map.js).
  Related ADRs: Depends on ADR-000, ADR-002. Related to ADR-003.
  Review Trigger: When the Domain-shared backend's actual tab list is
  verified against live code — currently Unknown / Not Verified.

ADR-013 — Execution OS's AI calls route through Personal AI Core (target architecture)
  Status: Accepted (Steven confirmed) | Date: 2026-07-25
  Decision: Option B — no direct Claude/ChatGPT/Gemini calls from
  Execution OS as the PERMANENT architecture; routes through Personal
  AI Core's AI Infrastructure as the target end state.
  Evidence caveat (2026-07-25): Open item: whether Personal AI Core
  currently has a reusable centralized AI-calling layer is NOT
  verified — this decision assumes it will exist or be built, not
  that it already does.
  Evidence update (2026-09-12, Verified this round — major update):
  confirmed ABSENT, not merely unconfirmed. Grepped the entirety of
  Personal AI Core's real code (00_Core-main) for Claude/Anthropic/
  OpenAI/Gemini API calls: zero matches. The 93-96 "AI" engines
  (Memory/Behavior/Suggestion/InsightRouter) are rule-based pattern
  analysis over the Events table, not generative-AI calls. Personal
  AI Core Gateway must be described as Target Architecture, never as
  a current runtime fact, in any Execution OS document.
  Related ADRs: Refined, not superseded, by ADR-015 (2026-09-12),
  which defines the transitional path to this target while the
  Gateway doesn't yet exist. This ADR's target-state decision is
  unchanged.
  Review Trigger: If repository evidence ever shows Personal AI Core
  has built a real centralized AI-calling layer — see ADR-015's
  Review Trigger for the specific, mechanical condition.

ADR-014 — Version Dependency declaration adopted
  Status: Accepted | Date: 2026-07-25, superseding update 2026-09-12
  Decision: Option B — this project's documents explicitly declare
  a minimum UEF/Blueprint version they depend on (see header of
  00_Project_Constitution.js and the Architecture doc). Motivated by
  a real, observed instance of drift (Blueprint's Governance node
  citing UEF v1.1 after UEF had moved to v1.3).
  Evidence update (2026-09-12, Verified this round — full
  resolution): UEF's complete primary text was obtained and read in
  full for the first time (v1.12, Stable, 2026-08-16). Confirmed:
  D8 (locked v1.5) resolves file-extension convention to `.js`
  (already this project's practice — the earlier "reported .txt vs
  .js" framing was itself imprecise; the real tension D8 resolved
  was `.txt` vs `.gs`, with `.js` as the actual outcome). UCR7
  (Infrastructure Adapter/Port isolation) confirmed added v1.4, exact
  wording obtained — matches this project's own File_Map design for
  50_DomainAdapterRegistry.js, arrived at independently. Newly
  discovered, with ZERO prior exposure at v1.3 and not part of the
  earlier v1.4/v1.5 rumor either: S0.6 items 3-4 (v1.9: export-and-
  persist each file immediately; v1.12: File->Engine->Sprint
  checkpoint hierarchy + an ecosystem-level Universal-Recovery-
  Manifest.md for cross-project/cross-session work); S2's Platform
  Constraints (GAS+Sheets only, no multi-statement transactions, no
  cross-project concurrency beyond LockService, v1.5); S2's EventBus-
  as-future-Platform-Capability framing (v1.7); the Event
  Completeness Principle (v1.8).
  Version dependency restated: UEF >= 1.12, Blueprint >= 1.2
  (Blueprint itself unchanged — UEF v1.12 states Blueprint is
  "Stable as of v1.2," so no drift there).
  Related ADRs: This update's own existence is exactly what ADR-014
  originally anticipated (a mechanism for catching version drift).
  Review Trigger: Re-verify whenever UEF issues a new version and
  this project has not yet read that version's primary text directly
  — do not treat ecosystem-memory summaries of a newer version as
  equivalent to having read it (this is the same mistake this ADR
  itself was created to catch, applied to itself).

ADR-015 — AI Planning provider strategy: Provider Interface + Transitional Direct LLM Adapter
  Status: Accepted (Steven confirmed, Post-Reconciliation brief) | Date: 2026-09-12
  Context: ADR-013 establishes Personal AI Core routing as the target
  architecture, but this round confirmed Personal AI Core currently
  has no centralized AI-calling layer at all. 40_AIPlanningConnector.js
  needs a real implementation path that doesn't block indefinitely on
  infrastructure that doesn't exist, without abandoning ADR-013's
  target direction.
  Question: How should 40_AIPlanningConnector.js call an LLM before
  Personal AI Core's Gateway exists?
  Options Considered: (A) Direct LLM call, no interface layer —
  fastest, but risks a temporary architecture quietly becoming
  permanent. (B) No LLM in V1, deterministic rules/heuristics only —
  safest, but bounds Goal Decomposition quality and defers real
  verification of the AI Planning Capability. (C) An AI Provider
  Interface inside Execution's Intelligence layer, with a Transitional
  Direct LLM Adapter behind it now, swapped for a Personal AI Core
  Adapter later — UCR7's Infrastructure Adapter/Port isolation pattern
  applied to a provider dependency instead of a transport dependency.
  Decision: Option C.
  Evidence: Verified this round — Personal AI Core's centralized
  AI-calling layer confirmed absent (see ADR-013 evidence update).
  UEF v1.12's real UCR7 text explicitly endorses this exact move for
  an unconfirmed dependency: write the Adapter, let its body be a
  logged placeholder, don't guess a signature to unblock development.
  Impact: 40_AIPlanningConnector.js calls an AI Provider Interface,
  never a provider directly, from day one of its own implementation.
  CRITICAL GOVERNANCE NOTE: this decision does NOT mean Personal AI
  Core currently has an AI Gateway. Three states must never be
  conflated in any document: Current State (Personal AI Core has no
  verified LLM API implementation), Target State (Execution AI
  Capability -> AI Provider Interface -> Personal AI Core Adapter ->
  Personal AI Core Gateway -> Model Router -> LLM Provider),
  Transitional State (Execution AI Capability -> AI Provider
  Interface -> Temporary Direct LLM Adapter, in force until the
  Review Trigger below fires).
  Next Steps: Define the AI Provider Interface's exact request/
  response shape when 40_AIPlanningConnector.js is actually built —
  not this round.
  Related ADRs: Refines ADR-013 — does not supersede it.
  Review Trigger: The Direct LLM Adapter is deprecated and removed
  the first time Personal AI Core's own AI Gateway passes its own
  Production Readiness Audit (UEF S9) — not "eventually," not "when
  convenient." Until that specific event, this ADR's Transitional
  status is unchanged. No other condition ends the transitional
  period.

ADR-016 — Execution OS owns an independent Telegram Bot / Command Entry Point
  Status: Accepted (Steven confirmed, Post-Reconciliation brief) | Date: 2026-09-12
  Context: Personal AI Core's command-routing mechanism was this
  project's single hard blocker requiring real code, not discussion.
  Personal AI Core's real 04_Main.js: a single Telegram webhook, a
  hardcoded sequential intent chain (Task->Inventory->Insight->
  fallback), not a dynamically-extensible router — adding Execution's
  own commands to that chain would mean editing Personal AI Core's
  Main.js, which is out of scope (Steven's explicit instruction: work
  only on Execution OS, do not modify any other project). Rider OS's
  real 80_RiderConnector.js is a one-way, read-only sync — strong
  evidence Rider OS's own user-facing commands never reach Personal
  AI Core's webhook at all, implying Rider OS runs its own bot.
  Question: How do Execution OS's own commands (/today /week /goals
  /vision /plan /review /waiting /dashboard) reach Execution OS,
  given Personal AI Core's webhook cannot be modified?
  Options Considered: (A) Add a branch to Personal AI Core's
  _handleMessage_ — rejected, out of scope. (B) Execution OS owns its
  own independent Telegram Bot (own token, own webhook), following
  the pattern already proven by Rider OS.
  Decision: Option B.
  Evidence: Verified this round — Personal AI Core's 04_Main.js,
  80_RiderConnector.js (Rider's own webhook itself was not directly
  read; its independence is inferred from the absence of any
  Rider-intent branch in Core's chain plus RiderConnector's explicit
  one-way-read framing — flagged as inference, not a direct read).
  Impact: Execution's Runtime layer gets its own Command/Intent
  Router (20_Router.js / 21_Parser.js, already in File_Map) receiving
  from its own bot, not from Personal AI Core's.
  IMPORTANT: Telegram Entry Point independence does NOT imply AI
  Infrastructure independence. Execution's own bot receiving its own
  commands is orthogonal to where those commands' AI-assisted
  responses, if any, get computed — that question is governed by
  ADR-013/ADR-015, not this ADR.
  Next Steps: Register a new Telegram Bot token when Runtime
  implementation begins — not this round.
  Related ADRs: Consistent with, clarifies rather than modifies,
  ADR-001's description of Personal AI Core as a "sibling project
  ... sharing the ecosystem's Telegram ... infrastructure pattern" —
  that phrase means running an independent instance of the same
  pattern, not sharing one literal webhook.
  Review Trigger: Revisit only if Personal AI Core's own routing
  architecture changes to a dynamically-extensible model, or if
  Telegram's own platform constraints change what's possible.

ADR-017 — Execution OS's UEF adoption is a voluntary extension beyond UEF's own stated Scope
  Status: Accepted (Steven confirmed, Post-Reconciliation brief) | Date: 2026-09-12
  Context: UEF v1.12's own Scope line names Personal AI Core, Rider
  OS, Reminder OS, Productivity OS, Property OS, and "every future
  Domain OS project." Execution OS's Constitution states, as its
  single most load-bearing rule, that Execution OS is NOT a Domain
  OS. Taken literally, UEF's own text does not assert it governs
  Execution OS.
  Question: Does ADR-001's "UEF: fully adopted" require UEF's own
  Scope to be amended to name Execution OS, or can a project adopt
  UEF's discipline without being named?
  Options Considered: (A) Treat the absence as a conflict requiring
  UEF itself to change first. (B) Treat UEF adoption as a choice any
  project can make about itself regardless of whether UEF's Scope
  line enumerates it, since UEF governs HOW engineering is done
  (its own framing) and "Domain OS" specifically distinguishes
  WHETHER a project has a Business Domain — an orthogonal question.
  Decision: (B). This does not require modifying UEF itself.
  Evidence: Verified this round — UEF v1.12's full Scope line and its
  own "governs every Domain OS project — an authority relationship,
  not a code dependency" framing.
  Impact: None to current practice — Execution OS continues fully
  adopting UEF exactly as ADR-001 already decided. This ADR makes the
  basis explicit rather than leaving it implicit.
  GOVERNANCE NOTE — UEF CHANGE PROPOSAL FLAGGED, NOT ACTED ON:
  whether UEF's own Scope line should be clarified to explicitly
  address coordinator-type (non-Domain, non-Core, non-External-
  System) projects is flagged as a candidate "UEF Change Proposal
  Required" for whoever maintains UEF's own governance process. This
  project does not modify UEF's text itself.
  Next Steps: None required of Execution OS.
  Related ADRs: Clarifies the basis of ADR-001; does not change its
  decision.
  Review Trigger: Revisit if UEF's own Scope line is ever amended to
  explicitly address coordinator-type projects, or if a second such
  project (a "Decision OS"-shaped project, should one ever become
  real — see 00_Project_State.js's open flag) needs the same
  clarification, which would suggest a recurring ecosystem-level gap
  rather than an Execution-OS-specific one.

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
Evidence update (2026-09-12, Verified this round): the Infrastructure
side is now confirmed ABSENT in Personal AI Core (see ADR-013), not
merely unbuilt-and-unconfirmed as of the original recording. This
status (Proposed/Deferred, not Accepted) is unchanged by that
confirmation — absence of the target doesn't promote the candidate,
it just sharpens what "not yet built" means.

CANDIDATE 3 — AI Contract: a standardized interface between AI
Capability and AI Infrastructure (Request/Context/Memory Scope/Model
Hint in; Response/Confidence/Reasoning Summary/Cost/Latency out) so
Domain code never changes when the underlying model provider does.
Explicitly deferred until at least two Domains (e.g. Finance OS and
News OS) actually build and use AI Capability against this pattern.
Naming note (2026-09-12): if this is ever built, avoid "Memory" as a
field/scope name without qualification — Personal AI Core already
has a real, different "93_MemoryEngine.js" (rule-based historical-
pattern storage over the Events table, not LLM context/session
memory). A future AI Contract's "Memory Scope" and Personal AI
Core's existing MemoryEngine are unrelated concepts that would
collide under the same word.
*/
