/*
=====================================================================
EXECUTION OS — FILE MAP
=====================================================================
Status: mostly PROPOSED numbering; EIGHT files are the exceptions —
built and checkpointed (see 00_Project_State.js's checkpoint log for
each): Foundation 10_Config.js / 11_Schema.js / 12_Identity.js /
13_EventDefinitions.js / 14_Versioning.js / 15_TruthEngine.js,
Cross-Cutting 60_Observability.js, and Testing 90_UnitTests.js.
Everything else below is still a plan for when implementation reaches
it, not an inventory of real files. (Header updated 2026-10-24: it
named only 10-12 as built, although the 13/14 entries below already
said BUILT and 60_Observability.js was the first file built,
2026-09-12/14. Updated 2026-10-26: SIX -> SEVEN, for 15_TruthEngine.js.
Updated 2026-10-27: a DEPLOYMENT CONFIGURATION section was added below
— it lists repository-root files that are not numbered source files, so
the count of seven built source files was unchanged by it. Updated
2026-10-31: SEVEN -> EIGHT, for 90_UnitTests.js, the GAS-native
verification gate for 15_TruthEngine.js; it is built and sandbox-tested
but has not been run in Apps Script. Updated 2026-11-01: no file was
added or renamed; the naming rules under DEPLOYMENT CONFIGURATION are
now marked PROPOSED (ADR-021) and the TESTING entry points to ADR-023.
Updated 2026-11-03: no file was added or renamed; the gate HAS now been
run once in Apps Script and 15_TruthEngine.js was changed after it (the
two entries below say so).)
Extension is .js per
Steven's confirmed convention, confirmed 2026-09-12 to exactly match
UEF v1.12's D8 decision (read directly, not from ecosystem memory).

NARROW GOVERNANCE REPAIR, 2026-10-04: the FOUNDATION (10-19) block
below previously still listed this project's original, pre-
reconciliation numbering (10_Schema.js/11_EventDefinitions.js/
13_Permissions.js/14_Versioning.js, with no 15-19 entries) even
though the 2026-09-12/13 Foundation Dependency Reconciliation had
already superseded it — the reconciled numbering was presented in
that round's response but never actually written into this file.
Repaired below to match what was actually decided and, for 10-12,
actually built. Scope of this repair is this block only — see the
RUNTIME-section note further down for a related, separate, still-
open question this repair deliberately did not touch.

GOVERNANCE (this set — the five files delivered alongside this one)
  00_Project_Constitution.js
  00_Business_Rules.js
  00_Project_State.js
  00_File_Map.js  (this file)
  00_ADR_Log.js

DEPLOYMENT CONFIGURATION (repository root; not numbered source files —
added 2026-10-27)
  appsscript.json   Apps Script manifest. "runtimeVersion": "V8" is
                     required, not cosmetic: the runtime files use
                     let/const and ES6 built-ins. "timeZone":
                     "Asia/Singapore" is PROPOSED (copied from
                     Personal Life OS; the same fixed UTC+08:00 as
                     Asia/Kuala_Lumpur). No advanced services, no
                     explicit oauthScopes.
  .claspignore      What clasp does NOT push. Two naming rules follow
                     from it. They are PROPOSED (ADR-021, recorded
                     2026-11-01): in effect because the files exist,
                     not confirmed by the owner. Until the owner
                     confirms or changes them, a new file has to obey
                     them or the push set changes:
                       - a name ending in _Test.js is a Node-only
                         suite and is never pushed to Apps Script;
                       - a name starting with 00_ is a comment-only
                         governance file and is never pushed.
                     Every other .js / .gs / .html file IS pushed, so a
                     file that must run in Apps Script must not use
                     either pattern, and a file that calls require()
                     or process must end in _Test.js. Example (added
                     2026-10-31): 90_UnitTests.js is pushed;
                     90_UnitTests_Test.js, its Node-only test, is not.
                     Expected push set today: the 7 runtime files,
                     90_UnitTests.js and appsscript.json (9 files).
  .clasp.json       NOT in this repository: it holds the owner's Apps
                     Script scriptId. Owner-held — see 00_Project_
                     State.js, WHAT IS STILL OPEN item 14.

FOUNDATION (10-19)
  10_Config.js              Configuration only — Spreadsheet ID,
                             active AI Adapter selection (ADR-015),
                             Telegram bot token slot (ADR-016), all
                             from Script Properties, no setters.
                             BUILT — checkpointed and passed 2026-09-14.
  11_Schema.js              Bootstrap / structural schema owner —
                             idempotent tab + header creation and
                             verification only, never a data-row
                             append. Does NOT depend on
                             15_TruthEngine.js: structural setup and
                             data-row persistence are separate
                             concerns that only share a build-order
                             sequencing note, not a code dependency
                             (Foundation Dependency Reconciliation,
                             2026-09-13). Only hardcodes
                             Execution_References' ADR-008/010-locked
                             field set; no other entity's business
                             fields. BUILT — checkpointed and passed
                             2026-09-16.
  12_Identity.js            Canonical ID generation only — stateless,
                             {PREFIX}-{timestamp}-{random} shape, no
                             Sheet-backed counter. No hardcoded
                             entity-prefix registry: prefixes are
                             caller-supplied and only structurally
                             validated, since no Engine owning
                             GOAL/XPRJ/REF/WAIT/VIS exists yet.
                             BUILT — checkpointed and passed 2026-10-03.
  13_EventDefinitions.js    Execution's own Event vocabulary — defines
                             which event types are legal. Does NOT
                             persist them; that is 16_EventLog.js's
                             job, a separate file and a separate
                             concern. Real precedent already in
                             Execution_OS_Architecture_v0.8.md:
                             goal.created, execution_project.
                             status_changed, review.completed,
                             execution.reference_completed (lowercase
                             entity.action), explicitly not an
                             exhaustive list. isLegalEventType() is
                             true only for goal.created/review.completed
                             (CONFIRMED tier); the other two stay
                             OBSERVED, not silently promoted. BUILT —
                             checkpointed and passed 2026-10-04/05.
  14_Versioning.js          Minimal hash/timestamp/version utility —
                             computeContentHash(fields) and
                             isNewerThan(a,b) only; no schema-version
                             stamp (no real evidence found for one).
                             Deliberately scoped narrow — no
                             speculative concurrency-control framework
                             (EP3) until a real, observed need exists.
                             BUILT — checkpointed and passed 2026-10-06.
  15_TruthEngine.js         Generic validated safe append/write owner,
                             per UCR6 — every Engine's data-row append
                             goes through this file, not its own raw
                             appendRow(). Schema-agnostic on purpose:
                             it does not know or enforce any entity's
                             field shape, only that an append is
                             locked and safe. BUILT — checkpointed and
                             passed 2026-10-26 (54/54 sandbox tests;
                             not verified in real GAS). Changed
                             2026-11-03 after the gate's first real run
                             found two defects: a string over 50000
                             characters is now refused before the lock,
                             and a string starting with "=" or an
                             apostrophe is written with one apostrophe
                             in front (PROPOSED P10 and P11, ADR-022);
                             67/67 sandbox tests; the first real run
                             observed part of it in Apps Script, the
                             new code has not been run there. Actual shape:
                             append(tabName, record) only — no
                             Spreadsheet-ID parameter (it always uses
                             Config's Spreadsheet), append-only (no
                             update/upsert/delete yet, EP3), script-
                             locked, header-name-driven, unknown
                             fields rejected, never creates a tab;
                             depends on Config + AlertService only.
                             Several choices are PROPOSED, not
                             governance-confirmed, and UCR6's primary
                             text was not available — see the file's
                             own header and 00_Project_State.js open
                             items 11-13.
  16_EventLog.js            Event append/read for Execution_Events,
                             validating each event's type against
                             13_EventDefinitions.js's vocabulary
                             before writing, via 15_TruthEngine.js.
                             Planned / not yet implemented.
  17_ReferenceBase.js       Reference entity shape, validation,
                             normalization, and snapshot/hash
                             preparation ONLY — this file does not
                             perform persistence. Execution_Reference
                             rows are actually written by a Runtime-
                             layer Engine (see the RUNTIME-section note
                             below), which calls 15_TruthEngine.js;
                             17_ReferenceBase.js has no Sheet access of
                             its own. Planned / not yet implemented.
  19_Utils.js               Generic, non-entity-specific shared
                             helpers only. Planned / not yet
                             implemented.

NOTE (found during this repair, deliberately NOT acted on — out of
this repair's scope, which is the Foundation block only): the
Foundation Dependency Reconciliation also called for a
26_ReferenceEngine.js in RUNTIME (Reference persistence — the Engine
that actually calls 15_TruthEngine.js on 17_ReferenceBase.js's
behalf, since ReferenceBase itself has no Sheet access). The RUNTIME
list below has never actually dropped 27_PlanningEngine.js — that
concern turned out to be about an earlier Implementation Master Plan
draft conflating Planning with AI Planning, not about this file —
but it has no ReferenceEngine entry at all, and adding one without
also resolving numbering against the existing 26_WeekViewEngine.js
is exactly the kind of RUNTIME-section change this repair's own
scope excludes. Flagged for a separate, future RUNTIME reconciliation
round, not fixed here.

RUNTIME (20-34)
  20_Router.js              Receives from Execution OS's OWN
                             independent Telegram Bot (ADR-016) — not
                             from Personal AI Core's webhook
  21_Parser.js
  22_VisionEngine.js
  23_GoalEngine.js
  24_ExecutionProjectEngine.js
  25_TodayViewEngine.js
  26_WeekViewEngine.js
  27_PlanningEngine.js
  28_DashboardEngine.js
  29_ReviewEngine.js
  30_WaitingEngine.js
  31_ExecutionEventEngine.js

INTELLIGENCE (40-49)
  40_AIPlanningConnector.js       Execution OS's own "AI Capability,"
                                  built on Personal AI Core's "AI
                                  Infrastructure" (see candidate
                                  principles in 00_ADR_Log.js)
  41_GoalDecompositionAssist.js
  42_PrioritySuggestion.js

INTEGRATION (50-59)
  50_DomainAdapterRegistry.js     All cross-Domain field-mapping
                                  config lives here — per UCR7
                                  (Infrastructure Adapter/Port
                                  isolation, confirmed 2026-09-12
                                  against UEF v1.12's actual S4 text,
                                  added v1.4), when a real dependency
                                  (e.g. Personal AI Core's routing
                                  mechanism) isn't confirmed yet, this
                                  file should get a logged placeholder
                                  Adapter rather than a guessed
                                  signature — this project's own
                                  design reached the same conclusion
                                  independently, before reading UCR7's
                                  real text
  54_AIProviderInterface.js       AI Provider Interface (ADR-015) —
                                  Execution AI Capability calls this,
                                  never a provider directly. Its
                                  Transitional Direct LLM Adapter is
                                  explicitly temporary; removed per
                                  ADR-015's Review Trigger, not on a
                                  calendar schedule
  51_ReferenceSync.js
  52_ReminderOSAdapter.js
  53_PersonalAICoreAdapter.js

CROSS-CUTTING (60-69)
  60_Observability.js       AlertService (UCR3 owner). BUILT —
                             checkpointed and passed 2026-09-12/14
                             (10/10 sandbox tests).
  61_Diagnostics.js

TESTING (90-99)
  90_UnitTests.js           GAS-native verification gate for
                             15_TruthEngine.js: one function,
                             runTruthEngineGate(), which the owner runs
                             by hand from the Apps Script editor. It
                             makes four temporary tabs (ZZ_EXEC_GATE_
                             prefix) in Execution's own Spreadsheet,
                             observes what the real platform does
                             (plain-text protection, a write past the
                             grid, a cell over the size limit, one
                             execution taking the script lock twice,
                             time per append), reports in the Execution
                             log and deletes its tabs. It stops before
                             writing if the Spreadsheet holds a tab with
                             a Domain OS name. BUILT 2026-10-31 — 65/65
                             sandbox tests of the gate itself (in
                             90_UnitTests_Test.js, Node-only, never
                             pushed) when built; NOT yet run in Apps
                             Script, so it has produced no real-GAS
                             evidence so far. [Updated 2026-11-03: it
                             ran once, 2026-11-03, and produced the
                             first real-GAS evidence (PASS 5, FAIL 2,
                             INCONCLUSIVE 2, SKIPPED 1); the gate is
                             unchanged, but 26 of its 65 sandbox tests
                             now fail against the changed
                             15_TruthEngine.js because their fake
                             platform is out of date — 00_Project_
                             State.js item 18.]
                             It cannot show mutual exclusion between
                             two overlapping executions, or the effect
                             of flushing before the lock is released;
                             its header lists both. It writes its temp
                             tabs and its own control rows directly: a
                             test-scaffolding exception to "TruthEngine
                             owns data-row writes", awaiting the
                             owner's confirmation (00_Project_State.js,
                             WHAT IS STILL OPEN item 15). The file name
                             is provisional: the planned slot name was
                             "unit tests"; the owner may rename it. The
                             gate's design is recorded as ADR-023
                             (PROPOSED, 2026-11-01), not as a decision
                             the owner has approved.
  91_ManualChecklists.js    Still PLANNED.
  [Note added 2026-10-27, updated 2026-10-31: 91_ManualChecklists.js is
  still PLANNED; 90_UnitTests.js is built (above). The Node-only suites
  are not in this block — each sits beside its source file as
  NN_Name_Test.js and is kept out of the Apps Script push by
  .claspignore (see DEPLOYMENT CONFIGURATION above). Anything placed in
  this block that must run inside Apps Script IS pushed, so its name
  must not end in _Test.js or start with 00_.]

DEPENDENCY RULES (per UEF v1.12 S2 — since these are independent GAS
deployments sharing only a Sheet, a "dependency" means this project
assumes another project populates a specific Sheet/tab. Every such
assumption gets one line here; UEF requires the matching line also
exist in the other project's own File_Map, which this project cannot
verify or add on its own.)
  51_ReferenceSync.js reading the Domain-shared backend assumes tabs
    named approximately: Events, Tasks, ActiveTasks, ArchiveTasks,
    TaskStatistics, TaskFilters, ReminderRules, ReminderOccurrences,
    ReminderHistory.
  STATUS (2026-09-12 text; partly superseded by the 2026-10-25 update
  below): Unknown / Not Verified. This list was supplied by Steven/
  relayed content in an earlier round, not read from live Sheet
  structure or Personal Life OS's own File_Map. Per the 2026-09-12
  Post-Reconciliation Decision (Decision 4): do not infer real tab
  names from filenames, memory, or this project's own conversation
  history. Verification Required Before Any Implementation Depending
  On These Tables — i.e. before 51_ReferenceSync.js is actually
  written, not before Foundation-layer work in general.

  EVIDENCE UPDATE 2026-10-25 — read directly from Personal Life OS's
  own code (the 70.Personal-Life-main snapshot, repo files dated
  2026-10-21; READ-ONLY — nothing in that project was modified).
  SOURCE LEVEL ONLY: this records what Personal Life OS's code creates
  and expects, not an inspection of the live Spreadsheet.
    Source: 15_Setup.js setupSheets() ensures exactly 14 tabs (lines
    76-182), and runDiagnostics() independently lists the same 14:
    Events, Tasks, ActiveTasks, ArchiveTasks, TaskStatistics,
    TaskFilters, Projects, Workflows, Timeline, Notes, Reviews,
    BusinessRules, WorkflowTemplates, TaskViewOrder.
    - Confirmed (6 of the 9 assumed above): Events, Tasks,
      ActiveTasks, ArchiveTasks, TaskStatistics, TaskFilters. Events
      is shared by design (15_Setup.js comment: this project / Core /
      Reminder OS); its header is identical in setupSheets() and in
      02_EventBus.js's COLS.
    - NOT created by Personal Life OS (3 of the 9): ReminderRules,
      ReminderOccurrences, ReminderHistory. They are Reminder OS's own
      tabs, named only second-hand: Personal Life OS's audit note
      00_Architecture_Review_ProjectWorkflow_Reminder_Integration.js
      quotes Reminder OS's 20_ReminderEngine.js (RULES_SHEET /
      OCCURRENCES_SHEET / HISTORY_SHEET). Reminder OS's own code was
      not read here, so these three remain Unverified.
    - Real tabs missing from the list above (8): Projects, Workflows,
      Timeline, Notes, Reviews, BusinessRules, WorkflowTemplates,
      TaskViewOrder.
    - Names are PascalCase with no prefix (Personal Life OS ADR-2026-
      07-24-020, which renamed seven tabs away from LIFE_*). Its design
      docs (e.g. 00_Sheets_Structure.js) still use the old LIFE_* names
      in prose; the code is authoritative. A deployment that predates
      that ADR needs renameSheetsToPascalCase() run on it, so a live
      Spreadsheet can lag the code.
    Column-level schema is deliberately NOT copied here (EP2: Personal
    Life OS owns it — 15_Setup.js setupSheets(), 00_Sheets_Structure.js).
  STATUS (updated 2026-10-25): SOURCE-VERIFIED for Personal Life OS's
  own 14 tabs and the shared Events header; NOT verified against the
  live Spreadsheet; the 3 Reminder tabs are second-hand only. Whether
  this is enough to lift the "Verification Required Before Any
  Implementation Depending On These Tables" gate for
  51_ReferenceSync.js is the project owner's call — not decided here.
  CROSS-PROJECT LINE (the UEF requirement stated above): Personal Life
  OS's own 00_File_Map.js has no entry naming Execution OS as a reader
  (checked 2026-10-25). It cannot be added from here — Personal Life
  OS is read-only to this project — flagged for the owner to add there.

OPEN NUMBERING QUESTION (ADR-006 covers the base choice; unresolved
detail): if the "Jarvis AI Ecosystem" shared-directory plan happens,
this numbering needs reconciling with Finance OS's proposed 900/100
block scheme to avoid collisions.
*/
