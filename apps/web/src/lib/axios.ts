import axios from 'axios';


const isProduction = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL;

if (isProduction && !apiUrl) {
  
  throw new Error('⚠️ CRITICAL: VITE_API_URL environment variable is missing. API connections will fail.');
}

export const api = axios.create({
  
  baseURL: (apiUrl || 'http://localhost:3000') + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;