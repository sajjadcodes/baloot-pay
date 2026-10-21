# 1. Project Vision

Baloot Pay aims to provide a reliable abstraction layer between digital businesses and payment providers.

Instead of coupling business applications directly to individual payment provider APIs, Baloot Pay exposes a consistent internal payment interface and manages the operational complexity of payment processing.

The platform should make it possible to:

- Create and track payment transactions.
- Integrate multiple payment providers through a consistent adapter interface.
- Support payment authorization, capture, cancellation, and refunds where the provider supports them.
- Handle asynchronous payment notifications safely.
- Prevent duplicate operations and unintended duplicate charges.
- Track transaction state changes through an auditable history.
- Recover from timeouts, network failures, and worker interruptions.
- Reconcile internal transaction records against provider records.
- Support multiple business tenants with strict data isolation.
- Provide operational visibility into failed, delayed, and inconsistent transactions.
- Offer a stable API that hides provider-specific implementation details.

The central objective is not simply to make payment requests succeed.

It is to make payment operations **correct, traceable, recoverable, secure, and understandable even when external systems fail**.

## 1.1 Product principles

Every architectural decision must prioritize these properties:

| Property | Requirement |
|---|---|
| Financial correctness | No silently duplicated or incorrectly represented financial operations. |
| Idempotency | Retrying an operation must not unintentionally execute it twice. |
| Security | Sensitive data and operations are protected by default. |
| Tenant isolation | One tenant cannot access another tenant's resources. |
| Reliability | Failures are explicitly represented and recoverable. |
| Auditability | Important state changes have attributable, durable records. |
| Extensibility | New payment providers do not require rewriting domain logic. |
| Observability | Operators can investigate failures without accessing sensitive payment data. |
| Maintainability | Modules have clear responsibilities and controlled dependencies. |

---

---

# 2. Product Scope and Boundaries

## 2.1 Initial product scope

The initial release should implement a payment orchestration service with a provider-independent domain model.

The platform will be responsible for coordinating operations, maintaining its internal transaction records, processing provider responses, handling webhooks, and reconciling discrepancies.

Actual money movement remains the responsibility of the integrated payment provider or other appropriately authorized financial institution.

### Included in the initial roadmap

- Integration with the existing multi-tenant authentication service and payment-service resource authorization.
- Payment creation and retrieval.
- Provider adapter abstraction.
- Payment status tracking.
- Provider-hosted checkout or provider token-based payment flows.
- Idempotent API operations.
- Authenticated and verified webhooks.
- Refund workflows.
- Authorization and capture where supported.
- Background job processing.
- Transaction event history.
- Reconciliation workflows.
- Operational dashboards or administrative APIs.
- Audit logs, metrics, structured logging, and alerts.
- Development, test, staging, and production configurations.

Individual payment methods and provider capabilities must be enabled only when explicitly selected and verified against the provider's documentation.

## 2.2 Explicitly excluded until separately approved

The initial release must not assume that Baloot Pay is authorized or designed to:

- Hold or custody customer funds.
- Maintain spendable customer balances.
- Operate as a bank, wallet, or stored-value institution.
- Issue payment cards.
- Store raw card numbers, CVVs, PINs, or magnetic-stripe data.
- Perform card acquiring independently of an authorized provider.
- Execute arbitrary bank transfers or payouts.
- Provide lending, credit, or investment products.
- Implement cryptocurrency custody.
- Make automated fraud decisions without an approved risk policy.

These are not ordinary feature additions. They may change the legal, security, operational, and accounting requirements of the entire platform.

## 2.3 Decisions that must not be guessed

Before implementing provider-dependent or jurisdiction-dependent functionality, document the following:

- Initial country of operation and applicable jurisdictions.
- Supported transaction currencies.
- Initial payment provider and supported payment methods.
- Merchant-of-record and settlement responsibilities.
- Whether Baloot Pay serves one merchant or multiple independent tenants.
- The authentication service's integration contract, tenant/permission claims, administrative access boundary, and failure behavior.
- Expected transaction volume and latency requirements.
- Data retention and deletion requirements.
- Applicable PCI DSS scope and validation obligations.
- Applicable privacy, consumer protection, financial services, and reporting obligations.

Use explicit configuration and capability flags for approved decisions.

Do not invent provider capabilities, legal conclusions, settlement guarantees, or financial behavior to keep implementation moving.

---
