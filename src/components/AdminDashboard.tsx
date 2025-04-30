import React, { useState } from 'react';
import { storage } from '../utils/storage';
import { Driver } from '../types';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const handleBack = () => {
    window.history.back();
  };

  const getPendingDrivers = () => {
    return storage.getUsers().filter(
      (user): user is Driver => user.role === 'driver' && user.status === 'pending'
    );
  };

  const getAcceptedDrivers = () => {
    return storage.getUsers().filter(
      (user): user is Driver => user.role === 'driver' && user.status === 'accepted'
    );
  };

  const getRejectedDrivers = () => {
    return storage.getUsers().filter(
      (user): user is Driver => user.role === 'driver' && user.status === 'rejected'
    );
  };

  const handleAcceptDriver = (driverId: string) => {
    storage.updateDriverStatus(driverId, 'accepted');
    setSelectedDriver(null);
  };

  const handleRejectDriver = (driverId: string) => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    storage.updateDriverStatus(driverId, 'rejected', rejectionReason);
    setRejectionReason('');
    setSelectedDriver(null);
  };

  const renderDriverDocuments = (driver: Driver) => (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Driver's License</h4>
        <img src={driver.documents.license} alt="License" className="w-full h-40 object-cover rounded-lg" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">RC Book</h4>
        <img src={driver.documents.rc} alt="RC Book" className="w-full h-40 object-cover rounded-lg" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Fitness Certificate</h4>
        <img src={driver.documents.fitness} alt="Fitness Certificate" className="w-full h-40 object-cover rounded-lg" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Insurance</h4>
        <img src={driver.documents.insurance} alt="Insurance" className="w-full h-40 object-cover rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
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
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            <UserCheck className="h-5 w-5 mr-2" />
            Pending Drivers
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'accepted'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Accepted Drivers
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'rejected'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            <XCircle className="h-5 w-5 mr-2" />
            Rejected Drivers
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'pending' && (
          <>
            {getPendingDrivers().map(driver => (
              <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{driver.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p>Email: {driver.email}</p>
                      <p>Mobile: {driver.mobile}</p>
                      <p>Lorry Type: {driver.lorryType}</p>
                      <p>Max Capacity: {driver.maxCapacity} tons</p>
                      <p>Address: {driver.address}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleAcceptDriver(driver.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setSelectedDriver(driver.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {selectedDriver === driver.id && (
                  <div className="mt-4">
                    <textarea
                      placeholder="Enter reason for rejection"
                      className="w-full p-2 border rounded-md"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => handleRejectDriver(driver.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDriver(null);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {renderDriverDocuments(driver)}
              </div>
            ))}
          </>
        )}

        {activeTab === 'accepted' && (
          <>
            {getAcceptedDrivers().map(driver => (
              <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{driver.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p>Email: {driver.email}</p>
                      <p>Mobile: {driver.mobile}</p>
                      <p>Lorry Type: {driver.lorryType}</p>
                      <p>Max Capacity: {driver.maxCapacity} tons</p>
                      <p>Address: {driver.address}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
                    Accepted
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            {getRejectedDrivers().map(driver => (
              <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{driver.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <p>Email: {driver.email}</p>
                      <p>Mobile: {driver.mobile}</p>
                      <p>Lorry Type: {driver.lorryType}</p>
                      <p>Max Capacity: {driver.maxCapacity} tons</p>
                      <p>Address: {driver.address}</p>
                    </div>
                    <div className="mt-4 p-4 bg-red-50 rounded-md">
                      <p className="text-red-800 font-medium">Rejection Reason:</p>
                      <p className="text-red-600">{driver.rejectionReason}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-red-100 text-red-800 rounded-md">
                    Rejected
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;