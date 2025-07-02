import React, { useState, useEffect } from 'react';
import { Load, User } from '../types';
import { ArrowLeft, Truck, ClipboardList, CheckSquare } from 'lucide-react';
import { loadAPI } from '../api';

interface DriverDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onBack: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ currentUser, onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'applied' | 'completed'>('available');
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
        const appliedResponse = await fetch('https://truckconnect-backend.onrender.com/api/loads/applications', {
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
      alert('You have already been assigned a load. Complete it before applying for another.');
      return;
    }

    if (currentUser.role === 'driver' && load.quantity > (currentUser as any).maxCapacity) {
      alert('Your vehicle cannot handle this load. Please apply for a smaller load.');
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
      
      alert('Applied successfully!');
    } catch (error: any) {
      console.error('Error applying for load:', error);
      alert(error.message || 'Failed to apply for load. Please try again.');
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
      
      alert('Load marked as completed!');
    } catch (error: any) {
      console.error('Error completing load:', error);
      alert(error.message || 'Failed to complete load. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
    <div className="max-w-7xl mx-auto px-4 py-8 bg-amber-50">
      {/* Add a global notification banner when driver has an assigned load */}
      {hasAssignedLoad && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow">
          <div className="flex items-center">
            <Truck className="h-6 w-6 mr-2" />
            <div>
              <p className="font-bold">You have an assigned load in progress</p>
              <p>You cannot apply for new loads until your current assignment is completed by the customer.</p>
            </div>
          </div>
        </div>
      )}

      

      <div className="mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'available'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Truck className="h-5 w-5 mr-2" />
            Available Loads
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'applied'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            Assigned Loads
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'completed'
                ? 'bg-amber-700 text-white'
                : 'bg-white text-amber-800 hover:bg-amber-100'
            }`}
          >
            <CheckSquare className="h-5 w-5 mr-2" />
            Completed Loads
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
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
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-amber-200">
            <h2 className="text-2xl font-bold mb-6 text-amber-800">Search for Loads</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-amber-800">Source Location</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    value={searchCriteria.source}
                    onChange={(e) => setSearchCriteria({ ...searchCriteria, source: e.target.value })}
                    placeholder="Enter source location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800">Destination Location</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
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
                  Clear
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800"
                >
                  Search
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
                        {load.source} → {load.destination}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                        <p>Load Type: {load.loadType}</p>
                        <p>Quantity: {load.quantity} tons</p>
                        <p>Estimated Fare: ₹{load.estimatedFare}</p>
                        <p>Posted: {new Date(load.createdAt).toLocaleDateString()}</p>
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
                          ? 'Applied' 
                          : 'Apply'}
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
                      {load.source} → {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                      <p>Load Type: {load.loadType}</p>
                      <p>Quantity: {load.quantity} tons</p>
                      <p>Estimated Fare: ₹{load.estimatedFare}</p>
                      <p>Status: Assigned to you</p>
                    </div>
                    
                    {/* Customer details section */}
                    <div className="mt-4 p-3 bg-amber-100 rounded-md">
                      <h5 className="font-semibold text-amber-800 mb-1">Customer Details:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Name:</span> {load.customerDetails?.name || load.customerName || 'Not provided'}</p>
                        <p><span className="font-medium">Phone:</span> {load.customerDetails?.phone || load.customerPhone || 'Not provided'}</p>
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
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-amber-800">
                      {load.source} → {load.destination}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-amber-900">
                      <p>Load Type: {load.loadType}</p>
                      <p>Quantity: {load.quantity} tons</p>
                      <p>Estimated Fare: ₹{load.estimatedFare}</p>
                      <p>Completed: {new Date(load.completedAt || '').toLocaleDateString()}</p>
                    </div>
                    
                    {/* Customer details section */}
                    <div className="mt-4 p-3 bg-amber-100 rounded-md">
                      <h5 className="font-semibold text-amber-800 mb-1">Customer Details:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Name:</span> {load.customerDetails?.name || load.customerName || 'Not provided'}</p>
                        <p><span className="font-medium">Phone:</span> {load.customerDetails?.phone || load.customerPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;