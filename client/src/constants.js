// client/src/constants.js

// Use REACT_APP_API_URL if set (e.g., by Docker), otherwise default for local development.
const backendBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
const backendApiEndpoint = `${backendBaseUrl}/api`;

const routes = {
  AUTHOR: "authors",
  AUTH: "auth",
  BOOK: "books",
  BORROWAL: "borrowals",
  GENRE: "genres",
  USER: "users"
};

const methods = {
  GET: "get",
  GET_ALL: "getAll",
  POST: "add",
  PUT: "update",
  DELETE: "delete",
  LOGIN: "login",
  REGISTER: "register",
  REVIEW: "reviews"
};

const apiUrl = (route, method, id = "") => {
  // Handle specific auth routes that might not follow the /route/method/:id pattern
  if (route === routes.AUTH && (method === methods.LOGIN || method === methods.REGISTER)) {
    return `${backendApiEndpoint}/${route}/${method}`;
  }
  let path = `${backendApiEndpoint}/${route}/${method}`;
  if (id) {
    path = `${path}/${id}`;
  }
  return path;
};

export {
  routes,
  methods,
  apiUrl,
};