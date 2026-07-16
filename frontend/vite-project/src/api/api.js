import axios from "axios";

let unauthorizedHandler = null;

export function setApiUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      !error?.config?.__skipAuthHandler &&
      unauthorizedHandler
    ) {
      unauthorizedHandler(error);
    }

    return Promise.reject(error);
  },
);

export default api;
