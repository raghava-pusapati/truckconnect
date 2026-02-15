import axios from 'axios';
import { User, Driver } from '../types';
import { API_BASE_URL, API_URL } from '../config';

// Configure axios with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    // Only set Content-Type to JSON if it's not already set (e.g., for FormData)
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  // Driver-specific authentication
  driverLogin: async (email: string, password: string) => {
    const response = await api.post('/auth/driver/login', { email, password });
    return response.data;
  },
  driverRegister: async (formData: FormData) => {
    // For FormData, we need to let the browser set Content-Type with boundary
    // So we create a custom config without Content-Type
    const response = await axios.post(
      `${API_BASE_URL}/auth/driver/register`, 
      formData,
      {
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          // Don't set Content-Type - let browser set it with boundary
        }
      }
    );
    return response.data;
  }
};

// Driver API calls
export const driverAPI = {
  getPendingDrivers: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log('Fetching pending drivers...');
      const response = await fetch(`${API_BASE_URL}/admin/drivers/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getPendingDrivers:', error);
      throw error;
    }
  },
  
  getAcceptedDrivers: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log('Fetching accepted drivers...');
      const response = await fetch(`${API_BASE_URL}/admin/drivers/accepted`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getAcceptedDrivers:', error);
      throw error;
    }
  },
  
  getRejectedDrivers: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log('Fetching rejected drivers...');
      const response = await fetch(`${API_BASE_URL}/admin/drivers/rejected`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getRejectedDrivers:', error);
      throw error;
    }
  },
  
  acceptDriver: async (driverId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log(`Accepting driver ${driverId}...`);
      const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in acceptDriver:', error);
      throw error;
    }
  },
  
  rejectDriver: async (driverId: string, rejectionReason: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log(`Rejecting driver ${driverId} with reason: ${rejectionReason}`);
      const response = await fetch(`${API_BASE_URL}/admin/drivers/${driverId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ rejectionReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in rejectDriver:', error);
      throw error;
    }
  },
  
  getAllDrivers: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log('Fetching all drivers...');
      const response = await fetch(`${API_BASE_URL}/admin/drivers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getAllDrivers:', error);
      throw error;
    }
  },
};

// Customer API calls
export const customerAPI = {
  getLoads: async () => {
    const response = await api.get('/customer/loads');
    return response.data;
  },
  createLoad: async (loadData: any) => {
    const response = await api.post('/customer/loads', loadData);
    return response.data;
  },
};

// Load API
export const loadAPI = {
  createLoad: async (loadData: {
    source: string;
    destination: string;
    loadType: string;
    quantity: number;
    estimatedFare: number;
  }) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(loadData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to create load');
    }

    return await response.json();
  },

  getMyLoads: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to fetch loads');
    }

    return await response.json();
  },

  completeLoad: async (loadId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads/${loadId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({ status: 'completed' })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to complete load');
    }

    return await response.json();
  },
  
  // New function to get available loads for drivers
  getAvailableLoads: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    // Try both endpoints - first the driver-specific endpoint, then fall back to the loads endpoint
    try {
      console.log('Trying driver endpoint for available loads');
      const response = await fetch(`${API_BASE_URL}/driver/loads`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Driver endpoint failed:', errorData);
        throw new Error(errorData.msg || 'Failed to fetch from driver endpoint');
      }

      const data = await response.json();
      console.log('Successfully fetched from driver endpoint:', data.length, 'loads');
      return data;
    } catch (driverEndpointError) {
      console.log('Falling back to loads endpoint');
      // Fall back to the loads/available endpoint
      const response = await fetch(`${API_BASE_URL}/loads/available`, {
        headers: {
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to fetch available loads');
      }

      const data = await response.json();
      console.log('Successfully fetched from loads endpoint:', data.length, 'loads');
      return data;
    }
  },

  // New function for drivers to apply for a load
  applyForLoad: async (loadId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads/${loadId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to apply for load');
    }

    return await response.json();
  },

  // New function for customers to assign a load to a driver
  assignLoad: async (loadId: string, driverId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads/${loadId}/assign/${driverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to assign load');
    }

    return await response.json();
  },

  // New function for drivers to get their assigned loads
  getAssignedLoads: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads/assigned`, {
      headers: {
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to fetch assigned loads');
    }

    return await response.json();
  },

  // Get applicants for a specific load
  getLoadApplicants: async (loadId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log(`Fetching applicants for load ${loadId}`);
      const response = await fetch(`${API_BASE_URL}/loads/${loadId}/applicants`, {
        headers: {
          'x-auth-token': token
        }
      });

      // Check if response is not OK
      if (!response.ok) {
        // Try to parse as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          throw new Error(errorData.msg || `Failed to fetch load applicants: ${response.status} ${response.statusText}`);
        } else {
          // If not JSON, it might be HTML or other error format
          console.error(`Non-JSON error response (${contentType}): ${response.status} ${response.statusText}`);
          // Return an empty array instead of throwing an error
          return [];
        }
      }

      // Try to parse JSON response safely
      try {
        const text = await response.text();
        // Check if response looks like HTML
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
          // Return empty array for HTML responses
          return [];
        }
        
        const data = JSON.parse(text);
        console.log(`Received ${data.length} applicants for load ${loadId}`);
        
        // For each applicant, try to fetch their documents if not already included
        const applicantsWithDocuments = await Promise.all(data.map(async (applicant: any) => {
          // If the applicant already has documents, return as is
          if (applicant.documents) {
            return applicant;
          }
          
          try {
            // Try to fetch driver details including documents
            console.log(`Fetching documents for driver ${applicant.driverId}`);
            const driverResponse = await fetch(`${API_BASE_URL}/drivers/${applicant.driverId}`, {
              headers: {
                'x-auth-token': token
              }
            });
            
            if (driverResponse.ok) {
              const driverData = await driverResponse.json();
              // Merge driver data with applicant data
              return {
                ...applicant,
                documents: driverData.documents || {}
              };
            }
          } catch (docError) {
            console.error(`Error fetching documents for driver ${applicant.driverId}:`, docError);
          }
          
          // Return original applicant if can't fetch documents
          return applicant;
        }));
        
        return applicantsWithDocuments;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // Return empty array for parse errors
        return [];
      }
    } catch (error) {
      console.error('Error in getLoadApplicants:', error);
      // Return empty array instead of throwing to avoid breaking the UI
      return [];
    }
  },

  // Assign a load to a specific driver
  assignLoadToDriver: async (loadId: string, driverId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_BASE_URL}/loads/${loadId}/assign/${driverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to assign load to driver');
    }

    return await response.json();
  },

  // Delete a load
  deleteLoad: async (loadId: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    try {
      console.log(`Attempting to cancel load ${loadId}`);
      
      // Now the backend supports 'cancelled' status
      const response = await fetch(`${API_BASE_URL}/loads/${loadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ 
          status: 'cancelled'  
        })
      });

      // Check if response is OK
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.msg || `Failed to cancel load: ${response.status} ${response.statusText}`);
        } else {
          throw new Error(`Failed to cancel load: ${response.status} ${response.statusText}`);
        }
      }

      // Try to return JSON response, but also handle non-JSON responses
      try {
        return await response.json();
      } catch (parseError) {
        // If not JSON, just return a success message
        return { msg: 'Load cancelled successfully' };
      }
    } catch (error) {
      console.error(`Error cancelling load ${loadId}:`, error);
      throw error;
    }
  },
};

export default api; 


// Notification API calls
export const notificationAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
  deleteAll: async () => {
    const response = await api.delete('/notifications');
    return response.data;
  }
};

// Profile API calls
export const profileAPI = {
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },
  updateProfile: async (data: any, role: string) => {
    const endpoint = role === 'driver' ? '/profile/driver' : '/profile/user';
    const response = await api.put(endpoint, data);
    return response.data;
  },
  uploadProfilePicture: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await axios.post(
      `${API_BASE_URL}/profile/upload-picture`,
      formData,
      {
        headers: {
          'x-auth-token': token
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        }
      }
    );
    return response.data;
  },
  getMyRatings: async () => {
    const response = await api.get('/profile/my-ratings');
    return response.data;
  },
  getRatingBreakdown: async () => {
    const response = await api.get('/profile/rating-breakdown');
    return response.data;
  }
};






