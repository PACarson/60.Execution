/*
=====================================================================
EXECUTION OS — FILE MAP
=====================================================================
Status: PROPOSED numbering only. None of the files below exist yet —
this is a plan for when implementation starts, not an inventory of
real files. Extension is .js per Steven's confirmed convention,
confirmed 2026-09-12 to exactly match UEF v1.12's D8 decision
(read directly, not from ecosystem memory).

GOVERNANCE (this set — the five files delivered alongside this one)
  00_Project_Constitution.js
  00_Business_Rules.js
  00_Project_State.js
  00_File_Map.js  (this file)
  00_ADR_Log.js

FOUNDATION (10-19)
  10_Schema.js              Execution-native entity schema only —
                             never Business Schema
  11_EventDefinitions.js    Execution's own Event enum
  12_Identity.js
  13_Permissions.js         (not designed — Tier 3, no evidence, EP3)
  14_Versioning.js

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
  60_Observability.js
  61_Diagnostics.js

TESTING (90-99)
  90_UnitTests.js
  91_ManualChecklists.js

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
  STATUS: Unknown / Not Verified. This list was supplied by Steven/
  relayed content in an earlier round, not read from live Sheet
  structure or Personal Life OS's own File_Map. Per the 2026-09-12
  Post-Reconciliation Decision (Decision 4): do not infer real tab
  names from filenames, memory, or this project's own conversation
  history. Verification Required Before Any Implementation Depending
  On These Tables — i.e. before 51_ReferenceSync.js is actually
  written, not before Foundation-layer work in general.

OPEN NUMBERING QUESTION (ADR-006 covers the base choice; unresolved
detail): if the "Jarvis AI Ecosystem" shared-directory plan happens,
this numbering needs reconciling with Finance OS's proposed 900/100
block scheme to avoid collisions.
*/
