#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema src/prisma/schema.prisma

echo "Starting server..."
node dist/main.js
