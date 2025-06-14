@echo off
echo ========================================
echo Library Management System - Complete Test Suite
echo SE507-Software Testing and Evaluation Assignment
echo ========================================

echo.
echo Starting Docker containers...
docker-compose up -d
timeout /t 10 >nul

echo.
echo ========================================
echo Running API Tests (Jest/Supertest)
echo ========================================
cd server
call npm test
if %errorlevel% neq 0 (
    echo API tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Running E2E Tests (Cypress)
echo ========================================
cd ../e2e

echo.
echo 1. Authentication & Authorization Tests...
call npx cypress run --spec "cypress/e2e/authentication_authorization.cy.ts"

echo.
echo 2. Entity Management Tests...
call npx cypress run --spec "cypress/e2e/entity_management.cy.ts"

echo.
echo 3. Specific Feature Tests...
call npx cypress run --spec "cypress/e2e/specific_feature_testing.cy.ts"

echo.
echo 4. Use Case Tests...
call npx cypress run --spec "cypress/e2e/use_case_testing.cy.ts"

echo.
echo 5. State Transition Tests...
call npx cypress run --spec "cypress/e2e/state_transition_testing.cy.ts"

echo.
echo 6. Security Tests...
call npx cypress run --spec "cypress/e2e/security_testing.cy.ts"

echo.
echo 7. Performance Tests...
call npx cypress run --spec "cypress/e2e/performance_testing.cy.ts"

echo.
echo 8. Browser Compatibility Tests...
call npx cypress run --spec "cypress/e2e/browser_compatibility_testing.cy.ts"

echo.
echo 9. Integration Tests...
call npx cypress run --spec "cypress/e2e/integration_testing.cy.ts"

echo.
echo 10. Regression Tests...
call npx cypress run --spec "cypress/e2e/regression_testing.cy.ts"

echo.
echo ========================================
echo Test Suite Execution Complete!
echo ========================================
echo.
echo Check the following for results:
echo - Test reports in: e2e/cypress/videos/
echo - Screenshots in: e2e/cypress/screenshots/
echo - API test results: Above output
echo.
echo Assignment deliverables ready for submission!
echo ========================================

cd ..
pause 