import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import CustomerAuth from './components/CustomerAuth';
import DriverAuth from './components/DriverAuth';
import AdminAuth from './components/AdminAuth';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard';
import { User } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setSelectedRole(null);
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <nav className="bg-amber-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => {
                if (!currentUser) {
                  window.location.href = '/';
                }
              }}
            >
              <Truck className="h-8 w-8 text-amber-950" />
              <span className="ml-2 text-2xl font-bold text-amber-950">Truck Connect</span>
            </div>
            {currentUser && (
              <div className="flex items-center">
                <span className="mr-4">Welcome, {currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-amber-950 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
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
