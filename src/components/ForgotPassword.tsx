import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';

interface ForgotPasswordProps {
  userType?: 'customer' | 'driver' | 'admin';
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ userType: propUserType, onBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<'customer' | 'driver' | 'admin'>(propUserType || 'customer');
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Detect user type and email from URL params
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const emailParam = searchParams.get('email');
    
    console.log('=== FORGOT PASSWORD PAGE LOADED ===');
    console.log('User Type from URL:', typeParam);
    console.log('Email from URL:', emailParam);
    
    if (typeParam === 'customer' || typeParam === 'driver' || typeParam === 'admin') {
      setUserType(typeParam);
    }
    
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      console.log('Setting email:', decodedEmail);
      setEmail(decodedEmail);
    }
  }, [searchParams]);

  const handleSendOTP = async () => {
    console.log('=== SEND OTP BUTTON CLICKED ===');
    console.log('Email:', email);
    console.log('User Type:', userType);
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Sending OTP request to backend...');
      const response = await axios.post(`${API_BASE_URL}/password-reset/request`, {
        email,
        userType
      });

      console.log('✓ OTP request successful:', response.data);
      
      // Don't show OTP in frontend - only log to console for development
      if (response.data.resetToken) {
        console.log('📧 OTP CODE (for development):', response.data.resetToken);
      }
      
      setSuccess(`6-digit OTP sent to ${email}. Please check your email.`);
      setStep('verify');
    } catch (err: any) {
      console.error('✗ OTP request failed:', err);
      console.error('Error response:', err.response?.data);
      
      if (err.response?.status === 404) {
        setError('Email not found. Please check your email or register first.');
      } else {
        setError(err.response?.data?.msg || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    console.log('=== VERIFY OTP BUTTON CLICKED ===');
    console.log('OTP entered:', token);

    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Verifying OTP...');
      // Verify OTP by calling backend
      const response = await axios.post(`${API_BASE_URL}/password-reset/verify-otp`, {
        token,
        email,
        userType
      });

      console.log('✓ OTP verified successfully:', response.data);
      setSuccess('OTP verified! Please set your new password.');
      setStep('reset');
    } catch (err: any) {
      console.error('✗ OTP verification failed:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.msg || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    console.log('=== RESET PASSWORD FORM SUBMITTED ===');
    console.log('OTP entered:', token);
    console.log('New password length:', newPassword.length);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending password reset request...');
      const response = await axios.post(`${API_BASE_URL}/password-reset/reset`, {
        token,
        newPassword,
        userType
      });

      console.log('✓ Password reset successful:', response.data);
      setSuccess(response.data.msg);
      setTimeout(() => {
        navigate(userType === 'driver' ? '/driver-login' : userType === 'admin' ? '/admin' : '/login');
      }, 2000);
    } catch (err: any) {
      console.error('✗ Password reset failed:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t('common.back')}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {step === 'request' ? t('forgotPassword.title') : step === 'verify' ? t('forgotPassword.verifyOTP') : t('forgotPassword.resetPassword')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              {step === 'request' 
                ? t('forgotPassword.sendOTPDesc')
                : step === 'verify'
                ? t('forgotPassword.verifyOTPDesc')
                : t('forgotPassword.resetPasswordDesc')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
              {error.includes('Email not found') && (
                <button
                  onClick={onBack}
                  className="block mt-2 text-xs sm:text-sm underline hover:text-red-800"
                >
                  Go back to login
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          {step === 'request' ? (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm px-3 sm:px-4 py-2 sm:py-3 text-gray-700 text-sm sm:text-base"
                  value={email}
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('forgotPassword.sendOTPDesc')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('forgotPassword.sendOTP')
                )}
              </button>
            </div>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">{t('forgotPassword.verifyOTP')}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-center text-xl sm:text-2xl tracking-widest font-mono"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('forgotPassword.otpPlaceholder')}
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">{t('forgotPassword.enterOTP')} {email}</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    {t('common.loading')}
                  </div>
                ) : (
                  t('forgotPassword.verifyOTPButton')
                )}
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full text-xs sm:text-sm text-orange-600 hover:text-orange-700 underline"
              >
                {t('forgotPassword.resendOTP')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">{t('auth.newPassword')}</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('forgotPassword.newPasswordPlaceholder')}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? t('common.loading') : t('forgotPassword.resetPasswordButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;





