#!/bin/sh
set -e
echo "Seeding database for E2E..."
node /app/scripts/seedDatabase.js # This will exit with 0 on success
echo "Seed complete. Starting E2E backend server..."
exec npm run dev