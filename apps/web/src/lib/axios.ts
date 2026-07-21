import axios from 'axios';

const isProduction = import.meta.env.PROD;
const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

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

// Add x-demo-mode header to all requests in demo mode
api.interceptors.request.use((config) => {
  const isDemoMode = localStorage.getItem('demo-mode') === 'true';
  if (isDemoMode) {
    config.headers['x-demo-mode'] = 'true';
  }
  return config;
}, (error) => {
  return Promise.reject(error);
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
