# Library Management System

This is a full-stack web application for managing a library's inventory, users, and borrowals. It provides a user-friendly interface for both librarians and members, with role-based access control to ensure data security and integrity.

This project fork has been enhanced with a comprehensive testing lifecycle to ensure software quality, robustness, and maintainability.

**Forked from**: [https://github.com/MERNRAD/LibraryManagement](https://github.com/MERNRAD/LibraryManagement)

---

## 🧪 Testing Strategy Overview

This project implements a structured testing lifecycle, breaking down the quality assurance process into five distinct phases. The strategy ensures that all aspects of the software, from individual code units to the complete deployed system, are thoroughly validated.

### Testing Phases

[cite_start]The testing process is organized into the following phases, aligned with the project timeline from early March 2025 to June 15, 2025[cite: 482]:

- [cite_start]**Phase 1: Planning & Initial Static Testing:** Focuses on understanding requirements and developing a detailed test plan[cite: 482].
- [cite_start]**Phase 2: Core Functional & API Test Design & Execution:** Involves the design and execution of black-box functional and API tests based on the SRS[cite: 484, 485, 486, 487, 488].
- [cite_start]**Phase 3: White-Box & Non-Functional Testing:** Covers unit testing, code coverage analysis, and testing for non-functional requirements like security and usability[cite: 489, 490].
- [cite_start]**Phase 4: Integration & Early Regression Testing:** Ensures that different parts of the system work together as expected and that new changes do not break existing functionality[cite: 491, 492, 493, 494].
- [cite_start]**Phase 5: System Changes, Final Testing & Report:** Involves final regression testing, deployment validation, and the preparation of the final report[cite: 494, 495, 496, 497].

---

## 🛠️ Types of Testing

A variety of testing methodologies are employed throughout the project, with responsibilities distributed between Coder and Non-Coder/Specification Expert roles to ensure a comprehensive evaluation.

### I. Functional Testing (Black-Box)

[cite_start]Led by non-coders, this testing is based on the **Software Requirements Specification (SRS)** and focuses on the application's behavior without knowledge of the internal code structure[cite: 523].

- [cite_start]**Authentication & Authorization**: Tests user login/logout, registration, and role-based access control to ensure users can only access appropriate features[cite: 524].
- [cite_start]**Entity Management (CRUD)**: Verifies all Create, Read, Update, and Delete operations for books, authors, genres, users, borrowals, and reviews[cite: 526].
- [cite_start]**Specific Feature Testing**: Validates the functionality of key features like the librarian dashboard, borrowal management, and review management[cite: 528].
- [cite_start]**Use Case Testing**: Executes tests for all main, alternative, and exception flows outlined in the SRS to ensure graceful error handling[cite: 530].
- [cite_start]**State Transition Testing**: Checks the system's behavior as entities transition between states, such as a book's availability or a borrowal's status[cite: 532].

### II. API Testing

[cite_start]This is a balanced effort between coders and non-coders to test the application's API endpoints directly[cite: 534, 535].

- [cite_start]**Coders** lead the development of automated API test scripts to validate functionality, performance, and security[cite: 534].
- [cite_start]**Non-coders** lead the design of user-centric test scenarios and perform manual testing using tools like Postman to validate requests and responses[cite: 535].

### III. White-Box Testing

[cite_start]Led by coders, this testing focuses on the internal logic and structure of the source code[cite: 536].

- [cite_start]**Unit Tests**: Jest is used to develop and execute unit tests for both frontend and backend modules, focusing on critical controllers, models, and complex logic[cite: 537].
- [cite_start]**Code Coverage**: The team analyzes code coverage for decisions, paths, and conditions to ensure that the code is thoroughly tested[cite: 490].

### IV. Non-Functional Testing

This category covers aspects of the system that are not related to specific functions but are critical to the user experience.

- **Security Testing**: A balanced team effort to identify vulnerabilities. [cite_start]Coders focus on technical aspects like penetration testing and server-side validation, while non-coders test for user-facing issues like XSS and access control violations[cite: 539, 540].
- [cite_start]**Usability Testing**: Non-coders design and conduct tests to evaluate the UI/UX for intuitiveness, consistency, and efficiency[cite: 542].
- [cite_start]**Performance Testing**: The team collaborates to check API response times and document UI responsiveness under various conditions[cite: 544, 545].
- [cite_start]**Browser Compatibility**: Non-coders test the application's core functionality and UI rendering on specified browsers (Chrome, Firefox, Edge, Safari)[cite: 548].

### V. Integration Testing

[cite_start]The team works together to ensure that different components and services of the application function correctly as a whole[cite: 550]. [cite_start]Non-coders design end-to-end user scenarios, which are then executed to verify data consistency and workflow integrity[cite: 551].

### VI. Regression Testing

[cite_start]A shared responsibility to ensure new changes do not negatively impact existing functionality[cite: 553].

- [cite_start]**Automated Suite**: Coders develop and maintain an automated regression suite of unit and API tests[cite: 552].
- [cite_start]**Manual Suite**: Non-coders maintain and execute a manual suite covering critical user workflows and previously identified defects[cite: 553].

### VII. Installation/Deployment Testing

The team validates the deployment process to ensure the application can be installed and run successfully in its target environment. [cite_start]This includes verifying Docker setups and deployment scripts[cite: 555].

### VIII. Static Testing

This involves testing without executing the code.

- **Code Reviews**: Coders lead technical reviews to check for logic, security, and efficiency issues. [cite_start]Non-coders participate to ensure alignment with the SRS[cite: 557, 558].
- [cite_start]**Documentation Review**: Non-coders lead the review of all project documentation for clarity, completeness, and accuracy[cite: 561].

---

## 📊 Code Coverage

Here is a summary of the code coverage reports for the client and server components of the application.

### Client-Side (Frontend) Coverage

The client-side test coverage is currently low and represents an area for future improvement.

_Report generated on: 2025-06-15_

| Category   | Coverage | Ratio   |
| :--------- | :------- | :------ |
| Statements | 4.97%    | 58/1167 |
| Branches   | 9.26%    | 39/421  |
| Functions  | 5.68%    | 24/422  |
| Lines      | 4.61%    | 52/1126 |

### Server-Side (Backend) Coverage

The backend demonstrates a solid foundation of test coverage, particularly in its models and routes.

_Report generated on: 2025-06-14_

| Category   | Coverage | Ratio   |
| :--------- | :------- | :------ |
| Statements | 77.97%   | 393/504 |
| Branches   | 70.37%   | 114/162 |
| Functions  | 73.46%   | 72/98   |
| Lines      | 78.81%   | 372/472 |

---

## 🚀 How to Run Tests

The `package.json` file is configured with a comprehensive set of scripts to execute the various tests.

### Run All Tests

To run the full suite of API, component, and end-to-end tests and generate a report:

```sh
npm test
```

### Run Specific Test Suites

- **API Tests**:
  ```sh
  npm run test:api
  ```
- **Component Tests (React)**:
  ```sh
  npm run test:component
  ```
- **End-to-End (E2E) Tests with Cypress**:
  ```sh
  npm run test:e2e
  ```

### Run Tests in Watch Mode

For active development, you can run tests in "watch mode," which will automatically re-run tests when files are changed.

- **API Tests (Watch Mode)**:
  ```sh
  npm run test:api:watch
  ```
- **Component Tests (Watch Mode)**:
  ```sh
  npm run test:component:watch
  ```
- **E2E Tests (Watch Mode with Cypress UI)**:
  ```sh
  npm run test:e2e:watch
  ```

### Reporting

After running E2E tests with the `test:e2e:report` command, a combined HTML report will be generated in the `e2e/cypress/data/reports/` directory. You can also generate it manually after running `test:e2e`:

```sh
npm run report:e2e:merge
npm run report:e2e:generate
```
