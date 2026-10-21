# 14. Testing Strategy

Tests must validate business behavior, security properties, and failure recovery.

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

## 14.2 Integration tests

Use a real disposable PostgreSQL instance or an equivalent isolated database environment for critical persistence tests.

Test:

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

## 14.3 End-to-end tests

Test complete workflows:

1. Create a payment.
2. Submit it to a simulated provider.
3. Receive a verified provider event.
4. Update the payment state.
5. Retrieve the payment.
6. Request a refund.
7. Receive the refund outcome.
8. Reconcile the resulting records.

Also test rejected payments, authentication failures, duplicate requests, timeouts, and provider outages.

## 14.4 Mandatory adversarial scenarios

- The same payment request arrives concurrently multiple times.
- The same idempotency key is reused with a different amount.
- A provider succeeds but the worker crashes before persisting the result.
- A provider times out after possibly processing a charge.
- A webhook is delivered repeatedly.
- A webhook arrives before the synchronous provider response is persisted.
- A stale webhook arrives after a newer state is recorded.
- Two partial refunds race.
- A tenant guesses another tenant's payment ID.
- A revoked API credential is reused.
- A provider returns an unexpected amount or currency.
- A worker processes the same outbox item twice.
- A database connection fails during a state transition.
- A reconciliation report disagrees with the internal transaction record.

Every discovered financial or security bug should produce a regression test.

## 14.5 Testing rules

- Do not use real payment credentials in automated tests.
- Use provider sandboxes or deterministic provider simulators.
- Never weaken production validation to simplify testing.
- Do not mark a phase complete while its critical tests fail.
- Track flaky tests instead of silently skipping them.
- Use property-based testing where it meaningfully strengthens money, state-machine, and concurrency invariants.

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
