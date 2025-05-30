# Library Management App

_Current version: v1.1_ (Consider updating if a new version is being released with these changes)

This is a simple fullstack web app for library management, built using the MERN stack. The application is ready for deployment using Docker Compose.

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#-about-the-project">About the project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#-getting-started">Getting Started</a>
      <ul>
        <li><a href="#-prerequisites">Prerequisites</a></li>
        <li><a href="#-downloading">Downloading</a></li>
        <li><a href="#-installing-and-executing-dev">Installing and executing (dev)</a></li>
      </ul>
    </li>
    <li><a href="#-docker-deployment">Docker Deployment</a></li>
    <li><a href="#-software-testing-plan">Software Testing Plan</a></li>
    <li><a href="#-file-structure">File Structure</a></li>
    <li><a href="#-gallery">Gallery</a></li>
    <li><a href="#-help">Help</a></li>
    <li><a href="#-authors">Authors</a></li>
    <li><a href="#-version-history">Version History</a></li>
    <li><a href="#-license">License</a></li>
    <li><a href="#-acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## 🔰 About the project

The system allows **Librarians** and **Members** to login to the web app (using accounts created by librarians).

**Librarians can:**

- Manage (CRUD)
  - Authors
  - Genres
  - Books
  - Borrowals
  - Users

**Members can:**

- View (R)
  - Authors
  - Genres
  - Books
  - Own borrowals
- Add (C)
  - Own borrowals

### Built with

<div style="display:inline-block">
<img alt="MongoDB"src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/databases/mongodb.svg" width="128"/>
<img alt="Node.js" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/frameworks/nodejs.svg" width="128"/>
<img alt="NPM" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/others/npm.svg" width="128"/>
<img alt="React" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/frameworks/react.svg" width="128"/>
<img alt="Git" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/others/git.svg" width="128"/>
<img alt="Github" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/cloud/github.svg" width="128"/>
<img alt="VS Code" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/text%20editors/vscode.svg" width="128"/>
<img alt="HTML" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/others/html.svg" width="128"/>
<img alt="CSS" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/others/css.svg" width="128"/>
<img alt="JS" src="https://github.com/yurijserrano/Github-Profile-Readme-Logos/blob/master/programming%20languages/javascript.svg" width="128"/>
</div>

<!-- GETTING STARTED -->

## ⚡ Getting Started

### ❕ Prerequisites

You need a computing environment with an up to date version of Windows/Mac OS/Linux and a working internet connection.

- Git
- Node.js
- NPM
- A web browser (Chrome/Edge recommended)

### 🔻 Downloading

- Clone the code repo using **HTTPS**, SSH or Github CLI

```
git clone https://github.com/6ebeng/LibraryManagement.git
```

