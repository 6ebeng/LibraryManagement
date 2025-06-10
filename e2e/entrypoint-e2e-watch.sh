#!/bin/sh
# LibraryManagement/e2e/entrypoint-e2e-watch.sh
# Entrypoint script for the e2e-runner-watch service to run Cypress in interactive mode.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting E2E Watch Mode (via entrypoint-e2e-watch.sh) ---"
echo "Date: $(date)"
echo "Working directory: $(pwd)"

# Optional: Verify Node and npm versions
if command -v node >/dev/null && command -v npm >/dev/null; then
  echo "Node version: $(node -v)"
  echo "NPM version: $(npm -v)"
fi

echo "Running npm install in /app to ensure dependencies are current..."
npm install

# --- FIX ---
# Explicitly install the Cypress binary.
# This ensures the application is downloaded and placed in the CYPRESS_CACHE_FOLDER.
echo "Ensuring Cypress binary is installed..."
npx cypress install
# --- END FIX ---


echo "Verifying Cypress installation and version..."
if npx cypress --version; then
  echo "Cypress version verified successfully."
else
  echo "ERROR: Cypress command failed or Cypress is not correctly installed."
  exit 1
fi

echo "Attempting to run: npm run cy:open"
# Using 'exec' allows 'npm run cy:open' to become the main process (PID 1)
exec npm run cy:open "$@"