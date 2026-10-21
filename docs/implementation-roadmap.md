# 13. Implementation Roadmap

Implement the following phases in order. Every phase must have a concrete completion gate before the next phase begins.

Do not implement the entire roadmap in one Copilot request.

## Phase 0 — Requirements and architectural decisions

**Objective:** Resolve the decisions that would otherwise cause expensive architectural mistakes.

Tasks:

- [ ] Inspect the existing repository and identify its current state.
- [ ] Confirm the supported Node.js, NestJS, Prisma, and PostgreSQL versions.
- [ ] Define the initial payment provider and integration capabilities.
- [ ] Define the initial countries and currencies.
- [ ] Confirm the tenant and authentication model.
- [ ] Document payment lifecycle and financial invariants.
- [ ] Define the intended card-data handling model.
- [ ] Identify PCI DSS, privacy, and other compliance questions requiring expert confirmation.
- [ ] Write initial architecture decision records in `docs/decisions/`.
- [ ] Create an initial threat model in `docs/threat-model/`.

**Completion gate:** No unresolved decision is silently assumed where it affects financial correctness, security, or provider compatibility.

If a critical decision is missing, Copilot must document the blocker and ask for clarification rather than implement an invented behavior.

## Phase 1 — Project foundation

**Objective:** Establish a reproducible and secure development environment.

Tasks:

- [ ] Configure NestJS application bootstrap.
- [ ] Configure strict TypeScript settings.
- [ ] Establish linting and formatting.
- [ ] Add validated environment configuration.
- [ ] Configure Prisma and PostgreSQL.
- [ ] Add version-controlled database migrations.
- [ ] Create Docker-based local development.
- [ ] Add health and readiness endpoints.
- [ ] Establish centralized exception handling.
- [ ] Configure structured logging and request IDs.
- [ ] Create unit and integration test conventions.
- [ ] Add CI checks for formatting, linting, compilation, and tests.
- [ ] Provide safe example configuration.

**Completion gate:** A clean checkout can install dependencies, start the development environment, apply migrations, run tests, and pass CI without real payment credentials.

## Phase 2 — Domain model and persistence

**Objective:** Establish the financial data foundation.

Tasks:

- [ ] Implement the tenant model.
- [ ] Implement provider account metadata.
- [ ] Implement payments and payment attempts.
- [ ] Implement refund records.
- [ ] Implement transaction events.
- [ ] Implement idempotency records.
- [ ] Implement webhook inbox records.
- [ ] Implement outbox records.
- [ ] Add foreign keys, unique constraints, indexes, and appropriate database checks.
- [ ] Add explicit money and currency validation.
- [ ] Define deletion and retention policies.
- [ ] Add repository integration tests.
- [ ] Test concurrent writes and conflicting requests.

**Completion gate:** Database constraints enforce critical invariants, migrations are reproducible, and concurrent operations cannot violate tested financial rules.

## Phase 3 — Authentication and tenant isolation

**Objective:** Secure access before exposing financial functionality.

Tasks:

- [ ] Implement the approved authentication model.
- [ ] Implement tenant-scoped API credentials.
- [ ] Implement credential hashing, issuance, revocation, and rotation.
- [ ] Add authorization guards and policy enforcement.
- [ ] Implement resource-level ownership checks.
- [ ] Add request validation and strict DTO handling.
- [ ] Add rate limits and sensitive-operation quotas.
- [ ] Add security audit events.
- [ ] Add negative authorization tests.
- [ ] Test tenant isolation across every implemented resource.

**Completion gate:** Unauthenticated, unauthorized, cross-tenant, revoked-credential, and malformed requests are rejected consistently.

## Phase 4 — Payment domain and API

**Objective:** Implement provider-independent payment behavior.

Tasks:

- [ ] Define payment commands and domain services.
- [ ] Implement the explicit payment state machine.
- [ ] Implement payment creation and retrieval.
- [ ] Implement merchant reference validation.
- [ ] Implement mandatory idempotency for applicable operations.
- [ ] Implement transactional state changes and event history.
- [ ] Implement stable error codes.
- [ ] Publish OpenAPI documentation.
- [ ] Add unit, integration, and end-to-end tests.

**Completion gate:** Payment lifecycle behavior is deterministic and tested without requiring a real provider.

## Phase 5 — First payment provider integration

**Objective:** Connect one approved provider without coupling the domain to its SDK.

Tasks:

- [ ] Read the provider's official API documentation.
- [ ] Document its supported operations and transaction states.
- [ ] Define a provider adapter interface.
- [ ] Implement the first provider adapter.
- [ ] Implement secure credential configuration.
- [ ] Configure timeouts and error classification.
- [ ] Implement provider request and response validation.
- [ ] Map provider states to internal states.
- [ ] Implement provider idempotency where supported.
- [ ] Implement uncertain-outcome handling.
- [ ] Add provider contract tests and sandbox integration tests.
- [ ] Verify that sensitive provider data is not logged.

**Completion gate:** Success, rejection, timeout, duplicate submission, malformed response, and provider outage scenarios are tested.