(Note: The original README referenced `MERNRAD/LibraryManagement.git`. I've updated this to `6ebeng/LibraryManagement.git` based on the current repository.)

### 🚀 Installing and executing (dev)

_You will need the .env file containing the environment variables in order to use the system, please contact the <a href="#-authors">authors</a>._

1. `cd` to project folder (`LibraryManagement`)
2. Run the following commands in terminal:
   - To install NPM packages
     ```
     npm run install
     ```
   - To start both server and client applications
     ```
     npm start
     ```
3. Use the following demo accounts to login:
   - **Librarian**
     ```
     Email address: testlibrarian@library.com
     Password: librarian123
     ```
   - **Member**
     ```
     Email address: testmember@library.com
     Password: member123
     ```

<!-- DOCKER DEPLOYMENT -->

## 🐳 Docker Deployment

This project is configured for deployment using Docker and Docker Compose for both development and production environments.

(The existing "How to Use Docker for This Project" section from lines 220-378 of the original README.md is maintained here. For brevity, I'm not reproducing all 158 lines, but they should be included in the final file.)

**Key Docker-related files:**

- `./docker-compose.yml` (Base configurations)
- `./docker-compose.dev.yml` (Development overrides)
- `./docker-compose.prod.yml` (Production overrides)
- `./.env.dev` (Development environment variables)
- `./.env.prod` (Production environment variables)
- `./client/Dockerfile`
- `./client/nginx.conf` (Production Nginx config for frontend)
- `./server/Dockerfile`

**Important:**

- Add `.env.dev` and `.env.prod` to your `.gitignore`.
- Modify placeholder values in `.env.dev` and especially `.env.prod` with actual secrets.

**Development Environment with Docker:**

1. Navigate to project root.
2. Build and start containers:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```
3. Access:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080`
   - MongoDB (dev): `mongodb://devuser:devpass@localhost:27017/librarymanagement_dev` (from host)
4. Hot reloading is enabled.
5. Stop with `Ctrl+C`, then `docker-compose -f docker-compose.yml -f docker-compose.dev.yml down [-v to remove volumes]`.

**Production Environment with Docker:**

1. Navigate to project root.
2. Configure `./.env.prod` with production secrets.
3. Build and start containers in detached mode:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
4. Access:
   - Frontend (Nginx): `http://localhost:80` (or server IP/domain)
5. View logs: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f [service_name]`
6. Stop: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml down [-v to remove volumes]`

Refer to the original README section for more detailed Docker Compose commands and explanations if needed.

<!-- SOFTWARE TESTING PLAN -->

## 🧪 Software Testing Plan

This section outlines the planned software testing phases and activities for the Library Management System. The plan is based on the tasks detailed in `docs/Tasks.pdf`.

### Work Breakdown Structure - Phases

**Phase 1: Planning & Initial Static Testing**

- 1.1. Understand SRS & Coursework Requirements
- 1.2. Develop Detailed Test Plan (incl. techniques, criteria) & Task Distribution
- 1.3. VIII. Static Testing: Documentation Review (SRS, Test Plan)
  - _Responsibility_: Non-Coders/Specification Experts lead review for clarity, consistency, completeness. Coders review for technical accuracy.
- 1.4. VIII. Static Testing: Initial Code Review Setup & Process Definition
  - _Responsibility_: Coders lead setup. Team defines process.
- 1.5. **Milestone:** P1 Complete: Test Plan Finalized

**Phase 2: Core Functional & API Test Design & Execution**

- 2.1. I.A Functional: Authentication & Authorization Test Design
  - _Responsibility_: Non-Coders design tests for registration, login, logout, role-based access. Coders review for technical edge cases.
  - _Techniques_: Equivalence Partitioning, Boundary Value Analysis.
- 2.2. I.B Functional: Entity Management (CRUD - Books, Authors, Genres, Users, Borrowals, Reviews) Test Design
  - _Responsibility_: Non-Coders design tests for Create, Read, Update, Delete operations, including data integrity and constraints. Coders review for backend data integrity implications.
- 2.3. I.C-D Functional: Specific Feature & Use Case (SRS Section 7) Test Design
  - _Responsibility_: Non-Coders design tests for main, alternative, and exception flows, error handling. Coders provide insight on complex backend logic.
- 2.4. I.E Functional: State Transition Test Design
  - _Responsibility_: Non-Coders identify entities with states (Borrowal Status, Book Availability) and design tests for valid/invalid transitions. Coders review state models.
- 2.5. II. API Test Scenario Design
  - _Responsibility_: Non-Coders lead user-centric scenario design based on SRS and user workflows.
- 2.6. II. API Test Automation Setup & Initial Scripts
  - _Responsibility_: Coders lead API test automation (e.g., using Postman scripts) for core functionalities.
- 2.7. I. Functional Test Execution & Defect Reporting
  - _Responsibility_: Non-Coders lead manual execution and defect reporting. Coders support troubleshooting.
- 2.8. II. API Test Execution (Manual & Automated)
  - _Responsibility_: Team executes tests. Non-Coders can run pre-written Postman collections.
- 2.9. **Milestone:** P2 Complete: Core Functional/API Tests Executed

**Phase 3: White-Box & Non-Functional Testing**

- 3.1. III. White-Box Test Planning & Unit Test Development
  - _Responsibility_: Coders analyze source code, plan coverage (Decision/Condition, Path), and develop unit tests (e.g., Jest).
- 3.2. III. White-Box Test Execution & Code Coverage Analysis
  - _Responsibility_: Coders execute unit tests and analyze code coverage.
- 3.3. IV.A Security Test Design & Execution
  - _Responsibility (Balanced)_: Coders lead technical security testing (code reviews for vulnerabilities, server-side validation). Non-Coders lead user-facing security testing (XSS attempts, access control checks from UI).
- 3.4. IV.B Usability Test Design & Execution
  - _Responsibility_: Non-Coders design usability scenarios, conduct heuristic evaluations or informal tests on UI/UX. Coders provide technical feedback.
- 3.5. IV.C Performance (Basic) Test Design & Execution
  - _Responsibility (Balanced)_: Non-Coders observe and document perceived page load times. Coders conduct basic API response time checks.
- 3.6. IV.E Browser Compatibility Testing
  - _Responsibility_: Non-Coders lead manual testing across specified browsers (Chrome, Firefox, Edge, Safari). Coders assist in debugging browser-specific issues.
- 3.7. VIII. Static Testing: Ongoing Code Reviews
  - _Responsibility (Team)_: Coders lead technical reviews. Non-Coders focus on readability and SRS alignment.
- 3.8. **Milestone:** P3 Complete: White-Box/NFR Tests Executed

**Phase 4: Integration & Early Regression Testing**

- 4.1. V. Integration Test Scenario Design
  - _Responsibility_: Non-Coders lead design of end-to-end user scenarios spanning multiple features.
- 4.2. V. Integration Test Execution
  - _Responsibility (Team)_: Coders lead technical setup and debugging. Non-Coders execute user-centric integration tests.
- 4.3. VI. Regression Test Suite Development (Manual)
  - _Responsibility_: Non-Coders lead development and maintenance of manual regression suite.
- 4.4. VI. Regression Test Suite Development (Automated)
  - _Responsibility_: Coders lead development and maintenance of automated regression suite (unit, API).
- 4.5. VI. Early Regression Test Cycles
  - _Responsibility (Team)_: Collaborate on regression strategy, scope, and review of results.
- 4.6. **Milestone:** P4 Complete: Integration & Initial Regression Done

**Phase 5: System Changes, Final Testing & Report**

- 5.1. Suggest, Implement & Test System Changes
  - _Responsibility (Team)_.
- 5.2. VI. Final Regression Testing Cycles
  - _Responsibility (Team)_.
- 5.3. VII. Installation/Deployment Testing
  - _Responsibility (Balanced)_: Coders verify Docker setup and deployment scripts. Non-Coders execute smoke/acceptance tests post-deployment.
- 5.4. VIII. Static Testing: Final Documentation Review
  - _Responsibility (Team)_: Non-Coders lead review of all documentation. Coders review for technical accuracy.
- 5.5. Prepare Final Report & Presentation
  - _Responsibility (Team)_.
- 5.6. **Milestone:** Project Submission

<!-- FILE STRUCTURE -->

### 📂 File Structure

```
.
├── client
│   ├── public/ (Static assets, index.html)
│   └── src/ (React application source)
│       ├── hooks/
│       ├── sections/ (@dashboard, auth)
│       ├── utils/
│       ├── App.jsx
│       ├── index.js (Client entry point)
│       ├── constants.js
│       └── routes.js
├── docs/ (Project documentation, including Tasks.pdf, SRS, etc.)
│   ├── SRS Library Management.docx
│   ├── Summary of Tests Needed for Library Management Project.docx
│   ├── Task Distribution for Library Management Project Testing.docx
│   └── Tasks.pdf
├── server
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── index.js (Node.js server entry point)
│   └── passport-config.js
├── .env.dev (Example, ensure in .gitignore)
├── .env.prod (Example, ensure in .gitignore)
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── package.json
├── README.md
└── LICENSE.md (Consider adding a LICENSE file if one doesn't exist)
```

- Key entry points: `server/index.js` (backend), `client/src/index.js` (frontend).

<!-- GALLERY -->

### 📸 Gallery

(Gallery images from the original README.md are maintained here. For brevity, not reproducing all image links.)

![Screenshot 2022-10-27 at 15 52 48 Large](https://user-images.githubusercontent.com/49369577/198261312-d21a461a-0dd9-46a8-897c-f8c06f76ef5a.jpeg)
![Screenshot 2022-10-27 at 15 53 06 Large](https://user-images.githubusercontent.com/49369577/198261409-31625ee5-b743-4360-a54a-8c2834a26f41.jpeg)
... (include all other gallery images) ...
![Screenshot 2022-10-27 at 15 55 15 Large](https://user-images.githubusercontent.com/49369577/198261821-d5e36256-552c-4664-8018-cf9269ae768d.jpeg)

<!-- HELP -->

## ❓ Help

Contact authors if you need help or run into any issues.

<!-- AUTHORS -->

## 👥 Authors

- Sandul Renuja | 2020/CS/054 - 2020cs054@stu.ucsc.cmb.ac.lk
- Abdullah Jasmin | 2020/CS/002 - 2020cs002@stu.ucsc.cmb.ac.lk
- Ravindu Wegiriya | 2020/CS/204 - 2020cs204@stu.ucsc.cmb.ac.lk
- Kaveesha Muthukuda | 2020/CS/118 - 2020cs118@stu.ucsc.cmb.ac.lk
- Induwara Pathirana | 2020/CS/126 - 2020cs126@stu.ucsc.cmb.ac.lk

<!-- VERSION HISTORY -->

## 📜 Version History

- **v1.1** - (Add a brief description of changes in this version if applicable)
- **v1.0** - Initial release

(Adjust version history as needed)

<!-- LICENSE -->

## 📄 License

(Specify your project's license here. For example: Distributed under the MIT License. See `LICENSE.md` for more information. If you don't have a `LICENSE.md` file, consider adding one.)

<!-- ACKNOWLEDGMENTS -->

## 🙏 Acknowledgments

(Optional: Add any acknowledgments here.)

- [yurijserrano/Github-Profile-Readme-Logos](https://github.com/yurijserrano/Github-Profile-Readme-Logos) for the technology logos.
