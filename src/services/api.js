import axios from 'axios';

// Cache for resolved IP addresses
let resolvedIpCache = null;
let lastResolvedTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Production API URL (fallback)
const PRODUCTION_API_URL = 'https://medicalbackend-production-770c.up.railway.app';

// Function to resolve domain using DNS-over-HTTPS
async function resolveDomain(domain) {
  try {
    // Only resolve if cache is expired or empty
    if (!resolvedIpCache || Date.now() - lastResolvedTimestamp > CACHE_DURATION) {
      const response = await fetch(`https://1.1.1.1/dns-query?name=${domain}`, {
        headers: {
          'accept': 'application/dns-json'
        }
      });
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        resolvedIpCache = data.Answer[0].data;
        lastResolvedTimestamp = Date.now();
      }
    }
    return resolvedIpCache;
  } catch (error) {
    console.error('DNS resolution failed:', error);
    return null;
  }
}

// Get the base URL with proper environment handling
const getBaseUrl = () => {
  // Use environment variable if available, otherwise fallback to production/local based on environment
  const url = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : 'http://localhost:5000');
  
  // Log for debugging
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', url);
  
  return url;
};

// Create the API instance with proper configuration
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000,
  retry: 3,
  retryDelay: 1000
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Making request to:', config.url, 'with baseURL:', config.baseURL);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    // Log errors (with more detail in development)
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        url: config?.url,
        baseURL: config?.baseURL,
        method: config?.method,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    } else {
      console.error('API Error:', error.message);
    }

    // Handle network errors with retry logic
    if (!error.response) {
      if (config && config.retry > 0) {
        config.retry -= 1;
        try {
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          if (process.env.NODE_ENV !== 'production') {
            console.log('Retrying request to:', config.url);
          }
          return await api(config);
        } catch (retryError) {
          console.error('Retry failed:', retryError.message);
        }
      }
      return Promise.reject({ 
        message: 'Network error. Please check your connection and try again.',
        details: error.message 
      });
    }

    // Handle other errors
    return Promise.reject(error.response.data);
  }
);

export default api; 