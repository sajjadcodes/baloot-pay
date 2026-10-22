# AWS Deployment Guide

This guide consolidates the AWS setup notes and the Baloot Auth deployment
handoff. It is operational context, not authorization to create or change AWS
resources. Confirm current AWS state and obtain owner approval for the exact
operation before provisioning, changing access, deploying, or incurring cost.

## Current environment handoff

**Owner-reported on 2026-10-23; not independently verified. Recheck live
state before relying on it.**

- AWS region: `us-east-1`.
- Shared EC2 host: `baloot-server`, Amazon Linux 2023, administered through
  Systems Manager Session Manager rather than SSH.
- The host had approximately 1.9 GiB memory after resizing. A previously
  created 2 GiB swap file was absent after restart. Check current free memory,
  disk, and swap before adding workloads.
- Auth is reported to run as `baloot-auth.service` from
  `/home/ssm-user/baloot/baloot-auth/dist/src/main.js`, with protected
  configuration in `/etc/baloot-auth.env`. Its application listens on
  `127.0.0.1:3000`.
- Caddy is reported to run as `caddy.service`, with configuration at
  `/etc/caddy/Caddyfile`. It serves `auth.balootix.com` and proxies to Auth.
  Preserve the existing service and site when adding any Pay hostname.
- Auth HTTPS was reported working with a Let's Encrypt certificate issued
  using TLS-ALPN validation. Port 80 was unreachable during setup; do not open
  it as a workaround without a separate review.
- A private RDS PostgreSQL instance exists and EC2-to-RDS connectivity on
  port 5432 was reported confirmed. Auth uses its own `baloot_auth` database
  and `baloot_auth_app` login. These are Auth-only and must not be reused by
  Pay.
- Pay's database, runtime/migration roles, Secrets Manager entries, hostname,
  systemd service, and deployment were not inspected or verified.
- An older Auth database credential was reported exposed in chat/IDE context;
  rotation is unconfirmed. Do not reuse it. Confirm rotation out of band with
  the owner; change Auth configuration only with approval.
- The handoff reported the EC2 public address and that `auth.balootix.com`
  resolved to it at that time. The address may change; this guide omits it.
  Verify current EC2 addressing and each Pay DNS record before relying on
  either.

The handoff does not verify full production Auth flows, Pay connectivity, or
Pay readiness. It also does not establish whether Pay should use another
logical database on the existing RDS instance or a separate RDS instance.

## Non-negotiable boundaries

- Keep Auth and Pay as separate processes/containers with separate
  configuration, logs, health checks, operating-system users, and
  deployment/restart controls.
- Keep Auth and Pay in different logical databases, with different runtime
  credentials. Pay must never connect to or query Auth's database.
- Keep each API's database runtime role least-privileged and separate from
  migration/owner credentials. Never give migration credentials to the API.
- Do not use the RDS master account as an application account. Do not grant
  broad schema, owner, or superuser permissions to fix an application error.
- Keep RDS private and allow PostgreSQL access only from approved application
  security groups. Never expose RDS, SSH, or NestJS ports to the public
  internet.
- Use EC2 instance roles for AWS access, not long-lived AWS access keys.
  Restrict Secrets Manager permissions to exact required secret ARNs and
  customer-managed KMS keys where applicable.
- Keep secrets out of source control, this document, shell history, user data,
  AMIs, build output, logs, and screenshots. Do not print environment files
  while inspecting configuration.
- Require IMDSv2 and use Session Manager for host administration. Do not
  weaken security groups or open SSH to work around an access problem.
- Shared EC2 means shared operating-system and instance-profile blast radius.
  Shared RDS means shared capacity, maintenance, outage, and recovery failure
  domains even when logical databases and roles are separate.
- Do not run Prisma contract emission, migrations, schema synchronization,
  database creation, role/grant changes, or destructive operations without
  explicit user approval for that exact operation and target. Follow the
  approval boundary in the [implementation roadmap](implementation-roadmap.md).

## Cost and account safety

- Confirm the account's current plan, promotional-credit balance, and terms
  in Billing and Cost Management. Offers, eligibility, expiration, and service
  coverage can change. Do not assume credits make resources free or that a
  budget alert prevents charges.
