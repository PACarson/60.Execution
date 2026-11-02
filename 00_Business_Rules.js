/*
=====================================================================
EXECUTION OS — BUSINESS RULES
=====================================================================
Status: All rules below are Planned — no rule has actually been
implemented or tested yet. (Updated 2026-10-24: this line read "zero
code exists", true when written, stale since Slice 0 began. The
Foundation files now built — see 00_Project_State.js — contain no
Engine that enforces a rule below, and no runtime file references a
BR-n rule (checked 2026-10-24); per-rule status was not otherwise
re-audited. Updated 2026-10-26: 15_TruthEngine.js's header now cites
BR-10, so that "no runtime file references a BR-n rule" holds only as
of 2026-10-24. That file takes a tab name only and always writes to
Config's own Spreadsheet, which structurally supports BR-10 for its
own writes — sandbox-tested only, and not an enforcement: it cannot
detect EXEC_OS_SPREADSHEET_ID being pointed at a Domain Spreadsheet,
and the rule's real subject, Reference sync, is unbuilt. BR-10 stays
Planned. Updated 2026-10-31: 90_UnitTests.js's header cites BR-10 too.
Its Domain-tab guard stops that one function's own run when the
configured Spreadsheet holds a tab with a Domain OS name — a best-effort
stop, not an enforcement, sandbox-tested only; BR-10 still stays
Planned.) Do not read "Planned"
as "low confidence" — it means "designed, not yet built," per UEF's
own status discipline (do not disguise a design decision as an
implemented one).
Source: Execution OS Architecture Design v0.8, section 8.
=====================================================================

| ID    | Rule                                                                                                                              | Status  | Related ADR |
|-------|-----------------------------------------------------------------------------------------------------------------------------------|---------|-------------|
| BR-1  | Execution must never create a full copy of any Domain business entity; only a Reference with cached snapshot fields is allowed.   | Planned | ADR-002     |
| BR-2  | Every Reference must be traceable via source_domain + source_entity_id. An unresolvable Reference is marked Stale, never silently dropped. | Planned | ADR-002     |
| BR-3  | Goal horizon hierarchy must be internally consistent: a child Goal's horizon can never be longer than its parent's (e.g. a Quarter goal's parent cannot be a Week goal). | Planned | —           |
| BR-4  | Any record with Created_Method = AI_Suggested must also carry AI_Confidence and AI_Reason.                                        | Planned | ADR-005     |
| BR-5  | Every AI suggestion is written to AI_Suggestions_Log, never overwritten; rejected suggestions are kept permanently.               | Planned | ADR-005     |
| BR-6  | A Waiting Item must link to at least one Reference, or explicitly declare "no Domain reference" (e.g. waiting on a person only).  | Planned | —           |
| BR-7  | Today View / Week View never persist aggregated business data; only Pin/Snooze-style manual overrides may be persisted.           | Planned | ADR-004     |
| BR-8  | Onboarding a Domain to Execution must never require that Domain to modify its own code; all adaptation logic lives in Execution's Integration layer. | Planned | ADR-003     |
| BR-9  | Execution's own governance files (this set) stay synchronized with every code change, per the ecosystem's standard workflow.      | Planned | —           |
| BR-10 | Reference sync is strictly read-only; Execution never writes to any Domain's own Sheet/Tab (Domain Ownership, Personal AI Core's P7). | Planned | ADR-003, ADR-012 |
| BR-11 | Execution's "complete/update" actions never write directly to a Domain's Sheet; they only publish an Execution Event, which a Domain may optionally subscribe to and act on. | Planned | ADR-007     |
| BR-12 | A Waiting Item must populate both `reason` and (except for Manual_Hold) `party`; free-text-only waiting descriptions are not allowed. | Planned | ADR-011     |
*/
