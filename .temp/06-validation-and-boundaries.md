## Phase 5: Validate and improve isolation

- Confirm from an external network that RDS is unreachable and application
  ports other than the approved HTTPS entry point are closed.
- Confirm Auth's database user cannot access Pay's database and Pay's user
  cannot access Auth's database.
- Confirm runtime users cannot create/alter/drop schema objects.
- Confirm no AWS access keys or database passwords are present in the
  repository, build artifacts, logs, shell history, or deployment manifests.
- Test backup restoration, secret rotation, EC2 replacement, application
  restart, and database failover in a non-production environment.
- Monitor EC2/RDS CPU, memory, connections, storage, latency, errors, and
  saturation. One EC2 host is a single compute failure domain; plan for a
  second instance and load balancer before availability requirements demand it.
- Reassess separate EC2 instances and a separate Pay RDS instance as soon as
  the payment risk, compliance, traffic, or availability requirements call for
  stronger isolation.

## Current repository boundary

This repository currently uses `DATABASE_URL` for Pay runtime configuration
and `MIGRATION_DATABASE_URL` for Prisma tooling. In AWS, populate those from
Pay's corresponding Secrets Manager secrets; do not commit real values. The
Prisma packages in the repository are release candidates, so do not treat this
setup as production-approved until stable compatible Prisma 8 packages and the
runtime requirements have been verified.

No migration, schema synchronization, or Prisma contract emission is authorized
by this guide. Those operations still require explicit approval for the exact
operation.
