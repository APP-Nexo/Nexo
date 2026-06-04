#!/bin/sh
set -e

echo "-> Generating Prisma client..."
npx prisma generate

echo "-> Running migrations..."
npx prisma db push --accept-data-loss

echo "-> Running seeds..."
npx tsx prisma/seeds/index.ts

echo "-> Starting server..."
npx tsx src/server.ts
