import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { Load, Customer } from '../types';
import { ArrowLeft } from 'lucide-react';

interface DriverDashboardProps {
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ onLogout }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    source: '',
    destination: ''
  });
  const currentUser = storage.getCurrentUser();

  const handleBack = () => {
    window.history.back();
  };

  const hasAssignedLoad = () => {
    return storage.getLoads().some(load => 
      load.assignedDriver === currentUser.id && load.status === 'assigned'
    );
  };

  const getAvailableLoads = () => {
    return storage.getLoads().filter(load => {
      if (load.status !== 'pending') return false;
      
      const sourceMatch = !searchCriteria.source || 
        load.source.toLowerCase().includes(searchCriteria.source.toLowerCase());
      const destMatch = !searchCriteria.destination || 
        load.destination.toLowerCase().includes(searchCriteria.destination.toLowerCase());
      
      // Check if load quantity exceeds driver's capacity
      if (load.quantity > currentUser.maxCapacity) return false;
      
      return sourceMatch && destMatch;
    });
  };

  const getAppliedLoads = () => {
    return storage.getLoads().filter(load => 
      load.applicants.includes(currentUser.id) || load.assignedDriver === currentUser.id
    );
  };

  const getCustomerDetails = (customerId: string): Customer | undefined => {
    const users = storage.getUsers();
    return users.find(user => user.id === customerId && user.role === 'customer') as Customer | undefined;
  };

  const applyForLoad = (load: Load) => {
    if (hasAssignedLoad()) {
      alert('You have already been assigned a load. Complete it before applying for another.');
      return;
    }

    if (load.quantity > currentUser.maxCapacity) {
      alert('Your vehicle cannot handle this load. Please apply for a smaller load.');
      return;
    }

    if (!load.applicants.includes(currentUser.id)) {
      const updatedLoad = {
        ...load,
        applicants: [...load.applicants, currentUser.id]
      };
      storage.updateLoad(updatedLoad);
      alert('Applied successfully!');
    }
  };

  // Check if driver is rejected
  if (currentUser.status === 'rejected') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Rejected</h2>
          <p className="text-gray-700 mb-4">
            Your application has been rejected. Please contact support.
          </p>
          <p className="text-gray-600 mb-6">
            Reason: {currentUser.rejectionReason}
          </p>
          <button
            onClick={onLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Check if driver is pending approval
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">Application Pending</h2>
          <p className="text-gray-700 mb-4">
            Your application is currently under review. Please check back later.
          </p>
          <button
            onClick={onLogout}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Search for Loads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Source Location</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={searchCriteria.source}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, source: e.target.value })}
              placeholder="Enter source location"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination Location</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              value={searchCriteria.destination}
              onChange={(e) => setSearchCriteria({ ...searchCriteria, destination: e.target.value })}
              placeholder="Enter destination location"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Available Loads</h3>
          <div className="space-y-4">
            {getAvailableLoads().map(load => (
              <div key={load.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      {load.source} → {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p>Load Type: {load.loadType}</p>
                      <p>Quantity: {load.quantity} tons</p>
                      <p>Estimated Fare: ₹{load.estimatedFare}</p>
                      <p>Posted: {new Date(load.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => applyForLoad(load)}
                    disabled={load.applicants.includes(currentUser.id) || hasAssignedLoad()}
                    className={`px-4 py-2 rounded-md ${
                      load.applicants.includes(currentUser.id) || hasAssignedLoad()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {load.applicants.includes(currentUser.id) ? 'Applied' : hasAssignedLoad() ? 'Complete Current Load' : 'Apply'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Applied Loads</h3>
          <div className="space-y-4">
            {getAppliedLoads().map(load => (
              <div key={load.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      {load.source} → {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p>Load Type: {load.loadType}</p>
                      <p>Quantity: {load.quantity} tons</p>
                      <p>Estimated Fare: ₹{load.estimatedFare}</p>
                      <p>Status: {
                        load.assignedDriver === currentUser.id 
                          ? 'Assigned to you'
                          : 'Application pending'
                      }</p>
                    </div>
                    {load.assignedDriver === currentUser.id && (
                      <div className="mt-4 p-4 bg-green-50 rounded-md">
                        <h5 className="font-medium text-green-800 mb-2">Customer Details</h5>
                        {(() => {
                          const customer = getCustomerDetails(load.customerId);
                          if (!customer) return null;
                          return (
                            <div className="text-sm text-green-700">
                              <p>Name: {customer.name}</p>
                              <p>Contact: {customer.mobile}</p>
                              <p>Email: {customer.email}</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-md ${
                    load.assignedDriver === currentUser.id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {load.assignedDriver === currentUser.id ? 'Assigned' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;