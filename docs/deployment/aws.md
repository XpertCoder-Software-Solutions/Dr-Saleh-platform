# Deploying to AWS (CI/CD with CodePipeline)

```
 GitHub (main) ──CodeStar connection──► CodePipeline
                                          ├─ dr-saleh-backend  (backend/** changed)
                                          │    CodeBuild: lint · tests · build
                                          │    CodeBuild: upload release to S3 → SSM Run Command on EC2
                                          │      → backend/scripts/deploy-on-server.sh
                                          │        (npm ci · prisma migrate deploy · build · PM2 reload ·
                                          │         health check · rollback on failure)
                                          └─ dr-saleh-frontend (frontend/** changed)
                                               CodeBuild: lint · typecheck · build → S3 → CloudFront invalidation

 https://drsalehabdelkarim.com, https://www.drsalehabdelkarim.com → CloudFront → S3 (site)
 https://api.drsalehabdelkarim.com → EC2 (nginx + Let's Encrypt → API on PM2) → RDS, Redis
```

Everything is defined in CloudFormation under `infra/aws/`:

| File | What it creates |
|---|---|
| `dns.yml` | Route 53 hosted zone for the domain + `api` A record to the EC2 server |
| `platform.yml` | ACM certificate, site bucket, CloudFront (+ SPA rewrite function), `@`/`www` alias records, GitHub connection, CodeBuild projects, the two pipelines, their IAM roles and logs |
| `buildspec-*.yml` | what each CodeBuild step runs |

No SSH keys, no AWS access keys in GitHub. A pipeline runs only when its own folder changes.

## One-time setup

### 0. The API server (EC2)
1. **SSM agent + role.** The instance must be visible in *Systems Manager → Fleet Manager*.
   Ubuntu and Amazon Linux AMIs already have the agent; the instance needs an IAM role with the
   managed policy `AmazonSSMManagedInstanceCore` (EC2 → instance → Actions → Security → Modify IAM role).
2. Docker with the compose plugin; the deploy user (default `ubuntu`) in the `docker` group and
   owner of the API folder (default `/var/www/dr-saleh-backend`). No Node is needed on the server:
   the deploy builds the image, runs `prisma migrate deploy` in a one-off container (Dockerfile
   target `migrator`) and restarts the stack from `backend/docker-compose.prod.yml`
   (project `dr-saleh-backend`, API on `127.0.0.1:3000` behind nginx, `uploads/` kept on the host).
   If the health check fails the previous image is restored. (`DeployRuntime=pm2` is the
   alternative for a server running the API on Node + PM2.)
3. The API's `.env` in the API folder (or `/etc/dr-saleh-api/.env`, which is copied over it on each
   deploy; template `backend/docs/deployment/production.env.example`) with:

   ```
   APP_PLATFORM_URL=https://drsalehabdelkarim.com
   CORS_ALLOWED_ORIGINS=https://drsalehabdelkarim.com,https://www.drsalehabdelkarim.com
   PAYMOB_REDIRECTION_URL=https://drsalehabdelkarim.com/checkout/result
   PAYPAL_RETURN_URL=https://drsalehabdelkarim.com/checkout/result
   PAYPAL_CANCEL_URL=https://drsalehabdelkarim.com/checkout/result
   ```

   plus the database `DATABASE_URL`, Redis (`REDIS_HOST=redis`), JWT secrets, CloudFront signing
   keys, Paymob/PayPal and Brevo keys.

### 1. DNS stack (any region)
CloudFormation → Create stack → upload `infra/aws/dns.yml` (name it `dr-saleh-dns`).
Then at **Hostinger** → the domain → *Nameservers* → *Change nameservers* → the four values
from the stack's `NameServers` output. Wait until `dig NS drsalehabdelkarim.com` shows the
`awsdns` servers (minutes to a few hours).

### 2. Platform stack (**us-east-1**, required for the CloudFront certificate)
CloudFormation (region N. Virginia) → Create stack → upload `infra/aws/platform.yml`
(name it `dr-saleh-platform`) with:

| Parameter | Value |
|---|---|
| `HostedZoneId` | `HostedZoneId` output of the dns stack |
| `Ec2InstanceId` | the API instance ID (`i-…`) |
| `Ec2Region` | the instance's region |
| `DeployUser`, `AppDir`, `DeployRuntime` | defaults unless the server differs |

Creating it takes ~10–20 minutes (certificate validation and CloudFront).

### 3. Approve the GitHub connection (once)
Developer Tools → Settings → **Connections** → `dr-saleh-github` (Pending) → *Update pending
connection* → install/authorize the **AWS Connector for GitHub** app on
`XpertCoder-Software-Solutions` for the `Dr-Saleh-platform` repo. Status becomes *Available*.

### 4. First run
CodePipeline → `dr-saleh-backend` and `dr-saleh-frontend` → *Release change*.
From then on every push to `main` deploys whatever changed.

On a database without roles/admin, seed once on the server:
`cd /var/www/dr-saleh-backend && docker run --rm --network host --env-file .env dr-saleh-backend-migrator npx prisma db seed`

## Day to day
- Logs: CloudWatch log group `/dr-saleh/codebuild`; each pipeline step links to its build log.
  The server output of a backend deploy is printed at the end of the deploy step.
- Roll back: re-run an older execution from the pipeline history (*Release change* on a past
  commit), or revert the commit on `main`.
- Cost: CodeBuild has 100 free build minutes a month on the small instance; each V2 pipeline is
  billed per action minute, a few cents per deploy.

## GitHub Actions (backup)
`.github/workflows` has the same checks and deploys for GitHub Actions. They are manual-only
while the organization's Actions billing is locked; to use them, see the git history of this
file for the secrets they need.
