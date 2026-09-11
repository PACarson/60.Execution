/*
=====================================================================
EXECUTION OS — PROJECT CONSTITUTION
=====================================================================
Status: Accepted content, Proposed overall (see 00_Project_State.js)
Version: derived from Execution OS Architecture Design v0.8
Date: 2026-07-25 (this extraction: 2026-07-26)
Code status: ZERO — this project has no implementation yet.
Depends On: UEF >= 1.3, Blueprint >= 1.2 (see ADR-014 in 00_ADR_Log.js —
  NOTE: ecosystem memory now references UEF v1.4/v1.5; this dependency
  line has not been re-verified against that actual text in this
  window — see checkpoint/handoff doc, open item.)
=====================================================================

SYSTEM IDENTITY
---------------------------------------------------------------------
Execution OS is NOT a Domain OS.

It is an Execution Coordinator: a layer that runs above every Domain
OS, responsible for "life execution" itself (Vision -> Goal -> action
-> review), and never for any single Domain's business data.

One-line positioning:
  Execution OS is the Personal AI Ecosystem's Execution Coordination
  Layer, responsible for aggregation, planning, sequencing, review,
  and cross-Domain coordination, but never the owner of any Business
  State.

Constitution boundary declaration (the single most important rule
in this document):
  Execution OS owns no Business Data; it owns only Execution Data,
  related to each Domain solely through Reference.

As long as this rule holds, adding any future Domain (Health OS,
Content OS, or otherwise) never requires re-architecting Execution OS.

OWNS
---------------------------------------------------------------------
  Intent layer:      Vision, Goal
  Execution layer:    Execution Project, Planning
  View layer:         Today View, Week View, Dashboard
  Governance layer:    Review, Waiting, Execution Event
  Connection layer:    Execution Reference (a pointer, never the data
                        itself)

NEVER OWNS
---------------------------------------------------------------------
  Business Task / Business Project / Business Timeline / Business
  Event — these always belong to whichever Domain produced them
  (Rider OS's Bookings, Finance OS's Net Worth and Financial
  Timeline, a future Property OS's Timeline, etc).

RELATIONSHIP DECLARATIONS
---------------------------------------------------------------------
  To UEF:              Fully adopted (ADR-001). Engineering discipline
                        is orthogonal to whether a project is a Domain.
  To Blueprint:         Selectively adopted (ADR-001). Reuses capability
                        nodes (Schema, Event Definitions, Query,
                        Connectors, etc.) but does NOT adopt Blueprint's
                        implicit "a Domain owns its business Schema"
                        assumption — Execution OS's Foundation Schema
                        defines only its own native entities.
  To Personal AI Core:  Sibling project. Shares the ecosystem's
                        Telegram/EventBus/Spreadsheet infrastructure
                        pattern, but does NOT share a Spreadsheet with
                        Domains (ADR-012 — Execution OS has its own,
                        independent Spreadsheet, read-only toward the
                        Domain-shared backend, never writes to it).
  To every Domain OS:   Read-only, one-directional observation via
                        Execution Reference. Never writes, never
                        copies, never owns.

ARCHITECTURE LAYER MAPPING (per Blueprint BP-6 — instantiation lives
in the project, not the Blueprint document)
---------------------------------------------------------------------
  Blueprint layer     | Execution OS instantiation
  --------------------|---------------------------------------------
  0. Governance        | Points to UEF, per BP-1. This file + Business
                        | Rules + Project State + File Map + ADR Log.
  1. Foundation         | Schema defines ONLY native entities (Vision,
                        | Goal, Execution Project, Reference, Waiting,
                        | Review, Execution Event) — never Business
                        | Schema. Permissions node not designed
                        | (single-user system, EP3).
  2. Runtime            | Request (Telegram entry), Event (own event
                        | stream + Domain event subscription), Query
                        | (Today/Week View reads). Planner (Planning
                        | Engine) and Projection (Today/Week/Dashboard)
                        | map to Blueprint nodes still at Tier 2 —
                        | Execution OS's own implementation does NOT
                        | automatically count toward promoting those
                        | to Tier 1; Blueprint's stated trigger language
                        | is scoped to "a second Domain OS project,"
                        | and Execution OS is explicitly not one (see
                        | ADR-001). Decision/User Confirmation nodes
                        | not designed yet.
  3. Intelligence        | AI Planning Connector = Execution OS's own
                        | "AI Capability," built on Personal AI Core's
                        | "AI Infrastructure" (ADR-013; see candidate
                        | principle in 00_ADR_Log.js).
  4. Integration         | Domain Adapter Registry = a more formal,
                        | novel instantiation of Blueprint's Bridge
                        | node (currently Tier 2, evidenced only by
                        | "the shared Sheet used informally as a
                        | bridge" — this is NOT reuse of an existing
                        | standard pattern, it is a new implementation
                        | of the same concept).
  5. Testing             | Same automated-unit-tests + manual-checklist
                        | convention as the rest of the ecosystem.
  Cross-Cutting          | Reuses Observability/Diagnostics (Tier 2).
                        | Security/Telemetry not designed (Tier 3,
                        | zero evidence).

DISAMBIGUATION NOTE
---------------------------------------------------------------------
Blueprint's Runtime layer has a node literally named "Execution"
(the service/action layer, Tier 1). This is NOT the same thing as
the project "Execution OS." Any reference to "Runtime > Execution"
in this governance set means the Blueprint node, not this project.

FULL REFERENCE DOCUMENT
---------------------------------------------------------------------
The complete architecture narrative (Data Ownership schemas, Execution
Flow diagrams, Cross-Domain Integration mechanics, Google Sheets
tab/field design, Personal AI Core interface questions) lives in the
companion reference document, not duplicated here per EP2 (one source
of truth): Execution_OS_Architecture_v0.8.md
*/
