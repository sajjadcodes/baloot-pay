# 11. Security Architecture

Security is a first-class requirement, not a final development phase.

Use the [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) as a threat-awareness baseline. Determine PCI DSS applicability with qualified payment-security professionals and the relevant acquiring or payment partners. This README does not establish compliance.

## 11.1 Authentication and authorization

Integrate with the already-deployed multi-tenant authentication service. Do not create a replacement authentication module, credential store, or user/tenant identity lifecycle inside Baloot Pay.

Baloot Pay must:

- Validate the service's documented issuer, audience, signature/token status, expiry, and required claims.
- Fail closed when authentication cannot be established or the required trust dependency is unavailable.
- Map verified identity and tenant claims into payment-service authorization.
- Explicit tenant and resource authorization.
- Least-privilege API scopes.
- Separate privileged administrative access.
- Brute-force and abuse protection.
- Audit logging for privileged operations.

Credential issuance, revocation, and rotation remain the responsibility of the deployed authentication service. Do not trust tenant IDs, roles, permissions, provider account IDs, or payment statuses supplied separately by clients.

## 11.2 Tenant isolation

Every tenant-owned resource must be scoped to its owning tenant.

Authorization must be enforced in application services or repositories using authenticated context.

Do not fetch a payment by ID and rely on the controller to remember a tenant check afterward.

Where appropriate, use PostgreSQL row-level security as an additional defense-in-depth mechanism. If used, configure tenant context safely for every database transaction and connection-pool interaction.

Test cross-tenant access for reads, updates, refunds, exports, webhook processing, and administrative actions.

## 11.3 Payment card data

The default design must not receive or store raw cardholder data.

Prefer provider-hosted checkout, provider-hosted payment fields, or provider tokenization that keeps sensitive card data outside Baloot Pay's infrastructure.

Never store CVV/CVC, PIN data, magnetic-stripe data, or equivalent sensitive authentication data after authorization. Do not log such data under any circumstances.

Payment tokens must be treated as sensitive credentials, with access and disclosure limited to approved operations.

Using a provider does not automatically eliminate PCI DSS responsibilities. Confirm the actual integration scope before production deployment.

## 11.4 Webhook verification

Every webhook integration must:

1. Read the request according to the provider's documented signing specification.
2. Preserve the exact raw bytes when required for signature verification.
3. Verify the signature before trusting event contents.
4. Validate the timestamp or replay window where supported.
5. Validate the expected provider account and endpoint context.
6. Reject invalid signatures.
7. Persist accepted events durably before acknowledging them, when required by the ingestion design.
8. Deduplicate repeated provider events.
9. Process events asynchronously where appropriate.
10. Retain enough metadata to investigate failed processing.

Never accept a browser redirect, query parameter, or client-side callback as proof of payment.

If the provider has no cryptographically verifiable webhook mechanism, require an approved alternative verification process, such as querying the provider's authenticated API.

## 11.5 Secrets management

- Do not commit real secrets.
- Provide a sanitized `.env.example`.
- Validate required configuration at application startup.
- Fail startup when critical production secrets are absent or invalid.
- Use a production secrets manager or approved secret-injection mechanism.
- Separate test, staging, and production credentials.
- Rotate compromised credentials promptly.
- Restrict who and what can read production secrets.

## 11.6 Input validation and API hardening

- Enforce request-size limits.
- Validate content types.
- Configure rate limits and operation-specific quotas.
- Apply timeouts to outbound calls.
- Validate provider response schemas.
- Prevent mass assignment.
- Prevent injection through parameterized database operations.
- Restrict outbound network destinations for configurable integrations.
- Protect against SSRF where URLs or callback destinations are accepted.
- Restrict CORS if browser-based clients require it.
- Avoid returning detailed exception information.

## 11.7 Logging and privacy

Never log:

- API secrets or access tokens.
- Raw authorization headers.
- CVV/CVC or raw card numbers.
- Database connection strings.
- Private cryptographic material.
- Unredacted sensitive provider payloads.

Use structured logs with request IDs, correlation IDs, internal payment IDs, tenant identifiers where appropriate, and normalized error codes.

Keep sensitive values out of metrics labels and tracing attributes.

## 11.8 Supply chain and secure development

- Pin dependencies and commit the lockfile.
- Scan dependencies for known vulnerabilities.
- Enable secret scanning.
- Run static analysis and linting.
- Keep the runtime and base container images patched.
- Use a non-root container user.
- Generate a software bill of materials where appropriate.
- Restrict CI/CD permissions.
- Protect production deployment credentials.
- Review security-sensitive dependency updates before release.

---
