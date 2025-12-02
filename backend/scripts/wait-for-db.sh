#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."

until npx prisma@5.7.1 db push --skip-generate --accept-data-loss || [ $? -eq 0 ]; do
  echo "PostgreSQL is unavailable - retrying in 2s"
  sleep 2
done

echo "PostgreSQL is up - executing migrations"
npx prisma@5.7.1 migrate deploy

echo "Starting application"
exec node dist/main
