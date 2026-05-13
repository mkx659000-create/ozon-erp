#!/bin/sh

echo "Running database migrations..."
npx prisma migrate deploy --schema src/prisma/schema.prisma || echo "WARNING: Migration failed, continuing with server startup..."

echo "Starting server..."
node dist/main.js
