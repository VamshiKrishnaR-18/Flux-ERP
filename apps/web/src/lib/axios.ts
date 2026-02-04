import axios from 'axios';

// ✅ Fix: Strict environment check
const isProduction = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL;

if (isProduction && !apiUrl) {
  // Fail fast: Prevent the app from deploying/running with broken networking
  throw new Error('⚠️ CRITICAL: VITE_API_URL environment variable is missing. API connections will fail.');
}

export const api = axios.create({
  // Only default to localhost in development mode
  baseURL: apiUrl || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // ✅ Critical for cookies
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch event for SessionExpiryModal
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;