import axios from 'axios';

// Ensure the API URL always has a protocol and is properly formatted
const getApiUrl = () => {
  const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Log the URL being used (for debugging)
  console.log('API URL:', url);
  
  try {
    // Try to create a URL object to validate the URL
    const urlObject = new URL(url);
    return urlObject.toString();
  } catch (error) {
    // If URL parsing fails, try to fix it
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const fixedUrl = url.includes('localhost') ? `http://${url}` : `https://${url}`;
      console.log('Fixed API URL:', fixedUrl);
      return fixedUrl;
    }
    return url;
  }
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout
  timeout: 10000,
  // Add retry logic
  retry: 3,
  retryDelay: 1000
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
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
          await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          console.log('Retrying request...');
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

export default api; 