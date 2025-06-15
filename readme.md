# Library Management System

This is a full-stack web application for managing a library's inventory, users, and borrowals. It provides a user-friendly interface for both librarians and members, with role-based access control to ensure data security and integrity.

**GitHub Repository**: [https://github.com/6ebeng/LibraryManagement](https://github.com/6ebeng/LibraryManagement)

## Features

- **User Authentication**: Secure user registration (by admin), login, and logout functionality.
- **Role-Based Access Control**: Different functionalities are available for Librarian (Admin) and Member roles.
- **Dashboard**: An overview for librarians with system statistics.
- **CRUD Operations**: Comprehensive management of:
  - Books
  - Authors
  - Genres
  - Users
  - Borrowals
  - Reviews
- **Responsive UI**: A responsive and intuitive user interface built with React and Material-UI.

## User Roles

The system has two main user roles:

1.  **Librarian (Admin)**:

    - Has full CRUD access to all system entities, including books, authors, genres, users, and borrowals.
    - Can manage user accounts and view system statistics on the dashboard.

2.  **Member**:

    - Can view books, authors, and genres.
    - Can borrow books and view their own borrowal history.
    - Can submit reviews for books.

## Technologies Used

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Passport.js
- **Containerization**: Docker

## System Architecture

The application follows a client-server architecture. The frontend is a single-page application (SPA) built with React that communicates with the backend via a RESTful API. The entire application is containerized using Docker for easy deployment and scalability.

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

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/logout`
- `GET, POST /api/book/...`
- `GET, PUT, DELETE /api/book/:id`
- `GET, POST /api/author/...`
- `GET, PUT, DELETE /api/author/:id`
- `GET, POST /api/genre/...`
- `GET, PUT, DELETE /api/genre/:id`
- `GET, POST /api/borrowal/...`
- `GET, PUT, DELETE /api/borrowal/:id`
- `GET, POST /api/user/...`
- `GET, PUT, DELETE /api/user/:id`
- `GET, POST /api/review/...`
- `GET, DELETE /api/review/:id`

## Key Use Cases

- **UC-001**: User Login
- **UC-002**: Add New Book (Librarian)
- **UC-003**: Borrow a Book (Member)
- **UC-004**: Register New User (Librarian)
- **UC-005**: View Borrowal History (Member)
