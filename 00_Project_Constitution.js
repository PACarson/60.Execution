/*
=====================================================================
EXECUTION OS — PROJECT CONSTITUTION
=====================================================================
Status: Accepted content, Proposed overall (see 00_Project_State.js)
Version: derived from Execution OS Architecture Design v0.8
Date: 2026-07-25 (this extraction: 2026-07-26)
Code status: ZERO — this project has no implementation yet.
Depends On: UEF >= 1.12, Blueprint >= 1.2 (see ADR-014 in 00_ADR_Log.js).
  UEF v1.12's full primary text was read directly 2026-09-12 (Stable,
  2026-08-16) — this line previously read ">= 1.3" based on the only
  version text this project had actually read; that has now been
  verified and updated, not merely re-reported from ecosystem memory.
  Blueprint's version is unchanged (UEF v1.12 states Blueprint is
  "Stable as of v1.2").
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
                        NOTE (ADR-017): UEF v1.12's own Scope line does
                        not name Execution OS — it lists Domain OS
                        projects by name plus "every future Domain OS
                        project," and this project explicitly isn't
                        one. This adoption is a voluntary extension
                        beyond UEF's literal stated scope, not a claim
                        that UEF's text already asserts jurisdiction
                        here. Does not require UEF itself to change.
  To Blueprint:         Selectively adopted (ADR-001). Reuses capability
                        nodes (Schema, Event Definitions, Query,
                        Connectors, etc.) but does NOT adopt Blueprint's
                        implicit "a Domain owns its business Schema"
                        assumption — Execution OS's Foundation Schema
                        defines only its own native entities.
  To Personal AI Core:  Sibling project. Runs its OWN independent
                        instance of the ecosystem's Telegram-bot and
                        EventBus-Adapter patterns (ADR-016) — this
                        means a separate bot/webhook, following the
                        same pattern Rider OS already uses, not a
                        shared webhook with Personal AI Core. Does NOT
                        share a Spreadsheet with Domains either
                        (ADR-012 — Execution OS has its own,
                        independent Spreadsheet, read-only toward the
                        Domain-shared backend, never writes to it).
                        Telegram-entry independence does NOT imply AI
                        Infrastructure independence — see ADR-013/015.
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

PLATFORM CONSTRAINTS (per UEF v1.12 S2, added here 2026-09-12)
---------------------------------------------------------------------
Execution OS runs on Google Apps Script + Google Sheets as its Truth
Layer, same as every other project in this ecosystem. Two consequences
that follow directly and already apply to decisions already made:
  - No multi-statement transactions. ADR-007's completion write-back
    (Execution publishes an Execution Event; a Domain optionally
    writes its own state) is two independent, non-atomic operations,
    not one. This was already true; it is stated here for the first
    time rather than left implicit.
  - No real concurrency beyond LockService, and LockService is
    per-script only — it does not coordinate across projects sharing
    the Domain backend Sheet.

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
