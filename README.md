# Baloot Pay

> **Secure payment orchestration and transaction operations platform**

Baloot Pay is a backend-first payment operations platform designed to coordinate payment transactions, integrate with external payment service providers, manage transaction lifecycles, and provide reliable, auditable payment workflows for modern digital businesses.

**Built with:** NestJS · TypeScript · PostgreSQL · Prisma · Payment Provider APIs

**Organization:** Balootix

## Documentation

The detailed product, engineering, payment-safety, and operational guidance is organized into focused documents:

| Guide | Contents |
|---|---|
| [Project overview](docs/project-overview.md) | Vision, product scope, and decisions that must be confirmed |
| [Architecture](docs/architecture.md) | Engineering principles, technology stack, architecture, and repository structure |
| [Payments and financial correctness](docs/payments-and-financial-correctness.md) | Domain model, money invariants, and payment/refund lifecycles |
| [API design](docs/api-design.md) | Endpoints, validation, authorization, errors, and pagination |
| [Security architecture](docs/security.md) | Authentication, tenant isolation, card-data handling, and secure development |
| [Reliability and operations](docs/reliability-and-operations.md) | Outbox/inbox, retries, reconciliation, observability, and deployment |
| [Implementation roadmap](docs/implementation-roadmap.md) | Phases, tasks, and completion gates |
| [Testing and production readiness](docs/testing-and-production-readiness.md) | Test strategy, definition of done, and production checklist |
| [Engineering guide](docs/engineering-guide.md) | AI coding-agent workflow and documentation standards |

Baloot Pay handles payment operations only within explicitly approved provider, jurisdiction, and compliance boundaries. It must preserve durable evidence and never treat an uncertain outcome as a confirmed failure or success.
