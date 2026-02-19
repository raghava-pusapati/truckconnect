import React, { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CustomerAuth from './components/CustomerAuth';
import DriverAuth from './components/DriverAuth';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard';
import ForgotPassword from './components/ForgotPassword';
import LanguageSelector from './components/LanguageSelector';
import NotificationBell from './components/NotificationBell';
import ToastProvider from './components/ToastProvider';
import { User } from './types';
import { profileAPI } from './api';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Auto-login on page load if token exists
  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verify token is still valid by fetching profile
          const profile = await profileAPI.getProfile();
          const user = JSON.parse(savedUser);
          setCurrentUser({ ...user, ...profile });
          
          // Navigate to appropriate dashboard based on role
          if (window.location.pathname === '/' || window.location.pathname === '/login' || window.location.pathname === '/driver-login' || window.location.pathname === '/admin') {
            if (user.role === 'admin') {
              navigate('/admin-dashboard');
            } else if (user.role === 'driver') {
              navigate('/driver-dashboard');
            } else {
              navigate('/customer-dashboard');
            }
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
          // Token is invalid, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    autoLogin();
  }, [navigate]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setSelectedRole(null);
    navigate('/');
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-950 mx-auto mb-4"></div>
          <p className="text-amber-900 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <ToastProvider />
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div 
              className="flex items-center cursor-pointer flex-shrink-0" 
              onClick={() => {
                if (!currentUser) {
                  window.location.href = '/';
                }
              }}
            >
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-amber-950" />
              <span className="ml-1 sm:ml-2 text-lg sm:text-2xl font-extrabold tracking-tight text-amber-950 truncate">Truck Connect</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <LanguageSelector />
              {currentUser && (
                <>
                  <NotificationBell />
                  <span className="hidden md:inline text-amber-900 truncate max-w-[120px]">Welcome, {currentUser.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-amber-950 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-sm sm:text-base shadow hover:bg-orange-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <Routes>
        <Route 
          path="/" 
          element={<LandingPage onRoleSelect={handleRoleSelect} />} 
        />
        <Route 
          path="/login" 
          element={
            <CustomerAuth 
              onSuccess={handleAuthSuccess} 
              onBack={() => window.history.back()} 
            />
          } 
        />
        <Route 
          path="/driver-login" 
          element={
            <DriverAuth 
              onSuccess={handleAuthSuccess} 
              onBack={() => window.history.back()} 
            />
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminAuth 
              onSuccess={handleAuthSuccess} 
              onBack={() => window.history.back()} 
            />
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <ForgotPassword 
              userType="customer"
              onBack={() => window.history.back()} 
            />
          } 
        />
        <Route 
          path="/customer-dashboard" 
          element={
            currentUser ? (
              <CustomerDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onBack={() => window.history.back()} 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/driver-dashboard" 
          element={
            currentUser ? (
              <DriverDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onBack={() => window.history.back()} 
              />
            ) : (
              <Navigate to="/driver-login" replace />
            )
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            currentUser && currentUser.role === 'admin' ? (
              <AdminDashboard 
                currentUser={currentUser} 
                onLogout={handleLogout} 
                onBack={() => window.history.back()} 
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
}

export default App;


