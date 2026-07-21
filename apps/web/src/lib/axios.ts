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
        data: {
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
        }
      }};
      if (url.includes('/stats')) return { data: { data: MOCK_DATA.stats } };
      
      // Handle single item views
      if (url.match(/\/invoices\/demo-[a-z0-9]+$/)) return { data: { data: MOCK_DATA.invoices[0] } };
      if (url.match(/\/quotes\/demo-[a-z0-9]+$/)) return { data: { data: MOCK_DATA.quotes[0] } };
      if (url.match(/\/clients\/demo-[a-z0-9]+$/)) return { data: { data: MOCK_DATA.clients[0] } };
      if (url.match(/\/products\/demo-[a-z0-9]+$/)) return { data: { data: MOCK_DATA.products[0] } };

      if (url.includes('/clients')) return { data: { data: MOCK_DATA.clients, pagination: { totalPages: 1 } } };
      if (url.includes('/products')) return { data: { data: MOCK_DATA.products, pagination: { totalPages: 1 } } };
      if (url.includes('/invoices')) return { data: { data: MOCK_DATA.invoices, pagination: { totalPages: 1 } } };
      if (url.includes('/quotes')) return { data: { data: MOCK_DATA.quotes, pagination: { totalPages: 1 } } };
      if (url.includes('/activity')) return { data: { data: MOCK_DATA.activities, pagination: { totalPages: 1 } } };
      if (url.includes('/expenses')) return { data: { 
        data: [
          { _id: '1', date: new Date().toISOString(), category: 'Rent', amount: 2000, description: 'Office rent', paymentMethod: 'bank_transfer' },
          { _id: '2', date: new Date().toISOString(), category: 'Software', amount: 150, description: 'SaaS subscriptions', paymentMethod: 'credit_card' },
        ], 
        pagination: { totalPages: 1 } 
      } };

      if (url.includes('/public/invoice')) return { data: { data: MOCK_DATA.invoices[0] } };
      if (url.includes('/public/client')) return { data: { data: MOCK_DATA.clients[0], invoices: MOCK_DATA.invoices } };

      if (url.includes('/search')) return { data: { 
        clients: MOCK_DATA.clients.slice(0, 2),
        invoices: MOCK_DATA.invoices.slice(0, 2),
        products: MOCK_DATA.products.slice(0, 2)
      }};
      if (url.includes('/settings')) return { data: { 
        data: {
          currency: 'USD',
          taxRate: 10,
          companyName: 'Demo Corp',
          address: '123 Demo St, San Francisco, CA',
          email: 'hello@democorp.com',
          phone: '+1 (555) 000-0000'
        }
      }};

      if (url.includes('/reports/revenue-vs-expenses')) return { data: { data: [
        { month: 'Jan', revenue: 4000, profit: 2400 },
        { month: 'Feb', revenue: 3000, profit: 1398 },
        { month: 'Mar', revenue: 2000, profit: 9800 },
        { month: 'Apr', revenue: 2780, profit: 3908 },
        { month: 'May', revenue: 1890, profit: 4800 },
        { month: 'Jun', revenue: 2390, profit: 3800 },
      ]}};

      if (url.includes('/reports/expense-breakdown')) return { data: { data: [
        { _id: 'Rent', total: 2400 },
        { _id: 'Utilities', total: 1398 },
        { _id: 'Software', total: 9800 },
        { _id: 'Marketing', total: 3908 },
        { _id: 'Payroll', total: 4800 },
      ]}};

      if (url.includes('/reports/tax')) return { data: { data: {
        totalTax: 1250.50,
        totalTaxable: 12505.00,
        totalRevenue: 25000.00
      }}};

      if (url.includes('/currencies')) return { data: { data: [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      ]}};

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
          ...mockData,
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

     // Generate realistic response data based on the URL
     const getMockActionResponse = () => {
       const id = `demo-${Math.random().toString(36).substr(2, 9)}`;
       
       if (url.includes('/upload')) {
         return { 
           success: true, 
           data: { 
             url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=100&h=100&fit=crop',
             publicId: 'demo-logo'
           } 
         };
       }
       if (url.includes('/invoices') && url.includes('/send')) {
         return { success: true, message: 'Invoice sent successfully (Demo)' };
       }
       if (url.includes('/quotes') && url.includes('/send')) {
         return { success: true, message: 'Quote sent successfully (Demo)' };
       }
       if (url.includes('/remind')) {
         return { success: true, message: 'Reminder sent successfully (Demo)' };
       }
       if (url.includes('/invoices') && config.method === 'post') {
         return { message: 'Invoice created successfully (Demo)', data: { _id: id, number: 999, total: 0, status: 'draft' } };
       }
       if (url.includes('/quotes') && config.method === 'post') {
         return { message: 'Quote created successfully (Demo)', data: { _id: id, number: 999, total: 0, status: 'draft' } };
       }
       if (url.includes('/clients') && config.method === 'post') {
         return { message: 'Client created successfully (Demo)', data: { _id: id, name: 'New Demo Client' } };
       }
       if (url.includes('/products') && config.method === 'post') {
         return { message: 'Product created successfully (Demo)', data: { _id: id, name: 'New Demo Product' } };
       }
       
       return { success: true, message: 'Demo Mode: Action simulated successfully', data: { _id: id } };
     };

     return Promise.reject({
        isMock: true,
        response: {
          data: getMockActionResponse(),
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