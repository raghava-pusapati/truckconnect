import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

// Add validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile: string): boolean => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { isValid: true, message: '' };
};

interface CustomerAuthProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const CustomerAuth: React.FC<CustomerAuthProps> = ({ onSuccess, onBack }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate mobile number for registration
    if (!isLogin && !validateMobile(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
  
    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }
  
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login API call
        const response = await axios.post('https://truckconnect-backend.onrender.com/api/auth/login', {
          email: formData.email,
          password: formData.password
        });

        if (response.data && response.data.user) {
          // Store token and user data in localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Call onSuccess with the user data
          onSuccess(response.data.user);
          
          // Navigate to customer dashboard
          navigate('/customer-dashboard', { replace: true });
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // Registration API call
        const response = await axios.post('https://truckconnect-backend.onrender.com/api/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.mobile,
          role: 'customer'
        });

        if (response.data) {
          // Clear form
          setFormData({
            name: '',
            mobile: '',
            email: '',
            password: ''
          });
          // Show success message and switch to login
          alert('Registration successful! Please login.');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('This email is already registered. Please login or use a different email.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.msg || 'Please fill all fields correctly');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(error.response?.data?.msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center text-amber-800 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-amber-100 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-amber-950 mb-8 tracking-tight">
              {isLogin ? 'Customer Login' : 'Customer Registration'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-amber-900">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-amber-900">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-amber-900">Mobile Number</label>
                <input
                  type="tel"
                  required
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-amber-900">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-600/90 hover:to-amber-600/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                    {isLogin ? 'Logging in...' : 'Registering...'}
                  </div>
                ) : (
                  isLogin ? 'Login' : 'Register'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({
                  name: '',
                  mobile: '',
                  email: '',
                  password: ''
                });
              }}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;