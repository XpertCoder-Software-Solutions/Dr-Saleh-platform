# Deploying to AWS (CI/CD)

```
                       https://<id>.cloudfront.net
                                   │
                         CloudFront distribution
          ┌────────────────────────┼─────────────────────────┐
   default (*)                /api/*                     /uploads/*
   S3 bucket (site)         EC2 :80 (nginx → API :3000)  EC2 :80
   + spa-rewrite function   no cache, all headers        cached
                                   │
                         RDS PostgreSQL · Redis · S3/CloudFront for lesson videos
```

One CloudFront domain serves the website and the API, so the site works over HTTPS
without a custom domain and without CORS issues. The frontend calls `/api` on the same
origin (the default `VITE_API_URL`).

## Pipelines (`.github/workflows`)

| Workflow | Runs on | Does |
|---|---|---|
| `ci-backend.yml` | PRs touching `backend/` | lint, unit tests, build |
| `ci-frontend.yml` | PRs touching `frontend/` | lint, typecheck, build |
| `deploy-backend.yml` | push to `main` touching `backend/`, or manual | CI → rsync `backend/` to EC2 → `npm ci`, `prisma migrate deploy`, build → PM2 reload → health check, rollback to the previous build if it fails |
| `deploy-frontend.yml` | push to `main` touching `frontend/`, or manual | CI → build → `s3 sync` (hashed assets cached 1 year, `index.html` no-cache) → CloudFront invalidation |

Both deploy jobs use the GitHub environment **production**: add required reviewers to it
in *Settings → Environments* if deploys should wait for an approval.

## GitHub settings (Settings → Secrets and variables → Actions)

Secrets:

| Name | Value |
|---|---|
| `EC2_HOST` | EC2 public DNS or IP |
| `EC2_USERNAME` | SSH user, e.g. `ubuntu` |
| `EC2_SSH_KEY` | private key of a deploy key pair (its public key in `~/.ssh/authorized_keys` on EC2) |
| `APP_DIR` | folder on EC2 for the API, e.g. `/var/www/dr-saleh-api` |
| `AWS_DEPLOY_ROLE_ARN` | ARN of the IAM role below |

Variables:

| Name | Value |
|---|---|
| `AWS_REGION` | e.g. `eu-central-1` |
| `FRONTEND_S3_BUCKET` | site bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribution ID |
| `DEPLOY_RUNTIME` | optional: `pm2` (default) or `docker-compose` |
| `VITE_API_URL` | optional: only if the API lives on another domain (full URL ending in `/api`) |

## AWS setup (once)

### 1. Site bucket
- S3 bucket, *Block all public access* on. No static website hosting needed.

### 2. CloudFront distribution
- **Origin A — S3 bucket** with Origin Access Control (OAC); apply the bucket policy CloudFront suggests.
- **Origin B — EC2**: the instance's public DNS, HTTP only, port 80.
- **Default behavior → Origin A**: redirect HTTP to HTTPS, `CachingOptimized`, and the
  CloudFront Function from `infra/cloudfront/spa-rewrite.js` on *viewer request*.
  Default root object: `index.html`.
- **Behavior `/api/*` → Origin B**: all HTTP methods, `CachingDisabled`,
  origin request policy `AllViewerExceptHostHeader`.
- **Behavior `/uploads/*` → Origin B**: GET/HEAD, `CachingOptimized`.
- Do **not** add custom error responses (they would also rewrite API 404s); the function handles SPA routes.

### 3. EC2
- Node 22, PM2, nginx, rsync installed; `sudo mkdir -p /var/log/dr-saleh-api` owned by the deploy user.
- nginx site from `infra/nginx/dr-saleh-api.conf`.
- Security group: port 80 only from the managed prefix list
  `com.amazonaws.global.cloudfront.origin-facing`; SSH from GitHub Actions
  (or use a bastion / SSM if SSH must stay closed).
- Env file `/etc/dr-saleh-api/.env` (template: `backend/docs/deployment/production.env.example`). With the
  CloudFront domain `https://<id>.cloudfront.net`:

  ```
  NODE_ENV=production
  APP_PUBLIC_URL=https://<id>.cloudfront.net
  APP_PLATFORM_URL=https://<id>.cloudfront.net
  CORS_ALLOWED_ORIGINS=https://<id>.cloudfront.net
  PAYMOB_NOTIFICATION_URL=https://<id>.cloudfront.net/api/payments/paymob/webhook
  PAYMOB_REDIRECTION_URL=https://<id>.cloudfront.net/checkout/result
  PAYPAL_RETURN_URL=https://<id>.cloudfront.net/checkout/result
  PAYPAL_CANCEL_URL=https://<id>.cloudfront.net/checkout/result
  ```

  plus the RDS `DATABASE_URL`, Redis, JWT secrets, CloudFront signing keys, Paymob/PayPal and Brevo keys.
- First deploy on an empty RDS: the pipeline runs `prisma migrate deploy` (the migrations build
  the full schema); then seed roles and the first admin once on the server (the seed needs the
  dev dependencies, which the deploy prunes):
  `cd $APP_DIR && set -a && . /etc/dr-saleh-api/.env && set +a && npm ci && npx prisma db seed && npm prune --omit=dev`
  (reads `INITIAL_ADMIN_*` from the env file).

### 4. IAM role for the frontend pipeline (no access keys)
1. IAM → Identity providers → add OpenID Connect provider
   `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Create a role with the trust policy `infra/iam/github-oidc-trust-policy.json`
   (only this repo's `production` environment can assume it) and the permissions
   `infra/iam/frontend-deploy-policy.json`. Replace the `<…>` placeholders.
3. Put the role ARN in the `AWS_DEPLOY_ROLE_ARN` secret.

## Adding a domain later
Add the domain as an alternate name on the distribution with an ACM certificate (us-east-1),
point DNS at CloudFront, and update the URLs in the EC2 env file. Nothing in the pipelines changes.