- The stated preference in the earlier setup notes was to avoid AWS charges
  after credits expire. If that remains the requirement, verify the current
  plan terms and do not convert to a paid plan without the owner's decision.
- Estimate EC2, RDS, storage, backups, data transfer, public IPv4, NAT
  gateways, and load balancers before creating or resizing resources.
- Use a root account only for necessary account setup; protect it with MFA
  and do not create root access keys. Use named human identities with MFA
  and least privilege for routine work. Do not share logins.
- Treat this deployment as a development environment unless availability,
  recovery, security, and compliance gates have been explicitly satisfied.

## Before making any Pay deployment change

Use the approved Session Manager path and inspect without exposing secrets:

1. Check current EC2 instance type, public address, memory, swap, disk space,
   running services, listening ports, and available capacity.
2. Check the Pay checkout at `/home/ssm-user/baloot/baloot-pay`: repository
   status, branch/commit, package scripts, configuration requirements,
   deployment documentation, and existing Pay database configuration.
3. Check the live Auth unit, Caddy service, Caddyfile, current DNS, security
   groups, RDS connectivity, and any Pay unit/configuration. Do not print
   secret files or values.
4. Confirm whether Pay already has a distinct database, runtime login,
   migration login, and approved secret references. If not, request approval
   before creating them. Do not infer Pay settings from Auth.
5. Confirm the Pay hostname, frontend origins, external email/payment
   integrations, authentication contract, secret delivery, and TLS
   requirements with the owner.
6. Select an unused loopback/private upstream port. Preserve Auth's
   `127.0.0.1:3000` listener and existing Caddy site; make a reviewed,
   additive Caddy change rather than replacing the configuration.
7. Recheck Pay DNS and inbound rules. Do not open ports, resize the instance,
   alter shared IAM, modify shared services, or change TLS/network settings
   without explicit approval and cost/impact review.

Do not infer Pay's authentication or tenant authorization contract from an
Auth health check. Pay must use the documented, approved Auth integration;
never share Auth signing keys, session tables, or database access.

## Database and secret setup decisions

- Use a dedicated logical database and distinct SQL roles for Pay regardless
  of whether the owner chooses the existing RDS instance or a separate one.
- A shared RDS instance may reduce cost but shares CPU, memory, storage,
  maintenance, instance failure, and administrative/recovery boundaries.
  Separate RDS instances provide stronger isolation at additional cost.
  Record the approved choice and rationale before provisioning.
- Keep RDS private, encrypted, backed up, and configured with retention and
  deletion protection appropriate to the approved environment. A backup is
  not a recovery plan until restore has been tested.
- Store runtime and migration credentials separately in the approved secret
  manager. Limit access by exact secret ARN. Plan and test credential
  rotation against application connection-pool behavior.
- Require TLS and verify the database server certificate for administrative
  and application connections as required by the selected runtime.
- Review any bootstrap SQL, grants, or migrations before execution. Test
  grants in a disposable database; verify both allowed and denied access.

## Deployment and verification checklist

Before exposing Pay through HTTPS, verify all applicable items:

- Pay starts as a distinct service/process under its own OS identity and
  listens only on a private or loopback interface.
- Pay uses only its own runtime configuration and database credentials;
  startup does not require migration credentials.
- Auth remains healthy on its existing loopback port, and the Caddy change
  preserves the Auth site while routing only the approved Pay hostname.
- The public TLS certificate and DNS point to the intended endpoint. Do not
  rely on stale or ephemeral IP information.
- RDS is unreachable from outside the approved network; public ingress exposes
  only the approved HTTPS entry point.
- Auth's database identity cannot access Pay's database, and Pay's identity
  cannot access Auth's database. Runtime identities cannot alter schema.
- Test Pay's authentication/authorization, tenant isolation, missing or
  invalid configuration, Auth timeout/outage behavior, database outage,
  connection-pool recovery, safe logging, rate limiting, and payment
  idempotency before any real transactions.
- Test restart, deployment recovery, secret rotation, backup restore, and
  EC2 replacement in an appropriate non-production environment.
- Monitor memory, disk, CPU, RDS connections, storage, latency, errors, and
  saturation. A single EC2 host is a compute failure domain, not high
  availability.

Passing a health check or build does not establish production readiness.
Production use additionally requires the applicable provider, financial
correctness, security, operational, and compliance reviews.
