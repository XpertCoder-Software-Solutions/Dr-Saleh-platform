# منصة د. صالح عبد الكريم

The whole platform in one repository:

| Folder | What | Stack |
|---|---|---|
| [`backend/`](backend) | API, database schema, payments, emails | NestJS 11, Prisma 7, PostgreSQL, Redis |
| [`frontend/`](frontend) | Website, student area and admin panel | React 19, Vite, Tailwind CSS v4 |

Each folder has its own README with the details.

## Run everything locally

Needs Docker Desktop.

- macOS: double-click `start-local.command`.
- Anywhere else: create `.env.local` with `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
  (32+ random characters each), then `docker compose up -d --build`.

Website: http://localhost:5180 · API: http://localhost:3100/api

On the first run the database and uploads are filled with the demo content from
`backend/demo` (see the backend README).

## CI/CD and deploying

GitHub Actions (`.github/workflows`) check every pull request and deploy on every
push to `main`: the backend to EC2 (PM2, RDS, Redis) and the frontend to S3 behind
CloudFront, both under one CloudFront domain. Setup, secrets and AWS steps:
[docs/deployment/aws.md](docs/deployment/aws.md).

The backend image (`backend/Dockerfile`) also runs on any Docker host; see the
backend README for its optional demo seed.
