import axios from 'axios';

// Cache for resolved IP addresses
let resolvedIpCache = null;
let lastResolvedTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Production API URL as fallback
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

// Ensure the API URL always has a protocol and is properly formatted
const getApiUrl = async () => {
  // Use environment variable, production URL, or localhost as fallback
  const url = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : 'http://localhost:5000');
  
  // Log the URL being used (for debugging)
  console.log('API URL:', url, 'Environment:', process.env.NODE_ENV);
  
  try {
    // Try to create a URL object to validate the URL
    const urlObject = new URL(url);
    
    // Only attempt DNS resolution for non-localhost URLs
    if (!url.includes('localhost')) {
      const resolvedIp = await resolveDomain(urlObject.hostname);
      if (resolvedIp) {
        // Replace hostname with IP but keep the path and protocol
        const ipBasedUrl = url.replace(urlObject.hostname, resolvedIp);
        console.log('Using IP-based URL:', ipBasedUrl);
        return ipBasedUrl;
      }
    }
    
    return urlObject.toString();
  } catch (error) {
    console.error('URL parsing error:', error);
    // If URL parsing fails, try to fix it
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const fixedUrl = url.includes('localhost') ? `http://${url}` : `https://${url}`;
      console.log('Fixed API URL:', fixedUrl);
      return fixedUrl;
    }
    return url;
  }
};

// Initialize API with base configuration
const initializeApi = async () => {
  const baseURL = await getApiUrl();
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000,
    retry: 3,
    retryDelay: 1000
  });
};

// Create a temporary API instance for use until initialization is complete
let api = axios.create({
  baseURL: PRODUCTION_API_URL, // Use production URL as initial fallback
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Initialize the real API instance
initializeApi().then(initializedApi => {
  api = initializedApi;
  
  // Add request interceptor for debugging
  api.interceptors.request.use(
    (config) => {
      console.log('Making request to:', config.url, 'with baseURL:', config.baseURL);
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
      
      // Log the full error for debugging
      console.error('API Error:', {
        url: config?.url,
        baseURL: config?.baseURL,
        method: config?.method,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Handle network errors
      if (!error.response) {
        // Check if we should retry the request
        if (config && config.retry > 0) {
          config.retry -= 1;
          try {
            // If DNS resolution failed, try to refresh the IP
            if (error.message.includes('ERR_NAME_NOT_RESOLVED') || error.message.includes('ERR_CONNECTION_REFUSED')) {
              const newBaseUrl = await getApiUrl();
              config.baseURL = newBaseUrl;
            }
            
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
            console.log('Retrying request with baseURL:', config.baseURL);
            return await api(config);
          } catch (retryError) {
            console.error('Retry failed:', retryError);
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
}).catch(error => {
  console.error('API initialization failed:', error);
});

export default api; 