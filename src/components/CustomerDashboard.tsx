import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { Load, Driver } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface CustomerDashboardProps {
  onLogout: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'post' | 'view'>('post');
  const currentUser = storage.getCurrentUser();
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    estimatedFare: '',
    loadType: '',
    quantity: ''
  });

  const handleBack = () => {
    window.history.back();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLoad: Load = {
      id: Date.now().toString(),
      customerId: currentUser.id,
      source: formData.source,
      destination: formData.destination,
      estimatedFare: parseFloat(formData.estimatedFare),
      loadType: formData.loadType,
      quantity: parseFloat(formData.quantity),
      status: 'pending',
      applicants: [],
      createdAt: new Date().toISOString()
    };

    storage.saveLoad(newLoad);
    setFormData({
      source: '',
      destination: '',
      estimatedFare: '',
      loadType: '',
      quantity: ''
    });
    alert('Load posted successfully!');
  };

  const getMyLoads = () => {
    return storage.getLoads().filter(load => load.customerId === currentUser.id);
  };

  const getDriverDetails = (driverId: string): Driver | undefined => {
    const users = storage.getUsers();
    return users.find(user => user.id === driverId && user.role === 'driver') as Driver | undefined;
  };

  const assignDriver = (load: Load, driverId: string) => {
    const updatedLoad = {
      ...load,
      assignedDriver: driverId,
      status: 'assigned' as const
    };
    storage.updateLoad(updatedLoad);
    alert('Driver assigned successfully!');
  };

  const completeLoad = (load: Load) => {
    storage.completeLoad(load.id);
    alert('Load marked as completed!');
  };

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

      <div className="mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('post')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'post'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            Post a Load
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'view'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            View My Loads
          </button>
        </div>
      </div>

      {activeTab === 'post' ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Post a Load</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Source Location</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Destination Location</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Fare (₹)</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.estimatedFare}
                  onChange={(e) => setFormData({ ...formData, estimatedFare: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Load Type</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.loadType}
                  onChange={(e) => setFormData({ ...formData, loadType: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity (tons)</label>
                <input
                  type="number"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Post Load
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {getMyLoads().map(load => (
            <div key={load.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {load.source} → {load.destination}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <p>Load Type: {load.loadType}</p>
                    <p>Quantity: {load.quantity} tons</p>
                    <p>Estimated Fare: ₹{load.estimatedFare}</p>
                    <p>Status: {load.status}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(load.createdAt).toLocaleDateString()}
                </div>
              </div>

              {load.status === 'pending' && load.applicants.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4">Available Drivers</h4>
                  <div className="space-y-4">
                    {load.applicants.map(driverId => {
                      const driver = getDriverDetails(driverId);
                      if (!driver || driver.status !== 'accepted') return null;

                      return (
                        <div key={driverId} className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <p className="text-sm text-gray-600">{driver.lorryType} - {driver.maxCapacity} tons capacity</p>
                          </div>
                          <button
                            onClick={() => assignDriver(load, driverId)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                          >
                            Select Driver
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {load.status === 'assigned' && (
                <div className="mt-6">
                  <div className="bg-green-50 p-4 rounded-md">
                    <h4 className="text-lg font-semibold text-green-800 mb-2">Assigned Driver</h4>
                    {(() => {
                      const driver = getDriverDetails(load.assignedDriver!);
                      if (!driver) return null;

                      return (
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-600">Contact: {driver.mobile}</p>
                          <p className="text-sm text-gray-600">{driver.lorryType} - {driver.maxCapacity} tons capacity</p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => completeLoad(load)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Mark as Completed
                    </button>
                  </div>
                </div>
              )}

              {load.status === 'completed' && (
                <div className="mt-6 bg-blue-50 p-4 rounded-md">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">Delivery Completed</h4>
                  <p className="text-sm text-blue-600">
                    Completed on: {new Date(load.completedAt!).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;