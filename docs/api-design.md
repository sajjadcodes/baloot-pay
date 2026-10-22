# 10. API Design

Use an unversioned REST API unless a documented requirement justifies another protocol.

Suggested initial endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/payments` | Create a payment |
| GET | `/api/payments/:id` | Retrieve a payment |
| POST | `/api/payments/:id/confirm` | Continue a supported payment flow |
| POST | `/api/payments/:id/capture` | Capture an authorized payment |
| POST | `/api/payments/:id/cancel` | Cancel a cancellable payment |
| POST | `/api/payments/:id/refunds` | Create a refund request |
| GET | `/api/payments/:id/refunds` | List refunds associated with a payment |
| GET | `/api/refunds/:id` | Retrieve a refund |
| GET | `/api/transactions` | Query authorized transaction records |
| GET | `/api/health/live` | Process liveness |
| GET | `/api/health/ready` | Dependency readiness |

Only expose operations supported by the configured provider and approved product scope.

`/api/health/live` reports only whether the process can respond. It does not
prove that the database, authentication service, or payment provider is ready.
Add `/api/health/ready` only alongside explicit checks for required runtime
dependencies; it must return unavailable when a required dependency is not
ready.

Provider webhooks should use separate, provider-specific routes or a carefully designed routing mechanism with independent signature verification.

## 10.1 API conventions

- Validate every request against a strict DTO.
- Reject unknown or unauthorized writable properties.
- Authenticate every protected endpoint.
- Enforce object-level authorization on every resource access.
- Derive tenant identity from the authenticated principal, not an arbitrary request body field.
- Require idempotency keys for payment creation, refunds, and other non-idempotent financial commands.
- Use stable error codes.
- Document pagination, filtering, limits, and sorting.
- Never expose provider secrets, internal stack traces, or sensitive raw provider responses.
- Return only fields that callers are authorized to access.

Successful responses use a consistent envelope:

```json
{
  "success": true,
  "code": 202,
  "message": "Successful request!",
  "data": {
    "paymentId": "payment-reference"
  },
  "requestId": "server-generated-request-id"
}
```

`code` is the actual HTTP status, not a payment outcome. For example, `202` means the request was accepted for processing; it does not mean funds were captured or settled. The interceptor leaves `204 No Content` and `304 Not Modified` without a response body.

A successful HTTP response does not necessarily mean that money has moved. Clearly distinguish an accepted asynchronous request from a confirmed financial outcome.

## 10.2 Error model

Use a consistent response structure. The global exception filter returns a sanitized form such as:

```json
{
  "statusCode": 409,
  "code": "CONFLICT",
  "message": "The request conflicts with current state.",
  "requestId": "server-generated-request-id"
}
```

The filter preserves the HTTP status, uses stable general codes for common client errors, and does not expose exception or provider details. Unexpected server errors return a generic message and are logged with the request ID and error type. The request ID is null only if the request-context middleware did not run.

Do not expose internal exceptions or sensitive provider messages directly to clients.

## 10.3 Pagination and query protection

- Use bounded page sizes.
- Validate all filters.
- Prevent expensive unrestricted queries.
- Apply tenant-scoped filters before returning results.
- Avoid exposing internal provider identifiers unless required.
- Use cursor pagination for large or frequently changing datasets when appropriate.

---
