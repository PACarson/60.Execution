# Execution OS — Implementation Master Plan
Date: 2026-09-12 | Runtime code written: NONE | Telegram Bot created: NONE | LLM called: NONE | Other projects touched: NONE

Per the brief's Section 38/39: this document is the planning deliverable itself. It does not authorize coding. **STOP after this document — waiting for explicit authorization to enter coding**, per the brief's own closing instruction.

---

## 1. Executive Summary

Repository inventory (re-run this round, not assumed from memory — see §2) confirms zero runtime code: seven files exist total, all governance/documentation, none executable. Given that, this plan proposes one structural change to the brief's own default Slice ordering (§4, justified with evidence) and one naming correction (Execution Events already have real precedent in lowercase `entity.action` form — `goal.created`, `review.completed`, `execution.reference_completed` — not the PascalCase list the brief offered as a starting point; §8 preserves the concepts, corrects the form).

**Final status: GREEN — READY TO CODE, except for one FILE-level blocker** (`51_ReferenceSync.js`, unchanged from the prior round, still gated on Domain Sheet tab verification). **First allowed Slice: Slice 0 — Foundation.** Per the brief's own Section 38, this status does not authorize starting — that requires your separate, explicit go-ahead.

---

## 2. Repository Evidence

Re-verified this round via `find`/`grep` against the actual updated repository, not inferred from governance text or memory of the prior rounds.

| Category | Evidence Found |
|---|---|
| Governance files | `00_Project_Constitution.js`, `00_Business_Rules.js`, `00_Project_State.js`, `00_File_Map.js`, `00_ADR_Log.js` — all present, all edited as of the Post-Reconciliation round |
| ADRs | 18, inside `00_ADR_Log.js` (ADR-000 through ADR-017) |
| Architecture documents | `Execution_OS_Architecture_v0.8.md` (751 lines) — **not yet synced** with ADR-015/016/017 or the ADR-013/014 updates; tracked debt, unchanged this round |
| Blueprint references | Only inside the Architecture doc and Constitution's Architecture Layer Mapping — no separate Blueprint file in this repository |
| Runtime files (`.js` outside the `00_` governance prefix) | **None found** |
| Tests | **None found** |
| Configuration | **None found** |
| Spreadsheet/persistence modules | **None found** — `SpreadsheetApp` appears only inside the Architecture doc's prose (planned API usage), not in any real code |
| Event modules | **None found** |
| Reference modules | **None found** |
| Existing UI/HTML | **None found** |
| Existing Connectors | **None found** |
| Existing Engines | **None found** |
| Existing utilities | **None found** |
| `README.md` | Present, effectively empty (14 bytes) |

**Conclusion**: everything below is planning against a blank runtime slate. No existing code needed reclassifying as already-built.

---

## 3. Implementation Master Plan (consolidated)

| Step | What | Depends on | Blocked? |
|---|---|---|---|
| 1 | Slice 0 — Foundation (incl. Router/Parser skeleton — see §4 for why it moved here) | Nothing | No |
| 2 | Slice 1 — Core Execution Entities | Slice 0 | No |
| 3 | Slice 2 — Execution State & Progression | Slice 1 | No |
| 4a | Slice 3 — Views & Planning Horizons | Slice 1–2 | No |
| 4b | Slice 4 — AI Planning (parallel with 4a — see §4) | Slice 1 only | No |
| 5 | Slice 5 — Telegram Bot registration & full wiring | Slices 0–4 | No (bot creation itself is out of scope for this planning round regardless — see Hard Rule) |
| — | `51_ReferenceSync.js` | Slice 1 (Reference entity) + Domain Sheet tab evidence | **Yes — FILE blocker, does not gate any Slice above** |

Full detail for each row is in §4 (slices), §7 (Foundation), §8 (events), §9 (AI), §11 (ReferenceSync), §12 (tests), §13 (checkpoints).

---

## 4. Slice Map — validated, one structural change proposed

