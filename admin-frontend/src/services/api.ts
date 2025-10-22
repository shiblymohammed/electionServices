import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('admin_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear auth data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden - insufficient permissions
      if (status === 403) {
        console.error('Access denied: Insufficient permissions');
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        console.error('Resource not found');
      }
      
      // Handle 500 Internal Server Error
      if (status >= 500) {
        console.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      console.error('An unexpected error occurred:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
