# Execution OS — Checkpoint / Handoff
Date: 2026-11-08 (drafted that day; written into the repository 2026-11-09, Asia/Kuala_Lumpur) | Prepared because: the owner's 2026-11-08 06:55 request to pause coding, audit this whole window against the actual repository, persist every decision of the window in the governance files and the ADR Log (an unsettled one marked pending or PROPOSED, not approved), save a checkpoint/handoff file, and stop.

How to use this file: it is a snapshot taken at the end of the 2026-11-08 checkpoint, and it replaces `Execution_OS_Checkpoint_Handoff_2026-11-01.md` as the file to read first (the 2026-11-01 file stays as a snapshot of that day; its sections on the current state and the next steps are stale). The five `00_` governance files are the source of truth; where this file and one of them disagree, the governance file wins (EP2). What this file adds is the audit: for every item, what is verified, against what, and what is not. Statements about the repository were checked against the files in this session (hashes, a re-run of every suite). Statements about earlier conversation turns rest on the persisted records and on compaction summaries; section 4.4 says exactly what that means.

## 摘要(中文)

- **项目状态**:Slice 0 — Foundation 仍在进行,现在停在一个刻意的 STOP。7 个运行时文件 + `90_UnitTests.js`(真机门禁)已写好,8 个 Node 沙盒套件 238/238 通过。**门禁已经在真实 Google Apps Script 里跑过两次**(2026-11-03、2026-11-05,都是你手动把文件贴进编辑器):第二次 PASS 7 / FAIL 0 / INCONCLUSIVE 2 / SKIPPED 1,结论仍是 INCOMPLETE——脚本锁(两个并发执行是否互斥、释放、超时)**还没有被观察到**。
- **没有做到一半的 implementation**:最后的代码工作是 2026-11-07 的 checkpoint(2026-11-08 06:35 经你点选授权写入仓库,已交付并 STOP)。本次(11-08)没有改任何代码,只改了 4 个治理文件并新增本文件;运行时、测试、部署文件与 11-07 逐字节相同。探针 `ZZ_Probe.js` 在仓库之外,已交付,**从未运行**。`16_EventLog.js` 没有开始。
- **本次持久化**:ADR Log 从 25 条增到 26 条。新增 **ADR-025**(Accepted,范围很窄):真机运行靠你手动把文件贴进 Apps Script 编辑器,clasp 暂不使用(你的原话只能从对话摘要转引,原消息已不在磁盘上)。ADR-020 加了你 2026-11-08 06:55 那条要求的注记;ADR-024 的数字更新,并新增 3 条 **PROPOSED** 规则(7–9)。ADR-021 到 ADR-024、TruthEngine 的 P1–P11 仍然是 **PROPOSED**,你没有确认过。工作约定(中文回复、不称呼姓名)原来只在 11-01 handoff 里,现已写进 Constitution。
- **下一步全部需要你决定或授权**:(A)你这边可选的真机探针(验证脚本锁);(B)对 PROPOSED 项和 open items 9–19 表态(尤其是 P11 是否保留);(C)是否把探针并入门禁(需要单独授权,并再跑一次真机);(D)明确说“做”之后才开始 `16_EventLog.js`。只说“继续”不等于授权新文件。
- **新窗口先读**:本文件 → `00_Project_State.js` → `00_ADR_Log.js` → `00_File_Map.js` → `00_Project_Constitution.js` → `00_Business_Rules.js`。第一步是 ADR-018 完整性核对(附录 A 的 sha256,按内容,不按文件名)。
- **审计的局限**:2026-11-02 至 2026-11-06 的原始消息已不在磁盘上,那一段只来自对话摘要和已持久化的文件(§4.4)。

---

## 1. Current Project State

Execution OS is an Execution Coordinator that runs above the Domain OSes, on Google Apps Script with Google Sheets as its Truth Layer. It is not a Domain OS and owns no Business Data (Constitution). Engineering framework: UEF v1.12 and Blueprint v1.2, with its own ADR log. Build position: **Slice 0 — Foundation, in progress, at a deliberate STOP.**

### 1.1 What exists in the repository (32 files, including this one)

| Group | Files | State |
|---|---|---|
| Runtime (7) | `60_Observability.js`, `10_Config.js`, `11_Schema.js`, `12_Identity.js`, `13_EventDefinitions.js`, `14_Versioning.js`, `15_TruthEngine.js` | BUILT and checkpointed (2026-09-12 to 2026-10-26). `15_TruthEngine.js` was changed on 2026-11-03 (P10, P11) and, in comments only, on 2026-11-07. Sandbox-tested; the engine's append path was also observed in real Apps Script, on the shapes the gate probed (§1.4). |
| Real-GAS verification (1) | `90_UnitTests.js` (one function, `runTruthEngineGate()`) | BUILT 2026-10-31, unchanged since. **Run twice in real Apps Script** (2026-11-03, 2026-11-05); verdict INCOMPLETE both times. It is pushed code, but test tooling, not runtime logic. |
| Node-only suites (8) | `NN_Name_Test.js` beside each of the 8 files above | Must never be pasted or pushed into Apps Script (they were pasted once by mistake and broke loading: ADR-021 note, ADR-025). `90_UnitTests_Test.js` was repaired 2026-11-07 (71 checks). |
| Deployment config (1) | `appsscript.json` | Written 2026-10-27. Pasted by hand with the scripts (item 14g); never read by the real clasp. **`.claspignore` is NOT in the owner's copy** (item 17; the 2026-11-01 handoff's manifest lists it). |
| Governance (5) | `00_Project_Constitution.js`, `00_Business_Rules.js`, `00_Project_State.js`, `00_File_Map.js`, `00_ADR_Log.js` | Comment-only files. Synced at every checkpoint (BR-9). |
| Documents (9) | `README.md` (a title), `Execution_OS_Architecture_v0.8.md` (stale header and section 9), the handoffs of 2026-10-08, 2026-11-01 and this one, a byte-identical second copy of the 2026-10-08 handoff (`…2026-10-08-1.md`, origin unexplained, left alone), the three 2026-09-12 documents | Reference. `00_File_Map.js` now has a RECORD DOCUMENTS block for them. |
| Archive (1) | `60_Execution-main-updated.zip` | An older snapshot (19 files and a directory entry, dated 2026-09-29 to 2026-10-09). Not extracted, not part of any manifest before 2026-11-03, left alone. |

