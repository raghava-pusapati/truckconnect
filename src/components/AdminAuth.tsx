import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User } from '../types';

interface AdminAuthProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onSuccess, onBack }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Login API call
      const response = await axios.post('https://truckconnect-backend.onrender.com/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data && response.data.user) {
        // Check if the user is an admin
        if (response.data.user.role !== 'admin') {
          throw new Error('Access denied. Only administrators can access this area.');
        }
        
        // Store token and user data in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call onSuccess with the user data
        onSuccess(response.data.user);
        
        // Navigate to admin dashboard
        navigate('/admin-dashboard', { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.status === 403) {
        setError('Access denied. Only administrators can access this area.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Access Only
            </h2>
            <p className="text-gray-600 mb-6">
              This area is restricted to authorized administrators.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth; 