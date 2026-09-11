/*
=====================================================================
EXECUTION OS — FILE MAP
=====================================================================
Status: PROPOSED numbering only. None of the files below exist yet —
this is a plan for when implementation starts, not an inventory of
real files. Extension is .js per Steven's confirmed convention
(itself matching UEF's later D8 decision, per ecosystem memory —
not independently re-verified against UEF v1.5's actual text this
window).

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
  20_Router.js
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
                                  isolation, reported via ecosystem
                                  memory as added in UEF v1.4), when
                                  a real dependency (e.g. Personal AI
                                  Core's routing mechanism) isn't
                                  confirmed yet, this file should get
                                  a logged placeholder Adapter rather
                                  than a guessed signature
  51_ReferenceSync.js
  52_ReminderOSAdapter.js
  53_PersonalAICoreAdapter.js

CROSS-CUTTING (60-69)
  60_Observability.js
  61_Diagnostics.js

TESTING (90-99)
  90_UnitTests.js
  91_ManualChecklists.js

OPEN NUMBERING QUESTION (ADR-006 covers the base choice; unresolved
detail): if the "Jarvis AI Ecosystem" shared-directory plan happens,
this numbering needs reconciling with Finance OS's proposed 900/100
block scheme to avoid collisions.
*/
