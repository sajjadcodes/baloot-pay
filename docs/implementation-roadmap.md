# 13. Implementation Roadmap

Implement the following phases in order. Every phase must have a concrete completion gate before the next phase begins.

Do not implement the entire roadmap in one Copilot request.

## Implementation contract

The current repository baseline is a minimal NestJS 11 application. It has no Prisma dependency, Prisma schema, database configuration, or payment implementation. Treat this as a greenfield implementation inside the existing NestJS app; inspect the live repository again before each change because this baseline can change.

### Small, reviewable increments

- Implement one independently reviewable behavior at a time. Each increment must have a narrow scope, its own relevant tests, and a short change summary.
- Keep a proposed commit to one cohesive increment; do not bundle a completed documentation section or unrelated phase into a large commit.
- Never create a commit unless the user explicitly confirms. When asked to prepare a commit, stage only the exact reviewed paths and provide a proposed commit subject and description.
- Do not move to the next increment when the current one has failing checks or an unresolved financial, security, or provider decision.
- Report changed files, commands actually run, outcomes, remaining risks, and the next smallest increment. Do not claim production readiness from a passing build or test suite alone.

### Prisma 8 and database approval boundary

- Confirm the Prisma 8 release, Node.js compatibility, PostgreSQL version, supported generator/provider configuration, and official command syntax against the official documentation before choosing dependencies or scripts. Do not infer Prisma 8 behavior from older Prisma versions.
- Pin compatible Prisma packages and preserve the package-manager lockfile. Keep schema, migration history, generated client output, and runtime adapter configuration consistent with the selected Prisma 8 setup.
- Treat Prisma 8 release candidates as development-only; block production deployment until a stable release and compatible PostgreSQL runtime package are verified.
- A schema change must first be proposed as a reviewable diff. Describe its data impact, constraints, indexes, lock/availability risks, backfill strategy, and recovery approach before asking for approval.
- **Never run Prisma `emit`, any migration command, or any other command that applies or synchronizes schema changes unless the user explicitly confirms that exact operation.** This includes development, deploy, reset, and push flows. Do not treat approval to edit a schema or write migration files as approval to execute them. Never reset or drop a database without explicit approval and confirmation that it is disposable.
- Before an approved schema operation, state the exact command, target environment/database, expected effect, and recovery plan. Stop if the target or effect is uncertain. Do not use production credentials for development or test operations.
- Separate the application database role from the migration/owner role. The runtime role must have only the privileges required by the application; schema-changing privileges must not be available to the public API process.

### Security from the first endpoint; hardening at the end

Security is not deferred until the final phase. Every API, persistence, and provider increment must include its applicable authentication, authorization, validation, tenant isolation, secret handling, safe logging, and negative tests before it is considered complete. The final security phase is an independent adversarial review and hardening pass over the implemented system, not the first time security controls are added.

No real payment credentials, live transactions, or production launch are permitted until the applicable security, operational, provider, and compliance gates have been explicitly reviewed and approved. No design can promise a service is “unhackable”; the goal is layered controls, limited blast radius, observable failures, and tested recovery.

## Step-by-step delivery sequence

Treat each numbered step below as a small implementation/review increment, not permission to execute database commands. The phase checklists that follow provide additional detail.

