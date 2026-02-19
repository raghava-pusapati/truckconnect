import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, ClipboardCheck, UserCheck, ChevronDown, ChevronUp, ExternalLink, Trash2, BarChart3, Star, User as UserIcon, Edit } from 'lucide-react';
import { User } from '../types';
import { loadAPI } from '../api';
import CustomerAnalytics from './CustomerAnalytics';
import RatingModal from './RatingModal';
import ProfileManagement from './ProfileManagement';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_BASE_URL } from '../config';

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
  driverRated?: boolean;
  customerRated?: boolean;
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
  const { t } = useTranslation();
  const [myLoads, setMyLoads] = useState<LoadWithApplicants[]>([]);
  const [activeTab, setActiveTab] = useState<string>('post');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingLoadId, setRatingLoadId] = useState<string>('');
  const [ratingDriverId, setRatingDriverId] = useState<string>('');
  const [ratingDriverName, setRatingDriverName] = useState<string>('');
  
  // Delivery date state
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<Date | null>(null);

  // Edit load state
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    source: string;
    destination: string;
    loadType: string;
    quantity: string;
    estimatedFare: string;
    description: string;
  }>({
    source: '',
    destination: '',
    loadType: '',
    quantity: '',
    estimatedFare: '',
    description: ''
  });

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
              // ✅ INCLUDE RATINGS
              averageRating: applicant.averageRating || 0,
              totalRatings: applicant.totalRatings || 0,
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
            assignedAt: load.assignedDriver.assignedAt || new Date().toISOString(),
            // ✅ INCLUDE RATINGS
            averageRating: load.assignedDriver.averageRating || 0,
            totalRatings: load.assignedDriver.totalRatings || 0
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
        
        console.log('RAW API RESPONSE:', fetchedApplicants);
        console.log('Response is array:', Array.isArray(fetchedApplicants));
        if (Array.isArray(fetchedApplicants) && fetchedApplicants.length > 0) {
          console.log('First applicant raw data:', JSON.stringify(fetchedApplicants[0], null, 2));
        }
        
        // If we got applicants back and they are an array, process them
        if (fetchedApplicants && Array.isArray(fetchedApplicants)) {
          // Process each applicant to ensure document data is preserved
          applicants = fetchedApplicants.map(applicant => {
            console.log('Processing applicant data:', applicant);
            console.log('Applicant averageRating:', applicant.averageRating);
            console.log('Applicant totalRatings:', applicant.totalRatings);
            
            return {
              driverId: applicant.driverId || applicant._id,
              name: applicant.name || 'Unknown Driver',
              phone: applicant.phone || applicant.mobile || 'Not provided',
              mobile: applicant.mobile || applicant.phone || 'Not provided',
              status: applicant.status || 'applied',
              lorryType: applicant.lorryType || 'Unknown',
              maxCapacity: applicant.maxCapacity || '0',
              appliedAt: applicant.appliedAt || new Date().toISOString(),
              // Include rating data
              averageRating: applicant.averageRating || 0,
              totalRatings: applicant.totalRatings || 0,
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
        toast.error('Could not load driver applicants');
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
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const assignLoadToDriver = async (loadId: string, driverId: string) => {
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
      
      toast.success('Load assigned successfully!');
      // Refresh loads to get the updated data
      fetchLoads();
    } catch (error: any) {
      console.error('Error assigning load:', error);
      
      // Show a more specific message if the driver already has an assigned load
      if (error.message && error.message.includes('already has an assigned load')) {
        setError('This driver already has an assigned load. Please choose another driver or wait until they complete their current job.');
        toast.error('Driver already has an assigned load');
      } else {
        setError(`Failed to assign load: ${error.message}`);
        toast.error('Failed to assign load');
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
      estimatedFare: Number(formData.get('estimatedFare')),
      description: formData.get('description') as string || '',
      estimatedDeliveryDate: estimatedDeliveryDate ? estimatedDeliveryDate.toISOString() : null
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
      setEstimatedDeliveryDate(null);
      setActiveTab('view');
      toast.success('Load created successfully!');
    } catch (error: any) {
      console.error('Error creating load:', error);
      setError('Failed to create load. Please try again.');
      toast.error('Failed to create load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLoad = async (loadId: string) => {
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
      toast.success('Load marked as completed successfully!');
    } catch (error: any) {
      console.error('Error completing load:', error);
      setError('Failed to complete load. Please try again.');
      toast.error('Failed to complete load');
    } finally {
      setIsLoading(false);
    }
  };

  const openRatingModal = (load: Load) => {
    if (load.assignedDriver) {
      setRatingLoadId(load.id);
      setRatingDriverId(load.assignedDriver.driverId);
      setRatingDriverName(load.assignedDriver.name);
      setShowRatingModal(true);
    }
  };

  const handleRatingSuccess = async () => {
    setShowRatingModal(false);
    await fetchLoads(); // Refresh loads to update rating status
    toast.success(t('rating.ratingSuccess'));
  };

  const handleDeleteLoad = async (loadId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Cancel the load using the API (actually marks as completed)
      await loadAPI.deleteLoad(loadId);
      
      // Update UI by removing the load
      setMyLoads(prevLoads => prevLoads.filter(load => load.id !== loadId));
      
      // Show confirmation
      toast.success('Load cancelled successfully!');
    } catch (error: any) {
      console.error('Error cancelling load:', error);
      setError('Failed to cancel load. Please try again.');
      toast.error('Failed to cancel load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLoad = (load: Load) => {
    setEditingLoadId(load.id);
    setEditFormData({
      source: load.source,
      destination: load.destination,
      loadType: load.loadType,
      quantity: load.quantity,
      estimatedFare: load.estimatedFare,
      description: load.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingLoadId(null);
    setEditFormData({
      source: '',
      destination: '',
      loadType: '',
      quantity: '',
      estimatedFare: '',
      description: ''
    });
  };

  const handleUpdateLoad = async (loadId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update the load using the API - use /edit endpoint
      const response = await fetch(`${API_BASE_URL}/loads/${loadId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          source: editFormData.source,
          destination: editFormData.destination,
          loadType: editFormData.loadType,
          quantity: Number(editFormData.quantity),
          estimatedFare: Number(editFormData.estimatedFare),
          description: editFormData.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update load');
      }

      const result = await response.json();
      const updatedLoad = result.load || result;

      // Update UI
      setMyLoads(prevLoads => prevLoads.map(load => 
        load.id === loadId ? { ...load, ...updatedLoad, id: loadId } : load
      ));

      // Reset edit state
      handleCancelEdit();

      toast.success(t('messages.loadUpdated'));
    } catch (error: any) {
      console.error('Error updating load:', error);
      setError('Failed to update load. Please try again.');
      toast.error(t('messages.failedToUpdate'));
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
          <p className="text-amber-800 text-center">{t('messages.noApplicants')}</p>
          <p className="text-amber-700 text-sm text-center mt-2">Check back later for applications.</p>
        </div>
      );
    }
    
    console.log('Rendering applicants:', applicants);
    console.log('Applicant ratings:', applicants.map(a => ({
      name: a.name,
      averageRating: a.averageRating,
      totalRatings: a.totalRatings
    })));
    
    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold text-amber-800 mb-2">{t('customer.applicants')}</h4>
        <div className="space-y-4">
          {applicants.map((applicant, index) => (
            <div key={applicant.driverId || index} className="border border-amber-200 rounded-md p-4 bg-amber-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                {/* Driver info section */}
                <div className="flex-grow">
                  <h5 className="font-semibold text-amber-800 text-lg">{applicant.name || 'Unknown Driver'}</h5>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                    <p className="text-sm"><span className="font-medium">{t('auth.phone')}:</span> {applicant.mobile || 'Not provided'}</p>
                    <p className="text-sm"><span className="font-medium">{t('driver.lorryType')}:</span> {applicant.lorryType || 'Not specified'}</p>
                    <p className="text-sm"><span className="font-medium">{t('driver.maxCapacity')}:</span> {applicant.maxCapacity || '0'} tons</p>
                    {applicant.appliedAt && (
                      <p className="text-sm">
                        <span className="font-medium">{t('customer.createdAt')}:</span> {new Date(applicant.appliedAt).toLocaleString()}
                      </p>
                    )}
                    {/* Show driver's average rating */}
                    {applicant.averageRating !== undefined && applicant.averageRating > 0 && (
                      <p className="text-sm flex items-center">
                        <span className="font-medium">{t('rating.averageRating')}:</span>
                        <span className="ml-1 flex items-center text-yellow-600">
                          {applicant.averageRating.toFixed(1)}
                          <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                          <span className="text-gray-600 ml-1">({applicant.totalRatings || 0})</span>
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setSelectedDriverId(selectedDriverId === applicant.driverId ? null : applicant.driverId)}
                    className="mt-3 text-amber-700 text-sm underline"
                  >
                    {selectedDriverId === applicant.driverId ? t('customer.hideApplicants') : t('customer.viewApplicants')}
                  </button>
                  
                  {selectedDriverId === applicant.driverId && renderDriverDocuments(applicant)}
                </div>
                
                {/* Assign button and note section */}
                <div className="flex flex-col items-start md:items-end self-start md:ml-4">
                  <button
                    onClick={() => assignLoadToDriver(load.id, applicant.driverId)}
                    className="bg-amber-600 text-white px-5 py-2 rounded-md hover:bg-amber-700 w-full md:w-auto text-center font-medium"
                  >
                    {t('customer.assignDriver')}
                  </button>
                  
                  {/* Show driver availability status info - this will be updated by the API */}
                  <div className="mt-3 text-xs text-gray-600 max-w-[200px]">
                    {t('messages.driverAvailability') || 'Note: If a driver has an existing assigned load, they will not be available until their current job is completed.'}
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
      <div className="min-h-screen bg-amber-50 p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-800">{t('customer.dashboard')}</h1>
            
          </div>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Tabs - Scrollable on mobile */}
          <div className="flex space-x-2 sm:space-x-4 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === 'post'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('customer.postLoad')}
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === 'view'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('customer.myLoads')}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === 'completed'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('customer.completedLoads')}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('customer.analytics')}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                activeTab === 'profile'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-800'
              }`}
            >
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              {t('profile.title')}
            </button>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          )}

          {/* Post a Load Form */}
          {!isLoading && activeTab === 'post' && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <h2 className="text-lg sm:text-xl font-semibold text-amber-800 mb-4">{t('customer.postLoad')}</h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.source')} <span className='text-green-500 text-xs sm:text-sm'>(Start Point -Along with Exact Address)</span></label>
                  <input
                    type="text"
                    name="source"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.destination')} <span className='text-green-500 text-xs sm:text-sm'>(End Point -Along with Exact Address)</span></label>
                  <input
                    type="text"
                    name="destination"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.loadType')} & Description about load</label>
                  <input
                    type="text"
                    name="loadType"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.quantity')} (enter only in tons)</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.estimatedFare')} (₹)</label>
                  <input
                    type="number"
                    name="estimatedFare"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.description')}</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder={t('customer.descriptionPlaceholder')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm sm:text-base px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('customer.estimatedDeliveryDate')}</label>
                  <DatePicker
                    selected={estimatedDeliveryDate}
                    onChange={(date) => setEstimatedDeliveryDate(date)}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t('customer.selectDeliveryDate')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border text-sm sm:text-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {isLoading ? t('common.loading') : t('customer.postLoad')}
                </button>
              </form>
            </div>
          )}

          {/* View My Loads */}
          {!isLoading && activeTab === 'view' && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {getPendingLoads().map((load) => (
                <div key={load.id} className={`bg-white p-4 sm:p-6 rounded-lg shadow-md relative ${
                  load.status === 'assigned' ? 'border-l-4 border-green-500' : ''
                }`}>
                  {/* Only show edit and delete buttons for pending loads, not for assigned loads */}
                  {load.status === 'pending' && editingLoadId !== load.id && (
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() => handleEditLoad(load)}
                        className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                        title={t('customer.editLoad')}
                      >
                        <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLoad(load.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                        title="Cancel Load"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Show edit form if this load is being edited */}
                  {editingLoadId === load.id ? (
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-amber-800 mb-4">{t('customer.editLoad')}</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.source')}</label>
                        <input
                          type="text"
                          value={editFormData.source}
                          onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.destination')}</label>
                        <input
                          type="text"
                          value={editFormData.destination}
                          onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.loadType')}</label>
                        <input
                          type="text"
                          value={editFormData.loadType}
                          onChange={(e) => setEditFormData({ ...editFormData, loadType: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.quantity')}</label>
                        <input
                          type="number"
                          value={editFormData.quantity}
                          onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.estimatedFare')} (₹)</label>
                        <input
                          type="number"
                          value={editFormData.estimatedFare}
                          onChange={(e) => setEditFormData({ ...editFormData, estimatedFare: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">{t('customer.description')}</label>
                        <textarea
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 px-3 py-2 border"
                        />
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleUpdateLoad(load.id)}
                          disabled={isLoading}
                          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 disabled:opacity-50"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-amber-800 mb-4 pr-16">
                        {load.source} - {load.destination}
                      </h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">{t('customer.loadType')}:</span> {load.loadType}</p>
                        <p><span className="font-medium">{t('customer.quantity')}:</span> {load.quantity}</p>
                        <p><span className="font-medium">{t('customer.estimatedFare')}:</span> ₹{load.estimatedFare}</p>
                        <p>
                          <span className="font-medium">{t('customer.status')}:</span>{' '}
                          <span className={`${
                            load.status === 'pending' 
                              ? 'text-orange-600' 
                              : load.status === 'assigned' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                          } font-medium`}>
                            {load.status === 'pending' 
                              ? t('customer.pending')
                              : load.status === 'assigned' 
                                ? t('customer.assigned')
                                : t('customer.completed')}
                          </span>
                        </p>
                        {load.status === 'assigned' && load.assignedDriver && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-md">
                            <p className="font-medium text-amber-800">{t('customer.driverDetails')}</p>
                            <p className="text-sm"><span className="font-medium">{t('auth.name')}:</span> {load.assignedDriver.name}</p>
                            <p className="text-sm"><span className="font-medium">{t('auth.phone')}:</span> {load.assignedDriver.mobile}</p>
                            <p className="text-sm"><span className="font-medium">{t('driver.lorryType')}:</span> {load.assignedDriver.lorryType}</p>
                            <p className="text-sm"><span className="font-medium">{t('driver.maxCapacity')}:</span> {load.assignedDriver.maxCapacity} tons</p>
                            {/* Show driver's average rating */}
                            {load.assignedDriver.averageRating && load.assignedDriver.averageRating > 0 && (
                              <p className="text-sm flex items-center mt-1">
                                <span className="font-medium">{t('rating.averageRating')}:</span>
                                <span className="ml-1 flex items-center text-yellow-600">
                                  {load.assignedDriver.averageRating.toFixed(1)}
                                  <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                                  <span className="text-gray-600 ml-1">({load.assignedDriver.totalRatings || 0})</span>
                                </span>
                              </p>
                            )}
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
                                {t('customer.hideApplicants')}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                {t('customer.viewApplicants')}
                              </>
                            )}
                          </button>
                        )}
                        {load.status === 'assigned' && (
                          <button
                            onClick={() => handleCompleteLoad(load.id)}
                            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex justify-center items-center"
                          >
                            {t('messages.markAsCompleted')}
                          </button>
                        )}
                      </div>
                      {load.status === 'pending' && renderApplicants(load)}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completed Loads */}
          {!isLoading && activeTab === 'completed' && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {getCompletedLoads().map((load) => (
                <div key={load.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-lg sm:text-xl font-semibold text-amber-800 mb-3 sm:mb-4">
                    {load.source} - {load.destination}
                  </h3>
                  <div className="space-y-2 text-sm sm:text-base">
                    <p><span className="font-medium">{t('customer.loadType')}:</span> {load.loadType}</p>
                    <p><span className="font-medium">{t('customer.quantity')}:</span> {load.quantity}</p>
                    <p><span className="font-medium">{t('customer.estimatedFare')}:</span> ₹{load.estimatedFare}</p>
                    <p><span className="font-medium">{t('customer.status')}:</span> {t('customer.completed')}</p>
                    <p><span className="font-medium">{t('customer.completedAt')}:</span> {new Date(load.completedAt || '').toLocaleString()}</p>
                    {load.assignedDriver && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-md">
                        <p className="font-medium text-amber-800">{t('customer.driverDetails')}</p>
                        <p className="text-sm"><span className="font-medium">{t('auth.name')}:</span> {load.assignedDriver.name}</p>
                        <p className="text-sm"><span className="font-medium">{t('auth.phone')}:</span> {load.assignedDriver.mobile}</p>
                        {/* Show driver's average rating */}
                        {load.assignedDriver.averageRating && load.assignedDriver.averageRating > 0 && (
                          <p className="text-sm flex items-center mt-1">
                            <span className="font-medium">{t('rating.averageRating')}:</span>
                            <span className="ml-1 flex items-center text-yellow-600">
                              {load.assignedDriver.averageRating.toFixed(1)}
                              <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-600 ml-1">({load.assignedDriver.totalRatings || 0})</span>
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {load.assignedDriver && (
                    load.customerRated ? (
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
                        {t('rating.rateDriver')}
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {!isLoading && activeTab === 'analytics' && (
            <CustomerAnalytics />
          )}

          {/* Profile Tab */}
          {!isLoading && activeTab === 'profile' && (
            <ProfileManagement currentUser={currentUser} userRole="customer" />
          )}
        </div>
        
        {/* Rating Modal */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          loadId={ratingLoadId}
          targetId={ratingDriverId}
          targetName={ratingDriverName}
          type="driver"
          onSuccess={handleRatingSuccess}
        />
      </div>
    );
  };

  export default CustomerDashboard;


