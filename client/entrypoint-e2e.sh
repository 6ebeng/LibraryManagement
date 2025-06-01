#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e


npm start

echo "⏳ Waiting for 15 seconds before starting E2E tests..."
sleep 15

echo "✅ Delay complete. Executing command: $@"

exec "$@"