import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with timeout for slow connections
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000, // 30 seconds (handle Render cold starts)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shadowtalk_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏱️ Request timeout - server may be waking up');
      error.message = 'Server is taking longer than expected. Please try again.';
    }
    
    if (error.response?.status === 403 && error.response?.data?.suspended) {
      // User is suspended
      alert(`Your account has been suspended.\nReason: ${error.response.data.suspendedReason || 'Violation of community guidelines'}`);
      // Optionally redirect or show suspended page
    } else if (error.response?.status === 401) {
      // Token expired or invalid - clear local storage
      localStorage.removeItem('shadowtalk_token');
      localStorage.removeItem('shadowtalk_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
