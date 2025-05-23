# Library Management App

_Current version: v1.1_

This is a simple fullstack web app for library management, built using the MERN stack.

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
    <li><a href="#-help">Help</a></li>
    <li><a href="#-authors">Authors</a></li>
    <li><a href="#-file-structure">File Structure</a></li>
    <li><a href="#-gallery">Gallery</a></li>
    <li><a href="#-version-history">Version History</a></li>
    <li><a href="#-license">License</a></li>
    <li><a href="#-acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## 🔰 About the project

The system allows **Librarians** and **Members** to login to the web app (using accounts created by librarians)

Lbrarians can:

- Manage (CRUD)
  - Authors
  - Genres
  - Books
  - Borrowals
  - Users

Members can:

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

You need a computing environment with an up to date version of Windows/Mac OS/Linux and a working internet connection

- Git
- Node.js
- NPM
- A web browser (Chrome/Edge recommended)

### 🔻 Downloading

- Clone the code repo using **HTTPS**, SSH or Github CLI

```
git clone https://github.com/MERNRAD/LibraryManagement.git
```

### 🚀 Installing and executing (dev)

### _You will need the .env file containing the environment variables in order to use the system, please contact the <a href="#-authors">authors</a>_

1. cd to project folder (LibraryManagement)
2. Run the following commands in terminal:

- To install NPM packages

```
npm run install
```

- To start both server and client applications

```
npm start
```

3. Use the following demo accounts to login

- Librarian

```
Email address: testlibrarian@library.com
Password: librarian123
```

- Member

```
Email address: testmember@library.com
Password: member123
```

<!-- HELP -->

## ❓ Help

Contact authors if you need help or run into any issues

<!-- AUTHORS -->

## 👥 Authors

- Sandul Renuja | 2020/CS/054 - 2020cs054@stu.ucsc.cmb.ac.lk
- Abdullah Jasmin | 2020/CS/002 - 2020cs002@stu.ucsc.cmb.ac.lk
- Ravindu Wegiriya | 2020/CS/204 - 2020cs204@stu.ucsc.cmb.ac.lk
- Kaveesha Muthukuda | 2020/CS/118 - 2020cs118@stu.ucsc.cmb.ac.lk
- Induwara Pathirana | 2020/CS/126 - 2020cs126@stu.ucsc.cmb.ac.lk

<!-- FILE STRUCTURE -->

### 📂 File Structure

```
.
├── client
│   ├── public
│   │   ├── assets
│   │   └── index.html
│   └── src
│       ├── hooks
│       ├── sections
│       │   ├── @dashboard
│       │   │   ├── app
│       │   │   ├── author
│       │   │   ├── book
│       │   │   ├── borrowal
│       │   │   ├── genre
│       │   │   └── user
|       │   └── auth
│       │       └── login
│       ├── utils
│       ├── App.jsx
│       ├── index.js
│       ├── constants.js
│       └── routes.js
│
├── server
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── index.js
│   └── passport-config.js
│
├── package.json
├── README.md
└── LICENSE.md
```

- Only the core files and directories are shown in the above tree

| No  | File Name           | Details                        |
| --- | ------------------- | ------------------------------ |
| 1   | server/index.js     | Node.js server app entry point |
| 2   | client/src/index.js | Client react app entry point   |

<!-- GALLERY -->

### 📸 Gallery

