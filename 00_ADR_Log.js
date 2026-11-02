/*
=====================================================================
EXECUTION OS — ADR LOG (project-local, per UEF S0.7)
=====================================================================
25 ADRs, ADR-000 through ADR-024 (updated 2026-11-01; it read "19
ADRs, ADR-000 through ADR-018" until then). ADR-000 through ADR-020
are Status: Accepted except where noted. ADR-021 through ADR-024 are
Status: PROPOSED: they record engineering choices that are built or in
use but that the owner has NOT confirmed — they are not approved
decisions, and no later file may treat them as settled. Questions on
which no decision exists at all are listed after the ADRs, under
PENDING DECISIONS; they are not ADRs. "Accepted" here means Steven
confirmed the decision across
this design conversation — either directly or by relaying a second
AI's drafted recommendation without objection across multiple
rounds. See checkpoint/handoff doc for the honest provenance note
(Execution_OS_Checkpoint_Handoff_2026-10-08.md, which stays the
provenance record): almost none of these were confirmed in Steven's own freestanding
prose ("yes, I approve X") — most came via relayed second-AI text
that Steven transmitted without changes. Treat "Accepted" as
"sufficiently confirmed to proceed," not as "personally
adjudicated word-for-word" — flagged for the next window's judgment.
(ADR-019 and ADR-020 are the exception: each rests on the owner's own
words, quoted in the entry.)

Full Evidence/Context/Options detail for each entry lives in
Execution_OS_Architecture_v0.8.md section 9 (ADR-000 through
ADR-014). ADR-015 through ADR-024's full Context/Question/Options/
Impact detail lives inline below, since they postdate v0.8 and have not
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
  Evidence update (2026-10-25, Verified this round — SOURCE LEVEL,
  read-only): Personal Life OS's own code was read directly
  (15_Setup.js setupSheets() and runDiagnostics(), 02_EventBus.js).
  Of the nine tabs listed in the caveat above, six exist in Personal
  Life OS's code (Events, Tasks, ActiveTasks, ArchiveTasks,
  TaskStatistics, TaskFilters); the three Reminder tabs are not
  created by it (Reminder OS's own, second-hand only); eight further
  tabs exist that the list omitted (Projects, Workflows, Timeline,
  Notes, Reviews, BusinessRules, WorkflowTemplates, TaskViewOrder).
  This is NOT an inspection of the live Spreadsheet. The decision
  itself rests on ownership-boundary reasoning, not on the tab list,
  so this evidence does not by itself change it. Full detail:
  00_File_Map.js, Dependency Rules.
  Related ADRs: Depends on ADR-000, ADR-002. Related to ADR-003.
  Review Trigger: When the Domain-shared backend's actual tab list is
  verified against live code — currently source-verified only (see the
  2026-10-25 evidence update above); not live-verified.

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

ADR-018 — Checkpoint Integrity Gate: re-verify working-directory state before and after every file, not only right after writing it
  Status: Accepted (Steven confirmed — invoked by name in both
  subsequent authorizations after it was adopted, for
  13_EventDefinitions.js and 14_Versioning.js) | Date: 2026-10-03
  Context: starting the 12_Identity.js checkpoint, the live
  container's working directory was found to contain only the 2
  files just written -- every previously checkpointed file (5
  governance files, the Architecture doc, 3 runtime files + tests)
  had silently disappeared, almost certainly from a container reset
  between sessions. No data was actually lost -- the last delivered
  zip had everything -- but the loss went undetected until a test
  happened to need a missing sibling file.
  Question: UEF v1.12 S0.6's File->Export->Read-back->Verify->Test->
  Evidence sequence verifies the NEW file being written at that
  moment. What catches the case where files from EARLIER checkpoints
  are silently no longer there before building on top of them?
  Options Considered: (A) Rely on S0.6 alone, treat this as a rare,
  one-off event not worth a standing process change. (B) Add an
  explicit integrity check -- working directory vs. last accepted
  checkpoint -- as its own gate, run both before starting new work
  and again before accepting a checkpoint as passed.
  Decision: (B).
  Evidence: Verified this round -- direct reproduction of the
  incident (ls showed only 2 files; the last delivered zip, checked
  separately, had the complete prior state). The gap is structural,
  not a one-off: S0.6's own sequence has no step that re-checks an
  earlier checkpoint's files are still present, so the same failure
  mode could recur identically on any future session.
  Impact: every subsequent checkpoint (13_EventDefinitions.js,
  14_Versioning.js, and this review itself) now opens with a working-
  directory-vs-last-checkpoint check and content-verifies key files
  rather than trusting filenames alone, and closes with the same
  check repeated before declaring PASS. A missing dependency, unclear
  recovery source, or unexplained state is a STOP, never a mock or a
  memory-reconstructed stand-in for a real file.
  Next Steps: none required now; the practice is already in active
  use.
  Related ADRs: complements, does not modify, UEF v1.12 S0.6's own
  checkpoint sequence -- this is the missing read-side complement to
  that write-side discipline. Flagged (00_Project_State.js, 2026-10-03)
  as a candidate UEF Change Proposal for whoever maintains UEF's own
  text; this project adopts the practice for itself in the meantime,
  the same way it adopted S0.6 before confirming UEF's exact version
  (see ADR-014).
  Review Trigger: if a future incident shows this Gate itself missed
  something (e.g. a partial/corrupted file that looks present but
  isn't, which this Gate's content-checks only partially cover),
  revisit its scope rather than assuming the existing check list is
  complete.

ADR-019 — Work boundary: only Execution OS is modified; every other OS is read-only reference
  Status: Accepted (the owner's explicit instruction, quoted below) |
  Date: 2026-09-12 or earlier (ADR-016's Context already cites it);
  restated 2026-10-24; recorded as an ADR 2026-11-01
  Context: this project works beside sibling projects (Personal Life
  OS, Personal AI Core, Rider OS, Reminder OS and others) whose code is
  needed as evidence. When the 2026-10-24 session began, the owner
  restated the boundary: "这个os是以execution os开发为主。其他的os只能
  read only" (this OS is the one being developed; the other OSes are
  read only).
  Question: may work on this project change anything inside a sibling
  project, even a small cross-reference?
  Options Considered: (A) allow minimal edits to a sibling where
  Execution OS needs one. (B) every other project is read only; what
  belongs there is flagged for the owner to apply.
  Decision: (B).
  Evidence: the owner's words above. ADR-016 already rejected an edit to
  Personal AI Core's Main.js on this ground. Since 2026-10-24 every
  checkpoint compared Personal Life OS byte for byte with its original
  archive before and after the work, and found it identical.
  Impact: a sibling's file is read, never written, copied into this
  repository, or re-saved. Something that must change there is recorded
  as a flag for the owner — for example, Personal Life OS's own
  00_File_Map.js has no line naming Execution OS as a reader (see
  00_File_Map.js, Dependency Rules). A copy of a sibling's file inside
  this repository is wrong by definition: the four test files copied in
  by mistake were removed on 2026-10-24.
  Next Steps: none; it applies to every future file.
  Related ADRs: ADR-012 and BR-10 state the same boundary for Sheet data
  at runtime (Execution never writes a Domain's Sheet); this ADR states
  it for the development work. ADR-016 cites it.
  Review Trigger: only if the owner changes the instruction.

ADR-020 — One file per explicit authorization; every checkpoint ends with a STOP
  Status: Accepted (the owner's standing instruction; restated
  2026-11-01: "完成 checkpoint、Governance/ADR 持久化及核对后就停止，不要
  继续 coding") | Date: in force since the first checkpoint
  (2026-09-12); recorded as an ADR 2026-11-01
  Context: Slice 0 has been built one file at a time, each on its own
  authorization ("one file plus its test"; the two named steps of the
  2026-10-27 request). 00_Project_State.js records the rule as the
  owner's standing instruction not to proceed to the next file
  automatically, and every checkpoint entry ends with a "Scope
  respected" statement. It was not an ADR.
  Question: what authorizes the next unit of work, and what happens at
  the end of a checkpoint?
  Options Considered: (A) carry on to the next planned file once the
  current one passes. (B) one explicit authorization per file (or per
  named step); after the checkpoint's governance sync and delivery,
  stop and wait.
  Decision: (B). A checkpoint ends with: governance synced (BR-9),
  delivery, a "Scope respected" statement, then STOP. Another file
  starts only on its own go-ahead.
  Evidence: the instruction as recorded in 00_Project_State.js
  (GOVERNANCE STATUS and NEXT ACTION), applied at every checkpoint from
  2026-09-12 to 2026-10-31.
  Impact: the builder's reading, NOT the owner's words (PROPOSED): a
  bare "继续" resumes work that was already authorized; it does not by
  itself authorize a new file. Before starting one, name the file and
  wait for the go-ahead.
  Next Steps: none.
  Related ADRs: ADR-018 (the integrity gate that opens and closes each
  checkpoint); ADR-019.
  Review Trigger: only if the owner changes the instruction.

ADR-021 — Deployment packaging for the Apps Script project: the clasp ignore list, the manifest, and the file-naming rules they imply
  Status: PROPOSED — implemented 2026-10-27 under the owner's
  authorization ("先做1", step 1 of "先做1，然后做2") but not confirmed rule
  by rule; nothing has been pushed | Date: 2026-10-27; recorded
  2026-11-01
  Context: the owner stated on 2026-10-27 that this OS runs in Google
  Apps Script ("这os是放在google app script里运行"). A read-only audit
  found that none of the three repository snapshots held .clasp.json,
  .claspignore or appsscript.json, and that clasp's default would push
  every .js file: the Node-only test files (they call require and
  process, which Apps Script does not have) and the comment-only
  governance files too. Loaded together, the test files and the runtime
  files fail (a global is declared twice), and each test file alone
  fails.
  Question: how does this flat repository become an Apps Script project
  without pushing files that cannot run there?
  Options Considered: (A) clasp's default ignore list — pushes the
  tests: broken. (B) keep the flat layout; a custom .claspignore
  excludes by file name; an appsscript.json pins the runtime. (C) move
  tests and governance files into subfolders and set a root directory —
  changes a layout the owner already uses.
  Decision (PROPOSED): (B). .claspignore holds two patterns (the
  Node-only test suites; the 00_ governance files) plus clasp's own two
  defaults, repeated because a custom file replaces the defaults.
  appsscript.json: runtime V8, exception logging STACKDRIVER, time zone
  Asia/Singapore, no explicit scopes, no advanced services.
  File-naming rules that follow — in effect because the files exist, not
  confirmed by the owner: a name ending in _Test.js is a Node-only suite
  and is never pushed; a name starting with 00_ is a comment-only
  governance file and is never pushed; every other .js, .gs or .html
  file IS pushed, so a file that must run in Apps Script must use
  neither form, and a file that calls require or process must end in
  _Test.js. Expected push set today: 9 files (the 7 runtime files,
  90_UnitTests.js, appsscript.json).
  Evidence: CONFIRMED by reading clasp's source (tags v3.4.1 and
  v2.5.0): a custom ignore file replaces the default; comments are not
  stripped; 3.x filters with micromatch.not and dot:true; only .js, .gs
  and .html files and appsscript.json are ever pushed (so Markdown needs
  no entry); push sends the whole file set and asks before overwriting
  the manifest. OFFICIAL DOCS (fetched 2026-10-27, through a page-
  summarising tool): manifest fields, the runtimeVersion and
  exceptionLogging values; updateContent "clears all the existing files
  in the project". OBSERVED in Personal Life OS (read only): its
  .claspignore, its appsscript.json and the key names of its
  .clasp.json. PROPOSED: the time zone (copied from that sibling), the
  leading double-star-and-slash form of both patterns, repeating the
  defaults, automatic scope detection. Verified only by a scratch
  harness (45 checks): clasp's own filtering calls re-run outside the
  clasp binary, and the tracked files loaded into one shared scope in
  five orders. The real clasp binary was never run (npm is unreachable
  from the sandbox), so nothing here is verified against real clasp.
  Impact: a file added later is pushed unless its name matches a
  pattern; the expected push set must be re-counted whenever a file is
  added (9 now).
  Next Steps (owner side, 00_Project_State.js item 14): .clasp.json with
  the owner's scriptId; compare with the live project before the first
  push (a push replaces the whole remote file set); the time zone; the
  command clasp status should list exactly 9 files.
  Related ADRs: ADR-006 (the 00_ prefix convention); ADR-023
  (90_UnitTests.js is a pushed file).
  Review Trigger: the owner's first real clasp status or push; the
  owner's confirmation or change of any rule above; a clasp release
  that reads its ignore file differently.

ADR-022 — TruthEngine write path: one append-only, plain-text-protected, script-locked row write (15_TruthEngine.js, choices P1 to P9)
  Status: PROPOSED — built 2026-10-26 under the owner's authorization
  for that one file; the choices are the builder's and are not
  confirmed; never run in real Apps Script | Date: 2026-10-26; recorded
  2026-11-01
  Context: 00_File_Map.js defines 15_TruthEngine.js only as the "generic
  validated safe append/write owner, per UCR6". UCR6's primary text is
  not in this repository (open item 12), so "validated" and "safe" had
  no definition. Personal Life OS's Known Limitation 11 (live-verified
  there, for date/time-shaped strings only) shows that appendRow ignores
  a plain-text format set beforehand, while setNumberFormat('@')
  followed by setValues keeps the string.
  Question: what does "validated, locked, safe" mean for a row write
  here, and which of those rules will bind later files such as
  16_EventLog.js?
  Options Considered: (A) appendRow into pre-formatted ranges — rejected
  on the sibling's own evidence. (B) the write path itself protects every
  non-empty string — chosen. (C) a wider API (update, upsert, delete)
  from the start — deferred, no real caller yet (EP3).
  Decision (PROPOSED): the header of 15_TruthEngine.js (P1 to P9) is the
  one source of the exact wording (EP2). In short: P1 one public
  function, append(tabName, record), with no Spreadsheet-ID parameter,
  so a Domain Spreadsheet is unreachable through it; P2 append-only
  (update-by-key deferred); P3 script lock, 10-second wait (a guess);
  P4 returns { tabName, rowNumber }; P5 generic validation — a record
  key that matches no header is rejected, never dropped; P6 every
  non-empty string is written as plain text (setNumberFormat('@') on the
  cell, then one setValues for the row, never appendRow) while numbers,
  booleans and blanks keep their native types; P7 defensive grid growth
  before a write past the last row; P8 no read-back; P9 logs name the
  tab and the field names, never the values. SpreadsheetApp.flush() runs
  before the lock is released (official docs).
  Evidence: CONFIRMED (governance text in this repository: the File_Map
  entry, Architecture S6.1, ADR-012 and BR-10, the Constitution's
  Platform Constraints); OBSERVED (Personal Life OS's source, read
  only); OFFICIAL DOCS (Lock: flush before release; waitLock throws on
  timeout); NOT AVAILABLE (UCR6's text). Sandbox: 54 checks, and 28
  planted defects each caught by at least one check. NOT verified in
  real GAS: that Execution's own Spreadsheet leaves protected strings
  alone (number-, date- and formula-shaped), a write past the grid, the
  lock's mutual exclusion, flush-before-release. 90_UnitTests.js
  (ADR-023) was built to observe several of these; it has not been run.
  Impact: every later file that writes a row calls TruthEngine.append; a
  caller that wants a numeric cell must pass a number, because a
  numeric-looking string is stored as text; the caller serializes
  payloads (dates as ISO strings, objects through JSON.stringify).
  Next Steps: the owner confirms or changes P1 to P9 (00_Project_State.js
  item 11; most worth a call: P2, P3, P6, P7); someone with UEF v1.12
  checks UCR6 (item 12); the first real run of the gate.
  Related ADRs: ADR-012 (own Spreadsheet); ADR-023 (the gate that
  observes it); ADR-018; BR-10.
  Review Trigger: a real-GAS observation that contradicts P6 or P7 (a
  formula-shaped string stored as a formula, a write past the grid
  failing or dropping data); UCR6's text disagreeing; the first caller
  needing update-by-key.

ADR-023 — Real-GAS verification by a hand-run gate function (90_UnitTests.js)
  Status: PROPOSED — the owner asked for a GAS-native verification file
  in the run...Gate() style on 2026-10-27 ("先做1，然后做2"); that request
  is the basis. Built 2026-10-29 to 2026-10-31. The design below, the
  test-scaffolding exception and the file name are the builder's choices
  and await confirmation (00_Project_State.js item 15). The gate has NOT
  been run in Apps Script. | Date: requested 2026-10-27; delivered
  2026-10-31; recorded 2026-11-01
  Context: the owner's practice is that every OS is made to work in real
  GAS ("我所有的os都是在gas跑通的", 2026-10-27; 00_Project_Constitution.js,
  PLATFORM CONSTRAINTS). Every test so far runs in a Node sandbox against
  hand-built fakes; their handling of re-typed strings, a write past the
  grid, an oversize cell, lock semantics and call time are assumptions.
  Question: how does the owner get real-platform evidence for
  15_TruthEngine.js, and how is it reported?
  Options Considered: (A) by hand in the Sheet — repeatable by no one,
  nothing recorded. (B) a hand-run function in the Apps Script project
  that writes only its own temporary tabs in Execution's own
  Spreadsheet, logs one line per check and deletes its tabs (the pattern
  of Personal Life OS's run...Gate() functions). (C) additionally a
  protocol with two overlapping executions, for mutual exclusion and
  flush-before-release.
  Decision (PROPOSED): (B), in 90_UnitTests.js (File_Map's slot name,
  used provisionally), with one editor-runnable function,
  runTruthEngineGate(). Statuses PASS, FAIL, INFO, INCONCLUSIVE,
  SKIPPED; timings are reported, never judged (there is no evidence for
  a threshold); every row under test goes through TruthEngine.append.
  (C) is NOT built: it would be speculative (EP3); only if the owner
  asks. Two choices are exceptions or duplications on purpose: the gate
  writes its temp tabs, their header rows, its control rows and one raw
  out-of-grid write directly rather than through TruthEngine (using
  Schema.ensureTab would put an unverified second file inside a gate
  about TruthEngine); and its guard against a Domain-named tab copies
  the list from 00_File_Map.js (an EP2 duplication accepted for a
  safety stop; File_Map wins if they differ).
  Evidence: sandbox only — the gate's own suite has 65 checks, all
  passing, and 52 deliberate breakages of the gate's own checks are all
  caught (my own selection, not exhaustive); the deployment harness has
  45 checks. API names rest on tiers (OFFICIAL DOCS, TYPE DECLARATIONS,
  OBSERVED in the sibling, PROPOSED) printed in the gate's header; the
  getDisplayValues, getNumberFormats and insertSheet entries were not
  read on the official pages. A wrong name makes the affected group
  report INCONCLUSIVE, never a TruthEngine verdict.
  Impact: the first real run is the first real-GAS evidence this project
  would have, for P3, P6, P7 and the lock behavior. One execution cannot
  show — and REAL_GAS_REQUIRED keeps listing — mutual exclusion between
  two overlapping executions, the effect of flushing before the lock is
  released, getLastRow on long-lived tabs, and latency under contention.
  The file is pushed (its name matches neither ignore pattern), so it
  sits in the Apps Script project until removed.
  Next Steps: owner side — push, set EXEC_OS_SPREADSHEET_ID, run once,
  return the whole Execution log (00_Project_State.js item 14f); decide
  item 15 (the exception, the file name, whether the file stays in the
  pushed set after its first run).
  Related ADRs: ADR-022 (the subject); ADR-021 (it is a pushed file);
  ADR-012 and BR-10 (the guard); ADR-018; ADR-024.
  Review Trigger: the first real run's log; the owner declining the
  exception or renaming the file.

ADR-024 — Verification and reporting discipline applied at every checkpoint
  Status: PROPOSED — a practice in use since the first checkpoint and
  made more explicit in this window; the owner has not ratified it as a
  rule | Date: in use since 2026-09-12; recorded 2026-11-01
  Context: every file so far is tested only in a Node sandbox, while the
  owner's own practice is real GAS (ADR-023). Without a stated
  discipline, "tests pass" is easily read as "works in production".
  Question: how are results, evidence and mistakes reported so that a
  later reader, or a new window, cannot mistake a sandbox pass for
  real-platform verification?
  Options Considered: (A) report pass counts only. (B) report each
  result with what it was run against, what it did not cover, and where
  each claim comes from.
  Decision (PROPOSED): (B), as these rules.
    1. A result obtained in the sandbox is never reported as verified in
       real GAS; each file keeps a REAL_GAS_REQUIRED list and the
       checkpoint entry repeats it.
    2. A statement about a platform API or a document carries its
       evidence tier: CONFIRMED (governance text in this repository),
       OFFICIAL DOCS (with the date fetched, and what the fetch tool
       could not show), TYPE DECLARATIONS (a secondary mirror), OBSERVED
       (a sibling project's source, read only), PROPOSED (the builder's
       own choice).
    3. Test code that guards a write path is itself checked by planting
       deliberate defects, one at a time, in throw-away copies outside
       the project (28 for TruthEngine, 52 for the gate); the number is
       reported together with the fact that the builder chose the
       selection. A check that no planted defect needs is removed, or
       the gap that let a defect survive is closed.
    4. A harness bug, a production defect and the builder's own mistake
       are reported separately and plainly in the checkpoint entry.
    5. When an instruction cannot be carried out (for example "store
       this in memory" when no memory tool exists), say so and record it
       where it can travel — the governance files — and never claim it
       was done.
    6. A governance comment block holds exactly one comment terminator,
       and no text inside it may contain the two-character sequence that
       ends a comment (so no glob written with a double star and a
       slash).
  Evidence: applied at the 15_TruthEngine.js, deployment-configuration
  and 90_UnitTests.js checkpoints; each entry in 00_Project_State.js
  shows it, including what it caught — a log entry whose text would have
  ended its file's comment early (2026-10-27), and redundant checks in
  the gate found only by planting defects in it (2026-10-30).
  Impact: a new window reads a result together with its limits; none of
  these rules changes what a file does.
  Next Steps: the owner confirms, changes or drops rules 1 to 6; if
  confirmed, they could become part of a Definition of Done
  (00_Project_State.js item 9).
  Related ADRs: ADR-018 (the integrity gate); ADR-022; ADR-023.
  Review Trigger: the owner's first real-GAS result; any case where a
  rule here made a checkpoint report something wrong.

---------------------------------------------------------------------
PENDING DECISIONS — NO DECISION HAS BEEN MADE. NOT ADRs, NOT ACCEPTED,
NOT PROPOSED. Listed 2026-11-01 so that none is mistaken for settled.
The open item named in each line, in 00_Project_State.js, holds the
detail (EP2); this list only points to it.
---------------------------------------------------------------------
  - Definition of Ready / Done / Production-Ready: the 2026-09-12
    verdicts are stale and were never re-determined; whether real-GAS
    verification becomes a Definition-of-Done criterion, and whether the
    verdicts apply per file, per slice or project-wide. (item 9)
  - Domain read mechanism: a Spreadsheet-level read (as ADR-003 and
    ADR-012 are written) versus Personal Life OS's QueryEngine or a
    GAS-library call. Needed before 50_DomainAdapterRegistry.js and
    51_ReferenceSync.js. (item 10)
  - Where 16_EventLog.js's read half gets its Sheet access, since
    15_TruthEngine.js has no read function. (item 13)
  - UCR6's primary text, which is not in this repository. (item 12)
  - Owner-side deployment: .clasp.json and the scriptId, comparing with
    the live project before the first push, the manifest time zone,
    EXEC_OS_SPREADSHEET_ID. (item 14; ADR-021)
  - The gate's test-scaffolding exception, the file name
    90_UnitTests.js, and whether the file stays in the pushed set after
    its first run. (item 15; ADR-023)
  - Whether to build a protocol with two overlapping executions
    (mutual exclusion; flush-before-release). Not built; only if the
    owner asks. (ADR-023)
  - Where the scratch verification tools live: outside the repository
    so far. (item 16)
  - Syncing Execution_OS_Architecture_v0.8.md section 9, and its stale
    header, with ADR-013 through ADR-024. (item 3)
  - RUNTIME numbering: a missing 26_ReferenceEngine.js against the
    existing 26_WeekViewEngine.js, and the shared-directory numbering
    question. (the notes in 00_File_Map.js)
  - Reminder OS's scheduling overlap, Rider OS's own bot, the unrelated
    "Decision OS" draft, UEF's Scope line, the ecosystem-level
    Universal-Recovery-Manifest. (items 1, 5, 6, 7, 8)
  - Whether the Checkpoint Integrity Gate (ADR-018) and a UEF Scope
    clarification (ADR-017) are raised as UEF Change Proposals. Not
    Execution OS's call.

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
