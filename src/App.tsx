import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import LandingPage from './components/LandingPage';
import CustomerAuth from './components/CustomerAuth';
import DriverAuth from './components/DriverAuth';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';
import DriverDashboard from './components/DriverDashboard';
import { storage } from './utils/storage';


function App() {
  const [currentView, setCurrentView] = useState('landing');
  const currentUser = storage.getCurrentUser();

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentView('landing');
  };

  const renderView = () => {
    if (currentUser) {
      if (currentUser.role === 'customer') {
        return <CustomerDashboard onLogout={handleLogout} />;
      } else if (currentUser.role === 'driver') {
        return <DriverDashboard onLogout={handleLogout} />;
      } else if (currentUser.role === 'admin') {
        return <AdminDashboard onLogout={handleLogout} />;
      }
    }

    switch (currentView) {
      case 'customer':
        return <CustomerAuth onSuccess={() => setCurrentView('landing')} />;
      case 'driver':
        return <DriverAuth onSuccess={() => setCurrentView('landing')} />;
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} />; 
      default:
        return <LandingPage onRoleSelect={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('landing')}>
              <Truck className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-2xl font-bold text-gray-800">Truck Connect</span>
            </div>
            {currentUser && (
              <div className="flex items-center">
                <span className="mr-4">Welcome, {currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {renderView()}
    </div>
  );
}

export default App;
