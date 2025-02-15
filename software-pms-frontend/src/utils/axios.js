import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const setupAxiosInterceptors = (logout) => {
  // Clear existing interceptors
  axiosInstance.interceptors.request.eject(
    axiosInstance.interceptors.request.handlers[0]
  );
  axiosInstance.interceptors.response.eject(
    axiosInstance.interceptors.response.handlers[0]
  );

  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle auth errors (401, 403)
      if (error.response && [401, 403].includes(error.response.status)) {
        console.log(`Auth error ${error.response.status}`);

        // Execute logout
        logout();

        // Redirect to login
        window.location.replace("/login");

        return Promise.reject(error);
      }

      // Handle other errors
      if (error.response) {
        if (error.response.status === 429) {
          console.warn("Rate limit exceeded");
        } else if (error.response.status >= 500) {
          console.error("Server error:", error.response.data);
        } else {
          console.error(
            `API Error ${error.response.status}:`,
            error.response.data
          );
        }
      } else {
        console.error("Network error:", error);
      }

      return Promise.reject(error);
    }
  );
};

export const handleApiCall = async (apiCall, errorMessages = {}) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (!error.response) {
      throw new Error(
        errorMessages.network ||
          "Network error occurred. Please check your connection."
      );
    }

    const errorMessage =
      error.response.data?.message ||
      errorMessages[error.response.status] ||
      "An unexpected error occurred.";

    throw new Error(errorMessage);
  }
};
