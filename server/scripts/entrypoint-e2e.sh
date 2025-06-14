#!/bin/sh
set -e
echo "Seeding database for E2E..."
node /app/scripts/seedDatabase.js
echo "Seed complete. Starting E2E backend server..."
exec npm start 