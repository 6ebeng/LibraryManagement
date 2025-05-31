# Testing Configuration Overview

The project employs a multi-layered testing strategy, encompassing API integration tests, component tests, and end-to-end (E2E) tests. Docker is heavily utilized to create isolated and consistent testing environments.

## Key Testing Aspects:

*   **Test Scripts:**
    *   The main `LibraryManagement/package.json` defines high-level test execution scripts:
        *   `test:api`: Runs API tests using Docker.
        *   `test:component`: Runs component tests using Docker.
        *   `test:e2e`: Runs E2E tests using Docker, bringing up frontend, backend, and test database services.
        *   `test`: Sequentially runs all three types of tests (API, component, E2E).
        *   `test:clean`: Shuts down and removes Docker containers and volumes used for testing.
    *   The `LibraryManagement/server/package.json` (backend) defines:
        *   `test` and `test:api`: Scripts to run API tests using Jest with `NODE_ENV=test`.
        *   `test:api:watch`: A script to run API tests in watch mode.
        *   Jest is listed as a `devDependency`, along with `supertest` for making HTTP requests in tests.
    *   The `LibraryManagement/client/package.json` (frontend) defines:
        *   `test`: A script to run tests using `react-scripts test`, which typically runs Jest in watch mode for Create React App projects.
        *   Various ESLint scripts for linting.
        *   `devDependencies` include testing libraries like `@babel/core`, `@babel/eslint-parser`, `eslint`, and various ESLint plugins.

*   **Testing Environment (Docker):**
    *   `LibraryManagement/docker-compose.test.yml` orchestrates the testing environments:
        *   `mongo-test`: A dedicated MongoDB instance for testing, initialized with `mongo-init.js`.
        *   `api-tester`: A service to run backend API tests. It builds from the server's Dockerfile (development target), connects to `mongo-test`, and runs `npm run test:api`.
        *   `component-tester`: A service to run frontend component tests. It builds from the client's Dockerfile (development target) and runs `npm test -- --watchAll=false --passWithNoTests` for a single run.
        *   `backend-e2e`: A service that runs the backend application specifically for E2E testing, connected to `mongo-test` and seeding the database using `seedDatabase.js`.
        *   `frontend-e2e`: A service that runs the frontend application for E2E testing, configured to communicate with `backend-e2e`.
        *   `e2e-runner`: Uses a Cypress image (`cypress/included:10.10.0`) to run E2E tests against the `frontend-e2e` and `backend-e2e` services. It mounts the project directory and executes `cypress run`.
        *   Watch mode services (`api-tester-watch`, `component-tester-watch`, `e2e-runner-watch`) are also defined for development, allowing tests to re-run on changes and for interactive E2E testing with the Cypress GUI.

*   **Cypress E2E Testing:**
    *   `LibraryManagement/cypress/cypress.config.js` configures Cypress:
        *   `baseUrl`: Set to `http://localhost:3000` but notes it will be overridden by `CYPRESS_BASE_URL` in Docker (which is `http://frontend-e2e:3000` as seen in `docker-compose.test.yml`).
        *   `specPattern`: Defines where to find E2E test files (`cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`).
        *   `supportFile`: Points to `cypress/support/e2e.js`.
    *   `LibraryManagement/cypress/e2e/authentication.cy.js` provides E2E test cases for authentication and authorization, including user registration by a librarian, user login, logout, and RBAC checks. It details interactions with the UI, such as typing into input fields (`[data-testid="username-input"]`) and clicking buttons (`button[type="submit"]`). It also mentions the use of custom commands like `cy.loginAsLibrarian()`.

*   **API Integration Testing:**
    *   `LibraryManagement/server/__tests__/integration/auth.api.test.js` demonstrates API integration tests for authentication and authorization endpoints.
    *   It uses `supertest` to make requests to the Express app.
    *   Tests cover user registration by a librarian, user login (Librarian and Member), logout, and RBAC by attempting to access protected endpoints with different user roles.
    *   It includes comments indicating the need to set up a test database (e.g., in-memory MongoDB or the one provided by `docker-compose.test.yml`) and seed users.

*   **Component Testing:**
    *   `LibraryManagement/client/src/sections/auth/login/LoginForm.test.js` shows component tests for the `LoginForm`.
    *   It uses `@testing-library/react` and `user-event` for rendering components and simulating user interactions.
    *   Tests cover rendering, typing into input fields, form submission with valid data, client-side validation for empty fields, displaying server error messages, and handling loading states.
    *   It includes mock functions (`mockOnSubmit`, `mockOnValidationError`) to verify interactions.

*   **Overall Test Plan (from README):**
    *   The `LibraryManagement/README.md` outlines a comprehensive software testing plan divided into phases:
        *   Phase 1: Planning & Initial Static Testing (SRS review, code review setup).
        *   Phase 2: Core Functional & API Test Design & Execution (Authentication, CRUD, specific features, API test automation).
        *   Phase 3: White-Box & Non-Functional Testing (Unit tests, security, usability, basic performance, browser compatibility).
        *   Phase 4: Integration & Early Regression Testing.
        *   Phase 5: System Changes, Final Testing & Report.
    *   This plan indicates a structured approach to testing, aligning with the different types of tests found in the codebase. The README also mentions the location of various Docker-related files and environment configuration files (`.env.dev`, `.env.prod`).