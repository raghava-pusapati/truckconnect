import React, { useState, useEffect } from 'react';
import { Driver, User } from '../types';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';
import { driverAPI } from '../api';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in and token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      return;
    }

    fetchDrivers();
  }, [activeTab]);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Fetching ${activeTab} drivers...`);
      let response;
      
      switch (activeTab) {
        case 'pending':
          response = await driverAPI.getPendingDrivers();
          break;
        case 'accepted':
          response = await driverAPI.getAcceptedDrivers();
          break;
        case 'rejected':
          response = await driverAPI.getRejectedDrivers();
          break;
      }
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      console.log(`Received ${activeTab} drivers:`, response);
      
      // Map MongoDB _id to id for frontend compatibility
      const driversData = response.map((driver: any) => ({
        ...driver,
        id: driver._id,
        mobile: driver.phone || driver.mobile // Map phone to mobile for frontend compatibility
      }));
      
      setDrivers(driversData);
    } catch (err: any) {
      console.error(`Error fetching ${activeTab} drivers:`, err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Redirect to login if token is invalid/expired
          setTimeout(() => onBack(), 3000);
        } else {
          setError(`Failed to load drivers: ${err.response.data?.msg || err.message}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('Server did not respond. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Failed to load drivers: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPendingDrivers = () => {
    return drivers.filter(driver => driver.status === 'pending');
  };

  const getAcceptedDrivers = () => {
    return drivers.filter(driver => driver.status === 'accepted');
  };

  const getRejectedDrivers = () => {
    return drivers.filter(driver => driver.status === 'rejected');
  };

  const handleAcceptDriver = async (driverId: string) => {
    try {
      await driverAPI.acceptDriver(driverId);
      // Update the local state
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === driverId 
            ? { ...driver, status: 'accepted' }
            : driver
        )
      );
      
      // Refresh the data to ensure it's up to date
      fetchDrivers();
    } catch (err) {
      console.error('Error accepting driver:', err);
      setError('Failed to accept driver. Please try again.');
    }
    setSelectedDriver(null);
  };

  const handleRejectDriver = async (driverId: string) => {
    if (!rejectionReason) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      await driverAPI.rejectDriver(driverId, rejectionReason);
      // Update the local state
      setDrivers(prevDrivers => 
        prevDrivers.map(driver => 
          driver.id === driverId 
            ? { ...driver, status: 'rejected', rejectionReason }
            : driver
        )
      );
      
      // Refresh the data to ensure it's up to date
      fetchDrivers();
    } catch (err) {
      console.error('Error rejecting driver:', err);
      setError('Failed to reject driver. Please try again.');
    }
    
    setRejectionReason('');
    setSelectedDriver(null);
  };

  const renderDriverDocuments = (driver: Driver) => {
    if (!driver.documents) {
      return (
        <div className="mt-4 p-4 bg-yellow-50 rounded-md">
          <p className="text-yellow-800">No documents uploaded yet</p>
        </div>
      );
    }

    // Helper function to get document URL
    const getDocumentUrl = (driverId: string, documentType: string): string => {
      // Base URL for document storage
      const baseUrl = 'https://truckconnect-backend.onrender.com/uploads/drivers';
      
      // Map document types to file extensions
      const extensions: Record<string, string> = {
        license: 'jpg',
        rc: 'jpg',
        fitness: 'jpg',
        insurance: 'pdf',
        medical: 'pdf',
        allIndiaPermit: 'pdf'
      };
      
      // Get extension for this document type
      const extension = extensions[documentType] || 'jpg';
      
      // Return formatted URL
      return `${baseUrl}/${driverId}/${documentType}.${extension}`;
    };

    console.log('Driver documents:', driver.documents);

    // Check if document URLs exist and if not, generate them
    const documentUrls = {
      license: driver.documents.license || getDocumentUrl(driver.id, 'license'),
      rc: driver.documents.rc || getDocumentUrl(driver.id, 'rc'),
      fitness: driver.documents.fitness || getDocumentUrl(driver.id, 'fitness'),
      insurance: driver.documents.insurance || getDocumentUrl(driver.id, 'insurance'),
      medical: driver.documents.medical || getDocumentUrl(driver.id, 'medical'),
      allIndiaPermit: driver.documents.allIndiaPermit || getDocumentUrl(driver.id, 'allIndiaPermit')
    };

    return (
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Driver's License</h4>
          <img 
            src={documentUrls.license} 
            alt="License" 
            className="w-full h-40 object-cover rounded-lg" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">RC Book</h4>
          <img 
            src={documentUrls.rc} 
            alt="RC Book" 
            className="w-full h-40 object-cover rounded-lg" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Fitness Certificate</h4>
          <img 
            src={documentUrls.fitness} 
            alt="Fitness Certificate" 
            className="w-full h-40 object-cover rounded-lg" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Insurance</h4>
          <img 
            src={documentUrls.insurance} 
            alt="Insurance" 
            className="w-full h-40 object-cover rounded-lg" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Certificate</h4>
          <img 
            src={documentUrls.medical} 
            alt="Medical Certificate" 
            className="w-full h-40 object-cover rounded-lg" 
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
        {(driver.documents.allIndiaPermit || true) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">All India Permit</h4>
            <img 
              src={documentUrls.allIndiaPermit} 
              alt="All India Permit" 
              className="w-full h-40 object-cover rounded-lg" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-amber-50">
      

      <div className="mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'pending'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <UserCheck className="h-5 w-5 mr-2" />
            Pending Drivers
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'accepted'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Accepted Drivers
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'rejected'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <XCircle className="h-5 w-5 mr-2" />
            Rejected Drivers
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'pending' && (
            <>
              {getPendingDrivers().length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-amber-200 text-center">
                  <p className="text-amber-800">No pending driver applications found.</p>
                </div>
              ) : (
                getPendingDrivers().map(driver => (
                  <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6 border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900">{driver.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-amber-800">
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
                          className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
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
                          className="w-full p-2 border border-amber-200 rounded-md"
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
                            className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {renderDriverDocuments(driver)}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'accepted' && (
            <>
              {getAcceptedDrivers().length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-amber-200 text-center">
                  <p className="text-amber-800">No accepted drivers found.</p>
                </div>
              ) : (
                getAcceptedDrivers().map(driver => (
                  <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6 border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900">{driver.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-amber-800">
                          <p>Email: {driver.email}</p>
                          <p>Mobile: {driver.mobile}</p>
                          <p>Lorry Type: {driver.lorryType}</p>
                          <p>Max Capacity: {driver.maxCapacity} tons</p>
                          <p>Address: {driver.address}</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-green-100 text-amber-800 rounded-md">
                        Accepted
                      </div>
                    </div>
                    {renderDriverDocuments(driver)}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'rejected' && (
            <>
              {getRejectedDrivers().length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-6 border border-amber-200 text-center">
                  <p className="text-amber-800">No rejected drivers found.</p>
                </div>
              ) : (
                getRejectedDrivers().map(driver => (
                  <div key={driver.id} className="bg-white rounded-lg shadow-lg p-6 border border-amber-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900">{driver.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-amber-800">
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
                    {renderDriverDocuments(driver)}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;