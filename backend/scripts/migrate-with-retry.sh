#!/bin/sh
# Migration script with retry logic for Railway deployment
# Waits for PostgreSQL to be ready before running migrations

MAX_RETRIES=10
RETRY_DELAY=3

echo "🔄 Waiting for PostgreSQL to be ready..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES: Running Prisma migrations..."

  if npx prisma@5.7.1 migrate deploy; then
    echo "✅ Migrations completed successfully!"
    exit 0
  else
    if [ $i -lt $MAX_RETRIES ]; then
      echo "⚠️ Migration failed, retrying in ${RETRY_DELAY}s..."
      sleep $RETRY_DELAY
    else
      echo "❌ Migration failed after $MAX_RETRIES attempts"
      exit 1
    fi
  fi
done
