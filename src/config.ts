// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://truckconnect-backend.onrender.com/api';

// Remove /api suffix for base URL without /api
export const API_URL = API_BASE_URL.replace('/api', '');


