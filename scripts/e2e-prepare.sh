#!/usr/bin/env bash
# Recreates the isolated e2e database with base data, sample stock and a test admin.
set -euo pipefail
cd "$(dirname "$0")/.."

E2E_DB="jeevan_cars_e2e"
export DATABASE_URL="postgresql://jeevan:jeevan_dev_password@localhost:5432/${E2E_DB}?schema=public"

# Local dev runs Postgres in Docker; CI provides psql and a Postgres service.
run_psql() {
  if command -v psql >/dev/null 2>&1; then
    psql -q "postgresql://jeevan:jeevan_dev_password@localhost:5432/postgres" "$@"
  else
    docker exec jeevan-cars-db psql -q -U jeevan -d postgres "$@"
  fi
}

run_psql -c "DROP DATABASE IF EXISTS ${E2E_DB} WITH (FORCE)" -c "CREATE DATABASE ${E2E_DB}"
npx prisma migrate deploy >/dev/null
npx tsx prisma/seed.ts
npx tsx prisma/seed-sample.ts
ADMIN_EMAIL="e2e-admin@jeevancars.test" ADMIN_NAME="E2E Admin" ADMIN_PASSWORD="e2e-password-not-secret" \
  npx tsx scripts/create-admin.ts
