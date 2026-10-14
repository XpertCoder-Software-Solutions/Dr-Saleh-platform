#!/bin/zsh -l
# Double-click on macOS (needs Docker Desktop): starts the platform and opens the site.
cd "$(dirname "$0")" || exit 1
exec > >(tee start-local.log) 2>&1

if [ ! -f .env.local ]; then
  echo "== creating .env.local with local secrets"
  {
    echo "JWT_ACCESS_SECRET=$(openssl rand -hex 32)"
    echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
  } > .env.local
fi

echo "== building and starting (first time takes a few minutes)"
docker compose up -d --build --force-recreate api web || exit 1

for i in {1..120}; do
  code=$(curl -s -o /dev/null -w '%{http_code}' localhost:3100/api/courses)
  [ "$code" = "200" ] && break; sleep 3
done
echo "API: $code"
for i in {1..200}; do
  wcode=$(curl -s -o /dev/null -w '%{http_code}' localhost:5180/)
  [ "$wcode" = "200" ] && break; sleep 3
done
echo "SITE: $wcode  ->  http://localhost:5180"
docker compose ps
[ "$wcode" = "200" ] && open http://localhost:5180
