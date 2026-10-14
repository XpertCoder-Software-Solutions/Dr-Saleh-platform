#!/usr/bin/env bash
# Runs ON the EC2 server as the deploy user (called by the AWS pipeline through SSM,
# see infra/aws/buildspec-backend-deploy.yml). Usage:
#   APP_DIR=/var/www/dr-saleh-api DEPLOY_RUNTIME=pm2 deploy-on-server.sh <release-dir>
# Copies the release into APP_DIR (keeping node_modules, the current build, uploads
# and env files), then:
#   pm2:            npm ci, prisma migrate deploy, build, PM2 reload;
#   docker-compose: build the image, run migrations in a one-off container, restart
#                   the app with docker-compose.prod.yml (server needs only Docker);
# and checks /api/health. If the health check fails the previous build/image is restored.
set -Eeuo pipefail

release="${1:?release directory required}"
app_dir="${APP_DIR:?APP_DIR is required}"
runtime="${DEPLOY_RUNTIME:-pm2}"
echo "== deploying ${REVISION:-unknown} to ${app_dir} (${runtime})"

mkdir -p "${app_dir}"
# Replace the source with the release, keeping what lives only on the server.
find "${app_dir}" -mindepth 1 -maxdepth 1 \
  ! -name node_modules ! -name dist ! -name dist.prev ! -name uploads \
  ! -name .env ! -name '.env.*' ! -name .git \
  -exec rm -rf {} +
cp -a "${release}/." "${app_dir}/"
cd "${app_dir}"
mkdir -p uploads

env_file=/etc/dr-saleh-api/.env
[ -f "${env_file}" ] || env_file="${app_dir}/.env"
[ -f "${env_file}" ] || { echo "No env file: /etc/dr-saleh-api/.env or ${app_dir}/.env" >&2; exit 1; }
# Reads one KEY=value from the env file without sourcing it (values may contain spaces).
env_value() { sed -n "s/^$1=//p" "${env_file}" | tail -n1 | tr -d '"'"'"'\r'; }
PORT="${PORT:-$(env_value PORT)}"
API_PREFIX="${API_PREFIX:-$(env_value API_PREFIX)}"

compose="docker compose -p dr-saleh-backend -f docker-compose.prod.yml"
image=dr-saleh-backend-app

case "${runtime}" in
  pm2)
    set -a; . "${env_file}"; set +a
    if [ -d dist ]; then rm -rf dist.prev && cp -a dist dist.prev; fi
    npm ci
    npx prisma generate
    npx prisma migrate deploy
    npm run build
    npm prune --omit=dev
    pm2 startOrReload ecosystem.config.cjs --env production
    pm2 save
    ;;
  docker-compose)
    [ "${env_file}" = "${app_dir}/.env" ] || cp "${env_file}" .env
    # Keep the running image so a failed health check can roll back to it.
    docker image inspect "${image}:latest" >/dev/null 2>&1 && docker tag "${image}:latest" "${image}:prev"
    ${compose} build app
    docker build --target migrator -t dr-saleh-backend-migrator .
    docker run --rm --network host --env-file .env dr-saleh-backend-migrator
    ${compose} up -d --no-build --remove-orphans app redis
    docker image prune -f >/dev/null || true
    ;;
  *) echo "Unsupported DEPLOY_RUNTIME: ${runtime}" >&2; exit 1 ;;
esac

url="${HEALTHCHECK_URL:-http://127.0.0.1:${PORT:-3000}/${API_PREFIX:-api}/health}"
for attempt in $(seq 1 12); do
  if curl -fsS "${url}" >/dev/null; then
    echo "== health check passed (${url})"
    exit 0
  fi
  echo "health check ${attempt}/12 failed, retrying"
  sleep 5
done

echo "== health check failed" >&2
if [ "${runtime}" = pm2 ] && [ -d dist.prev ]; then
  echo "== rolling back to the previous build" >&2
  rm -rf dist && mv dist.prev dist
  pm2 startOrReload ecosystem.config.cjs --env production || true
  pm2 logs dr-saleh-api --lines 100 --nostream || true
fi
if [ "${runtime}" = docker-compose ]; then
  docker logs --tail 100 dr-saleh-api || true
  if docker image inspect "${image}:prev" >/dev/null 2>&1; then
    echo "== rolling back to the previous image" >&2
    docker tag "${image}:prev" "${image}:latest"
    ${compose} up -d --no-build app || true
  fi
fi
exit 1
