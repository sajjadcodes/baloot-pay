# 12. Reliability and Distributed Workflows

## 12.1 Transactional outbox

Implement a transactional outbox for work that must reliably follow a database state change.

For example, creating a payment and scheduling its submission must be committed together.

A worker claims pending work, processes it, and records its outcome. Worker crashes must not permanently lose the operation.

The outbox provides durable scheduling, not exactly-once execution of external side effects.

External operations must still be idempotent or safely reconciled.

## 12.2 Webhook inbox

Webhook ingestion and processing must be separate concerns.

The HTTP handler should authenticate the event, persist it, and acknowledge it according to the provider's documented delivery contract.

A worker processes stored events with controlled retries.

Use a uniqueness constraint for the appropriate provider event identity where available. If a provider does not supply a stable event ID, define a provider-specific deduplication strategy without assuming that payload hashes are universally unique.

## 12.3 Retry policy

Retries must be operation-specific.

- Retry transient network failures and eligible server errors with bounded exponential backoff and jitter.
- Respect provider rate limits and retry guidance.
- Do not retry permanent validation or authorization errors blindly.
- Do not retry uncertain financial operations without idempotency or reconciliation safeguards.
- Use a maximum retry policy and an operational recovery path.
- Preserve the original request identity across safe retries.
- Record attempt counts and the reason for each retry.

## 12.4 Circuit breakers and timeouts

Use explicit timeouts for outbound provider calls.

A circuit breaker may prevent repeated requests to an unhealthy provider, but it must not silently mark payments failed.

When a provider is unavailable, preserve the operation's correct state and make the recovery path visible.

## 12.5 Reconciliation

Reconciliation is a core production capability, not an optional future optimization.

It should compare internal records with provider transaction records, status APIs, or settlement reports according to the provider's capabilities.

Detect at least:

- Payments missing from provider records.
- Provider transactions missing from internal records.
- Amount or currency mismatches.
- Status mismatches.
- Refund mismatches.
- Transactions stuck in processing.
- Unresolved provider timeouts.
- Duplicate or unexpected provider references.

Store reconciliation runs, findings, timestamps, and resolution history.

Never automatically overwrite conflicting financial records without a documented, tested resolution policy.

---

---

# 15. Observability and Operations

## 15.1 Logging

Use structured logs with consistent field names.

Useful fields include:

- Timestamp.
- Log level.
- Environment.
- Request ID.
- Correlation ID.
- Internal payment ID.
- Operation type.
- Provider name.
- Normalized error code.
- Processing duration.

Tenant identifiers should be included only where operationally justified and protected appropriately.

Never include secrets, raw card data, full authorization headers, or unredacted sensitive payloads.

## 15.2 Metrics

At minimum, monitor:

- Payment creation rate.
- Payment success and failure rates.
- Payments awaiting resolution.
- Provider request latency.
- Provider timeout and error rates.
- Webhook verification failures.
- Webhook processing lag.
- Outbox backlog.
- Retry volume.
- Refund processing outcomes.
- Reconciliation discrepancy counts.
- Database connection pool utilization.
- API latency and HTTP error rates.

Metrics must not use unbounded identifiers such as payment IDs as labels.

## 15.3 Alerts

Define actionable alerts for:

- Sudden provider failure increases.
- Long-running uncertain transactions.
- Growing worker backlog.
- Failed webhook processing.
- Invalid webhook signature spikes.
- Unresolved reconciliation discrepancies.
- Database unavailability.
- Exhausted credentials or expired certificates.
- Unexpected increases in refunds or payment failures.

Every critical alert must have a documented investigation and recovery procedure.

## 15.4 Operational safety

Administrative tooling must use separate privileged permissions.

Do not provide generic production endpoints that allow arbitrary status changes or direct database mutations.

Manual intervention must be authorized, recorded, justified, and auditable.

---

---

# 16. Deployment and Infrastructure

## 16.1 Environments

Maintain isolated development, testing, staging, and production environments.

Use separate databases, provider accounts, credentials, webhook endpoints, and secrets for each environment.

Never allow development configuration to fall back silently to production credentials.

## 16.2 Database migrations

- Commit Prisma migrations.
- Review generated SQL for financially important schema changes.
- Use backward-compatible expand-and-contract migrations where necessary.
- Back up before risky production changes.
- Test migrations against realistic data volumes.
- Define recovery procedures for failed migrations.
- Never assume that rolling back application code automatically reverses a financial operation.

## 16.3 Container security

- Run the application as a non-root user.
- Use a minimal supported base image.
- Exclude development dependencies from production images where appropriate.
- Do not bake secrets into image layers.
- Pin deployment artifacts.
- Configure resource limits.
- Handle SIGTERM and graceful shutdown.
- Stop accepting new work before shutting down workers.
- Allow in-flight operations to reach a safe persisted state.

## 16.4 Database and backups

- Use encrypted connections where required by the deployment environment.
- Apply least-privilege database credentials.
- Keep schema migration permissions separate from normal runtime permissions where practical.
- Enable backups and define a recovery point objective (RPO) and recovery time objective (RTO).
- Test restores periodically.
- Define a safe approach to replaying outbox and webhook work after restoration.

A backup is not a recovery strategy until restoration has been tested.

## 16.5 CI/CD release gates

The pipeline must include:

1. Dependency installation from the lockfile.
2. Formatting and linting.
3. Type checking.
4. Unit tests.
5. Integration tests.
6. Build verification.
7. Dependency and secret scanning.
8. Migration validation.
9. Artifact creation.
10. Controlled staging deployment.
11. Production approval and deployment.

Add performance and security test gates appropriate to the release.

---
