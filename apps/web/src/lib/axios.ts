import axios from 'axios';
import { MOCK_DATA } from './mockData';

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

// Demo Mode Interceptor
api.interceptors.request.use((config) => {
  const isDemoMode = localStorage.getItem('demo-mode') === 'true';
  
  if (isDemoMode && config.method === 'get') {
    const url = config.url || '';
    
    const getMockResponse = () => {
      if (url.includes('/dashboard/search')) return { data: { 
        data: {
          clients: MOCK_DATA.clients.slice(0, 3),
          invoices: MOCK_DATA.invoices.slice(0, 3),
          products: MOCK_DATA.products.slice(0, 3)
        }
      }};
      if (url.includes('/dashboard')) return { data: { 
        ...MOCK_DATA.stats, 
        recentInvoices: MOCK_DATA.invoices,
        chartData: [
          { name: 'Jan', income: 4000, expense: 2400 },
          { name: 'Feb', income: 3000, expense: 1398 },
          { name: 'Mar', income: 2000, expense: 9800 },
          { name: 'Apr', income: 2780, expense: 3908 },
          { name: 'May', income: 1890, expense: 4800 },
          { name: 'Jun', income: 2390, expense: 3800 },
        ]
      }};
      if (url.includes('/stats')) return { data: MOCK_DATA.stats };
      if (url.includes('/clients')) return { data: MOCK_DATA.clients, pagination: { totalPages: 1 } };
      if (url.includes('/products')) return { data: MOCK_DATA.products };
      if (url.includes('/invoices')) return { data: MOCK_DATA.invoices, pagination: { totalPages: 1 } };
      if (url.includes('/quotes')) return { data: MOCK_DATA.quotes, pagination: { totalPages: 1 } };
      if (url.includes('/activity')) return { data: MOCK_DATA.activities, pagination: { totalPages: 1 } };
      if (url.includes('/search')) return { data: { 
        clients: MOCK_DATA.clients.slice(0, 2),
        invoices: MOCK_DATA.invoices.slice(0, 2),
        products: MOCK_DATA.products.slice(0, 2)
      }};
      if (url.includes('/settings')) return { data: { 
        currency: 'USD',
        taxRate: 10,
        companyName: 'Demo Corp'
      }};
      if (url.includes('/ai/insights')) return { 
        data: {
          insights: "### 💡 Demo Mode AI Insights\n\n1. **Revenue is healthy**: Your revenue is up 12.5% this month, driven by Stark Industries.\n2. **Monitor Overdue Invoices**: You have 3 overdue invoices totaling $4,200. Consider sending reminders.\n3. **Client Growth**: 5 new clients added in the last 30 days shows strong business momentum."
        }
      };
      return null;
    };

    const mockData = getMockResponse();
    if (mockData) {
      // Short-circuit the request and return mock data
      return Promise.reject({
        isMock: true,
        response: {
          data: mockData,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        }
      });
    }
  }

  // For non-GET requests in demo mode
  if (isDemoMode && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
     const url = config.url || '';
     
     // Special handling for AI Chatbot POST - Allow to pass through to backend for "Real AI" experience
     if (url.includes('/ai/ask')) {
        let parsedData = {};
        try {
          parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {});
        } catch (e) {
          parsedData = config.data || {};
        }

        config.data = JSON.stringify({
          ...parsedData,
          isDemoMode: true
        });
        return config; 
     }

     return Promise.reject({
        isMock: true,
        response: {
          data: { message: 'Demo Mode: Action simulated successfully', data: {} },
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        }
      });
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's our hijacked mock response
    if (error.isMock) {
      return Promise.resolve(error.response);
    }

    if (error.response?.status === 401) {
      
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;