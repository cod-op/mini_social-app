import axios from "axios";

export const api = axios.create({
  baseURL: "https://mini-social-app-c7ne.onrender.com/api"
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("3w_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("3w_token");
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  }
);

export default api;
