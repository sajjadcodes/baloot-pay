# AWS Setup Guides for Baloot Auth and Baloot Pay

This folder contains local, step-by-step AWS Console guides. It is ignored by Git and stays on this machine unless you move it into tracked documentation.

## Read in this order

1. [AWS account, Free plan, and console basics](./01-account-and-free-plan.md) — account safety, credits, plan limits, and IAM concepts.
2. [Network foundation](./02-network-foundation.md) — VPC, subnets, security groups, EC2 IAM role, and Session Manager.
3. [Database and credentials](./03-database-and-secrets.md) — private RDS, separate Auth/Pay databases, SQL roles, and Secrets Manager.
4. [Launch EC2 and deploy Auth](./04-ec2-and-auth.md) — launch settings, HTTPS, then Auth.
5. [Deploy Baloot Pay](./05-deploy-pay.md) — integrate with Auth without sharing its database or credentials.
6. [Validation and remaining boundaries](./06-validation-and-boundaries.md) — final checks and project-specific limits.

## Decisions already made

- Deploy Auth before Pay; Pay uses the existing Auth service.
- Use one logical database for Auth and a separate logical database for Pay, with distinct roles and credentials and no cross-service database access.
- One EC2 host is the initial target, with a shared host/IAM-role blast radius.
- The number of RDS instances is still undecided; separate logical databases do not mean separate database servers.
- Use the AWS Free plan credits and do not convert to Paid if avoiding charges after credits expire remains the requirement. Verify the current terms and plan in your AWS account; this is temporary development infrastructure, not production hosting.

## Important guardrails

- Review AWS pricing and plan details before creating anything. Budgets and alerts are not a substitute for staying on the Free plan.
- Do not create public RDS access; do not expose SSH, PostgreSQL, or NestJS ports to the internet.
- Use EC2 IAM roles, not long-lived AWS access keys.
- Never put real credentials in these guides, source control, AMIs, shell history, or logs.
- Prisma packages in this project are release candidates. Production deployment is not approved until stable compatible versions are verified.
- Do not run Prisma contract emission, migrations, schema synchronization, or database operations without explicit approval for that exact operation.

The former all-in-one guide content is preserved across the six numbered files above.
