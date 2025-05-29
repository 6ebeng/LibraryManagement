#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Attempting to seed database from entrypoint..."
# Run the seed script. It's okay if it calls process.exit() here,
# as this shell script will continue to the next command if it's successful.
# Node will use the files from the /app directory due to the volume mount.
node /app/scripts/seedDatabase.js

echo "Database seeding attempt complete."
echo "Starting server..."

# Use exec to replace the shell process with npm run dev.
# This makes nodemon the main process Docker monitors.
exec npm run dev