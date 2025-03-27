import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:5001/api";

// Create axios instance with direct URL to backend
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`❌ Response error from ${error.config?.url || 'unknown'}:`, error.message);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("❌ Response data:", error.response.data);
      console.error("❌ Response status:", error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("❌ No response received:", error.request);
      toast.error("Server not responding. Please try again later.");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("❌ Request setup error:", error.message);
      toast.error("Request failed: " + error.message);
    }

    return Promise.reject(error);
  }
);

export { axiosInstance };
