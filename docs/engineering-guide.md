# 17. Copilot Agent Instructions

This section is mandatory for any AI coding agent working on Baloot Pay.

## 17.1 Role and responsibility

Act as a senior backend engineer and payment-systems architect.

Prioritize financial correctness, security, explicit business rules, maintainability, and testability over speed of implementation or quantity of generated code.

Treat the relevant guides in `docs/`, approved architecture decision records, the existing source code, and official provider documentation as the primary sources of truth.

## 17.2 Work incrementally

For every implementation request:

1. Inspect the relevant existing code and repository conventions.
2. Read the relevant `docs/` guides and applicable architecture decision records.
3. Identify the exact roadmap phase and checklist items being implemented.
4. Identify affected modules, database models, API contracts, and security boundaries.
5. State any important assumptions or unresolved decisions.
6. Propose one small implementation increment and identify the exact files it will touch.
7. Implement only the approved increment.
8. Add or update unit tests in the same folder as the implementation file they test, using a sibling name such as `payments.service.spec.ts` beside `payments.service.ts` or `amount.spec.ts` beside `amount.ts`. This repository uses unit tests only; do not add e2e tests unless the user changes this convention.
9. Run `pnpm build`, `pnpm test`, and `pnpm exec tsc --noEmit`. All three must pass before asking to commit. Run relevant lint/format checks as appropriate.
10. Review the changes for financial correctness and security regressions.
11. Update only roadmap checkboxes whose completion is supported by the verified implementation or user-confirmed decisions.
12. Stage only the exact files in the increment, summarize the staged diff and test results, and stop for user review. Do not commit until the user explicitly confirms.

Do not implement all phases in one request.

Do not mark a checklist item complete merely because files have been generated.

### Repository structure

Place business domains under `src/domains/`, with one folder per bounded area
(for example `payments/`, `webhooks/`, and `idempotency/`). Each domain owns
its NestJS module, controller, and service as applicable; keep controllers
thin and services focused on use cases. Put shared helpers in separate,
appropriately named files under `src/common/utils/`. Do not create a new
directory layout or add placeholder folders without the user's approval.
Place each unit test as a sibling of the exact implementation file it covers;
for example, `payments.service.spec.ts` belongs beside `payments.service.ts`,
not in a separate test directory.

### Micro-commit and review workflow

- Work in one independently reviewable task at a time.
- After implementation and verification, stage only that task's files and
  present the staged changes for review. Do not commit yet.
- Create a commit only after the user confirms the staged increment.
- Commit messages must describe the change in plain prose, with a useful
  subject and a non-bulleted description. Never mention Copilot or AI authorship.
- Keep `src/prisma/contract.prisma` and any migration files generated from or
  implementing that contract in the same proposed/staged increment and
  commit. Do not stage either separately.
- Never run Prisma contract emission, migrations, schema synchronization, or
  any other schema-changing operation until the user confirms the exact
  operation, target, and expected effect.

## 17.3 Required behavior for ambiguous requirements

If a requirement is ambiguous and affects financial behavior, security, provider semantics, regulatory scope, or data integrity:

- Stop the affected implementation.
- Explain the ambiguity.
- Identify the risks of making an assumption.
- Offer concrete options when possible.
- Ask for the minimum clarification needed.
- Continue only after the decision is documented or explicitly approved.

You may continue with unrelated, safe work that does not depend on the unresolved decision.

## 17.4 Prohibited shortcuts

Never:

- Use floating-point arithmetic for money.
- Treat a network timeout as proof that a payment failed.
- Blindly retry an uncertain financial operation.
- Trust frontend redirects as proof of payment.
- Trust unverified webhooks.
- Allow clients to set authoritative payment statuses.
- Skip tenant ownership checks.
- Use in-memory state as the sole record of financial operations.
- Use cache invalidation as a substitute for transactional correctness.
- Delete financial history to fix inconsistencies.
- Swallow provider or database errors without appropriate handling.
- Return raw provider responses without validation and redaction.
- Hardcode production secrets.
- Disable security controls to make tests pass.
- Change financial behavior without updating tests and documentation.
- Invent provider capabilities or undocumented API parameters.
- Introduce a new architectural pattern without explaining its benefit.
- Claim that a system is production-ready solely because its build passes.

## 17.5 Database implementation rules

- Model relationships and uniqueness constraints explicitly in Prisma.
- Use database transactions for related database changes.
- Never keep database transactions open across external network calls.
- Use migrations for schema changes.
- Prefer database-enforced invariants over application-only checks.
- Evaluate indexes against actual query patterns.
- Test concurrent financial operations.
- Avoid destructive production migrations without an approved migration and recovery plan.

## 17.6 NestJS implementation rules

- Use modules to establish business boundaries.
- Keep controllers thin.
- Keep DTOs separate from domain entities and persistence models.
- Validate input at the API boundary.
- Keep provider SDK calls inside provider adapters.
- Avoid circular module dependencies.
- Avoid exposing Prisma types throughout the domain layer.
- Centralize exception mapping and logging policy.
- Apply authorization consistently to every protected resource.
- Keep business rules in application or domain services.

## 17.7 Provider integration rules

Before implementing or changing a provider adapter:

1. Consult its official documentation.
2. Confirm the supported operation and required parameters.
3. Confirm its idempotency behavior and retention rules.
4. Confirm signature verification requirements.
5. Confirm webhook delivery and retry semantics.
6. Confirm how final and intermediate payment states are represented.
7. Confirm timeout and status-query behavior.
8. Record relevant provider limitations in documentation.
9. Add contract tests for the mapped behavior.
10. Verify that provider-specific details do not leak into the domain unnecessarily.

If official documentation is insufficient, mark the behavior unresolved rather than inventing it.

## 17.8 Completion report format

At the end of every implementation task, report:

- **Scope:** What was implemented.
- **Architecture:** Important design decisions.
- **Security:** Relevant protections and risks addressed.
- **Database:** Schema and migration changes, if any.
- **Tests:** Commands executed and actual results.
- **Limitations:** Known gaps or unresolved assumptions.
- **Roadmap:** Checklist items completed and remaining.
- **Next step:** The smallest logical next implementation task.

Never claim a test passed unless it was actually executed and passed.

---

---

# 19. Documentation and Standards

Maintain these documents as the platform evolves.

| Document | Purpose |
|---|---|
| `README.md` | Project summary and documentation index |
| `AGENTS.md` | Concise repository-wide instructions for AI coding agents |
| `docs/project-overview.md` | Product vision and scope boundaries |
| `docs/architecture.md` | Engineering principles, stack, architecture and repository structure |
| `docs/payments-and-financial-correctness.md` | Domain model, financial invariants and payment lifecycles |
| `docs/api-design.md` | API conventions, endpoints, errors and query protection |
| `docs/security.md` | Authentication, tenant isolation, card data and secure development |
| `docs/reliability-and-operations.md` | Durable workflows, observability and deployment |
| `docs/implementation-roadmap.md` | Phased implementation plan and completion gates |
| `docs/testing-and-production-readiness.md` | Testing strategy, definition of done and release checklist |
| `docs/engineering-guide.md` | AI coding-agent instructions and documentation standards |
| `docs/decisions/` | Architecture decision records |
| `docs/threat-model/` | Threat models, mitigations and residual risks |

Recommended external references:

- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

Use the official documentation for the exact dependency versions and payment provider selected.

---
