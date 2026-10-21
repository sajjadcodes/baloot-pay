# AWS Setup Guide for Baloot Auth and Baloot Pay

This guide is a local working note for the planned AWS deployment. The `.temp/`
directory is intentionally ignored by Git, so this guide will not be included
in commits or shared with other developers unless it is moved to tracked
documentation later.

## Recommended order

Set up the shared AWS foundation first, then deploy **Baloot Auth before
Baloot Pay**. Pay depends on Auth for identity, so verify Auth's production
endpoint and caller contract before connecting Pay to it. Keep each service's
database and credentials separate throughout. The database decision is made:
create one logical database for Auth and a different logical database for Pay.
The separate question of one shared RDS instance versus two RDS instances is
still open.

## How to use the AWS Console

Console labels sometimes change. Use the global search box at the top of the
AWS Console to find **Billing and Cost Management**, **IAM Identity Center**,
**VPC**, **EC2**, **RDS**, **Secrets Manager**, or **Systems Manager**. Before
creating a regional resource, check the Region selector in the top navigation.
IAM is mostly global; networking, compute, database, and secrets resources are
regional.

Read the summary before clicking **Create**, **Launch**, **Save**, or **Delete**.
Those actions can create billable resources or change access. This is a guide,
not permission to provision infrastructure now. Practice in a development
environment; never test destructive actions on production.

## Free plan and the $200 AWS credits

AWS currently advertises $100 in credits for eligible new accounts and the
possibility of earning up to $100 more through qualifying activities. Credits
are promotional AWS account credits, not a loan; you do not repay the amount.
Eligibility, credit availability, and eligible services are account-specific,
so confirm the plan and credit balance in **Billing and Cost Management**.

Your stated goal is to use the Free plan credits but **not pay AWS after they
end**:

1. During account signup, select the **Free plan** if AWS offers that choice.
   Review the plan terms shown in your account before accepting them.
2. Do not convert or upgrade to a **Paid plan** unless you later decide to
   accept charges. Do not assume a budget alert prevents billing.
3. AWS currently says the Free plan closes after six months or when its
   credits run out, whichever comes first, and that you are not charged unless
   you convert to Paid. Recheck the current terms in your account because
   AWS may change offers and eligibility.
4. Plan this as a temporary development environment, not production hosting.
   When the Free plan closes, expect hosted services to become unavailable.
   Export any data or configuration you need before then; do not assume a
   database, IP address, or service will remain available.
5. Keep checking the account's plan and credit balance before creating
   resources. If AWS presents a conversion prompt, stop and read it carefully.
   Decline it if avoiding all charges remains the priority.

**Important:** The Free plan's account closure and the treatment of data or
resources are governed by the current AWS account terms. Export data you need
and do not use this temporary account as the only copy of important data.

### First console visit: protect the account and check costs

If you do not yet have an AWS account, start at the official AWS website and
choose **Create an AWS account**. Follow the signup and identity/payment
verification steps directly on AWS. Choose a company-controlled email and
strong unique password. Do not send credentials or payment details to anyone
helping with setup. Once the account is ready, sign in to the AWS Management
Console.

1. Sign in as the account owner (root) only for initial account setup. Root has
   unrestricted power; do not use it for daily work or application access.
2. Open the account menu at the top right and choose **Security credentials**
   or **Account**. Find multi-factor authentication (MFA), register a
   passkey/security key or authenticator, then verify it works. Do not create
   root access keys. Store recovery information securely.
3. Search for **IAM Identity Center**. Enable it if available and follow its
   setup wizard to create named human access with MFA. Give only trusted
   operators an administrator permission set for setup tasks; use lower
   privilege for routine work. Do not share logins.
4. Search for **Billing and Cost Management → Budgets** and review the
   available budget/cost controls for your account plan. Alerts are useful
   visibility, but a budget alert does not necessarily stop spending and does
   not replace staying on the Free plan.
5. Search for **AWS Pricing Calculator** in another tab. Estimate EC2, RDS,
   storage, backups, data transfer, public IPv4, and any NAT gateway or load
   balancer before creating them. Always-on RDS, NAT gateways, and load
   balancers can cost money even with little traffic.
6. Choose the Region deliberately based on users, operators, data residency,
   and service availability. Use the same Region for Auth, Pay, EC2, and RDS
   initially. Moving a database later requires a planned migration.
7. Write down the account ID, chosen Region, intended DNS names, and authorized
   operators. Never put passwords, access keys, tokens, or DB connection
   strings in this note.

**Checkpoint:** You should be able to sign in as a named MFA-protected
operator, identify the selected Region, and see cost alerts before creating
resources. If anyone asks for an application access key or shared root login,
stop.

## What IAM means here

There are two related but different uses of IAM:

1. **EC2 instance role (recommended and required):** gives software on EC2
   permission to call specific AWS services, such as Secrets Manager. Attach
   the role through an instance profile. Do not create IAM access keys or put
   AWS credentials in either service's `.env` file.
2. **RDS IAM database authentication (optional follow-up):** uses a short-lived
   IAM token instead of a PostgreSQL password to log in. This is separate from
   the EC2 role. Before enabling it, verify that the selected Prisma 8
   PostgreSQL runtime and its connection pool can obtain and refresh tokens
   safely for every new connection. Until that is verified and load-tested,
   use separate, randomly generated database passwords stored in Secrets
   Manager.

An EC2 instance role does **not** automatically create a PostgreSQL database
user, grant SQL permissions, or make a database private.

