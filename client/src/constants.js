// client/src/constants.js

// Use REACT_APP_API_URL if set (e.g., by Docker), otherwise default for local development.
const backendBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
const backendApiEndpoint = `${backendBaseUrl}/api`;

const routes = {
  AUTHOR: "author",
  AUTH: "auth",
  BOOK: "book",
  BORROWAL: "borrowal",
  GENRE: "genre",
  USER: "user"
};

const methods = {
  GET: "get",
  GET_ALL: "getAll",
  POST: "add",
  PUT: "update",
  DELETE: "delete",
  LOGIN: "login",
  REGISTER: "register"
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

// The AUTH_LOGIN_URL, AUTH_REGISTER_URL, and backendApiUrl exports are removed.

module.exports = {
  routes,
  methods,
  apiUrl,
};