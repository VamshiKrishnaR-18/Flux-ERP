import axios from 'axios';

// Keep the named export if you use it elsewhere
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // ✅ Critical
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api; // 👈 ADD THIS LINE