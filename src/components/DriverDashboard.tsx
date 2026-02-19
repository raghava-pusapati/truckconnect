import React, { useState, useEffect } from 'react';
import { Load, User } from '../types';
import { ArrowLeft, Truck, ClipboardList, CheckSquare, BarChart3, Star, User as UserIcon } from 'lucide-react';
import { loadAPI } from '../api';
import DriverAnalytics from './DriverAnalytics';
import RatingModal from './RatingModal';
import ProfileManagement from './ProfileManagement';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

interface DriverDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onBack: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ currentUser, onLogout, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'available' | 'applied' | 'completed' | 'analytics'>('available');
  const [searchCriteria, setSearchCriteria] = useState({
    source: '',
    destination: ''
  });
  const [availableLoads, setAvailableLoads] = useState<Load[]>([]);
  const [appliedLoads, setAppliedLoads] = useState<Load[]>([]);
  const [completedLoads, setCompletedLoads] = useState<Load[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedLoadIds, setAppliedLoadIds] = useState<Set<string>>(new Set());
  const [hasAssignedLoad, setHasAssignedLoad] = useState<boolean>(false);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingLoadId, setRatingLoadId] = useState<string>('');
  const [ratingCustomerId, setRatingCustomerId] = useState<string>('');
  const [ratingCustomerName, setRatingCustomerName] = useState<string>('');

  // Initial data loading
  useEffect(() => {
    // Load initial data
    fetchAllData();
  }, []);

  // Refresh available loads when tab changes to 'available'
  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableLoads();
    }
  }, [activeTab]);

  // Update the hasAssignedLoad function to set state
  useEffect(() => {
    // Check if the driver has an assigned load
    const assignedLoad = appliedLoads.some(load => load.status === 'assigned');
    setHasAssignedLoad(assignedLoad);
  }, [appliedLoads]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both available and assigned loads in parallel
      await Promise.all([
        fetchAvailableLoads(),
        fetchAssignedLoads()
      ]);
      
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableLoads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching available loads from API...');
      const loads = await loadAPI.getAvailableLoads();
      console.log('Raw API response:', loads);
      
      // Format the loads to match our frontend Load interface
      const formattedLoads = loads.map((load: any) => ({
        ...load,
        id: load._id || load.id
      }));
      
      // Check if any loads have the current driver in their applicants list
      if (currentUser && currentUser.id) {
        const newAppliedLoadIds = new Set(appliedLoadIds);
        
        formattedLoads.forEach((load: any) => {
          if (load.applicants && Array.isArray(load.applicants)) {
            // Check if the current driver is in the applicants list
            const hasApplied = load.applicants.some((applicant: any) => 
              applicant.driverId === currentUser.id ||
              (typeof applicant === 'string' && applicant === currentUser.id)
            );
            
            if (hasApplied) {
              newAppliedLoadIds.add(load.id);
            }
          }
        });
        
        // Update the applied load IDs if any new ones were found
        if (newAppliedLoadIds.size > appliedLoadIds.size) {
          setAppliedLoadIds(newAppliedLoadIds);
        }
      }
      
      console.log('Formatted loads:', formattedLoads);
      setAvailableLoads(formattedLoads);
      console.log('Fetched available loads:', formattedLoads.length);
      return formattedLoads;
    } catch (error: any) {
      console.error('Error fetching available loads:', error);
      setError('Failed to load available loads. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedLoads = async () => {
    try {
      setIsLoading(true);
      const loads = await loadAPI.getAssignedLoads();
      console.log('Assigned loads data from API:', loads);
      
      // Fetch customer details for each load
      const loadWithCustomerDetails = await Promise.all(
        loads.map(async (load: any) => {
          try {
            // Get customer details from User model
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');
            
            if (load.customerId) {
              // Extract customer information from the load
              return {
                ...load,
                id: load._id || load.id,
                customerDetails: {
                  id: load.customerId,
                  name: load.customerName || 'Customer',
                  phone: load.customerPhone || 'Not provided',
                  email: load.customerEmail || ''
                }
              };
            }
            return {
              ...load,
              id: load._id || load.id,
              customerDetails: {
                id: '',
                name: 'Customer',
                phone: 'Not provided',
                email: ''
              }
            };
          } catch (err) {
            console.error('Error fetching customer details:', err);
            return {
              ...load,
              id: load._id || load.id,
              customerDetails: {
                id: '',
                name: 'Customer',
                phone: 'Not provided',
                email: ''
              }
            };
          }
        })
      );
      
      // Split into active and completed loads
      const active = loadWithCustomerDetails.filter((load: Load) => load.status === 'assigned');
      const completed = loadWithCustomerDetails.filter((load: Load) => load.status === 'completed');
      
      console.log('Processed active loads:', active);
      console.log('Processed completed loads:', completed);
      
      setAppliedLoads(active);
      setCompletedLoads(completed);

      // Also fetch loads the driver has applied for but not yet been assigned
      try {
        const appliedResponse = await fetch(`${API_BASE_URL}/loads/applications`, {
          headers: {
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });
        
        if (appliedResponse.ok) {
          const appliedData = await appliedResponse.json();
          console.log('Applied loads data:', appliedData);
          
          // Update the set of load IDs the driver has applied for
          const newAppliedLoadIds = new Set<string>();
          appliedData.forEach((load: any) => {
            if (load._id) {
              newAppliedLoadIds.add(load._id);
            }
            if (load.id) {
              newAppliedLoadIds.add(load.id);
            }
          });
          
          setAppliedLoadIds(newAppliedLoadIds);
          console.log('Updated applied load IDs:', newAppliedLoadIds);
        }
      } catch (error) {
        console.error('Error fetching applied loads:', error);
        // Non-critical error, don't show to user
      }
      
      return { active, completed };
    } catch (error: any) {
      console.error('Error fetching assigned loads:', error);
      return { active: [], completed: [] };
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the driver has already applied for a specific load
  const hasAppliedForLoad = (loadId: string) => {
    return appliedLoadIds.has(loadId);
  };

  // Filter available loads based on search criteria
  const getFilteredLoads = () => {
    console.log('Filtering loads, total available:', availableLoads.length);
    if (!availableLoads || availableLoads.length === 0) {
      console.log('No loads available to filter');
      return [];
    }
    
    const filtered = availableLoads.filter(load => {
      // Only show pending loads
      if (load.status !== 'pending') {
        console.log(`Load ${load.id} filtered out: not pending (${load.status})`);
        return false;
      }
      
      // Apply source filter if provided
      const sourceMatch = !searchCriteria.source || 
        load.source.toLowerCase().includes(searchCriteria.source.toLowerCase());
      if (!sourceMatch) {
        console.log(`Load ${load.id} filtered out: source "${load.source}" doesn't match "${searchCriteria.source}"`);
      }
      
      // Apply destination filter if provided
      const destMatch = !searchCriteria.destination || 
        load.destination.toLowerCase().includes(searchCriteria.destination.toLowerCase());
      if (!destMatch) {
        console.log(`Load ${load.id} filtered out: destination "${load.destination}" doesn't match "${searchCriteria.destination}"`);
      }
      
      // Check if load quantity exceeds driver's capacity
      const capacityMatch = currentUser.role !== 'driver' || 
        load.quantity <= (currentUser as any).maxCapacity;
      if (!capacityMatch) {
        console.log(`Load ${load.id} filtered out: quantity ${load.quantity} exceeds driver capacity ${(currentUser as any).maxCapacity}`);
      }
      
      return sourceMatch && destMatch && capacityMatch;
    });
    
    console.log(`Filtered loads: ${filtered.length} remain after filtering`);
    return filtered;
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The getFilteredLoads function will automatically apply the filters
    // This is just to prevent form submission behavior
  };

  const applyForLoad = async (load: Load) => {
    if (hasAssignedLoad) {
      toast.error('You have already been assigned a load. Complete it before applying for another.');
      return;
    }

    if (currentUser.role === 'driver' && load.quantity > (currentUser as any).maxCapacity) {
      toast.error('Your vehicle cannot handle this load. Please apply for a smaller load.');
      return;
    }

    try {
      setIsLoading(true);
      await loadAPI.applyForLoad(load.id);
      
      // Add this load ID to the applied loads set
      setAppliedLoadIds(prev => new Set(prev).add(load.id));
      
      // Refresh the load lists
      fetchAvailableLoads();
      fetchAssignedLoads();
      
      toast.success('Applied successfully!');
    } catch (error: any) {
      console.error('Error applying for load:', error);
      toast.error(error.message || 'Failed to apply for load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeLoad = async (load: Load) => {
    try {
      setIsLoading(true);
      await loadAPI.completeLoad(load.id);
      
      // Refresh the load lists
      fetchAssignedLoads();
      
      toast.success('Load marked as completed!');
    } catch (error: any) {
      console.error('Error completing load:', error);
      toast.error(error.message || 'Failed to complete load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openRatingModal = (load: Load) => {
    if (load.customerDetails || load.customerId) {
      setRatingLoadId(load.id);
      setRatingCustomerId(load.customerDetails?.id || load.customerId || '');
      setRatingCustomerName(load.customerDetails?.name || load.customerName || 'Customer');
      setShowRatingModal(true);
    }
  };

  const handleRatingSuccess = async () => {
    setShowRatingModal(false);
    await fetchAssignedLoads(); // Refresh loads to update rating status
    toast.success(t('rating.ratingSuccess'));
  };

  // Check if driver is rejected
  if ((currentUser as any).status === 'rejected') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Application Rejected</h2>
          <p className="text-gray-700 mb-4">
            Your application has been rejected. Please contact support.
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
  if ((currentUser as any).status === 'pending') {
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-amber-50 min-h-screen">
      {/* Add a global notification banner when driver has an assigned load */}
      {hasAssignedLoad && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 sm:p-4 mb-4 sm:mb-6 rounded shadow text-sm sm:text-base">
          <div className="flex items-start sm:items-center">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold">You have an assigned load in progress</p>
              <p className="text-xs sm:text-sm">You cannot apply for new loads until your current assignment is completed by the customer.</p>
            </div>
          </div>
        </div>
      )}

      

      <div className="mb-4 sm:mb-8">
        <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'available'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('driver.availableLoads')}
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'applied'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('driver.appliedLoads')}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'completed'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('driver.completedLoads')}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('driver.analytics')}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-3 sm:px-4 py-2 rounded-md whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'profile'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            {t('profile.title')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      )}

      {!isLoading && activeTab === 'available' && (
        <>
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-8 border border-amber-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-amber-800">{t('driver.availableLoads')}</h2>
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-amber-800">{t('customer.source')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                    value={searchCriteria.source}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, source: e.target.value })}
                    placeholder="Enter source location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800">{t('customer.destination')}</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                    value={searchCriteria.destination}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, destination: e.target.value })}
                    placeholder="Enter destination location"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSearchCriteria({ source: '', destination: '' })}
                  className="px-4 py-2 mr-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
                >
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {getFilteredLoads().length === 0 ? (
              <div className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200 text-center">
                <p className="text-amber-800">No available loads found matching your criteria</p>
              </div>
            ) : (
              getFilteredLoads().map(load => (
                <div key={load.id} className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold mb-2 text-amber-800">
                        {load.source} - {load.destination}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                        <p>{t('customer.loadType')}: {load.loadType}</p>
                        <p>{t('customer.quantity')}: {load.quantity} tons</p>
                        <p>{t('customer.estimatedFare')}: ₹{load.estimatedFare}</p>
                        <p>{t('customer.createdAt')}: {new Date(load.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => hasAppliedForLoad(load.id) ? null : applyForLoad(load)}
                      disabled={hasAssignedLoad || hasAppliedForLoad(load.id)}
                      className={`px-4 py-2 rounded-md ${
                        hasAssignedLoad
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : hasAppliedForLoad(load.id)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-amber-700 text-white hover:bg-amber-800'
                      }`}
                    >
                      {hasAssignedLoad 
                        ? 'Complete Current Load First' 
                        : hasAppliedForLoad(load.id) 
                          ? t('driver.applied')
                          : t('driver.apply')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!isLoading && activeTab === 'applied' && (
        <div className="space-y-4">
          {appliedLoads.length === 0 ? (
            <div className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200 text-center">
              <p className="text-amber-800">You haven't been assigned any loads yet</p>
            </div>
          ) : (
            appliedLoads.map(load => (
              <div key={load.id} className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-amber-800">
                      {load.source} - {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                      <p>{t('customer.loadType')}: {load.loadType}</p>
                      <p>{t('customer.quantity')}: {load.quantity} tons</p>
                      <p>{t('customer.estimatedFare')}: ₹{load.estimatedFare}</p>
                      <p>{t('customer.status')}: {t('customer.assigned')}</p>
                    </div>
                    
                    {/* Customer details section */}
                    <div className="mt-4 p-3 bg-amber-100 rounded-md">
                      <h5 className="font-semibold text-amber-800 mb-1">{t('driver.customerDetails')}:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">{t('auth.name')}:</span> {load.customerDetails?.name || load.customerName || 'Not provided'}</p>
                        <p><span className="font-medium">{t('auth.phone')}:</span> {load.customerDetails?.phone || load.customerPhone || 'Not provided'}</p>
                        {/* Show customer's average rating */}
                        {load.customerDetails?.averageRating && load.customerDetails.averageRating > 0 && (
                          <p className="flex items-center">
                            <span className="font-medium">{t('rating.averageRating')}:</span>
                            <span className="ml-1 flex items-center text-yellow-600">
                              {load.customerDetails.averageRating.toFixed(1)}
                              <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-600 ml-1">({load.customerDetails.totalRatings || 0})</span>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-semibold border border-green-300">
                    In Progress
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && activeTab === 'completed' && (
        <div className="space-y-4">
          {completedLoads.length === 0 ? (
            <div className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200 text-center">
              <p className="text-amber-800">You haven't completed any loads yet</p>
            </div>
          ) : (
            completedLoads.map(load => (
              <div key={load.id} className="bg-yellow-50 rounded-lg shadow-lg p-6 border border-yellow-200">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h4 className="text-lg font-semibold mb-2 text-amber-800">
                      {load.source} - {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                      <p>{t('customer.loadType')}: {load.loadType}</p>
                      <p>{t('customer.quantity')}: {load.quantity} tons</p>
                      <p>{t('customer.estimatedFare')}: ₹{load.estimatedFare}</p>
                      <p>{t('customer.completedAt')}: {new Date(load.completedAt || '').toLocaleDateString()}</p>
                    </div>
                    
                    {/* Customer details section */}
                    <div className="mt-4 p-3 bg-amber-100 rounded-md">
                      <h5 className="font-semibold text-amber-800 mb-1">{t('driver.customerDetails')}:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">{t('auth.name')}:</span> {load.customerDetails?.name || load.customerName || 'Not provided'}</p>
                        <p><span className="font-medium">{t('auth.phone')}:</span> {load.customerDetails?.phone || load.customerPhone || 'Not provided'}</p>
                        {/* Show customer's average rating */}
                        {load.customerDetails?.averageRating && load.customerDetails.averageRating > 0 && (
                          <p className="flex items-center">
                            <span className="font-medium">{t('rating.averageRating')}:</span>
                            <span className="ml-1 flex items-center text-yellow-600">
                              {load.customerDetails.averageRating.toFixed(1)}
                              <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-600 ml-1">({load.customerDetails.totalRatings || 0})</span>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {load.driverRated ? (
                  <button
                    onClick={() => openRatingModal(load)}
                    className="mt-4 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex justify-center items-center"
                  >
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    {t('rating.ratingGiven')}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => openRatingModal(load)}
                    className="mt-4 w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 flex justify-center items-center"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {t('rating.rateCustomer')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && activeTab === 'analytics' && (
        <DriverAnalytics />
      )}

      {!isLoading && activeTab === 'profile' && (
        <ProfileManagement currentUser={currentUser} userRole="driver" />
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        loadId={ratingLoadId}
        targetId={ratingCustomerId}
        targetName={ratingCustomerName}
        type="customer"
        onSuccess={handleRatingSuccess}
      />
    </div>
  );
};

export default DriverDashboard;


