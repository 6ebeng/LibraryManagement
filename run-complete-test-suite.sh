#!/bin/bash

echo "========================================"
echo "Library Management System - Complete Test Suite"
echo "SE507-Software Testing and Evaluation Assignment"
echo "========================================"

echo ""
echo "Starting Docker containers..."
docker-compose up -d
sleep 10

echo ""
echo "========================================"
echo "Setting up Test Environment"
echo "========================================"
cd server

# Set test environment
export NODE_ENV=test

# Seed database with test data (includes test users)
echo "Seeding database with test data..."
node scripts/seedDatabase.js

echo ""
echo "========================================"
echo "Running API Tests (Jest/Supertest)"
echo "========================================"

# Use npx jest directly which works better cross-platform
npx jest --coverage --runInBand --detectOpenHandles --forceExit

if [ $? -ne 0 ]; then
    echo "API tests failed!"
    read -p "Press Enter to continue..."
    exit 1
fi

echo ""
echo "========================================"
echo "Running E2E Tests (Cypress)"
echo "========================================"
cd ../e2e

echo ""
echo "1. Authentication & Authorization Tests..."
npx cypress run --spec "cypress/e2e/authentication_authorization.cy.ts"

echo ""
echo "2. Entity Management Tests..."
npx cypress run --spec "cypress/e2e/entity_management.cy.ts"

echo ""
echo "3. Specific Feature Tests..."
npx cypress run --spec "cypress/e2e/specific_feature_testing.cy.ts"

echo ""
echo "4. Use Case Tests..."
npx cypress run --spec "cypress/e2e/use_case_testing.cy.ts"

echo ""
echo "5. State Transition Tests..."
npx cypress run --spec "cypress/e2e/state_transition_testing.cy.ts"

echo ""
echo "6. Security Tests..."
npx cypress run --spec "cypress/e2e/security_testing.cy.ts"

echo ""
echo "7. Performance Tests..."
npx cypress run --spec "cypress/e2e/performance_testing.cy.ts"

echo ""
echo "8. Browser Compatibility Tests..."
npx cypress run --spec "cypress/e2e/browser_compatibility_testing.cy.ts"

echo ""
echo "9. Integration Tests..."
npx cypress run --spec "cypress/e2e/integration_testing.cy.ts"

echo ""
echo "10. Regression Tests..."
npx cypress run --spec "cypress/e2e/regression_testing.cy.ts"

echo ""
echo "========================================"
echo "Test Suite Execution Complete!"
echo "========================================"
echo ""
echo "Check the following for results:"
echo "- Test reports in: e2e/cypress/videos/"
echo "- Screenshots in: e2e/cypress/screenshots/"
echo "- API test results: Above output"
echo ""
echo "Assignment deliverables ready for submission!"
echo "========================================"

cd ..
read -p "Press Enter to continue..." 