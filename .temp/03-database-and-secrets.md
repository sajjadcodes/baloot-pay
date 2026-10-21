## Phase 2: Set up PostgreSQL and credentials

### 5. Create the private RDS PostgreSQL instance

1. First decide whether this is disposable development or production. Select
   an engine version only after checking compatibility with the Prisma
   runtime; the Prisma packages in this repository are release candidates, so
   do not assume the newest PostgreSQL release is supported.
2. Search **RDS → Databases → Create database**. Choose **Standard create**
   so you can inspect all network and security settings before provisioning.
3. Select **PostgreSQL** and the reviewed engine version. Choose **Manage
   master credentials in AWS Secrets Manager** if offered. Otherwise use a
   strong random master password and store it securely immediately. The master
   account is for bootstrap/admin only, never for either service runtime.
4. Select an instance class and storage after reviewing AWS Pricing Calculator.
   For production, explicitly decide whether to enable Multi-AZ; it increases
   cost but improves availability. Keep learning/test databases disposable
   and free of real payment data.
5. In **Connectivity**, select the new VPC and a DB subnet group containing
   the private subnets across at least two AZs. Set **Public access** to **No**.
   Attach `baloot-db-sg`, not the default security group.
6. Enable encryption at rest, automated backups, and a retention period that
   fits the recovery plan. Enable deletion protection for production. These
   settings reduce risk but do not replace a tested restore.
7. Before clicking **Create database**, inspect the summary: correct VPC,
   public access `No`, private subnet group, and `baloot-db-sg`. Review the
   monthly estimate. Create only when you are ready for the charge.
8. Wait for status `Available`. Open the database's **Connectivity & security**
   tab and record the endpoint and port. An endpoint is not a password, but
   avoid posting it publicly.
9. Later, test a connection from inside the VPC (the EC2 host) and confirm
   an outside machine cannot connect. Never make RDS public to troubleshoot.

**Why:** RDS manages the database host and backups. Private subnets and the
security group decide which network sources can reach PostgreSQL.

### 6. Use separate Auth and Pay databases; choose the RDS instance topology

1. Create one logical database and SQL roles for Auth, and a different logical
   database and SQL roles for Pay. This separation is required whichever
   infrastructure option you choose. Never grant Pay access to Auth's database.
2. A PostgreSQL database is a namespace on a server, not a separate server.
   One RDS instance can host both databases at lower initial cost only if you
   accept shared CPU, memory, storage, maintenance, outage, and recovery
   boundaries. A restore can need extra care because the instance is shared.
3. Use separate RDS instances when payment workload, recovery, compliance,
   availability, or blast-radius requirements need stronger isolation. This
   costs more but creates a stronger infrastructure boundary.
4. The number of RDS instances is not decided yet. Record the choice and
   rationale before provisioning; do not infer infrastructure isolation from
   the separate database names.

### 7. Create databases and SQL roles

The RDS console creates the PostgreSQL server. Creating app databases and
least-privilege roles is a PostgreSQL administration task, not an IAM wizard.
Never use the RDS master account as an application account, and do not paste
unreviewed SQL into production. This step needs reviewed SQL and a secure
database administration connection. Do not improvise grants in the console:
we should prepare the exact bootstrap SQL, test it in a disposable database,
and review it before you run it. It is separate from Prisma contract emission
and migrations, which still require your explicit approval.

1. Connect to RDS from inside the VPC using the approved secure admin path.
   Keep TLS enabled and verify the server certificate. Do not make RDS public
   so your laptop can connect.
2. Create the dedicated Auth database and Auth runtime role. Separately create
   the dedicated Pay database and Pay runtime role. Create distinct
   schema/migration roles for each service if the migration plan needs them.
3. Grant each runtime role access only to its own database and required
   operations. Runtime roles must not own schemas or have schema-changing
   privileges. Confirm exact grants required by Prisma 8 before applying them;
   never fix a permission error by granting superuser or broad owner rights.
4. Verify with each runtime role that it can connect only to its intended
   database and cannot create, alter, or drop schema objects. Test denied
   access too, not just successful access.

### 8. Save credentials in Secrets Manager

1. Search **Secrets Manager → Store a new secret**. Select **Other type of
   secret** for database credentials.
2. Enter only the fields the service secret loader is designed to read. Use
   separate secrets such as `/baloot/prod/auth/database-runtime` and
   `/baloot/prod/pay/database-runtime`. Give migration credentials different
   secret names and access policies.
3. Choose the intended KMS key and set a descriptive name and description.
   Do not put passwords in secret names, descriptions, tags, or screenshots.
   Select **Next**, review rotation settings, and store the secret.
4. Keep the master secret separate from service credentials. Restrict the EC2
   role to read only the exact runtime secret ARNs it needs. Grant
   `kms:Decrypt` only for the relevant customer-managed key if required.
5. Do not give migration credentials to either API process. Rotation must be
   planned and tested with connection-pool reconnect behavior before production.

