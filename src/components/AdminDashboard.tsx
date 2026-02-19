import React, { useState, useEffect } from 'react';
import { Driver, User } from '../types';
import { ArrowLeft, CheckCircle, XCircle, UserCheck, UserX, BarChart3 } from 'lucide-react';
import { driverAPI } from '../api';
import AdminAnalytics from './AdminAnalytics';
import { useTranslation } from 'react-i18next';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected' | 'analytics'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in and token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      return;
    }

    // Only fetch drivers if not on analytics tab
    if (activeTab !== 'analytics') {
      fetchDrivers();
    }
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

    console.log('Driver documents:', driver.documents);

    // Helper function to get document URL - handles both old and new format
    const getDocumentUrl = (doc: any): string | null => {
      if (!doc) return null;
      // New format: { url: "..." }
      if (typeof doc === 'object' && doc.url) return doc.url;
      // Old format: just a string URL
      if (typeof doc === 'string') return doc;
      return null;
    };

    const documentUrls = {
      license: getDocumentUrl(driver.documents.license),
      rc: getDocumentUrl(driver.documents.rc),
      fitness: getDocumentUrl(driver.documents.fitness),
      insurance: getDocumentUrl(driver.documents.insurance),
      medical: getDocumentUrl(driver.documents.medical),
      allIndiaPermit: getDocumentUrl(driver.documents.allIndiaPermit)
    };

    const renderDocument = (url: string | null, label: string) => {
      if (!url) {
        return (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
            <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Not uploaded</p>
            </div>
          </div>
        );
      }

      return (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{label}</h4>
          <img 
            src={url} 
            alt={label} 
            className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setSelectedImage(url)}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Document+Unavailable';
            }}
          />
        </div>
      );
    };

    return (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {renderDocument(documentUrls.license, "Driver's License")}
        {renderDocument(documentUrls.rc, "RC Book")}
        {renderDocument(documentUrls.fitness, "Fitness Certificate")}
        {renderDocument(documentUrls.insurance, "Insurance")}
        {renderDocument(documentUrls.medical, "Medical Certificate")}
        {renderDocument(documentUrls.allIndiaPermit, "All India Permit")}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-amber-50 min-h-screen">
      

      <div className="mb-4 sm:mb-8">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('admin.pendingDrivers')}
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'accepted'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('admin.acceptedDrivers')}
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'rejected'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('admin.rejectedDrivers')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('admin.analytics')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-3 sm:p-4 rounded-md mb-4 sm:mb-6 border border-red-200 text-sm sm:text-base">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'pending' && (
            <>
              {getPendingDrivers().length === 0 ? (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-amber-200 text-center">
                  <p className="text-amber-800">{t('messages.noDriversFound')}</p>
                </div>
              ) : (
                getPendingDrivers().map(driver => (
                  <div key={driver.id} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-amber-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-amber-900">{driver.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm text-amber-800">
                          <p className="break-words">Email: {driver.email}</p>
                          <p>Mobile: {driver.mobile}</p>
                          <p>Lorry Type: {driver.lorryType}</p>
                          <p>Max Capacity: {driver.maxCapacity} tons</p>
                          <p className="sm:col-span-2 break-words">Address: {driver.address}</p>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleAcceptDriver(driver.id)}
                          className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
                        >
                          {t('admin.accept')}
                        </button>
                        <button
                          onClick={() => setSelectedDriver(driver.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          {t('admin.reject')}
                        </button>
                      </div>
                    </div>

                    {selectedDriver === driver.id && (
                      <div className="mt-4">
                        <textarea
                          placeholder={t('admin.rejectionReason')}
                          className="w-full p-2 border border-amber-200 rounded-md"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => handleRejectDriver(driver.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            {t('admin.reject')}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(null);
                              setRejectionReason('');
                            }}
                            className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
                          >
                            {t('common.cancel')}
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
          
          {activeTab === 'analytics' && (
            <AdminAnalytics />
          )}
        </div>
      )}

      {/* Full-size image modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Full size document" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

