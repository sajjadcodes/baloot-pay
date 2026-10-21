## Phase 4: Deploy Baloot Pay second

### 11. Deploy Pay and integrate with Auth

1. Create Pay's own runtime and migration database roles, Pay database (or
   separate RDS instance), and separate Secrets Manager secrets.
2. Deploy Pay as a separate process or container with its own OS user,
   configuration, health check, logs, and restart/deployment controls. Initially
   keep its port private and expose it only through the reverse proxy or load
   balancer.
3. Configure Pay to call Auth through the documented HTTPS API contract. Do not
   share signing keys, read Auth's tables, or treat Auth `clientId` as a
   payment tenant ID. Resolve the verified Auth `userId` to Pay's local
   `TenantUser` mapping and enforce tenant ownership for every payment resource.
4. Give Pay only its runtime secret and narrowly scoped AWS permissions. Do not
   pass Auth's database secret to Pay. If both services share one EC2 instance
   role, remember that the role's permissions remain available to code on that
   host; separate RDS credentials still ensure SQL access is scoped by database.
5. Verify Pay starts without migration credentials and fails clearly when its
   own runtime database is unavailable. Test missing/invalid credentials,
   Auth timeouts and outages, cross-tenant access, connection-pool recovery,
   and payment idempotency before public launch.
6. Add a Pay DNS name and route it through the HTTPS reverse proxy. Keep Pay's
   NestJS port private. Verify Auth-to-Pay requests use the documented
   authenticated API contract, not a shared database or copied signing key.
7. Before exposing Pay publicly, verify authorization and tenant ownership on
   every payment endpoint, secure logging, rate limits, safe error handling,
   database least privilege, and recovery behavior. Passing a health check is
   not enough to approve a payment service for production.

