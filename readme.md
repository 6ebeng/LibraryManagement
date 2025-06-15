# Library Management System

[cite\_start]This is a full-stack web application for managing a library's inventory, users, and borrowals. [cite: 13, 18] [cite\_start]It provides a user-friendly interface for both librarians and members, with role-based access control to ensure data security and integrity. [cite: 18, 102]

**GitHub Repository**: [https://github.com/6ebeng/LibraryManagement](https://github.com/6ebeng/LibraryManagement)

## Features

- [cite\_start]**User Authentication**: Secure user registration (by admin), login, and logout functionality. [cite: 41, 45, 49]
- [cite\_start]**Role-Based Access Control**: Different functionalities are available for Librarian (Admin) and Member roles. [cite: 27]
- [cite\_start]**Dashboard**: An overview for librarians with system statistics. [cite: 25, 52]
- **CRUD Operations**: Comprehensive management of:
  - [cite\_start]Books [cite: 26]
  - [cite\_start]Authors [cite: 26]
  - [cite\_start]Genres [cite: 26]
  - [cite\_start]Users [cite: 27]
  - [cite\_start]Borrowals [cite: 26]
  - [cite\_start]Reviews [cite: 27, 88]
- [cite\_start]**Responsive UI**: A responsive and intuitive user interface built with React and Material-UI. [cite: 36, 94]

## User Roles

The system has two main user roles:

1.  **Librarian (Admin)**:

    - [cite\_start]Has full CRUD access to all system entities, including books, authors, genres, users, and borrowals. [cite: 29]
    - [cite\_start]Can manage user accounts and view system statistics on the dashboard. [cite: 29]

2.  **Member**:

    - [cite\_start]Can view books, authors, and genres. [cite: 30]
    - [cite\_start]Can borrow books and view their own borrowal history. [cite: 31]
    - [cite\_start]Can submit reviews for books. [cite: 88, 92]

## Technologies Used

- [cite\_start]**Frontend**: React, Material-UI [cite: 36]
- [cite\_start]**Backend**: Node.js, Express.js [cite: 35]
- [cite\_start]**Database**: MongoDB [cite: 35]
- [cite\_start]**Authentication**: Passport.js [cite: 36]
- [cite\_start]**Containerization**: Docker [cite: 32]

## System Architecture

The application follows a client-server architecture. [cite\_start]The frontend is a single-page application (SPA) built with React that communicates with the backend via a RESTful API. [cite: 20, 37] The entire application is containerized using Docker for easy deployment and scalability.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Docker and Docker Compose installed on your machine.
- Node.js and npm (for running scripts locally).

### Development

To run the application in a development environment with hot-reloading:

```sh
# Clone the repository
git clone https://github.com/6ebeng/LibraryManagement.git
cd LibraryManagement

# Create a .env.dev file with your development environment variables

# Start the services
npm run dev:watch:up
```

### Production

To build and run the application in a production environment:

```sh
# (Inside the project directory)
# Create a .env.prod file with your production environment variables

# Start the services using the production docker-compose file
docker-compose -f docker-compose.prod.yml up -d --build
```

## Running Tests

The repository is configured with a suite of tests, including API tests, component tests, and end-to-end (E2E) tests.

You can run all tests using the following command:

```sh
npm test
```

To run specific test suites, use the following commands:

- **API Tests**:
  ```sh
  npm run test:api
  ```
- **Component Tests**:
  ```sh
  npm run test:component
  ```
- **End-to-End (E2E) Tests**:
  ```sh
  npm run test:e2e
  ```

## Project Structure

The repository is organized as follows:

```
/
├── client/         # React frontend application
├── server/         # Node.js backend API
├── e2e/            # Cypress end-to-end tests
├── performance/    # k6 performance tests
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docker-compose.test.yml
└── package.json    # Project scripts and dependencies
```

## API Endpoints

The core API endpoints include:

- [cite\_start]`POST /api/auth/register` [cite: 45]
- [cite\_start]`POST /api/auth/login` [cite: 48]
- [cite\_start]`GET /api/auth/logout` [cite: 51]
- [cite\_start]`GET, POST /api/book/...` [cite: 56, 57]
- [cite\_start]`GET, PUT, DELETE /api/book/:id` [cite: 58, 59]
- [cite\_start]`GET, POST /api/author/...` [cite: 62, 63]
- [cite\_start]`GET, PUT, DELETE /api/author/:id` [cite: 64, 65]
- [cite\_start]`GET, POST /api/genre/...` [cite: 68, 69]
- [cite\_start]`GET, PUT, DELETE /api/genre/:id` [cite: 70, 71]
- [cite\_start]`GET, POST /api/borrowal/...` [cite: 75, 76]
- [cite\_start]`GET, PUT, DELETE /api/borrowal/:id` [cite: 77, 78]
- [cite\_start]`GET, POST /api/user/...` [cite: 83, 84]
- [cite\_start]`GET, PUT, DELETE /api/user/:id` [cite: 86, 87]
- [cite\_start]`GET, POST /api/review/...` [cite: 90, 92]
- [cite\_start]`GET, DELETE /api/review/:id` [cite: 91]

## Key Use Cases

- [cite\_start]**UC-001**: User Login [cite: 135]
- [cite\_start]**UC-002**: Add New Book (Librarian) [cite: 146]
- [cite\_start]**UC-003**: Borrow a Book (Member) [cite: 161]
- [cite\_start]**UC-004**: Register New User (Librarian) [cite: 177]
- [cite\_start]**UC-005**: View Borrowal History (Member) [cite: 192]
