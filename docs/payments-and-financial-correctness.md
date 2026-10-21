# 7. Core Domain Model

The schema must be derived from business invariants and provider capabilities, not generated blindly from this list.

## 7.1 Tenant

Represents a business using Baloot Pay.

Potential fields:

- `id`
- `name`
- `status`
- `createdAt`
- `updatedAt`

Tenant status should support an explicit lifecycle, such as active, suspended, or deactivated.

All tenant-owned resources must have a defined ownership relationship.

## 7.2 API credential

Represents a credential issued to a tenant or an approved machine identity.

Requirements:

- Store only a cryptographic hash of an API secret when the credential is a high-entropy bearer secret that does not need to be recovered.
- Show the secret only at issuance.
- Support revocation and rotation.
- Store scopes, status, creation time, expiration if applicable, and last-used metadata.
- Never log the raw credential.
- Support different permissions for payment creation, refunds, reads, and administration.
- Separate tenant API credentials from privileged platform administration credentials.

The exact authentication format must be decided before implementation.

## 7.3 Payment

Represents a logical payment operation.

Potential fields:

- `id`
- `tenantId`
- `providerAccountId`
- `providerPaymentId`, when available
- `merchantReference`
- `amountMinor`
- `currency`
- `status`
- `createdAt`
- `updatedAt`
- `version`, if optimistic concurrency control is used

Requirements:

- Use a unique internal identifier.
- Scope merchant references to the correct tenant.
- Represent money using integer minor units or an explicitly designed exact-decimal representation.
- Store currency using a validated, normalized code.
- Never trust an amount or currency supplied by a provider redirect or browser return page.
- Preserve the relationship between the internal payment and the provider's transaction identifiers.

The amount and currency should be immutable after payment creation unless an explicitly designed operation permits a change before submission to the provider.

## 7.4 Provider account

Represents a configured merchant account or integration with a payment provider.

Requirements:

- Support multiple provider configurations when required.
- Associate each configuration with its permitted tenants.
- Keep provider credentials outside the database where practical, using a secrets manager or secure secret reference.
- Store non-secret metadata and capability configuration.
- Enforce environment separation between sandbox and production.
- Record provider capabilities rather than assuming every provider supports every operation.

## 7.5 Payment attempt

Represents an individual attempt to execute a logical payment through a provider.

Separate payment attempts from logical payments because a payment may experience multiple processing steps or approved retries.

Potential fields:

- `id`
- `paymentId`
- `providerAccountId`
- `attemptNumber`
- `providerRequestReference`
- `providerTransactionId`
- `status`
- `failureCode`
- `createdAt`
- `updatedAt`

A retry must not automatically create an independent charge.

Use the provider's documented idempotency mechanism and reconciliation capabilities. If the previous outcome is uncertain, reconcile before submitting a potentially duplicate financial operation.

## 7.6 Refund

Represents a request to return some or all of a payment amount through the provider.

Requirements:

- Store the original payment relationship.
- Store the requested amount and currency.
- Track refund-specific status.
- Support provider-specific partial and full refund capabilities.
- Record the provider refund identifier.
- Prevent the total of accepted or pending refunds from exceeding the amount eligible for refund.
- Handle concurrent refund requests safely.

## 7.7 Webhook inbox

Represents a received provider notification.

Potential fields:

- `id`
- `providerAccountId`
- `providerEventId`, if supplied
- `eventType`
- `receivedAt`
- `signatureVerifiedAt`
- `processingStatus`
- `processedAt`
- `attemptCount`
- `lastErrorCode`

Store only the payload data necessary for processing and investigation.

Do not store sensitive card data or unrestricted raw request bodies by default. If raw payload retention is necessary for a provider-specific verification or audit requirement, define strict access, encryption, retention, and redaction rules.

## 7.8 Idempotency record

Represents a client request whose result must be stable across retries.

Requirements:

- Scope the key to the tenant, operation, and relevant endpoint or resource.
- Store a request fingerprint derived from canonical validated input.
- Store the resulting resource identifier or a safely replayable response.
- Reject reuse of the same key with a different request payload.
- Handle concurrent requests using database-enforced uniqueness and transactional coordination.
- Define key expiration and retention according to operation risk and documented policy.
- Never assume that deleting an old key makes an uncertain provider operation safe to repeat.

## 7.9 Transaction event

Represents a durable record of a meaningful payment state change.

Potential fields:

- `id`
- `paymentId`
- `eventType`
- `previousStatus`
- `newStatus`
- `source`
- `correlationId`
- `occurredAt`
- `metadata`

Use an append-only application model for transaction history. Enforce restricted database permissions so normal application flows cannot rewrite or delete historical records.

Do not put secrets, raw card data, or unnecessary personal information into event metadata.

## 7.10 Outbox record

Represents work that must be performed after a database transaction commits.

Requirements:

- Persist the business state change and outbox record in the same PostgreSQL transaction.
- Allow safe repeated delivery.
- Track processing attempts and scheduling.
- Support bounded exponential backoff and jitter.
- Preserve sufficient information for recovery after a process crash.
- Avoid marking work as completed before the required operation is durably acknowledged.

## 7.11 Additional models

Introduce further models only when justified by the approved scope:

- Administrative users and roles.
- Provider webhook endpoint configurations.
- Provider settlements and reconciliation records.
- Audit events.
- Rate-limit or usage records.
- Merchant payment method tokens, if explicitly required.
- Provider disputes and chargebacks.
- Fee calculations and settlement reports.

