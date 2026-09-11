/*
=====================================================================
EXECUTION OS — BUSINESS RULES
=====================================================================
Status: All rules below are Planned — zero code exists, so no rule
has actually been implemented or tested yet. Do not read "Planned"
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
