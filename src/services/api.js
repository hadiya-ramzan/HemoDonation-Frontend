import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach token automatically for protected backend routes.
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeMode");
    }

    return Promise.reject(error);
  }
);

/* ================================
   📍 LOCATION UPDATE API
================================ */
export const updateLocation = (data) => {
  return API.put("/user/update-location", data);
};

export default API;
