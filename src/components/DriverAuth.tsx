import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { authAPI } from '../api';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface DriverAuthProps {
  onSuccess: (user: User) => void;
  onBack: () => void;
}

// Add validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile: string): boolean => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  return { isValid: true, message: '' };
};

const DriverAuth: React.FC<DriverAuthProps> = ({ onSuccess, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mobile: '',
    email: '',
    password: '',
    lorryType: '',
    maxCapacity: ''
  });
  
  // Add document state to store file objects
  const [documents, setDocuments] = useState<{
    license: File | null;
    rc: File | null;
    fitness: File | null;
    insurance: File | null;
    allIndiaPermit: File | null;
    medical: File | null;
  }>({
    license: null,
    rc: null,
    fitness: null,
    insurance: null,
    allIndiaPermit: null,
    medical: null
  });
  
  // Document upload status
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: { loaded: number; total: number; progress: number }
  }>({});
  
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'pending' | 'rejected' | null;
    message: string;
    reason?: string;
  } | null>(null);

  // Handle document file selection
  const handleDocumentChange = (documentType: keyof typeof documents) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${documentType} file is too large. Please upload a file smaller than 5MB.`);
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError(`${documentType} file type not supported. Please upload a JPEG, PNG, or PDF.`);
        return;
      }

      // Clear any previous errors
      setError(null);
      
      setDocuments(prev => ({
        ...prev,
        [documentType]: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Add mobile validation for registration
    if (!isLogin && !validateMobile(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    // since everyone has different password requirements, we can use a function to validate the password
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Use the driver-specific login API
        const response = await authAPI.driverLogin(formData.email, formData.password);

        if (response && response.user) {
          const user = response.user;
          
          // Check the status of the driver
          if (user.status === 'pending') {
            setStatusMessage({
              type: 'pending',
              message: 'Your account is pending approval. Please contact admin.'
            });
            // Store token but don't navigate
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(user));
            setIsLoading(false);
            return;
          }
          
          if (user.status === 'rejected') {
            setStatusMessage({
              type: 'rejected',
              message: 'Your application has been rejected.',
              reason: user.rejectionReason || 'No reason provided.'
            });
            // Store token but don't navigate
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(user));
            setIsLoading(false);
            return;
          }
          
          // For accepted drivers, proceed normally
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Call onSuccess with the user data
          onSuccess(user);
          
          // Navigate to driver dashboard
          navigate('/driver-dashboard', { replace: true });
        } else {
          throw new Error('Invalid response from server');
        }
      } else {
        // Validate required documents
        if (!documents.license || !documents.rc || !documents.fitness || !documents.insurance || !documents.medical) {
          setError('License, RC, Fitness, Insurance, and Medical certificates are required');
          setIsLoading(false);
          return;
        }

        // Show loading message
        setIsLoading(true);
        console.log('Uploading documents to Cloudinary...');
        
        try {
          // Create FormData object for multipart/form-data upload
          const formDataToSend = new FormData();
          
          // Append text fields
          formDataToSend.append('name', formData.name);
          formDataToSend.append('email', formData.email);
          formDataToSend.append('password', formData.password);
          formDataToSend.append('phone', formData.mobile);
          formDataToSend.append('address', formData.address);
          formDataToSend.append('lorryType', formData.lorryType);
          formDataToSend.append('maxCapacity', formData.maxCapacity);
          
          // Append document files
          if (documents.license) formDataToSend.append('license', documents.license);
          if (documents.rc) formDataToSend.append('rc', documents.rc);
          if (documents.fitness) formDataToSend.append('fitness', documents.fitness);
          if (documents.insurance) formDataToSend.append('insurance', documents.insurance);
          if (documents.medical) formDataToSend.append('medical', documents.medical);
          if (documents.allIndiaPermit) formDataToSend.append('allIndiaPermit', documents.allIndiaPermit);
          
          // Debug: Log what we're sending
          console.log('FormData contents:');
          console.log('Text fields:', {
            name: formData.name,
            email: formData.email,
            phone: formData.mobile,
            address: formData.address,
            lorryType: formData.lorryType,
            maxCapacity: formData.maxCapacity
          });
          console.log('Files:', {
            license: documents.license?.name,
            rc: documents.rc?.name,
            fitness: documents.fitness?.name,
            insurance: documents.insurance?.name,
            medical: documents.medical?.name,
            allIndiaPermit: documents.allIndiaPermit?.name
          });
          
          console.log('Sending registration request...');
          
          // Use authAPI to register the driver with FormData
          const response = await authAPI.driverRegister(formDataToSend);
          
          console.log('Registration successful!');

          if (response) {
            // Clear form
            setFormData({
              name: '',
              address: '',
              mobile: '',
              email: '',
              password: '',
              lorryType: '',
              maxCapacity: ''
            });
            
            // Clear documents
            setDocuments({
              license: null,
              rc: null,
              fitness: null,
              insurance: null,
              allIndiaPermit: null,
              medical: null
            });
            
            // Show success message and switch to login
            alert('Registration successful! Please login once admin approves your account.');
            setIsLogin(true);
          }
        } catch (uploadError: any) {
          console.error('Error uploading documents:', uploadError);
          setError(uploadError.response?.data?.msg || 'Error uploading documents. Please try again.');
          setIsLoading(false);
          return;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('This email is already registered. Please login or use a different email.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.msg || 'Please fill all fields correctly');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.status === 404) {
        setError('Driver not found. Please check your email or register.');
      } else if (error.response?.status === 413) {
        setError('Document files are too large. Please compress them and try again.');
      } else {
        setError(error.response?.data?.msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocumentUploadField = (
    documentType: keyof typeof documents,
    label: string,
    required: boolean = true
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 flex items-center">
        <label className="flex w-full cursor-pointer border rounded-md border-gray-300 py-2 px-3 hover:bg-gray-50">
          <input
            type="file"
            className="hidden"
            accept="image/*, application/pdf"
            onChange={handleDocumentChange(documentType)}
            required={required}
          />
          <Upload className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-gray-600 flex-1 truncate">
            {documents[documentType] ? documents[documentType]!.name : 'Choose file...'}
          </span>
        </label>
      </div>
      {documents[documentType] && (
        <p className="mt-1 text-xs text-green-600">
          File selected: {documents[documentType]!.name}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('common.back')}
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              {isLogin ? t('auth.driverLogin') : t('auth.driverRegister')}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {statusMessage && statusMessage.type === 'pending' && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              {statusMessage.message}
            </div>
          )}
          
          {statusMessage && statusMessage.type === 'rejected' && (
            <div className="mb-4">
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {statusMessage.message}
              </div>
              {statusMessage.reason && (
                <div className="mt-2 p-4 bg-gray-100 border border-gray-300 text-gray-700 rounded">
                  <p className="font-semibold">Reason:</p>
                  <p>{statusMessage.reason}</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                {/* Personal Information Section */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <textarea
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LORRY DETAILS(Company & No.of tyres)</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        value={formData.lorryType}
                        onChange={(e) => setFormData({ ...formData, lorryType: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maximum Capacity (tons)</label>
                      <input
                        type="number"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        value={formData.maxCapacity}
                        onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Documents Section */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Required Documents</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please upload the following documents. Required fields are marked with an asterisk (*).
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {renderDocumentUploadField('license', 'Driver License')}
                    {renderDocumentUploadField('rc', 'RC Book')}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {renderDocumentUploadField('fitness', 'Fitness Certificate')}
                    {renderDocumentUploadField('insurance', 'Insurance Certificate')}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {renderDocumentUploadField('medical', 'Medical Certificate')}
                    {renderDocumentUploadField('allIndiaPermit', 'All India Permit', false)}
                  </div>
                </div>
              </>
            )}

            {/* Account Information Section - Both Login and Register */}
            <div className={!isLogin ? "border-b border-gray-200 pb-4 mb-4" : ""}>
              <h3 className={!isLogin ? "text-lg font-medium text-gray-900 mb-3" : "sr-only"}>Account Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={isLogin ? "" : "col-span-1"}>
                  <label className="block text-sm font-medium text-gray-700">{t('auth.email')}</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className={isLogin ? "" : "col-span-1"}>
                  <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                  <input
                    type="password"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.email) {
                      setError('Please enter your email first');
                      return;
                    }
                    navigate(`/forgot-password?type=driver&email=${encodeURIComponent(formData.email)}`);
                  }}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? t('common.loading') : t('common.loading')}
                  </div>
                ) : (
                  isLogin ? t('common.login') : t('common.register')
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setStatusMessage(null);
                setFormData({
                  name: '',
                  address: '',
                  mobile: '',
                  email: '',
                  password: '',
                  lorryType: '',
                  maxCapacity: ''
                });
                // Clear document uploads when switching modes
                setDocuments({
                  license: null,
                  rc: null,
                  fitness: null,
                  insurance: null,
                  allIndiaPermit: null,
                  medical: null
                });
              }}
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverAuth;