The brief's default six-slice structure was evaluated against dependency order, coupling, testability, and cross-OS dependency, per its own Section 13 requirement — not accepted by default.

**Proposed change**: move the Router/Parser skeleton (an empty command-dispatch table, no Telegram Bot token yet) from a last, standalone "Telegram Interface" slice into Slice 0 — Foundation. Each later Slice then registers its own commands into that table as it lands, instead of the entire interface layer being bolted on at the end.

Justification: `00_File_Map.js`'s own pre-existing numbering already puts `20_Router.js`/`21_Parser.js` immediately after Foundation (10–19) and before the Engines (22+) — this proposal aligns Slice boundaries with a numbering decision that already existed, rather than introducing something new. It also means `/vision` or `/today` can be manually exercised end-to-end as early as Slice 1, instead of no user-facing command working until everything else is done — real, incremental verification instead of a single big-bang interface slice. The actual Bot token/webhook registration itself still happens last (§4, Slice 5) and is out of scope for this planning round regardless (Hard Rule: no Bot creation).

**Second finding**: Slice 3 (Views) and Slice 4 (AI Planning) have no dependency on each other — both depend on Slice 1–2, neither on the other. They can be built in parallel rather than strictly sequentially. (Nuance: AI Planning's "Review Analysis" capability specifically benefits from Slice 2's progression history existing first — flagged in the table below, not a reason to block the rest of Slice 4.)