No second provider should be added until the first integration has a clear, tested abstraction.

## Phase 6 — Durable asynchronous processing

**Objective:** Make financial workflows recoverable after process failures.

Tasks:

- [ ] Implement transactional outbox persistence.
- [ ] Implement worker claiming and processing.
- [ ] Implement retry policy and backoff.
- [ ] Add concurrency protection.
- [ ] Add dead-letter or equivalent failed-work handling.
- [ ] Add operational inspection and recovery procedures.
- [ ] Test crashes before and after external provider requests.
- [ ] Test duplicate worker execution.
- [ ] Test queue backlog and provider outages.

**Completion gate:** No critical operation is silently lost when an API process or worker restarts.

## Phase 7 — Webhook ingestion

**Objective:** Process asynchronous provider events safely.

Tasks:

- [ ] Implement provider-specific webhook endpoints.
- [ ] Preserve raw request bytes when signature verification requires them.
- [ ] Verify signatures and replay protections.
- [ ] Persist verified events durably.
- [ ] Implement deduplication.
- [ ] Process events asynchronously.
- [ ] Enforce legal state transitions.
- [ ] Handle out-of-order events.
- [ ] Handle duplicate delivery.
- [ ] Add invalid-signature, replay, and payload-tampering tests.
- [ ] Add webhook failure visibility and recovery tooling.

**Completion gate:** Replayed, forged, duplicated, delayed, and conflicting notifications cannot incorrectly confirm a payment.

## Phase 8 — Capture, cancellation, and refunds

**Objective:** Implement additional financial operations supported by the selected provider.

Tasks:

- [ ] Implement authorization and capture if supported.
- [ ] Implement cancellation where supported.
- [ ] Implement full and partial refunds where supported.
- [ ] Validate operation-specific state transitions.
- [ ] Protect concurrent refund requests.
- [ ] Enforce amount and currency integrity.
- [ ] Track provider refund identifiers and outcomes.
- [ ] Handle refund timeouts and retries.
- [ ] Add idempotency and concurrency tests for every operation.

**Completion gate:** No operation can bypass provider capabilities, exceed its permitted amount, or execute from an invalid state.

## Phase 9 — Reconciliation and financial operations

**Objective:** Detect and investigate discrepancies.

Tasks:

- [ ] Define provider reconciliation sources.
- [ ] Implement scheduled reconciliation.
- [ ] Compare internal and external transaction states.
- [ ] Detect amount, currency, and refund mismatches.
- [ ] Identify transactions stuck in uncertain states.
- [ ] Persist reconciliation runs and findings.
- [ ] Implement a controlled manual review workflow.
- [ ] Add alerting for unresolved discrepancies.
- [ ] Document recovery and correction procedures.

**Completion gate:** Operators can identify unresolved payment discrepancies and investigate them without modifying historical records silently.

## Phase 10 — Observability and operational controls

**Objective:** Make the system diagnosable in production.

Tasks:

- [ ] Add structured application logs.
- [ ] Add request and transaction correlation IDs.
- [ ] Add latency, error-rate, and throughput metrics.
- [ ] Add worker backlog and retry metrics.
- [ ] Add provider availability and failure metrics.
- [ ] Add alerts for stuck payments and reconciliation failures.
- [ ] Add safe operational status endpoints.
- [ ] Document dashboards and alert responses.
- [ ] Verify that logs and telemetry do not expose secrets or payment data.

**Completion gate:** Critical failures can be detected and investigated without relying on direct database manipulation or sensitive payload inspection.

## Phase 11 — Production hardening

**Objective:** Validate security, resilience, and deployment readiness.

Tasks:

- [ ] Run threat-model review.
- [ ] Run dependency and secret scans.
- [ ] Perform authorization and tenant-isolation testing.
- [ ] Perform load and stress testing.
- [ ] Test graceful shutdown and recovery.
- [ ] Test database backup and restore.
- [ ] Verify migration and rollback procedures.
- [ ] Verify secret rotation.
- [ ] Test provider outage and recovery scenarios.
- [ ] Review retention, access controls, and operational permissions.
- [ ] Verify disaster recovery procedures.
- [ ] Complete compliance and security reviews applicable to the actual business model.

**Completion gate:** Production release is approved only after the required technical, operational, and external compliance reviews have been completed.

## Phase 12 — Additional providers and advanced capabilities

Only begin after the first provider and operational workflows are stable.

Potential capabilities:

- [ ] Additional payment providers.
- [ ] Provider routing based on explicit policies.
- [ ] Failover with provider-specific duplicate-charge protections.
- [ ] Disputes and chargeback management.
- [ ] Provider settlement reporting.
- [ ] Merchant analytics.
- [ ] Usage metering and billing.
- [ ] Advanced risk controls.
- [ ] Additional payment methods.

Provider failover must never mean blindly submitting the same uncertain payment to another provider. Establish the original provider's outcome first or use a formally approved risk policy that accounts for duplicate financial execution.

---
