#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/db
./node_modules/.bin/prisma migrate deploy

echo "Starting API server..."
cd /app/apps/api
exec node dist/main.js
