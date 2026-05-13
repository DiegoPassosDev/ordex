import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  return "/api";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  // Get token from Zustand store
  const authState = useAuthStore.getState();
  const token = authState.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ordex_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