| Slice | Purpose | Scope | Files (planned numbering) | Depends on | Persistence impact | Events | Entry Gate | Exit Gate |
|---|---|---|---|---|---|---|---|---|
| **0 — Foundation** | Everything else needs this to exist | Config, Spreadsheet/tab creation, canonical ID generation, timestamp utilities, Execution Event log writer (base shape only), Reference base shape (schema only, no sync), shared utilities, checkpoint mechanism, Router/Parser skeleton (empty dispatch table) | `10_Config.js`, `11_Schema.js`, `12_Identity.js`, `13_EventLog.js`, `14_ReferenceBase.js`, `19_Utils.js`, `20_Router.js`, `21_Parser.js` | Nothing | Creates the independent Spreadsheet (ADR-012) and its tabs | None yet (log exists, nothing writes to it yet) | Repo state matches this plan | Spreadsheet + tabs exist and are readable; ID generator produces non-colliding IDs on repeated calls; checkpoint log records this Slice |
| **1 — Core Execution Entities** | The nouns | Vision, Goals (+ BR-3 Horizon self-consistency), Goal hierarchy, Execution Projects, Execution References (entity shape + manual CRUD — **not** automated sync, that's `51_ReferenceSync.js`, separately blocked) | `22_VisionEngine.js`, `23_GoalEngine.js`, `24_ExecutionProjectEngine.js`, `25_ReferenceEngine.js` | Slice 0 | Writes to Visions/Goals/Execution_Projects/Execution_References tabs | `goal.created` (real precedent, Architecture doc Flow B), plus proposed `vision.created`, `execution_project.created`, `execution_reference.created` (same lowercase `entity.action` convention, not yet Accepted — see §8) | Slice 0 complete | A Goal with an invalid Horizon (child longer than parent, BR-3) is rejected; a manually-created Reference persists and reads back correctly |
| **2 — Execution State & Progression** | State changes over time | Execution state on Goal/Execution Project, progression, Waiting (ADR-011's Reason × Party), completion handling, Domain writeback boundary | `26_WaitingEngine.js`, `27_ExecutionEventEngine.js` (progression logic) | Slice 1 | Writes to Waiting_Items tab; Execution_Events tab starts receiving real entries | `execution.reference_completed` (real precedent, Flow G) + proposed `execution_project.started/progressed/cancelled/blocked`, `waiting.created/resolved` (same convention, not yet Accepted) | Slice 1 complete | Completing a Reference publishes `execution.reference_completed` and never writes the Domain's own Sheet (BR-11 check); a Waiting Item's `reason` rejects a value outside the closed enum |
| **3 — Views & Planning Horizons** | Read-side aggregation | Today View, Week View, Dashboard (all computed per ADR-004, only Pin/Snooze persisted), Review foundation, Horizon rollup display | `28_TodayViewEngine.js`, `29_WeekViewEngine.js`, `30_DashboardEngine.js`, `31_ReviewEngine.js` | Slice 1–2 | Pin/Snooze table only; everything else computed at query time | `review.completed` (real precedent, Flow E) | Slice 2 complete | Today View returns the same result twice in a row with no state change in between (proves it's computed, not drifting); a Pinned item survives a View recompute |
| **4 — AI Planning** *(parallel with 3)* | AI-assisted capability | AI Planning Capability, AI Provider Interface, Transitional Direct LLM Adapter, migration boundary (ADR-015) | `40_AIPlanningConnector.js`, `41_AIProviderInterface.js`, `42_DirectLLMAdapter.js` | Slice 1 (Review Analysis sub-capability additionally benefits from Slice 2, not blocked by it) | Writes suggestions to AI_Suggestions_Log (ADR-005) | None new — suggestions are metadata on existing entities, not separate Execution Events | Slice 1 complete | A simulated Adapter failure (timeout/malformed JSON) leaves the underlying Goal/Project record intact and unblocked (§10) |
| **5 — Telegram Bot registration & full wiring** | Make it reachable | Register the actual Bot token/webhook (ADR-016); wire every command accumulated in the Slice-0 dispatch table end-to-end | `20_Router.js` (completed), bot registration itself | Slices 0–4 | None new | None new | Slices 0–4 complete | Sending each planned command through the real bot produces the same result as calling the Engine directly |

---

## 5. File Map (Implementation-level)

| File | Slice | Responsibility (single) | Dependencies | Tests | Checkpoint |
|---|---|---|---|---|---|
| `10_Config.js` | 0 | Read/hold Spreadsheet ID, active AI Adapter selection, Bot token placeholder | None | Unit | File |
| `11_Schema.js` | 0 | Create/verify tab structure on the independent Spreadsheet | `10_Config.js` | Persistence | File |
| `12_Identity.js` | 0 | Generate canonical IDs (proposed prefix scheme below, §7) | `10_Config.js` | Unit + negative (collision) | File |
| `13_EventLog.js` | 0 | Append-only write + read for Execution_Events | `11_Schema.js` | Persistence | File |
| `14_ReferenceBase.js` | 0 | Reference entity shape only (ADR-008/010 fields) — no sync logic | `11_Schema.js` | Unit | File |
| `19_Utils.js` | 0 | Shared helpers with no entity-specific logic | None | Unit | File |
| `20_Router.js` | 0 (skeleton), extended every later Slice | Own an empty, then incrementally filled, command-dispatch table | `21_Parser.js` | Contract | File, then re-checkpointed each time a Slice adds to it |
| `21_Parser.js` | 0 | Parse raw Telegram text into a command + args shape | None | Unit | File |
| `22_VisionEngine.js` | 1 | Vision CRUD only | Slice 0 | Unit + Persistence | File → Engine (with 23–25) |
| `23_GoalEngine.js` | 1 | Goal CRUD + BR-3 Horizon check only | Slice 0 | Unit + negative (bad Horizon) | File → Engine |
| `24_ExecutionProjectEngine.js` | 1 | Execution Project CRUD only | Slice 0 | Unit + Persistence | File → Engine |
| `25_ReferenceEngine.js` | 1 | Manual Reference CRUD only — **not** the same file as `51_ReferenceSync.js` | `14_ReferenceBase.js` | Unit + Persistence | File → Engine → **Sprint** (Slice 1 complete) |
| `26_WaitingEngine.js` | 2 | Waiting CRUD + Reason×Party validation only | Slice 1 | Unit + negative | File → Engine |
| `27_ExecutionEventEngine.js` | 2 | Publish real Execution Events on state changes; enforce BR-11 (never write a Domain Sheet) | `13_EventLog.js` | Unit + negative (attempted Domain write must fail) | File → Engine → **Sprint** (Slice 2 complete) |
| `28_TodayViewEngine.js` | 3 | Today aggregation, computed only | Slice 1–2 | Unit (idempotent recompute) | File → Engine |
| `29_WeekViewEngine.js` | 3 | Week aggregation, computed only | Slice 1–2 | Unit | File → Engine |
| `30_DashboardEngine.js` | 3 | Dashboard aggregation, computed only | Slice 1–2 | Unit | File → Engine |
| `31_ReviewEngine.js` | 3 | Review generation + `review.completed` publish only | Slice 1–2 | Unit + Persistence | File → Engine → **Sprint** (Slice 3 complete) |
| `40_AIPlanningConnector.js` | 4 | Orchestrate a planning request — never calls a provider directly | Slice 1, `41_AIProviderInterface.js` | Unit | File → Engine |
| `41_AIProviderInterface.js` | 4 | The interface contract only (see §9) — no provider-specific code | None | Contract | File → Engine |
| `42_DirectLLMAdapter.js` | 4 | Transitional adapter, isolates the concrete LLM call | `41_AIProviderInterface.js` | Negative (every failure mode in §10) | File → Engine → **Sprint** (Slice 4 complete) |

No file above carries more than one primary responsibility; the one place this risk was real (`20_Router.js` accumulating logic across Slices) is handled by keeping it a pure dispatch table with no entity logic inside it — each Engine owns its own command handler function, `20_Router.js` only maps a parsed command to that function.

`51_ReferenceSync.js` is deliberately **not** in the table above — see §11.

---

## 6. Dependency Map

```
Slice 0 (Foundation, incl. Router/Parser skeleton)
   |
   +--> Slice 1 (Core Execution Entities)
             |
             +--> Slice 2 (Execution State & Progression)
             |         |
             |         v
             +--> Slice 3 (Views & Planning Horizons)  --\
             |                                             >-- both feed --> Slice 5 (Telegram wiring)
             +--> Slice 4 (AI Planning, parallel with 3)  -/

51_ReferenceSync.js: depends on Slice 1 (Reference entity must exist)
                     AND on Domain Sheet tab evidence (external, unresolved)
                     -- does not gate Slices 2-5.
```

---

## 7. Foundation Plan (Slice 0 detail)

- **Persistence** — Execution OS's own Spreadsheet (ADR-012). Proposed tabs (not yet Accepted — no ADR governs the exact tab list, only that the Spreadsheet is independent): `Visions`, `Goals`, `Execution_Projects`, `Execution_References`, `Waiting_Items`, `Execution_Events` (append-only), `Reviews`, `Config`. Flagged as **Proposed**, requires your confirmation before `11_Schema.js` is written.
- **Identity** — no ADR governs Execution OS's own ID format. Proposing a short-prefix scheme consistent with the ecosystem's own observed pattern (Productivity OS's `TSK-xxx`): `GOAL-###`, `XPRJ-###` (not `PRJ-` — avoids exactly the Execution-Project-vs-Business-Project collision the Architecture doc's own §2.3 disambiguation already warns about), `REF-###`, `WAIT-###`, `VIS-###`. **Proposed**, not Accepted.
- **Events** — see §8; real precedent exists for three names, the rest are proposed extensions of the same convention.
- **References** — not new design. ADR-008/010 already locked the field set (Architecture doc §3.2); `14_ReferenceBase.js` implements what's already decided, doesn't design anything new.
- **Audit** — every write to a Core Execution Entity gets a corresponding Execution Event (the append-only log IS the audit trail). No separate "audit" concept proposed — consistent with EP3 (anti-premature-engineering) and with not building "general AI Audit infrastructure" (Part 3 §20's explicit prohibition, which applies to more than just AI).
- **Configuration** — Spreadsheet ID, active AI Adapter selection (Direct vs. future Personal AI Core, per ADR-015's migration switch), Bot token (once Slice 5 registers one). No secrets committed to any governance file — Script Properties, per the ecosystem's own observed convention (Personal AI Core's ConnectorLib draft used the same approach).

**Ownership Safety Review** (Part 2 §15): no Foundation utility gives Execution OS write access to a Domain table. `13_EventLog.js` writes only to Execution's own `Execution_Events` tab on Execution's own Spreadsheet; nothing in Slice 0 opens a Domain Spreadsheet at all (that only happens later, read-only, inside the separately-blocked `51_ReferenceSync.js`). No architecture risk found.

---

## 8. Event Design

Evidence check performed before proposing anything (Part 2 §16 explicitly warns against assuming the brief's suggested names are already Accepted — they are not; nothing in `00_ADR_Log.js` governs a canonical Execution Event list).

**Real precedent found in the Architecture doc** (lowercase `entity.action` convention, lives in code as strings, not an enum anyone has formally locked): `goal.created`, `review.completed`, `execution.reference_completed`.

**Proposed extensions**, same convention, covering the concepts the brief's PascalCase list gestured at — renamed to match what's actually already in use, not left as a parallel naming scheme:

| Brief's suggested name | Proposed real name | Slice | Status |
|---|---|---|---|
| ExecutionCreated | `execution_project.created` | 1 | Proposed |
| ExecutionStarted | `execution_project.started` | 2 | Proposed |
| ExecutionProgressed | `execution_project.progressed` | 2 | Proposed |
| ExecutionCompleted | *(already exists as `execution.reference_completed` for the Reference-completion case; a separate `execution_project.completed` may still be needed for whole-Project completion — distinct concept, not a duplicate)* | 2 | Proposed |
| ExecutionCancelled | `execution_project.cancelled` | 2 | Proposed |
| ExecutionBlocked | `execution_project.blocked` | 2 | Proposed |
| WaitingCreated | `waiting.created` | 2 | Proposed |
| WaitingResolved | `waiting.resolved` | 2 | Proposed |

None of the "Proposed" rows above are Accepted. They are this plan's recommendation for how to extend the real, already-established convention consistently — confirmation is a governance step, not an implementation one, and can happen alongside Slice 1–2 rather than blocking Slice 0.

---

## 9. AI Planning Plan

**Architecture** (per ADR-015, unchanged, not reopened):
```
Goal --> AI Planning Capability --> AI Provider Interface --> Transitional Direct LLM Adapter
                                                            (future: --> Personal AI Core Adapter --> Gateway)
```

**AI Capability responsibility** — in scope: Goal Planning, Goal Decomposition, Milestone/Project suggestion, Task decomposition, prioritization recommendation, review analysis. Out of scope, per the brief's own explicit list and consistent with Candidate 2's Capability/Infrastructure split: general Prompt Registry, general Memory system, Model Router, ecosystem-wide AI Audit, general AI Infrastructure of any kind.

**AI Provider Interface — field set, evaluated against real evidence rather than including every candidate field**:

| Field | Include? | Evidence/purpose |
|---|---|---|
| request | Yes | The planning question/context to send — no interface without it |
| response | Yes | The AI's output — no interface without it |
| context | Yes | Goal/Project data the request needs |
| confidence | Yes | Real precedent — the Architecture doc's Metadata Block already anticipates AI Confidence on Goal/Vision/Execution Project/Review (§3.3), and its own open question (Appendix A) about extending it to Waiting/Execution Event |
| explanation/reason | Yes | Same Metadata Block real precedent — "Reason" is the paired field to Confidence |
| provider_path | Yes (minimal) | Needed to know, per suggestion, whether it came from the Transitional Adapter or (later) the Personal AI Core Adapter — required for ADR-015's own migration verification, not a general "model info" field |
| errors | Yes | Required by §10 (AI Failure Safety) — a failure must be a structured result, not an uncaught exception |
| latency | **No** | No architecture evidence found requiring it; can be logged incidentally inside the Adapter's own implementation without being part of the formal Capability-facing contract |
| cost metadata | **No** | Belongs to future centralized AI Infrastructure (Candidate 2), not to Execution OS's own interface |
| audit metadata | **No** | Same reasoning as cost — this is exactly the "general AI Audit infrastructure" the brief says not to build here |

**Transitional Direct LLM Adapter** — Current: Direct LLM Adapter (`42_DirectLLMAdapter.js`). Future: Personal AI Core Adapter. Migration trigger (unchanged from ADR-015, restated for this plan): Personal AI Core's own Gateway passes its own Production Readiness Audit (UEF §9) — mechanical, not calendar-based. Until then, `42_DirectLLMAdapter.js` is explicitly temporary in its own file header comment, not just in governance prose.

## 10. AI Failure Safety

Core rule: **the AI call happens alongside or after the core entity write, never gating it.** A Goal/Execution Project/Task can always be created and persisted with zero AI involvement; AI Planning is additive.

| Failure mode | Handling |
|---|---|
| Unavailable / timeout | `41_AIProviderInterface.js` returns a structured `{success:false, error:'timeout'}`-shaped result; caller proceeds without a suggestion |
| Invalid response / malformed JSON | Same structured failure; the malformed payload itself is never written into `AI_Suggestions_Log` as if it were a real suggestion |
| Provider error / quota error | Same structured failure; distinguished in the `errors` field for later debugging, not surfaced as a generic catch-all |
| Unexpected output shape | Validated against the expected response shape before being treated as a suggestion; a shape mismatch is treated the same as a malformed response |

"AI recommendation must not auto-override a user-owned final decision" (brief's own wording) — no code path proposed here writes an AI suggestion directly into a Goal/Project/Task's authoritative field; suggestions are written to `AI_Suggestions_Log` and to the Metadata Block's Confidence/Reason fields only, exactly as ADR-005 already decided. Nothing new required to satisfy this.

---

## 11. ReferenceSync Plan (blocked)

**Allowed now** (per the brief's own Section 24) and included in this plan:
- Interface definition: `51_ReferenceSync.js` will expose a `syncFromDomain_(domainAdapterConfig)` shape that reads a Domain's Adapter config from `50_DomainAdapterRegistry.js` and produces/updates `Execution_References` rows — this shape does not require knowing real tab names yet, only that a config object with a tab reference will be passed in.
- Expected contract: input is a Domain Adapter config (source tab name, field-mapping); output is zero or more upserted Reference rows plus a `last_synced_at` update — this is already specified by ADR-002/003/010, not new.
- Validation: any row read from a Domain tab must map to ADR-008's locked Reference field set before being written; anything that doesn't map cleanly is logged and skipped, never partially written.
- Test fixtures strategy: since real tab structure is unverified, fixtures will be hand-built fake rows matching the *expected* shape (per ADR-008), clearly labeled as fixtures, not copied from any assumed-real tab.
- Required source tabs identified (not verified): `Events`, `Tasks`, `ActiveTasks`, `ArchiveTasks`, `TaskStatistics`, `TaskFilters`, `ReminderRules`, `ReminderOccurrences`, `ReminderHistory` — carried forward from ADR-012's own still-open evidence caveat, explicitly not newly invented here.

**Not allowed, and not done**: no tab name is hardcoded anywhere in this plan; no schema is assumed; no fixture is presented as if it were real data.

**ReferenceSync Entry Gate**: `51_ReferenceSync.js` may only be implemented once the Domain Sheet tab list above is confirmed against live Personal Life OS code or an equivalent authoritative source. Until then it stays a **FILE-level blocker** (§14) — it does not gate Slices 0, 1, 2, 3, 4, or 5, since none of those require automated Domain sync to function (Slice 1's `25_ReferenceEngine.js` supports manual Reference creation, which is sufficient for every other Slice's own Entry Gate).

---

## 12. Test Strategy

| Test type | Applies to | Example (not exhaustive) |
|---|---|---|
| Unit | Every Engine's pure logic | Goal Horizon self-consistency (BR-3) rejects a Quarter goal under a Week parent |
| Contract | Cross-module interfaces | `41_AIProviderInterface.js`'s request/response shape is honored by `42_DirectLLMAdapter.js` |
| Persistence | Write → read-back → verify (per UEF §0.6 item 3, applies to test design too, not just implementation workflow) | A created Vision persists and reads back with identical field values |
| Negative | Invalid ID, missing dependency, duplicate operation, stale reference, invalid state transition, external provider failure | A `WaitingEngine` call with a `reason` outside the closed enum is rejected, not silently coerced; a duplicate `execution.reference_completed` publish for the same Reference is idempotent, not double-counted |

---

## 13. Checkpoint Plan — UEF v1.12 §0.6, made executable

The brief explicitly rejected "we will follow checkpoint" as a non-answer. Concrete workflow, one file at a time:

```
Implement file
     |
     v
Export/persist immediately (§0.6 item 3, v1.9)
     |
     v
Read the persisted copy back — not the in-memory version just written
     |
     v
Verify it matches what was intended (diff, not "looks right")
     |
     v
Self-check against that file's own Entry/Exit Gate criteria (§4/§5 above)
     |
     v
Record a File checkpoint in 00_Project_State.js's Implementation Checkpoint Log
     (already scaffolded there since the Post-Reconciliation round)
     |
     v
[repeat for every file in the Engine]
     |
     v
All files in the Engine checkpointed --> record an Engine checkpoint
     |
     v
[repeat for every Engine in the Sprint/Slice]
     |
     v
All Engines in the Slice checkpointed --> record a Sprint checkpoint
     |
     v
If this work spans more than this one project or one AI session:
also record an entry in the ecosystem-level Universal-Recovery-Manifest.md
(this project still cannot create or verify that file itself — flagged,
unchanged from the Post-Reconciliation round's open item)
```

**Checkpoint evidence, concretely** (Part 3 §27): a File checkpoint is only recorded once (a) the file exists at its expected path, (b) its persisted content was read back and matches, (c) that file's own unit/negative tests pass, (d) no other file changed unintentionally in the process (a diff against the prior checkpoint's file list), (e) the repository state at that point is one a fresh session could resume from using only `00_Project_State.js` — not the AI session's own memory of what it just did.

---

## 14. Blocker Classification

| Blocker | Class | Gates |
|---|---|---|
| `51_ReferenceSync.js` — Domain Sheet tab list unverified | **FILE** | Only that one file |
| Foundation tab list / ID scheme not yet Accepted (§7) | Not a blocker — flagged as Proposed, needs your confirmation before `11_Schema.js`/`12_Identity.js` specifically, not before Slice 0 planning |
| Event name extensions not yet Accepted (§8) | Not a blocker — same reasoning, needed before `27_ExecutionEventEngine.js` specifically |
| Reminder OS's Phase B Scheduler Integration (unresolved since the original checkpoint) | **SLICE** (Slice 3, Review Engine's periodic trigger) — has a non-blocking fallback: Execution's own GAS time-based trigger, within its own 20-trigger quota, if Reminder OS scheduler-sharing stays unresolved |
| Architecture doc §9 not synced with recent ADRs | Not a blocker — documentation debt, doesn't change what gets built |

**No GLOBAL blocker found.** Nothing in this plan stops the entire implementation from starting.

---

## 15. Implementation Order

`Foundation -> Core Entities -> Execution State -> {Views & Planning Horizons, AI Planning in parallel} -> Telegram Bot wiring`

Differs from the brief's strictly-sequential default only at the Views/AI-Planning step (§4's parallel finding) — everything else matches the given order, and repository evidence didn't surface a reason to change the rest.

**Parallel work**: within Slice 0, `19_Utils.js` and `21_Parser.js` have no dependency on each other or on `11_Schema.js`/`12_Identity.js` and could be written concurrently. Within Slices 3/4 (parallel with each other as noted), each Slice's own internal files are still sequential (an Engine's tests depend on that Engine existing first) — the parallelism is between the two Slices, not a license to skip internal ordering within either one.

---

## 16. Cross-OS Dependency Matrix

| External OS | Dependency | Direction | Current Evidence | Required Before Implementation |
|---|---|---|---|---|
| Personal Life OS | Domain Sheet tabs for Reference Sync | Execution reads FROM it, one-way | Tab list Unknown/Not Verified | Only for `51_ReferenceSync.js` (FILE blocker) — not for Slices 0-5 |
| Personal AI Core | Future AI Gateway (Target state, ADR-013/015) | Execution will call it, one-way, once it exists | Confirmed absent today | Not required at all until ADR-015's migration trigger fires |
| Reminder OS | Possible scheduler-sharing for Review Engine's periodic trigger | Execution -> Reminder OS, if shared; Execution's own trigger, if not | Reminder OS's event+scan pattern (Model A) confirmed for reminders specifically; scheduler-sharing for non-reminder jobs unconfirmed | Not required — Slice 3 has a non-blocking fallback (own GAS trigger) |
| Domain OS / Domain Sheets (general) | Read-only Reference access | Execution reads FROM Domains | Read-only pattern confirmed (ADR-012, Reminder OS's Model A) | Same as Personal Life OS row |
| Telegram | Bot registration | External account/token, not code | N/A | Required only for Slice 5, not before |
| LLM Provider (e.g. Claude) | Transitional Direct LLM Adapter | Execution -> Provider, directly, temporarily | ADR-015 Accepted | Required only for Slice 4, not before |

**Ownership-safety check across every row above**: none grant Execution OS write access to another OS. Every dependency is read-only, publish-only (events), or call-only (future Gateway, LLM Provider). No architecture risk found.

---

## 17. Coding Entry Gate

| Category | Check | Status |
|---|---|---|
| Governance | UEF v1.12 aligned | Yes — confirmed Post-Reconciliation round |
| Governance | Relevant ADRs Accepted | Yes — ADR-013/014/015/016/017 all Accepted |
| Governance | No unresolved architecture conflict | Yes — the two found in Governance Reconciliation are both resolved |
| Repository | File map confirmed | Yes — §5 above |
| Repository | Dependencies confirmed | Yes — §6/§16 above |
| Repository | No unexpected modification | Yes — only Execution OS's own governance files were ever touched, verified by diff each time |
| Persistence | Checkpoint procedure ready | Yes — §13, made executable this round |
| Testing | Test strategy ready | Yes — §12 |
| Testing | Fixtures ready where needed | Partial — ReferenceSync's fixtures are planned but explicitly not real until tabs are verified (§11); every other Slice's fixtures are self-contained |
| AI | Provider boundary defined | Yes — §9 |
| AI | Transitional adapter explicitly temporary | Yes — ADR-015, restated in §9 |
| Cross-OS | Ownership boundaries verified | Yes — §16 |

---

## 18. First Coding Target

**Slice 0 — Foundation**, specifically starting with `10_Config.js` and `11_Schema.js` (nothing else can be tested without the Spreadsheet existing first). This is the brief's own default candidate, and repository evidence didn't surface a reason to override it — unlike the Slice-ordering question in §4, there is no competing evidence here.

**What still cannot be touched, even after this plan**: any Personal AI Core, Reminder OS, or Personal Life OS file; any real Telegram Bot registration; any real LLM API call; the Domain Sheet tab list may not be guessed when `51_ReferenceSync.js`'s turn comes.

---

**STOP. This plan does not authorize coding.** Per the brief's Section 38/39: waiting for your explicit authorization before Slice 0's first file is written.
