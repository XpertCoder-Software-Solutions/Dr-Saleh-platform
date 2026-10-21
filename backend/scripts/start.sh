#!/bin/sh
# Container entrypoint.
# With DEMO_SEED=true, a brand-new deployment is filled with the demo content:
#   - the database is restored from demo/drsaleh.dump when it has no tables yet
#     (the dump already records every Prisma migration as applied);
#   - demo images and files are unpacked into uploads/ once.
#   - migrations added after the dump are applied with psql.
# Without DEMO_SEED nothing is touched and the API just starts.
set -e

if [ "$DEMO_SEED" = "true" ]; then
  DB_URL="${DATABASE_URL%%\?*}"
  if [ "$(psql "$DB_URL" -Atc "select to_regclass('public.users') is not null")" != "t" ]; then
    echo "[start] empty database: restoring demo data"
    pg_restore --no-owner --no-acl -d "$DB_URL" demo/drsaleh.dump
  fi
  # Apply migrations newer than the dump (the runner image has psql but no prisma CLI).
  # Each one is recorded in _prisma_migrations exactly like `prisma migrate deploy` does.
  for dir in prisma/migrations/*/; do
    name=$(basename "$dir")
    file="$dir/migration.sql"
    [ -f "$file" ] || continue
    done_already=$(psql "$DB_URL" -Atc "select count(*) from _prisma_migrations where migration_name = '$name' and finished_at is not null")
    if [ "$done_already" = "0" ]; then
      echo "[start] applying migration $name"
      if psql "$DB_URL" -v ON_ERROR_STOP=1 -q -1 -f "$file"; then
        checksum=$(sha256sum "$file" | cut -d' ' -f1)
        psql "$DB_URL" -q -c "insert into _prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) values (gen_random_uuid()::text, '$checksum', now(), '$name', now(), 1)"
      else
        echo "[start] migration $name failed; the database was left as it was"
      fi
    fi
  done
  if [ ! -f uploads/.demo-loaded ]; then
    echo "[start] unpacking demo uploads"
    mkdir -p uploads
    tar xzf demo/uploads.tgz -C .
    touch uploads/.demo-loaded
  fi
fi

exec node dist/src/main.js
