#!/bin/sh
#
# Cypress Test Runner Script for the e2e-runner service.
# This script is executed inside the Docker container, from the /app working directory.
# It's responsible for initiating the Cypress test run.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting Cypress E2E tests ---"
echo "Date: $(date)"
echo "Working directory: $(pwd)" # Should be /app as per Dockerfile and docker-compose.test.yml

# Optional: Verify Node and npm versions for debugging
if command -v node >/dev/null && command -v npm >/dev/null; then
  echo "Node version: $(node -v)"
  echo "NPM version: $(npm -v)"
else
  echo "Warning: Node and/or NPM not found in PATH for version check."
fi

# Display key Cypress environment variables from docker-compose.test.yml for debugging
echo "CYPRESS_BASE_URL: ${CYPRESS_BASE_URL}"
echo "CYPRESS_API_URL: ${CYPRESS_API_URL}"
# Add any other relevant CYPRESS_ variables here if needed for logging

echo "Verifying Cypress installation and version..."
# 'npx cypress --version' uses the Cypress version installed in /app/node_modules
if npx cypress --version; then
  echo "Cypress version verified successfully."
else
  echo "ERROR: Cypress command failed or Cypress is not correctly installed in /app/node_modules."
  exit 1
fi

echo "Running Cypress tests with command: cy:run:docker $@"

# Execute Cypress tests:
# - 'npx cypress run' ensures the project-local Cypress installation (in /app/node_modules) is used.
# - '--env docker=true' is passed, aligning with your e2e/package.json script
#   and can be used for conditional logic within your tests or Cypress configuration.
# - '"$@"' passes all arguments received by this script directly to the 'cypress run' command.
#   This allows you to specify additional Cypress CLI options in docker-compose.test.yml if needed,
#   e.g., entrypoint: ['sh', './cypress_runner.sh', '--browser', 'chrome']
npm run cy:run:docker -- "$@"

# The 'set -e' ensures that if 'cypress run' exits with a non-zero status (indicating test failures),
# this script will also exit with that status, correctly signaling failure to Docker/CI.

echo "--- Cypress E2E tests finished ---"