import axios from 'axios';

export  const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // ✅ CRITICAL: Allows browser to send/receive cookies
});

// Response Interceptor (Handle 401s)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any local state if needed, but no token to delete anymore
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

