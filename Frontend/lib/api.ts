import axios from "axios";
import { toast } from "sonner";

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    const isAiError =
      error.response?.status === 503 ||
      (typeof detail === "string" && detail.toLowerCase().includes("ai service unavailable")) ||
      (error.config?.url && error.config.url.includes("/api/ai/") && error.response?.status >= 500);

    if (isAiError) {
      toast.error("AI service unavailable, check your AI Settings", {
        duration: 5000,
      });
    }
    return Promise.reject(error);
  }
);

export { api, getBaseUrl };
export default api;