1. **Baseline and scope:** Inventory the current NestJS app, scripts, tests, and deployment assumptions. Confirm the first provider, countries/currencies, tenant model, the deployed [Baloot Auth service](https://github.com/sajjadcodes/baloot-auth) version and integration contract, card-data flow, expected traffic, availability/latency objectives, and applicable compliance questions. Record unresolved decisions; do not guess.
2. **Application safety foundation:** Establish strict configuration validation, consistent error mapping, request/correlation IDs, redacted structured logging, request/body limits, security headers, explicit CORS policy where needed, and liveness/readiness behavior. Add tests for invalid configuration and failure responses.
3. **Prisma 8 and PostgreSQL design:** Verify official Prisma 8 compatibility and usage, select supported packages/adapters, define database environments and least-privilege roles, and review the initial schema/migration plan. Keep any schema/client-generation execution behind the approval boundary above.
4. **Persistence foundation:** After the schema and exact operation are approved, implement the tenant and provider-account foundations, durable identifiers, database constraints, indexes, and repository integration tests. Verify behavior against PostgreSQL, not only mocks.
5. **Authentication integration and tenant authorization:** Integrate with the already-deployed Baloot Auth service only after its caller types and verification contract are confirmed. It documents HttpOnly browser cookies, bearer access-token extraction, and a `userId`/`clientId`/`sessionId` principal; Auth `clientId` is not automatically the Baloot Pay business tenant. Do not build a local authentication module, duplicate Auth users/sessions/credentials, or share its signing secret/database as a shortcut. Resolve the approved browser/API and service-to-service flows, tenant mapping, and payment authorization source before implementation. Test missing, malformed, expired, revoked, unavailable-service, insufficient-permission, and cross-tenant credentials and resource IDs.
6. **Payment domain and read/create APIs:** Add exact money/currency validation, domain state transitions, API contracts, stable errors, idempotency, event history, and tenant-scoped queries. Test boundary amounts, malformed inputs, duplicate/concurrent requests, and illegal transitions.
7. **Durable provider submission:** Implement a single documented provider adapter and transactional outbox. Exercise provider success/rejection, timeouts after possible processing, malformed responses, retries, worker crashes, duplicate delivery, and recovery without duplicate charges.
8. **Webhooks and refunds:** Add provider-specific signature/replay verification, durable inbox/deduplication, out-of-order event handling, and only provider-supported capture/cancel/refund flows. Test forged/replayed events, webhook races, refund limits, and concurrent partial refunds.
9. **Reconciliation and operator workflows:** Compare internal state to provider evidence, surface discrepancies, and provide audited recovery paths. Test stuck and uncertain outcomes without overwriting financial history.
10. **Scale and resilience qualification:** Define explicit load profiles from the agreed traffic objectives; run API and worker load, burst, soak, database contention, pool saturation, queue backlog, and dependency-outage tests. Tune only from measurements and rerun regressions.
11. **Final security hardening and release gate:** Revisit the threat model against the running implementation. Perform focused authorization and tenant-isolation reviews, injection/input abuse checks, SSRF/egress review where applicable, webhook replay/forgery tests, dependency and secret scans, database privilege/RLS review if used, backup/restore and recovery drills, and independent security review appropriate to the risk. Remediate findings and rerun affected suites before any production approval.
12. **Additional capabilities:** Add another provider, routing, disputes, or advanced features only after the first provider and operational workflows meet their gates. Provider failover must not resubmit an outcome-unknown payment without a verified safe policy.

### Increment-level completion gate

Before an increment is considered complete:

- Its acceptance criteria and affected trust boundaries are stated.
- Tests cover the intended success path, rejection/negative cases, relevant concurrency or failure behavior, and a regression for each fixed defect.
- Relevant formatting, lint, type-check, build, unit, integration, and e2e checks are run and reported truthfully.
- Database tests use an isolated PostgreSQL environment for constraints, locking, transactionality, and concurrency guarantees; mocks alone are not sufficient.
- No migration, schema synchronization, or Prisma `emit` is run without the user's explicit confirmation for that operation.
- Only the files needed for the approved increment are staged, and no commit is created without explicit confirmation.

## Phase 0 — Requirements and architectural decisions

**Objective:** Resolve the decisions that would otherwise cause expensive architectural mistakes.

Tasks:

- [ ] Inspect the existing repository and identify its current state.
- [ ] Confirm the supported Node.js, NestJS, Prisma, and PostgreSQL versions.
- [ ] Define the initial payment provider and integration capabilities.
- [ ] Define the initial countries and currencies.
- [ ] Review the deployed Baloot Auth version, Swagger contract, and official integration documentation; record its actual principal fields and token/session validation behavior.
- [ ] Decide how browser cookie-authenticated clients reach the payment API without assuming host-only Auth cookies are sent to another host; preserve CSRF protections.
- [ ] Decide whether direct machine-to-machine callers are in scope; the documented bearer extraction is not by itself a machine credential-issuance contract.
- [ ] Define the trusted mapping from Auth user/client context to Baloot Pay tenant and payment permissions. Do not treat `clientId` as a business `tenantId` without an explicit reviewed decision.
- [ ] Define Auth dependency timeout, outage, fail-closed, observability, and any revocation-consistent caching policy.
- [ ] Define realistic expected traffic, peak/burst behavior, latency objectives, availability objectives, and test environments; do not invent pass/fail thresholds.
- [ ] Document payment lifecycle and financial invariants.
- [ ] Define the intended card-data handling model.
- [ ] Verify Prisma 8, PostgreSQL, Node.js, and NestJS compatibility using their official version-specific documentation.
- [x] Decide to use one dedicated logical database for Baloot Auth and a separate dedicated logical database for Baloot Pay, with separate database roles and credentials and no cross-service database access.
- [ ] Define the AWS RDS for PostgreSQL infrastructure model: private networking and TLS, runtime versus migration credentials, backup and recovery, and whether the two databases share one RDS instance or use separate instances based on accepted isolation, cost, and availability requirements.
- [ ] Define the EC2 deployment boundary for Auth and Pay, including separate processes/containers and configuration, secret delivery, instance metadata protections, host hardening, and the risk accepted while both services share one host.
- [ ] Identify PCI DSS, privacy, and other compliance questions requiring expert confirmation.
- [ ] Write initial architecture decision records in `docs/decisions/`.
- [ ] Create an initial threat model in `docs/threat-model/`.

**Completion gate:** No unresolved decision is silently assumed where it affects financial correctness, security, provider compatibility, database safety, load-test acceptance criteria, or Auth-to-payment tenant/permission mapping.

If a critical decision is missing, Copilot must document the blocker and ask for clarification rather than implement an invented behavior.

## Phase 1 — Project foundation

**Objective:** Establish a reproducible and secure development environment.

Tasks:

- [x] Configure NestJS application bootstrap with bounded JSON and URL-encoded body parsers, request-context middleware, a global exception filter, and a success-response interceptor.
- [x] Configure strict TypeScript settings (`strict` and `noImplicitOverride`) and validate the complete source/test suite under them.
- [x] Establish linting and formatting with non-mutating `lint` and `format:check` commands; keep autofixes explicit.
- [x] Add validated environment configuration for the current `PORT` setting and provide a non-secret `.env.example`.
- [ ] Configure Prisma and PostgreSQL.
- [ ] Design version-controlled database migrations and review their impact before any execution.
- [ ] Obtain explicit user approval before running Prisma `emit` or any migration/schema-changing command.
- [ ] Keep runtime database privileges separate from schema migration privileges.
- [ ] Create Docker-based local development.
- [ ] Add health and readiness endpoints.
- [x] Establish centralized exception handling with sanitized response bodies and stable general error codes.
- [ ] Configure structured logging.
- [x] Generate server-owned request IDs and return them with API error responses for correlation.
- [x] Set baseline response security headers and prevent storage of sensitive API responses.
- [ ] Create unit and integration test conventions.
- [ ] Create isolated PostgreSQL integration-test conventions; tests must not point at a shared or production database.
- [ ] Add CI checks for formatting, linting, compilation, and tests.
- [x] Provide safe example configuration with no credentials or secrets.

**Completion gate:** A clean checkout can install dependencies, start the development environment, run the already-approved database setup path, execute tests, and pass CI without real payment credentials. CI must not apply or synchronize a schema unless explicitly configured and approved for its isolated database.

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
- [ ] Verify runtime DB roles cannot perform schema changes or access another environment.

**Completion gate:** Database constraints enforce critical invariants, migrations are reproducible, and concurrent operations cannot violate tested financial rules.

## Phase 3 — Baloot Auth integration and tenant isolation

**Objective:** Secure access before exposing financial functionality by integrating the existing deployed [Baloot Auth service](https://github.com/sajjadcodes/baloot-auth). Do not recreate its authentication module or credential lifecycle in Baloot Pay.

Tasks:

- [ ] Confirm the deployed version and Swagger/API contract before writing code. Current docs describe HttpOnly browser cookies, bearer access-token extraction, and a `userId`/`clientId`/`sessionId` principal.
- [ ] Select the approved integration topology for browser and non-browser callers. Do not assume host-only Auth cookies are available to another API host or that bearer extraction constitutes a machine credential flow.
- [ ] Verify authentication through the agreed Auth-backed contract. Do not copy the Auth signing secret, query its database directly, or claim local JWT verification also checks live session revocation.
- [ ] Map the verified Auth principal to a Baloot Pay tenant and operation permissions using an explicitly approved mapping. Auth `clientId` selects an Auth client and is not inherently the payment tenant.
- [ ] Define and test bounded Auth-call timeouts, fail-closed behavior, telemetry, and any cache behavior against session revocation requirements.
- [ ] Add authorization guards and policy enforcement for payment-service resources.
- [ ] Implement resource-level ownership checks.
- [ ] Add request validation and strict DTO handling.
- [ ] Add rate limits and sensitive-operation quotas.
- [ ] Define limits from measured/approved service capacity; test throttling and recovery without rate-limit bypasses.
- [ ] Add security audit events.
- [ ] Add negative authorization tests.
- [ ] Test tenant isolation across every implemented resource.

**Completion gate:** Baloot Auth remains authoritative for authentication and its own client/session lifecycle; Baloot Pay does not duplicate its auth module or credential store. The approved tenant mapping and payment permissions are enforced, and unauthenticated, unauthorized, cross-tenant, revoked-credential, unavailable-auth-service, and malformed requests are rejected consistently with safe and observable failure behavior.

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
- [ ] Test request size/content-type limits, injection-shaped input, mass-assignment attempts, and authorization on every resource operation.

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
- [ ] Test graceful worker shutdown, lease expiry/claim recovery, and bounded retry behavior under sustained backlog.

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
- [ ] Perform a final least-privilege database review, including row-level security behavior if RLS is adopted.
- [ ] Verify that no production endpoint, credential, or database becomes publicly reachable beyond the approved design.
- [ ] Review retention, access controls, and operational permissions.
- [ ] Verify disaster recovery procedures.
- [ ] Complete compliance and security reviews applicable to the actual business model.

**Completion gate:** Production release is approved only after the required technical, operational, and external compliance reviews have been completed.

Load-test thresholds and launch gates must be based on the Phase 0 service objectives and explicitly approved before the test. Passing a load test at an arbitrary request rate is not evidence of capacity for real traffic.

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
