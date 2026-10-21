## Phase 1: Create the AWS foundation

The first deployment in this guide uses one EC2 instance with HTTPS exposed
through a reverse proxy and private RDS subnets. This is a single-instance
starting point, not high availability. Do not expose NestJS ports directly.
An Application Load Balancer in front of private EC2 instances is a stronger
later option, but costs more and requires more setup.

### 1. Create the VPC and subnets

1. Search **VPC**, open its dashboard in the selected Region, and choose
   **Create VPC**.
2. If available, select **VPC and more**. Name it `baloot-prod`. Choose a
   private IPv4 CIDR such as `10.20.0.0/16` only after confirming it does not
   overlap any network you may connect later.
3. Select at least two Availability Zones and create public and private
   subnets in them. RDS subnet groups require subnets in at least two AZs even
   if you choose a single-AZ DB instance.
4. For a cost-conscious initial setup, choose **no NAT gateway** if offered.
   NAT gateways have ongoing charges. Put the first EC2 host in a public
   subnet and RDS only in private subnets. EC2 can use the Internet Gateway
   for outbound connections; private RDS does not need general internet access.
5. Confirm the wizard attaches an **Internet Gateway** and the public-subnet
   route table sends `0.0.0.0/0` to it. Do not add an Internet Gateway route
   to the private DB subnet route table.
6. Review the cost and network summary, then create the VPC. Record its VPC ID,
   subnet IDs, and AZs.
7. Open **VPC → Your VPCs** and verify its state is `Available`. Open
   **Subnets**, check each subnet is in the new VPC and correct AZ, and confirm
   DB subnets do not auto-assign public IPv4 addresses.

**Why:** The VPC is your private network boundary. The DB subnets must not have
a route that makes RDS directly internet-reachable.

### 2. Create security groups

1. Open **VPC → Security groups → Create security group**. Create
   `baloot-app-sg` in the new VPC. A security group is a stateful network
   firewall attached to a server or database.
2. For `baloot-app-sg` inbound rules, allow TCP `443` from `0.0.0.0/0` for
   HTTPS. Add IPv6 `::/0` only if IPv6 is configured and intentionally used.
   Optionally allow TCP `80` if you need HTTP-to-HTTPS redirects or certificate
   validation. Do not add SSH `22`, PostgreSQL `5432`, or NestJS port `3000`
   as internet-facing rules.
3. Create `baloot-db-sg` in the same VPC. Add inbound PostgreSQL TCP `5432`
   with **Source** set to the `baloot-app-sg` security group using the selector.
   Never use `0.0.0.0/0` as the DB source or a laptop IP as a shortcut.
4. Review and create both groups. Reopen their inbound rules and verify they
   match the intended rules. Record the security-group IDs.

**Why:** The DB rule refers to the application security group, so only
instances with that group can reach PostgreSQL. The NestJS port stays private.

### 3. Create the EC2 IAM role

1. Search **IAM → Roles → Create role**. Select **AWS service**, then **EC2**
   as the use case. This trust relationship allows EC2 to obtain temporary
   credentials; it does not create static keys.
2. Attach the AWS-managed `AmazonSSMManagedInstanceCore` policy so Systems
   Manager can administer EC2 without public SSH. This policy does not grant
   access to application secrets.
3. Name the role `baloot-ec2-role`. Review that the trusted service is EC2,
   then create the role.
4. Later, add a custom policy allowing `secretsmanager:GetSecretValue` only for
   the exact Auth and Pay runtime secret ARNs. If you use a customer-managed
   KMS key, allow `kms:Decrypt` only on that key as needed.
5. Do not attach `AdministratorAccess`, `PowerUserAccess`, or
   `SecretsManagerReadWrite`. Because both services share this EC2 role, both
   can potentially use all permissions granted to the host; recognize this
   shared blast radius.

**Why:** The EC2 role gives the host temporary AWS credentials without putting
access keys in files or environment variables.

### 4. Prepare administration without SSH

1. Use **Systems Manager → Session Manager** for server administration. Do
   not open public SSH just to make first access easier.
2. The EC2 role, SSM Agent, and outbound HTTPS connectivity to Systems Manager
   are required. A public-subnet instance with an Internet Gateway route can
   usually reach AWS public endpoints; verify it for the chosen AMI and Region.
3. When launching EC2, require **IMDSv2** (metadata version **V2 only**).
   This reduces common SSRF paths that could otherwise expose instance-role
   credentials.
4. After launch, confirm the instance appears `Online` in Systems Manager.
   Troubleshoot the role, agent, and routing if not; do not open SSH to the
   internet as a workaround.