If a future requirement introduces customer balances, transfers between accounts, or custodial funds, stop and design a separate double-entry ledger and accounting model before implementation.

---

---

# 8. Financial Correctness and Invariants

These requirements are mandatory and must have automated tests.

## 8.1 Money representation

Never use JavaScript floating-point numbers for financial arithmetic.

For supported currencies, represent amounts using integer minor units and validate the permitted scale for each currency.

For example:

```typescript
type Money = {
  amountMinor: bigint;
  currency: string;
};
```

This is a conceptual domain type, not a JSON response contract.

Before implementation, decide how the application converts values between PostgreSQL `BIGINT`, Prisma representations, TypeScript `bigint`, and JSON.

JSON does not natively serialize JavaScript `bigint`. Public APIs must use a documented representation, such as validated decimal integer strings or a safe integer representation where the range is strictly bounded.

Never silently round an amount or infer currency precision.

## 8.2 Amount integrity

For every payment:

- Amount must be positive and within configured provider limits.
- Currency must be supported for the selected provider account.
- Amount and currency must be bound to the persisted payment record.
- The provider response must be checked against the expected payment and currency when the provider exposes those values.
- Refund amounts must use the original payment's currency unless an explicitly supported and documented model states otherwise.

## 8.3 Idempotent payment creation

For an identical tenant, operation, idempotency key, and request fingerprint:

- Return the existing logical result.
- Do not create a second logical payment.
- Do not create an unintended second provider charge.

If the same key is reused with a different fingerprint, return a stable conflict error.

Idempotency must be enforced in the database and application service, not merely through a cache.

## 8.4 External calls and database transactions

Never hold a PostgreSQL transaction open while waiting for a payment provider's network response.

A database transaction cannot atomically commit with an independent provider API.

Instead:

1. Validate and persist the logical operation.
2. Persist durable work in the same database transaction.
3. Submit the external operation through a worker.
4. Persist the observed result and transaction event.
5. Reconcile ambiguous outcomes.

This architecture must tolerate the worker crashing before or after a provider request.

## 8.5 Concurrency

Concurrent operations must not violate payment invariants.

Examples:

- Two refund requests cannot exceed the refundable amount.
- Two workers cannot independently advance the same payment using stale state.
- Two requests with the same idempotency key cannot create duplicate operations.
- A delayed webhook cannot overwrite a newer, valid transaction state.
- A retry cannot bypass a payment's current status restrictions.

Use appropriate database uniqueness constraints, transactions, locking or optimistic concurrency control, and conditional state updates.

Do not rely on application-level checks alone when a database constraint can enforce the invariant.

## 8.6 Uncertain outcomes

A timeout does not prove that a provider operation failed.

If the provider might have processed the operation:

- Mark the attempt as requiring reconciliation or another explicit uncertain state.
- Do not immediately create a new independent payment attempt.
- Query the provider or use its documented idempotent retry mechanism.
- Reconcile before deciding whether another financial operation is safe.

## 8.7 Historical integrity

Transaction history must preserve what happened, when it happened, and what evidence supported the decision.

Do not delete and recreate financial records to correct an operational mistake.

Use explicit compensating operations and auditable corrections appropriate to the business model.

---

---

# 9. Payment Lifecycle and State Machines

State machines must be explicit, documented, and tested.

The following are conceptual states, not a universal provider-independent status enum that must be copied unchanged.

## 9.1 Payment lifecycle

A baseline lifecycle may include:

```text
CREATED
   |
   v
PROCESSING
   |
   +------> REQUIRES_ACTION
   |             |
   |             v
   |         PROCESSING
   |
   +------> AUTHORIZED
   |             |
   |             v
   |         CAPTURE_PENDING
   |             |
   |             v
   |          CAPTURED
   |
   +------> SUCCEEDED
   |
   +------> FAILED
   |
   +------> CANCELED
   |
   +------> OUTCOME_UNKNOWN
```

A provider may support only some of these states or use different terminology.

The domain model must distinguish at least:

- Internal workflow status.
- Provider-reported status.
- Financial operation status.
- Whether an outcome is final, pending, or uncertain.

Do not collapse materially different states into a single `SUCCESS` or `FAILED` value.

## 9.2 State transition rules

For every transition, define:

- Allowed source states.
- Target state.
- Triggering command or event.
- Required authorization.
- Required financial validations.
- Provider capability requirements.
- Database concurrency behavior.
- Transaction event to append.
- Whether asynchronous work is scheduled.
- Failure and recovery behavior.

Reject illegal transitions explicitly.

For example, a payment must not be captured merely because a client asks for capture. Its current state, amount, provider capabilities, and authorization must permit the operation.

## 9.3 Webhook ordering

Webhook delivery may be duplicated, delayed, or out of order.

Never assume arrival order is authoritative.

Use verified provider event identifiers, provider transaction state queries, versioning where available, and a provider-specific transition policy.

An old notification must not downgrade a confirmed payment to an earlier state.

If events conflict and the correct outcome cannot be established, flag the payment for reconciliation rather than guessing.

## 9.4 Refund lifecycle

Model refund processing independently from payment processing.

A refund may be pending, successful, failed, or uncertain according to the provider's behavior.

Do not mark a refund successful merely because the provider accepted the request for processing.

Apply the provider's documented definition of refund completion and retain the relevant provider reference.

---
