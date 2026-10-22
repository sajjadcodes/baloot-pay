# 14. Testing Strategy

Tests must validate business behavior, security properties, and failure recovery.

## Repository test convention

Baloot Pay currently uses unit tests only. Put each `*.spec.ts` in the same
folder as the exact implementation file it tests; for example,
`payments.service.spec.ts` beside `payments.service.ts`. Do not collect unit
tests in a separate test directory. Add unit tests for controllers, services,
and complex shared helpers/utilities. Do not add e2e tests unless the owner
approves changing this convention. Tests involving PostgreSQL, provider sandboxes, or other external
systems require a separately approved isolated test strategy; never point
tests at shared or production infrastructure.

## 14.1 Unit tests

Test:

- Money calculations.
- Currency validation.
- Payment state transitions.
- Refund eligibility.
- Idempotency request fingerprinting.
- Provider status mapping.
- Retry eligibility.
- Error classification.
- Authorization policies.

Domain tests should not require a running database or external payment provider.

## 14.2 Future persistence verification (approval required)

Persistence and concurrency guarantees cannot be established by mocks alone.
Before adding database tests or integration tooling, agree on an isolated
disposable PostgreSQL environment and approve its lifecycle and exact
schema-changing commands. Never use shared or production databases.

When approved, verify:

- Prisma queries and constraints.
- Migration correctness.
- Idempotency under concurrent requests.
- Transaction rollback behavior.
- Outbox atomicity.
- Webhook deduplication.
- Tenant-scoped queries.
- Refund concurrency.
- Worker claiming and recovery.

Mocks alone are insufficient to verify database concurrency guarantees.

## 14.3 Mandatory adversarial scenarios

- The same payment request arrives concurrently multiple times.
- The same idempotency key is reused with a different amount.
- A provider succeeds but the worker crashes before persisting the result.
- A provider times out after possibly processing a charge.
- A webhook is delivered repeatedly.
- A webhook arrives before the synchronous provider response is persisted.
- A stale webhook arrives after a newer state is recorded.
- Two partial refunds race.
- A tenant guesses another tenant's payment ID.
- A revoked authentication session is reused.
- A provider returns an unexpected amount or currency.
- A worker processes the same outbox item twice.
- A database connection fails during a state transition.
- A reconciliation report disagrees with the internal transaction record.

Every discovered financial or security bug should produce a regression test.

## 14.4 Testing rules

- Do not use real payment credentials in automated tests.
- Use provider sandboxes or deterministic provider simulators.
- Never weaken production validation to simplify testing.
- Do not mark a phase complete while its critical tests fail.
- Before every commit request, run `pnpm build`, `pnpm test`, and
  `pnpm exec tsc --noEmit`; all must pass.
- Track flaky tests instead of silently skipping them.
- Use property-based testing where it meaningfully strengthens money, state-machine, and concurrency invariants.

## 14.5 Load, stress, and resilience testing

Load testing is a release qualification activity, not a substitute for correctness tests. Define measurable traffic, latency, availability, and error-budget objectives before selecting pass/fail thresholds. Do not invent a single requests-per-second target and treat it as production capacity.

Use an isolated, production-representative environment with synthetic data and no live payment credentials. Test the API, PostgreSQL, workers, and provider simulator together where practical. Record the test profile, environment, build, database size, configuration, and results so runs can be compared.

Run and retain results for:

- **Baseline and ramp:** Increase traffic gradually; measure throughput, p50/p95/p99 latency, error rate, CPU/memory, database connections, query latency, and worker lag.
- **Peak and burst:** Exercise the agreed peak profile and short bursts; verify backpressure, bounded queues, rate limits, and graceful overload responses.
- **Soak:** Sustain representative traffic long enough to expose connection leaks, memory growth, queue drift, retry storms, and resource exhaustion.
- **Stress and recovery:** Exceed expected capacity in a controlled environment; confirm graceful degradation and that the service recovers after load is reduced.
- **Database contention:** Run concurrent idempotent creates, duplicate keys, competing state transitions, and partial refunds; verify uniqueness and financial invariants remain enforced under contention.
- **Worker/provider pressure:** Simulate slow, unavailable, rate-limited, and intermittently failing providers; verify bounded retries, no duplicate charges, durable queue behavior, and timely recovery.
- **Failure injection:** Exercise database connection loss, worker restarts, timeouts after possible provider processing, and webhook bursts while checking the resulting durable records.