Not in the repository, on purpose: `.clasp.json` (it holds the owner's Apps Script scriptId, which must not be invented), the lock probe `ZZ_Probe.js` and the scratch verification tools (Appendix B).

### 1.2 Numbers (all Node.js vm-sandbox results; none is a real-GAS result)

| Suite | Checks |
|---|---|
| `60_Observability_Test.js` | 10 |
| `10_Config_Test.js` | 14 |
| `11_Schema_Test.js` | 18 |
| `12_Identity_Test.js` | 17 |
| `13_EventDefinitions_Test.js` | 17 |
| `14_Versioning_Test.js` | 24 |
| `15_TruthEngine_Test.js` | 67 |
| `90_UnitTests_Test.js` (tests the gate itself) | 71 |
| **Total** | **238** (167 for the seven runtime files, 71 for the gate) |

Re-run at this checkpoint, after the last edit: 238/238 and `node --check` clean on all 21 `.js` files. Run at earlier checkpoints and not repeated, because no code or test file has changed since: 46 planted defects in `15_TruthEngine.js` (all caught), 52 in the gate (all caught), 16 in the gate's repaired Node suite (all caught; 8 in its fake platform, 6 in the engine, 2 in the gate); the totals were re-read in the saved outputs at this checkpoint. The selections are the builder's own, not exhaustive. **Not re-runnable on this tree:** the 45-check deployment harness (it expects `.claspignore` and needs two npm modules); it was last run on 2026-11-01.

### 1.3 Governance state

- ADR Log: **26 ADRs, ADR-000 to ADR-025.** Accepted: ADR-000 to ADR-020, and ADR-025 (narrow). **PROPOSED, not accepted: ADR-021 to ADR-024.** A PENDING DECISIONS list (not ADRs) sits after them.
- Provenance caveat that still stands (from the 2026-10-08 handoff): most of ADR-000 to ADR-018 were confirmed by the owner relaying a second AI's drafted text without objection, not in the owner's own freestanding words. "Accepted" means "sufficiently confirmed to proceed". ADR-019, ADR-020 and ADR-025 rest on the owner's own words; ADR-025's reach this file through a compaction summary, not the raw message.
- Definition of Ready / Done / Production-Ready: the 2026-09-12 verdicts in `00_Project_State.js` are **stale and were never re-determined** (open item 9). Do not quote them as current.

### 1.4 What real Apps Script has shown (OBSERVED, owner's own logs, Execution's own Spreadsheet "60.Execution")

| Run | When (Asia/Kuala_Lumpur) | Result |
|---|---|---|
| 1 | 2026-11-03 06:59 | PASS 5, FAIL 2, INCONCLUSIVE 2, SKIPPED 1, INFO 4, 17010 ms. The two FAILs were defects in `15_TruthEngine.js`: a leading "=" or apostrophe was not kept as typed even in a plain-text cell (PT.A), and a 50001-character cell made the platform refuse the write after part of the row had landed (OS). Answered by P11 and P10. |
| 2 | 2026-11-05 00:29 | PASS 7, FAIL 0, INCONCLUSIVE 2, SKIPPED 1, INFO 4, 21245 ms, verdict INCOMPLETE. PT.A 24 of 24 and PT.B 12 of 12 strings came back as typed; the 50001-character string was refused before the lock with nothing written. |

The three lock checks (LK.release, LK.releaseFail, LK.timeout) could not conclude in either run, because the platform granted a second script-lock object within one execution. **Still unobserved:** whether the script lock keeps two overlapping executions apart, its release paths, the timeout text, flush before release, exactly 50000 characters and the unit counted, strings starting with "+", "-" or "@" beyond "+3" and "-7", `getLastRow()` on long-lived tabs, latency under contention. The log of run 2 carries no hash of the pasted file, so that it was the 2026-11-03 engine rests on the owner's word.

### 1.5 One paragraph

Seven runtime files and one verification gate are written and pass their sandbox tests. The gate has run twice in real Apps Script, by hand-paste, and found and then confirmed the fix of two real defects in the TruthEngine write path; on the shapes it probed, the write path now behaves as designed. The owner's own bar is "works in real GAS", and one part of it, the lock, is still unobserved: a probe for it exists outside the repository and has not been run. Nothing is in progress, and nothing is authorized to start.

---

## 2. Important Decisions From This Window

"Window" here means 2026-11-02 to 2026-11-08: from the owner unpacking the 2026-11-01 handoff to this checkpoint. Status words are used strictly: **Accepted** = rests on the owner's own words. **PROPOSED** = the builder's choice, built or in use, not confirmed. **Fact stated by the owner** = recorded as given, not a design decision. **Applied** = done and delivered, no objection recorded, not separately confirmed. **Authorization** = a go-ahead for a named scope.

| # | Decision | Made by | Status | Persisted in |
|---|---|---|---|---|
| 1 | Files reach Apps Script for the real-GAS runs by hand-paste, clasp set aside (not decided against). The owner's words, as a compaction summary carries them: "A，手动贴。你可以输出代码，因为我会在电脑里备份一份". The texts of options A, B and C are not on disk | Owner | **Accepted**, narrow | ADR-025; ADR-021 note; Project_State items 14g, 14h, 17 and WHAT IS ACCEPTED; Constitution WORKING RULES; File_Map DEPLOYMENT CONFIGURATION note |
| 2 | `.claspignore` is not in the owner's copy: "这个OS还没部署，所以没有.claspignore". The owner explained the difference and chose to go on | Owner (fact) | Fact stated by the owner | Project_State item 17 and the 2026-11-03 entry; ADR-025 Context; File_Map note |
| 3 | Authorization of the 2026-11-03 checkpoint: "请做代码，也顺便更新治理文件" (scope: `15_TruthEngine.js`, its test, the governance files; the gate unchanged; then STOP) | Owner | Authorization, applied | Project_State 2026-11-03 entry |
| 4 | TruthEngine P10 (refuse a cell over 50000 characters before the lock) and P11 (a string starting with "=" or an apostrophe is written with one extra leading apostrophe), made after real run 1 found two defects | Builder | **PROPOSED**; observed holding in real run 2 on the probed shapes | ADR-022; Project_State item 11 and the 2026-11-03 entry; header of `15_TruthEngine.js` |
| 5 | The two real runs recorded as OBSERVED (real GAS, dated, which Spreadsheet), including that one execution can take the script lock twice | Owner's logs | Observed fact | ADR-022 and ADR-023 notes; Project_State 2026-11-03 and 2026-11-07 entries; Constitution PLATFORM CONSTRAINTS (added 2026-11-08) |
| 6 | The gate (`90_UnitTests.js`) was left unchanged; its OS PASS text, "so the lock was released", describes a lock that is never taken on the P10 path. Recorded, not fixed: a change to the gate needs its own go-ahead and another real run | Builder | Open | Project_State item 15; ADR Log PENDING DECISIONS annotation (2026-11-08) |
| 7 | A throw-away probe for the lock, `ZZ_Probe.js` (version 2026-11-06), written outside the repository and delivered 2026-11-06; the owner had asked how to verify the lock ("请教我要怎么做/验证", 2026-11-05 16:09) | Builder | **PROPOSED**; produced no evidence, never run | Project_State item 19; ADR-023 note (option C) |
| 8 | Scratch-first practice when the owner cannot test or review ("我现在在送外卖，不方便做测试。你能继续开发吗？", 2026-11-06 10:19): prepare outside the repository, write into it only after one go-ahead naming the files | Builder | **PROPOSED** (ADR-024 rule 7) | ADR-024 note; Constitution PROPOSED PRACTICES; Project_State 2026-11-07 and 2026-11-08 entries |
| 9 | The gate's Node suite repaired (71 checks), the engine and its test given comment-only updates, four governance files updated: written into the repository on the owner's tap on "全部 7 个文件(推荐)", 2026-11-08 06:35 | Owner (authorization); builder (work) | Authorization, applied; sandbox-verified only | Project_State item 18 and the 2026-11-07 entry; ADR-022 and ADR-023 notes |
| 10 | The owner's request of 2026-11-08 06:55: pause coding; audit the whole window against the repository; put every decision into a Governance file and the ADR Log, not only into a checkpoint; mark the unsettled as pending or proposed; save a downloadable handoff; then stop ("完成 checkpoint、Governance/ADR 持久化及核对后就停止，不要继续 coding") | Owner | **Accepted** (instruction); the go-ahead for this checkpoint | ADR-020 note; Project_State GOVERNANCE STATUS bracket and 2026-11-08 entry; Constitution WORKING RULES |
| 11 | ADR-024 rules 7 to 9: scratch-first; a fake platform tuned to a real log is reported as pinned to it; a bracket carries its drafting day | Builder | **PROPOSED** | ADR-024 note; Constitution PROPOSED PRACTICES |
| 12 | Working conventions: replies to the owner in Chinese, governance files and handoffs in English, never address the owner by name | Carried by the 2026-11-01 handoff | Convention; who first asked cannot be shown from the files | Constitution WORKING CONVENTIONS (2026-11-08) |
| 13 | A bare "继续" resumes authorized work and does not authorize a new file | Builder's reading, **not the owner's words** | **PROPOSED** | ADR-020 Impact; Constitution WORKING CONVENTIONS; Project_State NEXT ACTION |
| 14 | ADR-021 to ADR-024, P1 to P11 and the file-naming rules stay unconfirmed | — | **PROPOSED** | ADR Log header and entries; Project_State WHAT IS ACCEPTED |

**Not decided (pending).** Listed in `00_ADR_Log.js` under PENDING DECISIONS and in Project_State's WHAT IS STILL OPEN; none is an ADR and none is proposed: Definition of Ready/Done and real-GAS as a Done criterion (9); Domain read mechanism (10); whether P11 stays and whether the P7 guard stays (11); EventLog's read half (13); UCR6's text (12); owner-side deployment, now including whether clasp is ever adopted and `.claspignore` restored (14, 17); the gate's exception, name, PASS-text wording and whether it stays pushed (15); where the scratch tools live (16); folding the lock probe into the gate (ADR-023 option C); Architecture section 9 sync (3); the RUNTIME numbering of `26_ReferenceEngine.js` against `26_WeekViewEngine.js`; Reminder OS scheduling overlap, Rider OS's own bot, the "Decision OS" draft, UEF's Scope line, the ecosystem recovery manifest (1, 5, 6, 7, 8); whether to raise ADR-017/ADR-018 as UEF Change Proposals (not Execution OS's call).

**Persistence check.** Every row above that is Accepted or PROPOSED is in `00_ADR_Log.js` or points to an ADR entry there; every row also appears in at least one of the other governance files, as named in its last column. This was checked at this checkpoint by searching each named file for the row's anchor text (the results are in the 2026-11-08 entry of Project_State: no anchor missing). `00_Business_Rules.js` needed no change: no rule's status changed (all twelve stay Planned), and BR-9 already requires governance to stay in step with every change.

---

## 3. Status in the six categories

How to read "verified": the owner's own bar for runtime code is "works in real Apps Script" (Constitution, PLATFORM CONSTRAINTS). A Node sandbox result does not meet it. So 3.1 lists only what was verified against something stated in its row, with the tier; a file that is only partly observed in real GAS appears in 3.2 with what is and is not observed.

### 3.1 已完成且已验证 — Completed AND verified (each row says against what)

| Item | Verified against | Recorded in |
|---|---|---|
| The write path's plain-text protection, including P11, on the shapes the gate probes: every number-, date-, time-, hash- and TRUE/false-shaped string, a leading "=", a SUM formula and a leading apostrophe come back as typed (PT.A 24/24, PT.B 12/12). **Tier: OBSERVED real GAS**, run 2 (2026-11-05 00:29) | The owner's copy of the Execution log, in his own Spreadsheet. Not the shapes the gate did not probe; the unprobed ones are listed in 1.4 | ADR-022 and ADR-023 notes; Project_State 2026-11-07 entry |
| P10: a 50001-character string is refused before the lock and nothing is written. **Tier: OBSERVED real GAS**, run 2 | Same log. Exactly 50000 characters and the unit counted are not observed | Same |
| The gate loads and runs in real Apps Script when exactly the eight scripts and the manifest are pasted (never a `_Test.js` file, never a `00_` file); it ends with the Spreadsheet as it found it | Both logs (17010 ms and 21245 ms) | Project_State item 14g; ADR-023; ADR-025 |
| The gate's Node suite is repaired: 71/71, and it models the real platform as the two logs showed it. 16 planted defects each make at least one check fail; every one of the 13 new or rewritten checks fails under at least one of them; replays of both real logs through the fake reproduce PASS 5/FAIL 2/INCONCLUSIVE 2/SKIPPED 1/INFO 4 with "moved from 2 to 3" and PASS 7/FAIL 0/INCONCLUSIVE 2/SKIPPED 1/INFO 4 with verdict INCOMPLETE; the engine minus P10 and P11 behaves identically to the 2026-11-01 engine on nine platform settings. **Tier: sandbox, pinned to the two logs.** The 46 engine and 52 gate planted-defect runs were repeated on the 2026-11-07 files (46/46 and 52/52 caught) | The saved outputs of those runs (re-read at this checkpoint); the 8 suites re-run at this checkpoint (238/238) | Project_State item 18 and the 2026-11-07 entry; ADR-024 note |
| The working tree at this checkpoint | Before any edit: content-identical to the 2026-11-07 whole-tree manifest (31 of 31, none missing, different or unlisted). After: only the four governance files differ, plus this file; the other 27 are byte-identical | §4; Appendix A |
| Governance files in step with the code (BR-9) | Each of the five is comment-only with exactly one comment terminator; `node --check` clean (re-checked after the last edit) | Project_State 2026-11-08 entry |
| Carried from the 2026-11-01 handoff, still true: the 2026-10-24 reconciliation; the Domain-shared backend's 14-tab list **at source level**; Personal Life OS untouched | As stated there. Personal Life OS was not re-compared in this window; no step of this window touched it | Project_State log entries |

### 3.2 已实现但未验证 — Implemented but NOT verified in real GAS

Every sandbox number in this table is a Node `vm` result against hand-built fakes of Apps Script services; the fakes' behaviors are assumptions, except where a real log pinned them (marked).

| File | What it does | Sandbox evidence | What only real GAS can show (still unobserved) |
|---|---|---|---|
| `60_Observability.js` | `AlertService`, the owner of UCR3: the one way a failure is logged and thrown | 10/10 | Real `Logger` behavior. The gate's log shows its messages arriving (ERROR lines between checks) |
| `10_Config.js` | Configuration from Script Properties, no setters | 14/14 | Exercised implicitly: the engine reads the Spreadsheet ID through Config on every append, in both runs. Nothing checks the Config file's own cases in real GAS |
| `11_Schema.js` | Idempotent tab and header creation / verification | 18/18 | The `REAL_GAS_REQUIRED` list that `11_Schema_Test.js` prints. The gate did not call Schema |
| `12_Identity.js`, `13_EventDefinitions.js`, `14_Versioning.js` | ID generation; Execution's event vocabulary; `computeContentHash`, `isNewerThan` | 17/17, 17/17, 24/24 | Pure logic; only the runtime's globals. Nothing calls them in real GAS |
| `15_TruthEngine.js` | `append(tabName, record)`: validated (P10), locked, plain-text-protected (P6, P11). The only file that writes data rows. Nothing calls it yet except the gate | 67/67; 46 planted defects, each caught; its fake is pinned to the two real logs | Partly observed (3.1). **Not observed:** mutual exclusion of the script lock between two executions, its release after success and after failure, the timeout text, flush before release, exactly 50000 characters and the unit counted, strings starting with "+", "-" or "@" beyond "+3" and "-7", long-lived tabs, latency under contention |
| `90_UnitTests.js` | `runTruthEngineGate()`: the hand-run gate | 71/71 on its Node suite; 52 planted defects, each caught | It ran twice and said INCOMPLETE twice. Its lock checks cannot conclude in one execution. Its OS PASS text overstates (item 15) |
| `appsscript.json` | Manifest (V8, STACKDRIVER, Asia/Singapore PROPOSED, no scopes, no services) | The deployment harness (45 checks) last ran 2026-11-01 and cannot run on this tree | Pasted by hand (item 14g); not compared with the live project's manifest (item 14b); the time zone is the owner's call (14c) |
| `ZZ_Probe.js` (outside the repository) | Two overlapping executions against the engine's lock; a 50000-character string; strings starting "+", "-", "@" | 20 sandbox scenarios, 126 checks ok, 7 planted engine defects and 2 planted probe defects caught — against a fake with worker threads | Everything. It has never run in Apps Script and has produced no evidence of any tier (item 19) |

Also here, as practice rather than code: ADR-021 to ADR-024 (and their rules 7 to 9) are in use but unconfirmed (§2).

### 3.3 正在进行 — In progress

- **No implementation is in progress.** Nothing is half-written (§4).
- This checkpoint finishes when this file is delivered.
- Owner-side: no record that the owner has started the probe or any other real-GAS step since 2026-11-05.

### 3.4 尚未实现 — Not implemented

| Layer | Files (names as planned in `00_File_Map.js`; numbering is mostly PROPOSED) |
|---|---|
| Foundation | `16_EventLog.js` (next in the order the evidence supports; **not started**), `17_ReferenceBase.js`, `19_Utils.js` (only if a real need appears, EP3) |
| Runtime | `20_Router.js`, `21_Parser.js` (skeleton only), `22_VisionEngine.js`, `23_GoalEngine.js`, `24_ExecutionProjectEngine.js`, `25_TodayViewEngine.js`, `26_WeekViewEngine.js`, `27_PlanningEngine.js`, `28_DashboardEngine.js`, `29_ReviewEngine.js`, `30_WaitingEngine.js`, `31_ExecutionEventEngine.js`; the `26_ReferenceEngine.js` entry that is missing and collides in number |
| Intelligence | `40_AIPlanningConnector.js`, `41_GoalDecompositionAssist.js`, `42_PrioritySuggestion.js` |
| Integration | `50_DomainAdapterRegistry.js`, `51_ReferenceSync.js`, `52_ReminderOSAdapter.js`, `53_PersonalAICoreAdapter.js`, `54_AIProviderInterface.js` |
| Cross-cutting / Testing | `61_Diagnostics.js`, `91_ManualChecklists.js` |
| Other | Execution OS's own Telegram bot and webhook (ADR-016); any AI call; `.clasp.json` and `.claspignore` (not in the owner's copy); the Architecture document's section 9 sync. Slices 1 to 5 are not started. Nothing has run against a Domain Spreadsheet |

### 3.5 未解决 / blocked — Unresolved or blocked

| Item | State | Waiting on |
|---|---|---|
| 1. Reminder OS Phase B overlaps Execution's scheduling needs | Open, not touched | Design together with Reminder OS |
| 2. Domain tab list | Source-verified only | The owner's call whether source level is enough before `51_ReferenceSync.js` |
| 3. Architecture v0.8 section 9 and header not synced (now past ADR-025) | Tracked drift (EP2) | A separate authorization to edit that document |
| 4. AI Provider Interface shape | Deferred | `40_AIPlanningConnector.js` |
| 5. Rider OS's own Telegram bot never read | Inferred only | Reading Rider OS (read-only) |
| 6. A "Decision OS" in one unrelated draft | Not introduced | Real evidence |
| 7. UEF's Scope line and coordinator projects | A candidate UEF Change Proposal | Not Execution OS's call |
| 8. UEF §0.6 item 4's ecosystem `Universal-Recovery-Manifest.md` | Cannot be created or verified here | The ecosystem maintainer |
| 9. Definition of Ready / Done / Production-Ready; real GAS as a Done criterion | Stale verdicts, not re-determined | **Owner** |
| 10. Domain read mechanism (Spreadsheet read vs Personal Life OS's QueryEngine or library) | Undecided | **Owner**; needed before `50_` / `51_` |
| 11. TruthEngine P1 to P11 | ADR-022 PROPOSED. P11 held in run 2; whether it stays, and whether the P7 guard stays (the platform grows the grid itself), are open | **Owner** (most worth a call: P2, P3, P6/P11, P7, P10) |
| 12. UCR6's primary text is not in the repository | `15_TruthEngine.js` was checked only against File_Map's paraphrase | Someone with UEF v1.12 at hand |
| 13. Where `16_EventLog.js`'s read half gets its Sheet access | Undecided | Settle at that file's checkpoint |
| 14. Owner-side deployment: (a) `.clasp.json`, (b) compare with the live project before a first push, (c) time zone, (d) `EXEC_OS_SPREADSHEET_ID` (set in practice: both runs used "60.Execution"), (e) `clasp status` listing 9 files, (f, g) done by hand-paste, (h) the route is ADR-025 | a, b, c, e open; clasp not used | **Owner** |
| 15. The gate's test-scaffolding exception; the file name `90_UnitTests.js`; whether it stays in the pushed set; the OS PASS-text wording | Undecided | **Owner**; the wording is a code change: its own go-ahead and another real run |
| 16. The scratch verification tools live outside the repository, so several sandbox numbers cannot be re-run from the repository alone | Three archives delivered (Appendix B); where they live is undecided | **Owner** |
| 17. `.claspignore` is absent from the owner's copy; the File Map and the 2026-11-01 manifest still list it | The owner said the OS is not deployed yet; nothing restored | **Owner**: restore, drop, or keep absent; which copy governs |
| 19. The lock probe `ZZ_Probe.js` has not been run | Delivered 2026-11-06 | **Owner** (optional, real GAS) |
| ADR-021 to ADR-024 and ADR-024's rules 7 to 9 | PROPOSED | **Owner** confirms, changes or drops |
| The real-GAS gaps listed in 1.4 | Unobserved | The probe, or another real run |
| RUNTIME numbering: `26_ReferenceEngine.js` against `26_WeekViewEngine.js` | Flagged in File_Map | A future RUNTIME reconciliation round |

(Item 18, the gate's Node suite, was open from 2026-11-03 and is resolved: see 3.1.)

### 3.6 已被后续决定取代 — Superseded

| Superseded | By |
|---|---|
| The 2026-11-01 handoff's current-state sections: "219 checks", "30 files", "never run in Apps Script", "P1 to P9", "`.claspignore`" in the manifest | This file |
| The 2026-11-01 handoff's Option A (clasp push, `clasp status`, then run the gate) | What the owner actually did: hand-paste (ADR-025). The remaining real-GAS step is the lock probe (item 19) |
| "Nothing has been run in Apps Script" | Two real runs of the gate (1.4) |
| The known-red gate Node suite (26 of 65 failing, 2026-11-03) | The repaired suite, 71/71 (2026-11-07) |
| TruthEngine's nine choices P1 to P9 as the full set | P1 to P11 (P10, P11 PROPOSED) |
| "25 ADRs" | 26, with ADR-025 |
| ADR-024 rule 3's numbers (28 and 52) | 46, 52 and 16 (ADR-024 note) |
| NEXT ACTION texts of 2026-11-01, 2026-11-03 and 2026-11-07 | The 2026-11-08 text (Project_State) |
| The 2026-09-12 Definition-of-Ready / Done verdicts | **Stale, not superseded by any decision.** Kept in 3.5 (item 9) |

Older superseded items (original File_Map numbering, the Dual-Bus EventBus draft, the "UEF v1.4/v1.5" guess, the Schema–TruthEngine circularity, PascalCase event names) are listed in §3 of the 2026-10-08 handoff and still hold.

---

## 4. Current Implementation Checkpoint

### 4.1 Where things stand

- **Last implementation work:** the 2026-11-07 checkpoint: `90_UnitTests_Test.js` rewritten (1277 to 1428 lines; 65 to 71 checks), comment-only updates to `15_TruthEngine.js` (its code is byte-identical to the 2026-11-03 file) and to `15_TruthEngine_Test.js` (only comments and the notes it prints at the end changed), and four governance files. It was written into the repository on 2026-11-08 06:35 after the owner's tap, delivered, and ended in a deliberate STOP.
- **Half-done work: none.** No partial file, no temporary file in the repository, no edited-but-untested code. Runtime, test and deployment files are byte-identical to the 2026-11-07 state (Appendix A). Files outside the repository: the lock probe (finished, delivered, never run) and the scratch tools (Appendix B).
- **What was interrupted:** only this checkpoint's own work. The owner's request arrived twenty minutes after the 2026-11-07 checkpoint was applied. The audit's read-only part was done first; a context compaction then fell before the governance edits, and the owner's "继续" messages of 2026-11-08 16:04 and 21:14 and of 2026-11-09 06:44 resumed it. After the breaks the tree was re-verified against the 2026-11-07 manifest (31 of 31, most recently on 2026-11-09 before the repository was written): exactly as left. Nothing else was interrupted.
- **Where to continue:** nowhere in code. See §5.

### 4.2 Delivery ledger

| Delivery | Scope | Delivered as |
|---|---|---|
| 2026-10-24 to 2026-11-01 | Reconciliation, TruthEngine, deployment config, the gate, the 2026-11-01 audit | See the 2026-11-01 handoff §4.2 |
| 2026-11-01 | `60.Execution-scratch-tools-2026-11-01.zip`: the five scratch tools (the owner's extracted copy has `README.txt`, `clasp_select_check.js`, `gas_scope_check.js`, `integration_smoke.js`, `mutate.js`, `mutate_gate.js`) | A zip, with the 2026-11-01 checkpoint |
| 2026-11-02 | The nine files to paste (7 runtime files, `90_UnitTests.js`, `appsscript.json`), hashes checked against the 2026-11-01 manifest, with steps | Files in the conversation |
| 2026-11-03 | TruthEngine fix (P10, P11): `15_TruthEngine.js`, `15_TruthEngine_Test.js`, four governance files, diff, whole-tree manifest, sums; also `mutate_2026-11-03.js` (the 46-defect version of `mutate.js`) | `Execution_OS_Checkpoint_2026-11-03_changed_files.zip` (the zip's file time is 2026-11-04 11:22; sha256 `774d4b12…`), `15_TruthEngine.js`, `mutate_2026-11-03.js` |
| 2026-11-06 | The lock probe `ZZ_Probe.js` (version 2026-11-06, 1319 lines, sha256 `8950776e…`) with step-by-step instructions | The file, in the conversation |
| 2026-11-07 (delivered 2026-11-08 06:35) | Item 18 and the second run: 7 files (`90_UnitTests_Test.js`, `15_TruthEngine.js`, `15_TruthEngine_Test.js`, four governance files), diff, whole-tree manifest, sums; and the second scratch-tools archive | `Execution_OS_Checkpoint_2026-11-07_changed_files.zip` (157246 bytes, sha256 `05a725f3…`), `60.Execution-scratch-tools-2026-11-07.zip` (49069 bytes, sha256 `4db9a1fe…`) |
| **2026-11-08 (this)** | **Audit, persistence and handoff, no code** | **This file, the four changed governance files, a diff, the whole-tree manifest and sums** |

### 4.3 What this checkpoint changed

- `00_ADR_Log.js`: ADR-025 added (Accepted, narrow); dated notes in ADR-020 and ADR-021; in ADR-024 a note that brings rule 3's numbers up to date and adds rules 7 to 9 (PROPOSED); header (26 ADRs, status sentence, provenance sentence); three PENDING DECISIONS annotations.
- `00_Project_Constitution.js`: a Code status note; a dated paragraph of observed platform facts in PLATFORM CONSTRAINTS; a note in WORKING RULES and a new WORKING CONVENTIONS block; the ADR-024 line in PROPOSED PRACTICES.
- `00_File_Map.js`: header note; a note on `.claspignore` under DEPLOYMENT CONFIGURATION; a new RECORD DOCUMENTS block.
- `00_Project_State.js`: header; GOVERNANCE STATUS bracket; DESIGN VERSION range; CODE STATE ([Added 2026-11-08]); WHAT IS ACCEPTED (an ADR-020 note, a new ADR-025 bullet, a note on ADR-024); item 3; new sub-item 14h; a bracket in item 17; the 2026-11-08 checkpoint-log entry; NEXT ACTION.
- This file.
- Not changed: every runtime, test and deployment file; `00_Business_Rules.js`; the Architecture document; the three older handoffs; the 2026-09-12 documents; `README.md`; the zip.

### 4.4 Limits of this audit

- The session's raw transcript on disk: when the audit began it started at 2026-11-06 14:40 (Asia/Kuala_Lumpur); after the compaction during this checkpoint it starts at 2026-11-08 07:00 (still so when its first record was read again on 2026-11-09 06:46). Everything earlier (2026-11-02 to 2026-11-06 and the first hours of 2026-11-08) survives only as compaction summaries and as what they persisted: the governance files, the delivered archives and the files in this repository. The audit of that stretch rests on those records, not on the original messages. An instruction that was never persisted anywhere would not show up in it.
- The owner's words quoted for 2026-11-02 to 2026-11-06 come from the lists of his messages in the compaction summaries, except where a governance entry written at the time quotes them (for example "请做代码，也顺便更新治理文件" in the 2026-11-03 entry). The original messages could not be re-read. That is why ADR-025's wording carries a caveat, and why the texts of options A, B and C are not reconstructed.
- The day of the hand-paste choice is not recoverable: ADR-025 gives the interval (after the owner's zip of 2026-11-02, before the first paste log of 2026-11-03 06:56).
- Nothing in this checkpoint ran in Apps Script, and nothing in it could have.

### 4.5 Authorization chain of the window (what permitted each repository write)

| When | Owner's words | What was written into the repository |
|---|---|---|
| 2026-11-02 | (reading the handoff; "先解压然后读handoff先。你建议要从哪里开始") | Nothing |
| 2026-11-03 15:37 | "请做代码，也顺便更新治理文件" | The 2026-11-03 checkpoint: six files |
| 2026-11-08 06:35 | A tap on "全部 7 个文件(推荐)" (other options: "只写测试+治理(5 个)", "只写治理(4 个)", "先别动仓库") | The 2026-11-07 checkpoint: seven files |
| 2026-11-08 06:55 (resumed 2026-11-08 16:04 and 21:14, and 2026-11-09 06:44) | The request quoted in §2, row 10 | This checkpoint: four governance files and this file |

Every bare "继续" in between (Appendix D) was read as "go on with what is already authorized" and never as a go-ahead for a repository file (the builder's reading, PROPOSED; ADR-020).

---

## 5. Exact Next Steps

**Step 0, always first (ADR-018).** Check the working directory, or the attached zip, against the sha256 manifest in Appendix A, **by content, not by file names**. The manifest lists 31 files; this file is not in it (a file cannot contain its own hash), so compare it with the `MANIFEST_whole_tree_after_2026-11-08.txt` delivered beside it, or with the sha256 given in the delivery message. Anything missing, different or unexplained is a **STOP**: do not rebuild it from memory and do not stand in a mock for it; restore it from the 2026-11-08 delivery (ask the owner to attach the archive if it is not on disk) and report. The absence of `.claspignore` is already explained by the owner and is not a difference to chase.

**Step 1.** Read the files in §6, in that order.

**Step 2.** Do not start any file. If the owner's first message is a bare "继续", answer with the menu below and wait: a bare "继续" resumes authorized work, and none is in flight (ADR-020, builder's reading, PROPOSED). If the message names a step, do that step only.

### Option A — The owner's real-GAS probe for the lock (owner-side; optional; Claude can prepare and read, not do or verify)

The route is the owner's hand-paste (ADR-025). The probe's master copy is `probe/ZZ_Probe.js` in `60.Execution-scratch-tools-2026-11-07.zip` (sha256 `8950776e807f48da714a32403e4b7cc37284e71d8994f9f3feacd38c7f297c68`); its header has the full instructions.

1. Make sure the Apps Script project holds the current nine files and nothing else from the repository. To make a log prove which engine ran, paste the repository's present `15_TruthEngine.js` (it is the 2026-11-03 engine plus comments; run 2 used the 2026-11-03 engine on the owner's word only).
2. Paste `ZZ_Probe.js` as one extra file. Run `zzpSetup` once.
3. Open the project in a second browser tab. In tab 1 run `zzpRunA`; within 2 minutes, in tab 2, run `zzpRunB`. Do not touch the Spreadsheet or run anything else until both say "Execution completed".
4. Run `zzpVerify` (read-only) and copy the whole log back. Run `zzpCleanup`.
5. Run `zzpBoundary` (a single execution: three long strings, fourteen short ones) and copy its log back.
6. Delete `ZZ_Probe.js` from the project.

**What Claude does with the logs (analysis and governance only):** read each phase against the matching unobserved item in 1.4. Record what was observed in the governance files as OBSERVED (real GAS, dated, which Spreadsheet), reporting separately a harness bug, a production defect and any mistake of its own (ADR-024 rule 4). The probe's numbers are PROPOSED. **Any change to the engine, the gate or the probe is code: it needs its own explicit go-ahead.** Update items 11, 15 and 19 and the status of ADR-022 and ADR-023 only as the owner decides.

### Option B — The owner's decisions (each answerable in a sentence; none is started)

In the order they matter: 11 (does P11 stay, now that it held in real GAS? P2 append-only, P3 the 10-second lock wait, P7 grid-growth guard, P10); 9 (is real GAS a Done criterion, and per file or per slice?); 15 (the gate's exception, its file name, whether it stays pushed, the OS PASS-text wording); 17 and 14 (restore `.claspignore`, or keep hand-paste and drop the clasp route; the time zone); 16 (where the scratch tools live); 10 (the Domain read mechanism, before `50_` / `51_`); and confirming, changing or dropping ADR-021 to ADR-024 and the three new rules in ADR-024.

### Option C — Fold the probe, or the part worth keeping, into the gate (ADR-023 option C)

A change to `90_UnitTests.js`: its own explicit go-ahead, and another real run before anything counts.

### Option D — `16_EventLog.js` (only on an explicit go-ahead)

Planned scope (File_Map): append/read for `Execution_Events`, validating each event type against `13_EventDefinitions.js` before writing, writing through `15_TruthEngine.js`. It is TruthEngine's first real caller, so items 11, 12 and 13 are best settled first; the read half's Sheet access is undecided (item 13) and is settled at that file's own checkpoint, not pre-built. One file plus its Node test, then STOP.

### Step 3, after any unit of work

The UEF §0.6 sequence (File → Export → Read-back → Verify → Test → Evidence → STOP), the Checkpoint Integrity Gate before and after, governance synced in the same step (BR-9), delivery, a "Scope respected" statement, then **STOP**. Do not go on to the next file.

---

## 6. Files the Next Window Must Read First (in this order)

1. **This file.**
2. **`00_Project_State.js`**: first the header, CODE STATE, WHAT IS ACCEPTED, WHAT IS STILL OPEN (items 1 to 19), then the 2026-11-03, 2026-11-07 and 2026-11-08 checkpoint-log entries and NEXT ACTION. The rest is the evidence log.
3. **`00_ADR_Log.js`**: the header (which ADRs are Accepted and which PROPOSED), ADR-018 to ADR-025, and PENDING DECISIONS.
4. **`00_File_Map.js`**: numbering, DEPLOYMENT CONFIGURATION (naming rules PROPOSED; `.claspignore` note), RECORD DOCUMENTS, TESTING, and the RUNTIME numbering note.
5. **`00_Project_Constitution.js`**: identity and boundaries, PLATFORM CONSTRAINTS (including the observed platform facts), the Checkpoint Integrity Gate, WORKING RULES, WORKING CONVENTIONS, PROPOSED PRACTICES.
6. **`00_Business_Rules.js`**: BR-1 to BR-12, all Planned; BR-9 and BR-10 matter most.
7. **The headers of `15_TruthEngine.js`** (P1 to P11, the OBSERVED block) **and `90_UnitTests.js`** (HOW TO RUN, evidence tiers, what it covers and does not), and the `REAL_GAS_REQUIRED` section of `15_TruthEngine_Test.js`. The headers, not the whole files.
8. **`Execution_OS_Checkpoint_Handoff_2026-11-01.md`**: only for the history of the 2026-10-24 to 2026-11-01 audit (its current-state sections are stale). `Execution_OS_Checkpoint_Handoff_2026-10-08.md`: the provenance note for the acceptance of ADR-000 to ADR-018; its counts are stale.
9. **`Execution_OS_Architecture_v0.8.md`**: the reasoning record. Its header and section 9 are stale; **where it conflicts with the ADR Log, the ADR Log wins.**
10. Background only: the three 2026-09-12 documents. `README.md` is a title.

---

## 7. Things Not To Redo / Not To Assume

### Not to redo

- Do not redo this audit, the 2026-11-01 audit or the 2026-10-24 reconciliation. Run the ADR-018 content check and read the governance files.
- Do not re-derive the observations of the two real runs, or re-run the replays: the fake platform is pinned to them and the replay check passes by construction.
- Do not re-mutate the engine, the gate or the gate's suite unless their code changes; the totals (46, 52, 16) are in ADR-024's note and the hashes are in Appendix A.
- Do not re-test the probe in the sandbox unless it changes: 20 scenarios, 126 checks ok, on 2026-11-07.
- Do not re-decide the hand-paste route (ADR-025) and do not "restore" `.claspignore` to make a harness pass.
- Do not re-read Personal Life OS to rebuild the Domain tab list; the source-level evidence is recorded.
- Do not re-fetch clasp's source or Google's Lock and Spreadsheet pages for what is already recorded (evidence tiers in the gate header, ADR-021, ADR-023). Fetch only for a new question.
- Do not try to run the real clasp here: the npm registry is unreachable.
- Do not re-debate settled design points from the 2026-10-08 handoff: `17_ReferenceBase.js` does not persist; Schema and TruthEngine do not depend on each other; the Foundation numbering; lowercase `entity.action` event names; no schema-version stamp for Versioning.
- Do not try to "store this in memory": there is no memory-writing tool. Governance files are the memory.

### Not to assume

- **Do not assume the probe has run.** No record says so. Do not assume the script lock works: it is unobserved, and the gate has said INCOMPLETE twice.
- **Do not read "PASS 7, FAIL 0" as "TruthEngine is verified in GAS".** It covers the shapes the gate probed, in one Spreadsheet, from one execution at a time; the verdict was INCOMPLETE.
- **Do not read "tests pass" as "works in GAS".** All 238 are sandbox checks against fakes. The fake platform in `90_UnitTests_Test.js` and in `15_TruthEngine_Test.js` was tuned to two real logs; outside the 36 shapes they probed, its rule for what a cell re-types is a guess.
- Do not assume which file version was pasted into Apps Script: no log carries a hash. Do not assume the Apps Script project's files equal the repository's; nothing compares them (ADR-025).
- Do not treat ADR-021 to ADR-024, ADR-024's rules 7 to 9, the file-naming rules or P1 to P11 as approved. Do not treat ADR-025's quoted words as verbatim: they come from a compaction summary.
- Do not quote the Definition-of-Ready / Done / Production-Ready verdicts as current. They are stale.
- Do not assume the time zone is decided, that the Domain tab list is verified live, or that the real clasp behaves like the harness.
- Do not assume `.claspignore` or `.clasp.json` exists. Do not assume the 2026-11-01 handoff's state sections, counts or manifest are current.
- Do not assume the Architecture document is current.
- Do not assume a bare "继续" authorizes a new file.
- Do not assume the surviving transcript is complete (§4.4): rely on the persisted files.
- Do not assume the dated brackets in the governance files carry the day a change was applied: a bracket carries the day it was drafted, and the entry says when it was applied (ADR-024 rule 9, PROPOSED).
- Do not edit Personal Life OS or any other sibling (ADR-019), and do not copy their files into this repository.
- Do not address the owner by name: the older governance text uses two names, and neither is to be used.
- Replies to the owner are in Chinese. Governance files and this handoff are in English.

---

## Appendix A — sha256 manifest of the repository at the end of this checkpoint

This file is not in the manifest, because a file cannot contain its own hash. To check: save the lines below as `manifest.txt` and run `sha256sum -c manifest.txt` inside the repository directory. 31 files; `.claspignore` is absent on purpose (item 17).

```
68a1e7589423d7ac1b2376adeedcb7e7ff82f23ba27f60ed1d24aba640443353  00_ADR_Log.js
e07c2b5f066036086dd9a61522378fddf1bc51c61bfe64139716982927b50846  00_Business_Rules.js
69107a4ac149f8bebca983a0c0a6b7ad994efc63cfd24996d97819d401a8ead7  00_File_Map.js
8ffed845147e2ba0e257e145479a5cd5eb61c9683cd6818031ca139df1920735  00_Project_Constitution.js
35598624ef73f64aa9c191f305f8587fc113f39c74894860db0b6b1bc93fcb7e  00_Project_State.js
4324fd9a946b0153dc241ba881e4110f374b402ff59e37065be60d4ee0deec4e  10_Config.js
b6cd9cf0e7ebfad39fabde11be7fc5a3e5cddbe484611b5ac944a73577f32947  10_Config_Test.js
50fd181da5b18d7b6f238a8d4b6b6a0e2f66981a7720a6ef3e8e5693aa202dc2  11_Schema.js
09a5dc5fc61ef9d1257bc1080cd0ed04c92aa11720f7cb6b82dcb4b73dd15ab2  11_Schema_Test.js
6bd76b60c3780c0bb6d1331c1f3a4fa867aae02e6fcfb47e809468cb815725c7  12_Identity.js
a1dee4242c6b1cf3e0cc2f5f19ef18e5b1caad5b996a15fd1f97810ed52060c7  12_Identity_Test.js
303fa82f5bb78a0c54607ca876ea80ac1083e78bb9321ac4a85aabfa3e7417a3  13_EventDefinitions.js
ed9b9606d5acbae44962978b422f0c4c9a5dfe1d2049c5712d22f57666752d95  13_EventDefinitions_Test.js
90629c84b5df069cab8f315e7ca6a9932f46e28851c4b96ad5d73291e91527f2  14_Versioning.js
092389c5207ce1a14573470a3b338b791a70d33f4a7b6499d59b3256ce92dddb  14_Versioning_Test.js
19a91d5d8003dddfd6c14a88e5c9640fd5c32f7f4488b5cdd13c34bf4c3ee192  15_TruthEngine.js
9bee213c2637836e5b988d923cf10f90ad5ea71e00152bd3d47c57b38799f18c  15_TruthEngine_Test.js
79bef367bb1252f4a1aee24c2348e44a0091eed8aa19aed2324c7c9ef644c9d6  60_Execution-main-updated.zip
f104bbc090f779efbe8e7eb29bfd13952bc5c4ada1f5f7e1c0beae1d6bae174d  60_Observability.js
6bc517cac7f9d84ab36941a2358a5851eb45a226c74b27344cdfb27580245a35  60_Observability_Test.js
353eb85e0ed0f8bf134d5eda291ac7f23b96c8ccd041ce2c63d33709fb41b053  90_UnitTests.js
0ac710b39821ac46767197acba46cef7fd9ee9f744b0cdd70af50d2c728df832  90_UnitTests_Test.js
677c46deddbfbc21a2aa6cd933daf5b4cfe89abc909593962232c0450137140e  Execution_OS_Architecture_v0.8.md
bb1645148cb8b76ebb4c1b15c936456bcb39674852bbd39e7586a965a1e86cca  Execution_OS_Checkpoint_Handoff_2026-10-08-1.md
bb1645148cb8b76ebb4c1b15c936456bcb39674852bbd39e7586a965a1e86cca  Execution_OS_Checkpoint_Handoff_2026-10-08.md
ddbd4b46ddafd23e93cb68dc5672412b740eb2ceee1607f0256c8aedcbb69da5  Execution_OS_Checkpoint_Handoff_2026-11-01.md
8ca9189ba04b0fd17227cafdce03fe63df6c3329a05f34e15588f507d5176a40  Execution_OS_Governance_Reconciliation_2026-09-12.md
ed3bae47cb324db831f32833c5e2e8f32f8c1b5517080b60619338ae0d22ac2c  Execution_OS_Implementation_Master_Plan_2026-09-12.md
1e3de6535340b59cd9f55ec9b42cb0d9c604efbace8c8f57a844e2c00f9d72fd  Execution_OS_Post_Reconciliation_Closure_2026-09-12.md
fca3740208384f56125c877d02d955bbd249ebfbff2f94526dafde6e5d7735b1  README.md
536a6a1949f96c03d1da9d21e299b76f86f976bd8dcaba32e01de686f8358fd1  appsscript.json
```

## Appendix B — scratch verification tools and the probe (outside the repository)

Several sandbox numbers in the Project_State log came from scripts that were never in the repository (open item 16). Three deliveries hold them. They are not part of the project, nothing refers to them at runtime, and they are not deployed. Their evidence tier is "the same library call and logic, run outside the real tool": not real clasp and not real GAS.

| Delivery | Contents |
|---|---|
| `60.Execution-scratch-tools-2026-11-01.zip` (2026-11-01) | `clasp_select_check.js` (the 45-check deployment harness; needs `micromatch` 4.0.x and a `.claspignore`), `gas_scope_check.js` (the seven runtime files in one shared scope), `integration_smoke.js`, `mutate.js` (28 planted defects in `15_TruthEngine.js`), `mutate_gate.js` (52 planted defects in `90_UnitTests.js`), `README.txt` |
| `mutate_2026-11-03.js` (2026-11-03; sha256 `a6b3ea64…`) | The 46-defect version of `mutate.js` (28 plus 18 for P10 and P11) |
| `60.Execution-scratch-tools-2026-11-07.zip` (2026-11-08 06:35; 15 files; sha256 `4db9a1fe…`) | `gate_suite/` (`suite_loader.js`, `planted_defects.js` with 16 defects, `replay_real_runs.js`, `engine_equivalence.js`, the 2026-11-01 engine as `baseline_2026-11-01_15_TruthEngine.js`, sha256 `0dceee1a…`), `probe/ZZ_Probe.js` (master copy) and `probe/harness/` (the worker-thread sandbox, 20 scenarios), `README.txt`, `SHA256SUMS.txt` |

The harness `clasp_select_check.js` hard-codes the expected tracked set (9 files) and needs `.claspignore`: it is not runnable on the owner's present copy. The scratch area these were built in is session-local; the owner's downloaded copies are the only durable ones.

## Appendix C — environment facts and tool quirks

- No memory-writing tool exists in this environment.
- The npm registry is unreachable. `micromatch` was present under `/opt/npm-tools/node_modules` in an earlier sandbox; a new container may not have it.
- The Write tool turns a backslash followed by `u` and four hex digits into the raw character. Any file that must keep such an escape needs a script and a read-back (the probe builds its two special characters with `String.fromCharCode` for this reason). The gate's check pins `90_UnitTests.js` to ASCII-only code.
- A governance file holds exactly **one** comment terminator and no text that contains the two-character sequence that ends a comment: never write a glob with a double star and a slash there; write it in words.
- Available in the sandbox: `zip`, `unzip`, `patch`, `python3`, `node` (v22), `diff`, `sha256sum`. The shell's working directory resets between calls: use absolute paths.
- The owner's time zone is Asia/Kuala_Lumpur (UTC+08:00). Transcript timestamps are UTC. The Spreadsheet's time zone is Asia/Shanghai and the script's is Asia/Singapore (as the gate's log printed them).
- A question that the owner can answer with one tap (a listed choice) works better than free text when he is not at a keyboard; the 2026-11-08 06:35 go-ahead was taken that way.

## Appendix D — the owner's messages in this window, as recorded

Messages before 2026-11-08 07:00 are known only from compaction summaries (§4.4); times are as the summaries gave them. A bare "继续" resumes authorized work (ADR-020, builder's reading, PROPOSED).

| When | Message |
|---|---|
| 2026-11-02 | The 2026-11-01 repository zip and scratch-tools zip, with "先解压然后读handoff先。你建议要从哪里开始" |
| 2026-11-02/03 | "这个OS还没部署，所以没有.claspignore。你觉得ABC哪一个好？"; then "A，手动贴。你可以输出代码，因为我会在电脑里备份一份"; then "好的，下一步要做什么" |
| 2026-11-03, shortly after 06:56 | The pasted log of the failed first load (log time 06:56; "SyntaxError: Identifier 'Config' has already been declared", 10_Config_Test.gs) |
| 2026-11-03, shortly after 07:00 | The PDF of the first real run (run time 06:59) |
| 2026-11-03 15:37 | "请做代码，也顺便更新治理文件" |
| 2026-11-03 21:42, 2026-11-04 06:00 | "继续" (twice) |
| 2026-11-04 11:18 | The first run's PDF again (identical hash; not a second run) |
| 2026-11-05 00:31 | The PDF of the second real run (00:29) |
| 2026-11-05 10:47 | "继续" |
| 2026-11-05 16:09 | "请教我要怎么做/验证" |
| 2026-11-06 00:05, 07:03 | "继续" (twice) |
| 2026-11-06 10:19 | "我现在在送外卖，不方便做测试。你能继续开发吗？" |
| 2026-11-06 14:38, 23:29; 2026-11-07 06:10, 14:21; 2026-11-08 00:22, 06:34 | "继续" (six times) |
| 2026-11-08 06:35 | A tap on "全部 7 个文件(推荐)" |
| 2026-11-08 06:55 | The request quoted in §2, row 10 |
| 2026-11-08 16:04, 21:14; 2026-11-09 06:44 | "继续" (three times) |