![Screenshot 2022-10-27 at 15 52 48 Large](https://user-images.githubusercontent.com/49369577/198261312-d21a461a-0dd9-46a8-897c-f8c06f76ef5a.jpeg)

![Screenshot 2022-10-27 at 15 53 06 Large](https://user-images.githubusercontent.com/49369577/198261409-31625ee5-b743-4360-a54a-8c2834a26f41.jpeg)

![Screenshot 2022-10-27 at 15 53 23 Large](https://user-images.githubusercontent.com/49369577/198261440-9c43f63e-9ba4-4f16-a552-9d210f40c8df.jpeg)

![Screenshot 2022-10-27 at 15 53 31 Large](https://user-images.githubusercontent.com/49369577/198261486-fd2f6bfa-955f-4cdc-9716-091d5ba027a9.jpeg)

![Screenshot 2022-10-27 at 15 53 38 Large](https://user-images.githubusercontent.com/49369577/198261620-a6669984-8a9a-4067-b9e8-e6f716d8f76b.jpeg)

![Screenshot 2022-10-27 at 15 53 49 Large](https://user-images.githubusercontent.com/49369577/198261666-b550362c-4e69-47f4-aaf2-1bbcb278d96e.jpeg)

![Screenshot 2022-10-27 at 15 54 04 Large](https://user-images.githubusercontent.com/49369577/198261690-4bc70865-4f25-403a-a2c2-a1f0192ab02a.jpeg)

![Screenshot 2022-10-27 at 15 54 16 Large](https://user-images.githubusercontent.com/49369577/198261718-67c1800e-549c-4fe3-9219-95bcaf5302c6.jpeg)

![Screenshot 2022-10-27 at 15 54 27 Large](https://user-images.githubusercontent.com/49369577/198261796-63cc2266-c59f-42ee-91aa-ea585df55fc2.jpeg)

![Screenshot 2022-10-27 at 15 55 15 Large](https://user-images.githubusercontent.com/49369577/198261821-d5e36256-552c-4664-8018-cf9269ae768d.jpeg)

# How to Use Docker for This Project

This document outlines how to run the Library Management application using Docker and Docker Compose for both development and production environments.

## Prerequisites

- **Docker Desktop**: Install Docker Desktop for your operating system (Windows, macOS, or Linux). This includes Docker Engine and Docker Compose. Download from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
- **Code**: You should have the project code, including the `client` and `server` directories, and the Docker-related files (`Dockerfile` in client and server, `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.prod.yml`, `.env.dev`, `.env.prod`) in your project root.
- **Terminal/Command Prompt**: You'll need a terminal or command prompt to run Docker commands.

## Project Structure (Docker-related files)

Make sure you have the following files in your project root and respective directories:

- `./docker-compose.yml` (Base Docker Compose configurations)
- `./docker-compose.dev.yml` (Development specific configurations)
- `./docker-compose.prod.yml` (Production specific configurations)
- `./.env.dev` (Environment variables for development)
- `./.env.prod` (Environment variables for production)
- `./client/Dockerfile` (Dockerfile for the frontend application)
- `./client/nginx.conf` (Nginx configuration for the frontend in production)
- `./server/Dockerfile` (Dockerfile for the backend application)

**Important**:

- Add `.env.dev` and `.env.prod` to your `.gitignore` file to prevent committing sensitive credentials.
- Modify the placeholder values in `.env.dev` and (especially) `.env.prod` with your actual secrets and configuration details.

## Development Environment

This setup is for local development, featuring hot-reloading for both frontend and backend, and easier debugging.

1.  **Navigate to Project Root**:
    Open your terminal and change the directory to the root of your project (where `docker-compose.yml` is located).

    ```bash
    cd path/to/your/project
    ```

2.  **Build and Start Containers**:
    Run the following command to build the Docker images (if they don't exist or if Dockerfiles have changed) and start the services:

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    ```

    - `docker-compose.yml`: Specifies the base service definitions.
    - `docker-compose.dev.yml`: Overrides and adds configurations for the development environment (e.g., volume mounts for hot-reloading, development commands).
    - `up`: Creates and starts containers.
    - `--build`: Forces a build of the images before starting the containers. You can omit `--build` if your Dockerfiles and their contexts haven't changed since the last build.

3.  **Accessing the Application**:

    - **Frontend (React Dev Server)**: Open your web browser and go to `http://localhost:3000`
    - **Backend API**: The backend server will be running and accessible from the frontend. If you need to test it directly, its API endpoints are available at `http://localhost:8080` (e.g., `http://localhost:8080/api/books`).
    - **MongoDB**: The MongoDB instance for development will be running. If you need to connect to it directly (e.g., with MongoDB Compass), the connection string (from within other Docker containers) is `mongodb://mongo:27017/librarymanagement_dev`. From your host machine, it's accessible at `mongodb://devuser:devpass@localhost:27017/librarymanagement_dev` (using credentials from `.env.dev`).

4.  **Hot Reloading**:
    Changes made to the source code in the `./client` and `./server` directories on your host machine will automatically trigger a reload in the respective containers, allowing you to see changes live.

5.  **Viewing Logs**:
    You will see the combined logs from all services (frontend, backend, mongo) in your terminal.

6.  **Stopping the Development Environment**:
    - Press `Ctrl+C` in the terminal where `docker-compose up` is running.
    - To remove the containers (and optionally volumes if you want a clean start next time), run:
      ```bash
      docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
      ```
      To remove volumes as well (be careful, this deletes data in `mongo-dev-data`):
      ```bash
      docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
      ```

## Production Environment

This setup is for building and running the application in a production-like manner. It uses optimized builds and Nginx to serve the frontend.

1.  **Navigate to Project Root**:
    Open your terminal and change the directory to the root of your project.

    ```bash
    cd path/to/your/project
    ```

2.  **Configure Production Environment Variables**:
    Ensure your `./.env.prod` file is correctly configured with strong, unique secrets and appropriate settings for your production MongoDB instance (if external) or the Dockerized MongoDB for production. **Do not use default or weak credentials.**

3.  **Build and Start Containers**:
    Run the following command to build the Docker images and start the services in detached mode (`-d`):

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ```

    - `docker-compose.yml`: Specifies the base service definitions.
    - `docker-compose.prod.yml`: Overrides and adds configurations for the production environment (e.g., production build targets, restart policies).
    - `up`: Creates and starts containers.
    - `-d`: Runs containers in detached mode (in the background).
    - `--build`: Forces a build of the images.

4.  **Accessing the Application**:

    - **Frontend (Nginx)**: Open your web browser and go to `http://localhost:80` (or the IP address/domain name of your server if deployed remotely).
    - **Backend API**: The backend is not directly exposed to the host on port `8080` by default in the `docker-compose.prod.yml` (as Nginx proxies API requests). It's accessible internally at `http://backend:8080` by the frontend service.

5.  **Viewing Logs**:
    To view the logs of the running services:

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
    ```

    Or for a specific service (e.g., backend):

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
    ```

6.  **Stopping the Production Environment**:
    To stop the services:

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    ```

    To remove volumes as well (be careful, this deletes data in `mongo-prod-data`):

    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
    ```

## General Docker Compose Commands

- **List running containers for a compose project**:

  ```bash
  # For dev
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
  # For prod
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
  ```

- **Rebuild a specific service**:

  ```bash
  # For dev, e.g., frontend
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml build frontend
  # For prod, e.g., backend
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml build backend
  ```

- **Execute a command inside a running container**:
  ```bash
  # For dev, e.g., open a shell in the backend container
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh
  ```

Remember to replace the file paths and service names as per your actual project structure if they differ from the examples.
