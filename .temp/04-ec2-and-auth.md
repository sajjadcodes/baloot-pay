## Phase 3: Deploy Baloot Auth first

### 9. Launch the EC2 host

1. Search **EC2 → Instances → Launch instances**. Enter a name such as
   `baloot-services-prod`.
2. Under **Application and OS Images**, choose a maintained Amazon Linux
   image. Read the image details and confirm it is a supported 64-bit image
   for your planned deployment tooling.
3. Under **Instance type**, choose only after checking the pricing estimate.
   A development instance can be small; production size must be chosen from
   measured memory, CPU, and traffic requirements.
4. Under **Key pair (login)**, choose **Proceed without a key pair** only if
   you have confirmed Systems Manager Session Manager works for the selected
   image and Region. This avoids distributing SSH private keys.
5. Under **Network settings**, choose the new VPC, a public subnet, enable a
   public IP for this simple HTTPS design, and select only `baloot-app-sg`.
   Do not edit the security group to add public SSH or the app's NestJS port.
6. Expand **Advanced details**. Attach `baloot-ec2-role` as the IAM instance
   profile. Set **Metadata version** to **V2 only** / require IMDSv2. Do not
   paste secrets into **User data**; user data is not a secrets store and may
   be retrievable from the instance.
7. Set encrypted EBS storage. Review every section in the summary, including
   network, role, metadata, storage, and hourly estimate. Click **Launch
   instance** only when ready to incur the charge.
8. Open **EC2 → Instances** and wait until the instance state is `Running` and
   both status checks pass. Then use **Systems Manager → Session Manager** to
   open a shell. If it is not managed/online, investigate the role, SSM Agent,
   subnet route, and outbound HTTPS before continuing.

**Why:** The instance profile lets the host call approved AWS services without
static keys. IMDSv2 helps protect those temporary role credentials.

### 10. Put Auth behind HTTPS and deploy it

1. Confirm the deployed Auth API contract, supported caller flow, token
   verification behavior, and operational health/readiness endpoints. Do not
   assume a browser cookie flow automatically works between two API hosts.
2. Choose a DNS name, for example `auth.example.com`. In your DNS provider,
   create a record pointing to the EC2 public address, or use a stable
   Elastic IP if you need the address not to change after stopping/replacing
   the instance. Public IPv4 and Elastic IP usage can incur charges.
3. Choose the TLS path before opening the service:
   - For a direct-to-EC2 reverse proxy, use a maintained proxy and a
     certificate method supported by your DNS provider (for example,
     Let's Encrypt with automated renewal). Test renewal; a certificate that
     expires silently will take the API offline.
   - For AWS Certificate Manager (ACM), the usual design attaches an ACM
     certificate to an Application Load Balancer. This adds cost and is not
     directly installed into a normal EC2 Nginx process.
4. Deploy Auth as its own process or container on EC2, using a dedicated
   operating-system user, a private listening port bound to loopback or the
   private interface, and only Auth's runtime configuration and database
   secret.
   Use an approved deployment method, preferably a controlled CI/CD pipeline
   or signed build artifact. Do not place repository access keys or DB
   passwords in source control, shell history, AMIs, or build logs.
5. Keep Auth's database private and reachable only from the application
   security group. Verify Auth can reach only its own database with its
   runtime role.
6. Configure the reverse proxy to accept HTTPS and forward to Auth's local
   port. Configure HTTP-to-HTTPS redirect only if port `80` is open. Expose
   only intended Auth routes; never expose the NestJS port directly.
7. Verify the DNS name resolves to the expected endpoint, the browser/client
   sees a valid TLS certificate, Auth health checks pass, and sign-in works
   through the intended caller flow.
8. Verify logs do not contain passwords, tokens, cookies, or secret values.
   Test a restart, backup restore plan, and secret rotation in development
   before considering the deployment production-ready.