Acceptance criteria must include both performance and correctness: no duplicate logical operations or unsafe duplicate charges, no cross-tenant disclosure, no lost durable work, no invalid state transitions, and no unbounded resource/queue growth. A fast response with an incorrect financial result is a failed test.

## 14.6 Security and abuse testing

For each protected API, test unauthenticated and unauthorized access, incorrect scopes, revoked credentials, tenant-ID tampering, cross-tenant object IDs, mass assignment, malformed and oversized payloads, injection-shaped input, pagination/filter abuse, and rate-limit behavior. Verify errors do not disclose secrets, stack traces, provider internals, or another tenant's data.

For provider-facing surfaces, test invalid signatures, replayed and duplicated webhooks, stale/out-of-order events, wrong provider-account context, and payload tampering. Test secret redaction in logs and telemetry. Verify the runtime database role cannot perform schema changes and that any row-level security policy behaves correctly across pooled connections if RLS is adopted.

Run security and dependency checks in CI, investigate findings rather than suppressing them blindly, and add regression tests for discovered application vulnerabilities. Before production approval, complete the final threat-model review and any independent security assessment required by the risk and compliance owners.

---

---

# 18. Definition of Done

A feature is complete only when all applicable requirements are satisfied.

## Functional correctness

- [ ] Requirements are documented.
- [ ] Valid requests behave as specified.
- [ ] Invalid state transitions are rejected.
- [ ] Financial invariants are preserved.
- [ ] Errors are mapped to stable application error codes.

## Security

- [ ] Authentication is enforced where required.
- [ ] Authorization and tenant isolation are verified.
- [ ] Input validation is complete.
- [ ] Sensitive information is not leaked.
- [ ] Retry and replay risks are addressed.
- [ ] Provider responses are validated.
- [ ] Applicable abuse controls are implemented.

## Persistence and reliability

- [ ] Database constraints enforce critical invariants.
- [ ] Migrations are committed and tested.
- [ ] Concurrency behavior is tested.
- [ ] Recovery after partial failure is documented.
- [ ] Asynchronous operations are durable where required.

## Testing

- [ ] Unit tests pass.
- [ ] Relevant integration tests pass.
- [ ] Relevant end-to-end tests pass.
- [ ] Critical negative cases are tested.
- [ ] No known critical regression is left unresolved.

## Maintainability

- [ ] Types and module boundaries are clear.
- [ ] No unnecessary duplication was introduced.
- [ ] API documentation is updated.
- [ ] Architecture decisions are documented where needed.
- [ ] Operational behavior is documented where relevant.

## Verification

- [ ] Linting passes.
- [ ] Type checking passes.
- [ ] Build passes.
- [ ] Relevant CI checks pass.
- [ ] The completion report reflects actual results.

Passing this checklist establishes feature completion, not automatic production approval.

---

---

# 20. Production Readiness Checklist

Do not launch real transactions until the following have been evaluated and approved.

### Financial correctness

- [ ] Payment and refund invariants are tested.
- [ ] Duplicate requests cannot unintentionally execute duplicate charges.
- [ ] Uncertain outcomes have a recovery procedure.
- [ ] Provider and internal transaction records can be reconciled.
- [ ] Historical records and audit events are protected.

### Security and compliance

- [ ] Tenant isolation and authorization have been reviewed.
- [ ] Credentials and secrets are managed securely.
- [ ] Webhook verification has been tested against replay and forgery.
- [ ] Card-data handling and PCI DSS scope have been reviewed.
- [ ] Applicable legal, privacy, and financial obligations have been assessed.
- [ ] Security vulnerabilities have been reviewed and remediated according to release policy.

### Reliability

- [ ] Worker and process failures have been tested.
- [ ] Provider timeouts and outages have been tested.
- [ ] Database backup and restore have been verified.
- [ ] Reconciliation and manual recovery procedures are operational.
- [ ] Monitoring and critical alerts are configured.

### Release operations

- [ ] Staging workflows have been completed.
- [ ] Production configuration has been reviewed.
- [ ] Secrets and credentials are environment-specific.
- [ ] Migrations and deployment procedures have been tested.
- [ ] Rollback and incident-response procedures are documented.
- [ ] Production release approval has been obtained.

---

## Final Engineering Principle

Baloot Pay must never optimize for the appearance of a successful transaction.

It must optimize for the ability to determine, with durable evidence, what was requested, what the provider actually did, what Baloot Pay recorded, whether the operation is final, and what must happen next.

**When the outcome is uncertain, preserve the evidence, prevent unsafe retries, and reconcile. When a financial invariant cannot be guaranteed, stop the operation rather than silently compromising correctness.**
