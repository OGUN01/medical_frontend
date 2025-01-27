import axios from 'axios';

// Ensure the API URL always has a protocol
const getApiUrl = () => {
  const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If no protocol is present, add https:// for production or http:// for localhost
  return url.includes('localhost') ? `http://${url}` : `https://${url}`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject({ message: 'Network error. Please check your connection.' });
    }
    // Handle other errors
    return Promise.reject(error.response.data);
  }
);

export default api; 