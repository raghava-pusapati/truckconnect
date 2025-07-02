import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, ClipboardCheck, UserCheck, ChevronDown, ChevronUp, ExternalLink, Trash2 } from 'lucide-react';
import { User } from '../types';
import { loadAPI } from '../api';

interface Driver {
  driverId: string;
  name: string;
  mobile: string;
  lorryType: string;
  maxCapacity: string;
  assignedAt?: string;
}

interface DriverApplicant extends Driver {
  email?: string;
  address?: string;
  experience?: string;
  appliedAt: string;
  documents?: {
    license?: string;
    rc?: string;
    fitness?: string;
    insurance?: string;
    medical?: string;
    allIndiaPermit?: string;
  };
}

interface Load {
  id: string;
  userId: string;
  source: string;
  destination: string;
  loadType: string;
  quantity: string;
  estimatedFare: string;
  description?: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  assignedDriver?: Driver;
  applicants?: DriverApplicant[];
}

interface LoadWithApplicants extends Load {
  applicants: DriverApplicant[];
  showApplicants?: boolean;
}

interface CustomerDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onBack: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ currentUser, onLogout, onBack }) => {
  const [myLoads, setMyLoads] = useState<LoadWithApplicants[]>([]);
  const [activeTab, setActiveTab] = useState<string>('post');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Helper function to extract ID value from MongoDB ObjectId
  const extractIdFromMongoObject = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    // Handle ObjectId
    if (obj && typeof obj === 'object') {
      if (obj.$oid) return obj.$oid; // MongoDB extended JSON format
      if (typeof obj.toString === 'function') return obj.toString();
    }
    return String(obj);
  };

  // Fetch loads when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      fetchLoads();
    }
  }, [currentUser]);

  const fetchLoads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loads = await loadAPI.getMyLoads();
      console.log('Raw loads data from API:', loads);
      
      // Convert MongoDB _id to id for frontend compatibility
      const formattedLoads = loads.map((load: any) => {
        // Process applicants array if it exists
        let applicants = [];
        if (load.applicants && Array.isArray(load.applicants)) {
          applicants = load.applicants.map((applicant: any) => {
            // Extract driverId from MongoDB data - could be in driverId field or _id field
            const driverIdValue = extractIdFromMongoObject(applicant.driverId) || 
                                extractIdFromMongoObject(applicant._id);
            
            console.log('Processing applicant:', applicant);
            console.log('Extracted driverId:', driverIdValue);
            
            return {
              // Map MongoDB driver applicant structure to our interface
              driverId: driverIdValue,
              name: applicant.name || 'Unknown',
              mobile: applicant.mobile || 'No phone',
              lorryType: applicant.lorryType || 'Not specified',
              maxCapacity: applicant.maxCapacity || 'Not specified',
              appliedAt: applicant.appliedAt || new Date().toISOString(),
              // Include other fields if they exist
              email: applicant.email,
              address: applicant.address,
              documents: applicant.documents || {}
            };
          });
        }
        
        // Process assigned driver if it exists
        let assignedDriver = null;
        if (load.assignedDriver && load.assignedDriver.driverId) {
          const driverIdValue = extractIdFromMongoObject(load.assignedDriver.driverId);
          assignedDriver = {
            driverId: driverIdValue,
            name: load.assignedDriver.name || 'Unknown',
            mobile: load.assignedDriver.mobile || 'No phone',
            lorryType: load.assignedDriver.lorryType || 'Not specified',
            maxCapacity: load.assignedDriver.maxCapacity || 'Not specified',
            assignedAt: load.assignedDriver.assignedAt || new Date().toISOString()
          };
        }
        
        return {
          ...load,
          id: extractIdFromMongoObject(load._id) || load.id, // Handle both MongoDB _id and regular id
          showApplicants: false,
          // Ensure applicants array is initialized with processed data
          applicants: applicants,
          // Include processed assigned driver
          assignedDriver: assignedDriver
        };
      });
      
      console.log('Formatted loads with processed applicants:', formattedLoads);
      setMyLoads(formattedLoads);
    } catch (error: any) {
      console.error('Error fetching loads:', error);
      setError('Failed to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApplicants = async (loadId: string) => {
    console.log('toggleApplicants called for loadId:', loadId);
    
    // Find the load in state
    const loadIndex = myLoads.findIndex(load => load.id === loadId);
    console.log('loadIndex:', loadIndex);
    
    if (loadIndex === -1) {
      console.log('Load not found in state');
      return;
    }
    
    const load = myLoads[loadIndex];
    console.log('Current load:', load);
    
    // Initialize applicants array if it doesn't exist
    const currentApplicants = load.applicants || [];
    
    // If we're already showing applicants, just toggle visibility off
    if (load.showApplicants) {
      console.log('Hiding applicants');
      const updatedLoads = [...myLoads];
      updatedLoads[loadIndex] = {
        ...load,
        showApplicants: false
      };
      setMyLoads(updatedLoads);
      return;
    }
    
    // If we have applicants already, just toggle visibility on
    if (currentApplicants.length > 0) {
      console.log('Showing existing applicants');
      const updatedLoads = [...myLoads];
      updatedLoads[loadIndex] = {
        ...load,
        showApplicants: true
      };
      setMyLoads(updatedLoads);
      return;
    }
    
    // If we need to fetch applicants
    try {
      console.log('Fetching applicants from API');
      setIsLoading(true);
      let applicants: DriverApplicant[] = [];
      
      try {
        // Add a specific timeout to the fetch operation
        const fetchPromise = loadAPI.getLoadApplicants(loadId);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 second timeout
        });
        
        const fetchedApplicants = await Promise.race([fetchPromise, timeoutPromise]);
        
        // If we got applicants back and they are an array, process them
        if (fetchedApplicants && Array.isArray(fetchedApplicants)) {
          // Process each applicant to ensure document data is preserved
          applicants = fetchedApplicants.map(applicant => {
            console.log('Processing applicant data:', applicant);
            
            return {
              driverId: applicant.driverId || applicant._id,
              name: applicant.name || 'Unknown Driver',
              phone: applicant.phone || applicant.mobile || 'Not provided',
              mobile: applicant.mobile || applicant.phone || 'Not provided',
              status: applicant.status || 'applied',
              lorryType: applicant.lorryType || 'Unknown',
              maxCapacity: applicant.maxCapacity || '0',
              appliedAt: applicant.appliedAt || new Date().toISOString(),
              // Ensure we preserve all document data
              documents: {
                license: applicant.documents?.license || null,
                rc: applicant.documents?.rc || null,
                fitness: applicant.documents?.fitness || null,
                insurance: applicant.documents?.insurance || null,
                medical: applicant.documents?.medical || null,
                allIndiaPermit: applicant.documents?.allIndiaPermit || null
              }
            };
          });
          
          console.log('Processed applicants data:', applicants);
        }
      } catch (apiError: any) {
        console.error('API error details:', apiError);
        // Show a more user-friendly error message
        setError('Could not load driver applicants. Please try again later.');
        // Continue with empty array rather than aborting
        applicants = [];
      }
      
      // Update the load with applicants and toggle visibility (even if empty)
      const updatedLoads = [...myLoads];
      updatedLoads[loadIndex] = {
        ...load,
        applicants,
        showApplicants: true
      };
      console.log('Setting updated loads with applicants');
      setMyLoads(updatedLoads);
    } catch (error: any) {
      console.error('Error in toggleApplicants:', error);
      setError('An error occurred while fetching driver information.');
    } finally {
      setIsLoading(false);
    }
  };

  const assignLoadToDriver = async (loadId: string, driverId: string) => {
    if (!confirm('Are you sure you want to assign this load to this driver?')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await loadAPI.assignLoadToDriver(loadId, driverId);
      
      // Update the load status in state
      setMyLoads(prevLoads => 
        prevLoads.map(load => {
          if (load.id === loadId) {
            // Find the driver details from the applicants list
            const driver = load.applicants?.find(app => app.driverId === driverId);
            if (driver) {
              return {
                ...load,
                status: 'assigned',
                assignedDriver: {
                  driverId: driver.driverId,
                  name: driver.name,
                  mobile: driver.mobile,
                  lorryType: driver.lorryType,
                  maxCapacity: driver.maxCapacity,
                  assignedAt: new Date().toISOString()
                }
              };
            } else {
              // If driver details aren't available, just update the status
              return {
                ...load,
                status: 'assigned'
              };
            }
          }
          return load;
        })
      );
      
      alert('Load assigned successfully!');
      // Refresh loads to get the updated data
      fetchLoads();
    } catch (error: any) {
      console.error('Error assigning load:', error);
      
      // Show a more specific message if the driver already has an assigned load
      if (error.message && error.message.includes('already has an assigned load')) {
        setError('This driver already has an assigned load. Please choose another driver or wait until they complete their current job.');
      } else {
        setError(`Failed to assign load: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const loadData = {
      source: formData.get('source') as string,
      destination: formData.get('destination') as string,
      loadType: formData.get('loadType') as string,
      quantity: Number(formData.get('quantity')),
      estimatedFare: Number(formData.get('estimatedFare'))
    };

    try {
      setIsLoading(true);
      setError(null);
      
      // Create load using the API
      const newLoad = await loadAPI.createLoad(loadData);
      
      // Add the new load to the state with the id from MongoDB
      setMyLoads(prevLoads => [
        ...prevLoads, 
        { 
          ...newLoad,
          id: newLoad._id 
        }
      ]);
      
      form.reset();
      setActiveTab('view');
    } catch (error: any) {
      console.error('Error creating load:', error);
      setError('Failed to create load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLoad = async (loadId: string) => {
    // Add confirmation dialog
    if (!confirm('Are you sure you want to mark this load as completed?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Update load status using the API
      await loadAPI.completeLoad(loadId);
      
      // Update the local state
      setMyLoads(prevLoads => 
        prevLoads.map(load => 
          load.id === loadId 
            ? { ...load, status: 'completed', completedAt: new Date().toISOString() }
            : load
        )
      );
      
      // Show confirmation
      alert('Load marked as completed successfully!');
    } catch (error: any) {
      console.error('Error completing load:', error);
      setError('Failed to complete load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLoad = async (loadId: string) => {
    // Add confirmation dialog
    if (!confirm('Are you sure you want to cancel this load? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Cancel the load using the API (actually marks as completed)
      await loadAPI.deleteLoad(loadId);
      
      // Update UI by removing the load
      setMyLoads(prevLoads => prevLoads.filter(load => load.id !== loadId));
      
      // Show confirmation
      alert('Load cancelled successfully!');
    } catch (error: any) {
      console.error('Error cancelling load:', error);
      setError('Failed to cancel load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPendingLoads = () => {
    return myLoads.filter(load => (load.status === 'pending' || load.status === 'assigned'));
  };

  const getCompletedLoads = () => {
    return myLoads.filter(load => load.status === 'completed');
  };

  // Utility function to get document URL
  const getDocumentUrl = (documentUrl: string | undefined): string => {
    // If the document URL is already a complete data URL, return it as is
    if (documentUrl && documentUrl.startsWith('data:image')) {
      return documentUrl;
    }
    
    // If it's another type of URL, return it
    if (documentUrl && (documentUrl.startsWith('http') || documentUrl.startsWith('blob:'))) {
      return documentUrl;
    }
    
    // Return a placeholder for missing documents
    return 'https://via.placeholder.com/300x200?text=Document+Not+Available';
  };

  // Function to open document in a new tab with proper handling
  const openDocumentInNewTab = (url: string) => {
    // For base64 images, we need special handling to ensure they display properly
    if (url.startsWith('data:')) {
      // Create a new window/tab
      const newWindow = window.open('', '_blank');
      
      // If window was blocked, alert the user
      if (!newWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site to view documents.');
        return;
      }
      
      // Write HTML content to properly display the image/document
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Viewer</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #f0f0f0;
            }
            img {
              max-width: 100%;
              max-height: 90vh;
              object-fit: contain;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .document-container {
              padding: 20px;
              background: white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              border-radius: 4px;
              max-width: 90vw;
              max-height: 90vh;
              overflow: auto;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <img src="${url}" alt="Document" />
          </div>
        </body>
        </html>
      `);
      
      newWindow.document.close();
    } else {
      // For regular URLs, just open in a new tab
      window.open(url, '_blank');
    }
  };

  const renderDriverDocuments = (applicant: DriverApplicant) => {
    console.log('Rendering documents for applicant:', applicant);
    
    // Try to access document URLs from the documents property
    const documents = applicant.documents || {};
    
    // Extract document URLs, handling both string URLs and base64 data
    const documentUrls = {
      license: getDocumentUrl(documents.license),
      rc: getDocumentUrl(documents.rc),
      fitness: getDocumentUrl(documents.fitness),
      insurance: getDocumentUrl(documents.insurance),
      medical: getDocumentUrl(documents.medical),
      allIndiaPermit: getDocumentUrl(documents.allIndiaPermit)
    };
    
    console.log('Document URLs:', documentUrls);
    
    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <h4 className="font-medium text-amber-800">Driver's License</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.license)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-amber-800">RC Book</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.rc)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-medium text-amber-800">Fitness Certificate</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.fitness)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-amber-800">Insurance</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.insurance)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h4 className="font-medium text-amber-800">Medical Certificate</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.medical)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-amber-800">All India Permit</h4>
            <button 
              onClick={() => openDocumentInNewTab(documentUrls.allIndiaPermit)}
              className="text-blue-600 hover:underline flex items-center text-sm mt-1"
            >
              View <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderApplicants = (load: LoadWithApplicants) => {
    if (!load.showApplicants) return null;
    
    // Initialize applicants as an empty array if it's undefined
    const applicants = load.applicants || [];
    
    if (applicants.length === 0) {
      return (
        <div className="mt-4 p-4 bg-amber-50 rounded-md">
          <p className="text-amber-800 text-center">No drivers have applied for this load yet.</p>
          <p className="text-amber-700 text-sm text-center mt-2">Check back later for applications.</p>
        </div>
      );
    }
    
    console.log('Rendering applicants:', applicants);
    
    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-amber-800 mb-2">Driver Applicants</h4>
        <div className="space-y-4">
          {applicants.map((applicant, index) => (
            <div key={applicant.driverId || index} className="border border-amber-200 rounded-md p-4 bg-amber-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                {/* Driver info section */}
                <div className="flex-grow">
                  <h5 className="font-semibold text-amber-800 text-lg">{applicant.name || 'Unknown Driver'}</h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                    <p className="text-sm"><span className="font-medium">Phone:</span> {applicant.mobile || 'Not provided'}</p>
                    <p className="text-sm"><span className="font-medium">Lorry Type:</span> {applicant.lorryType || 'Not specified'}</p>
                    <p className="text-sm"><span className="font-medium">Capacity:</span> {applicant.maxCapacity || '0'} tons</p>
                    {applicant.appliedAt && (
                      <p className="text-sm">
                        <span className="font-medium">Applied:</span> {new Date(applicant.appliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedDriverId(selectedDriverId === applicant.driverId ? null : applicant.driverId)}
                    className="mt-3 text-amber-700 text-sm underline"
                  >
                    {selectedDriverId === applicant.driverId ? 'Hide documents' : 'View documents'}
                  </button>
                  
                  {selectedDriverId === applicant.driverId && renderDriverDocuments(applicant)}
                </div>
                
                {/* Assign button and note section */}
                <div className="flex flex-col items-start md:items-end self-start md:ml-4">
                  <button
                    onClick={() => assignLoadToDriver(load.id, applicant.driverId)}
                    className="bg-amber-600 text-white px-5 py-2 rounded-md hover:bg-amber-700 w-full md:w-auto text-center font-medium"
                  >
                    Assign Load
                  </button>
                  
                  {/* Show driver availability status info - this will be updated by the API */}
                  <div className="mt-3 text-xs text-gray-600 max-w-[200px]">
                    Note: If a driver has an existing assigned load, they will not be available until their current job is completed.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentUser?.id) {
    return (
      <div className="min-h-screen bg-amber-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-800 mb-4">Not Logged In</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-amber-800">Customer Dashboard</h1>
            
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === 'post'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Post a Load
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === 'view'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              View My Loads
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center px-4 py-2 rounded-lg ${
                activeTab === 'completed'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <ClipboardCheck className="w-5 h-5 mr-2" />
              Completed Loads
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          )}

          {/* Post a Load Form */}
          {!isLoading && activeTab === 'post' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-amber-800 mb-4">Post New Load</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source <span className='text-green-500'>(Start Point -Along with Exact Address)</span></label>
                  <input
                    type="text"
                    name="source"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination <span className='text-green-500'>(End Point -Along with Exact Address)</span></label>
                  <input
                    type="text"
                    name="destination"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Load Type & Description about load</label>
                  <input
                    type="text"
                    name="loadType"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity (enter only in tons)</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Fare (₹)</label>
                  <input
                    type="number"
                    name="estimatedFare"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {isLoading ? 'Posting...' : 'Post Load'}
                </button>
              </form>
            </div>
          )}

          {/* View My Loads */}
          {!isLoading && activeTab === 'view' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPendingLoads().map((load) => (
                <div key={load.id} className={`bg-white p-6 rounded-lg shadow-md relative ${
                  load.status === 'assigned' ? 'border-l-4 border-green-500' : ''
                }`}>
                  {/* Only show delete button for pending loads, not for assigned loads */}
                  {load.status === 'pending' && (
                    <button
                      onClick={() => handleDeleteLoad(load.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      title="Cancel Load"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  <h3 className="text-xl font-semibold text-amber-800 mb-4 pr-8">
                    {load.source} → {load.destination}
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Load Type:</span> {load.loadType}</p>
                    <p><span className="font-medium">Quantity:</span> {load.quantity}</p>
                    <p><span className="font-medium">Estimated Fare:</span> ₹{load.estimatedFare}</p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`${
                        load.status === 'pending' 
                          ? 'text-orange-600' 
                          : load.status === 'assigned' 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                      } font-medium`}>
                        {load.status === 'pending' 
                          ? 'Pending' 
                          : load.status === 'assigned' 
                            ? 'Assigned' 
                            : 'Completed'}
                      </span>
                    </p>
                    {load.status === 'assigned' && load.assignedDriver && (
                      <div className="mt-2 p-3 bg-amber-50 rounded-md">
                        <p className="font-medium text-amber-800">Assigned Driver</p>
                        <p className="text-sm"><span className="font-medium">Name:</span> {load.assignedDriver.name}</p>
                        <p className="text-sm"><span className="font-medium">Phone:</span> {load.assignedDriver.mobile}</p>
                        <p className="text-sm"><span className="font-medium">Lorry Type:</span> {load.assignedDriver.lorryType}</p>
                        <p className="text-sm"><span className="font-medium">Capacity:</span> {load.assignedDriver.maxCapacity} tons</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-col space-y-2">
                    {load.status === 'pending' && (
                      <button
                        onClick={() => toggleApplicants(load.id)}
                        className="w-full bg-amber-500 text-white py-2 rounded-md hover:bg-amber-600 flex justify-center items-center"
                      >
                        {load.showApplicants ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Driver Applicants
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            View Driver Applicants
                          </>
                        )}
                      </button>
                    )}
                    {load.status === 'assigned' && (
                  <button
                    onClick={() => handleCompleteLoad(load.id)}
                        className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 flex justify-center items-center"
                  >
                        Mark as Completed
                  </button>
                    )}
                  </div>
                  {load.status === 'pending' && renderApplicants(load)}
                </div>
              ))}
            </div>
          )}

          {/* Completed Loads */}
          {!isLoading && activeTab === 'completed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCompletedLoads().map((load) => (
                <div key={load.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-amber-800 mb-4">
                    {load.source} → {load.destination}
                  </h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Load Type:</span> {load.loadType}</p>
                    <p><span className="font-medium">Quantity:</span> {load.quantity}</p>
                    <p><span className="font-medium">Estimated Fare:</span> ₹{load.estimatedFare}</p>
                    <p><span className="font-medium">Status:</span> {load.status}</p>
                    <p><span className="font-medium">Completed At:</span> {new Date(load.completedAt || '').toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  export default CustomerDashboard;
