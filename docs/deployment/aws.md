# Deploying to AWS (CI/CD)

```
 https://drsalehabdelkarim.com, https://www.drsalehabdelkarim.com
        │  Route 53 alias
   CloudFront (ACM certificate, us-east-1) ── spa-rewrite function
        │  Origin Access Control
   S3 bucket: the built frontend

 https://api.drsalehabdelkarim.com
        │  Route 53 A record
   EC2: nginx + Let's Encrypt → API (PM2, port 3000)
        ├─ RDS PostgreSQL
        ├─ Redis
        └─ S3 + CloudFront signed URLs for lesson videos
```

The website calls the API at `https://api.drsalehabdelkarim.com/api`, and uploaded
images are served from `https://api.drsalehabdelkarim.com/uploads/...`.

## Pipelines (`.github/workflows`)

| Workflow | Runs on | Does |
|---|---|---|
| `ci-backend.yml` | PRs touching `backend/` | lint, unit tests, build |
| `ci-frontend.yml` | PRs touching `frontend/` | lint, typecheck, build |
| `deploy-backend.yml` | push to `main` touching `backend/`, or manual | CI → rsync `backend/` to EC2 → `npm ci`, `prisma migrate deploy`, build → PM2 reload → health check, rollback to the previous build if it fails |
| `deploy-frontend.yml` | push to `main` touching `frontend/`, or manual | CI → build → `s3 sync` (hashed assets cached 1 year, `index.html` no-cache) → CloudFront invalidation |

Both deploy jobs use the GitHub environment **production**. Add required reviewers to it
in *Settings → Environments* if deploys should wait for an approval.

## GitHub settings (Settings → Secrets and variables → Actions)

Secrets:

| Name | Value |
|---|---|
| `EC2_HOST` | `api.drsalehabdelkarim.com` (or the server's public IP) |
| `EC2_USERNAME` | SSH user, e.g. `ubuntu` |
| `EC2_SSH_KEY` | private key of a deploy key pair (its public key in `~/.ssh/authorized_keys` on EC2) |
| `APP_DIR` | the API folder on the server, e.g. `/var/www/dr-saleh-api` |
| `AWS_DEPLOY_ROLE_ARN` | ARN of the IAM role in step 5 |

Variables:

| Name | Value |
|---|---|
| `AWS_REGION` | region of the site bucket, e.g. `eu-central-1` |
| `FRONTEND_S3_BUCKET` | site bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribution ID |
| `DEPLOY_RUNTIME` | optional: `pm2` (default) or `docker-compose` |
| `VITE_API_URL` | optional, defaults to `https://api.drsalehabdelkarim.com/api` |

## AWS setup (once)

### 1. DNS → Route 53
The domain's DNS is at Hostinger today (nameservers `*.dns-parking.com`) with three A records
(`@`, `www`, `api`) all pointing to the EC2 server and no MX/TXT records.

1. Route 53 → Hosted zones → Create `drsalehabdelkarim.com`.
2. Add `api` → A record → the EC2 IP (the API keeps working through the switch).
3. At Hostinger: Domains → `drsalehabdelkarim.com` → DNS / Nameservers → *Change nameservers*
   to the four `awsdns` names Route 53 shows for the zone. Propagation can take a few hours.

### 2. Certificate
ACM in **us-east-1** (required by CloudFront) → request a public certificate for
`drsalehabdelkarim.com` and `www.drsalehabdelkarim.com`, DNS validation →
*Create records in Route 53*.

### 3. Site bucket
S3 bucket (any region), *Block all public access* on, no static website hosting.

### 4. CloudFront distribution
- Origin: the bucket, with Origin Access Control; apply the bucket policy CloudFront offers.
- Alternate domain names: `drsalehabdelkarim.com`, `www.drsalehabdelkarim.com`; certificate from step 2.
- Default root object `index.html`; viewer protocol: redirect HTTP to HTTPS; cache policy `CachingOptimized`.
- Functions → create a function from `infra/cloudfront/spa-rewrite.js`, publish it, and attach it
  to the default behavior on *viewer request* (client-side routes like `/courses/…` → `index.html`).
- Route 53: `drsalehabdelkarim.com` and `www` → A (alias) → the distribution
  (replace the old A records that pointed to EC2).

### 5. IAM role for the frontend pipeline (no access keys)
1. IAM → Identity providers → add OpenID Connect provider
   `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Create a role with the trust policy `infra/iam/github-oidc-trust-policy.json`
   (only this repo's `production` environment can assume it) and the permissions
   `infra/iam/frontend-deploy-policy.json`. Replace the `<…>` placeholders.
3. Put the role ARN in the `AWS_DEPLOY_ROLE_ARN` secret.

### 6. API server (EC2)
- Needs Node 22, PM2, rsync and `/var/log/dr-saleh-api` writable by the deploy user (see
  `backend/docs/deployment/final-production-deployment.md`; nginx + TLS for `api.` is already there).
- In `/etc/dr-saleh-api/.env` set the site URLs:

  ```
  APP_PLATFORM_URL=https://drsalehabdelkarim.com
  CORS_ALLOWED_ORIGINS=https://drsalehabdelkarim.com,https://www.drsalehabdelkarim.com
  PAYMOB_REDIRECTION_URL=https://drsalehabdelkarim.com/checkout/result
  PAYPAL_RETURN_URL=https://drsalehabdelkarim.com/checkout/result
  PAYPAL_CANCEL_URL=https://drsalehabdelkarim.com/checkout/result
  ```

- The first pipeline run applies the new migrations with `prisma migrate deploy`. If the
  database has no roles/admin yet, seed once on the server (the seed needs dev dependencies,
  which the deploy prunes):
  `cd $APP_DIR && set -a && . /etc/dr-saleh-api/.env && set +a && npm ci && npx prisma db seed && npm prune --omit=dev`
