import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { profileAPI } from '../api';

interface ProfileManagementProps {
  currentUser: any;
  userRole: 'customer' | 'driver' | 'admin';
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  lorryType?: string;
  maxCapacity?: string;
  profilePicture?: string;
  averageRating?: number;
  totalRatings?: number;
}

interface Rating {
  _id: string;
  customerRating?: { rating: number; review?: string; ratedAt: string };
  driverRating?: { rating: number; review?: string; ratedAt: string };
  customerId?: { name: string };
  driverId?: { name: string };
  loadId?: { source: string; destination: string };
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({ currentUser, userRole }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    lorryType: '',
    maxCapacity: ''
  });
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchRatings();
    fetchRatingBreakdown();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileAPI.getProfile();
      console.log('Profile data:', data);
      setProfile(data);
      setEditData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        lorryType: data.lorryType || '',
        maxCapacity: data.maxCapacity || ''
      });
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error(t('messages.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const data = await profileAPI.getMyRatings();
      setRatings(data);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  };

  const fetchRatingBreakdown = async () => {
    try {
      const data = await profileAPI.getRatingBreakdown();
      setRatingBreakdown(data);
    } catch (error) {
      console.error('Failed to fetch rating breakdown:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const updateData = {
        name: editData.name,
        phone: editData.phone,
        ...(userRole === 'driver' && {
          address: editData.address,
          lorryType: editData.lorryType,
          maxCapacity: editData.maxCapacity
        })
      };

      const updated = await profileAPI.updateProfile(updateData, userRole);
      setProfile(updated);
      setIsEditing(false);
      toast.success(t('messages.profileUpdated'));
    } catch (error) {
      toast.error(t('messages.failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, JPEG, or PNG)');
      return;
    }

    // Validate file size (2MB max for faster upload)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB for faster upload');
      return;
    }

    try {
      setUploadingPicture(true);
      console.log('Uploading file:', file.name, 'Size:', (file.size / 1024).toFixed(2) + 'KB', 'Type:', file.type);
      
      const formData = new FormData();
      formData.append('profilePicture', file);

      console.log('Sending upload request...');
      const startTime = Date.now();
      const response = await profileAPI.uploadProfilePicture(formData);
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('Upload completed in', uploadTime, 'seconds');
      console.log('Upload response:', response);
      
      setProfile(prev => prev ? { ...prev, profilePicture: response.profilePictureUrl } : null);
      toast.success(t('messages.pictureUploaded'));
      
      // Clear the input so the same file can be uploaded again if needed
      e.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.msg || error.message || 'Failed to upload picture';
      toast.error(errorMsg);
    } finally {
      setUploadingPicture(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="relative flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-gray-300">
              {uploadingPicture ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-500"></div>
                  <span className="text-xs mt-2">Uploading...</span>
                </div>
              ) : profile?.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl text-gray-400">👤</span>
              )}
            </div>
            <label className={`absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 sm:p-3 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg ${uploadingPicture ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePictureUpload}
                className="hidden"
                disabled={uploadingPicture}
              />
              <span className="text-lg sm:text-xl">{uploadingPicture ? '⏳' : '📷'}</span>
            </label>
          </div>
          <div className="flex-1 min-w-0 pt-0 sm:pt-2 text-center sm:text-left w-full">
            <h2 className="text-xl sm:text-2xl font-bold truncate">{profile?.name}</h2>
            <p className="text-sm sm:text-base text-gray-600 truncate">{profile?.email}</p>
            {profile?.averageRating !== undefined && (
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <span className="text-yellow-500">⭐</span>
                <span className="font-semibold">{profile.averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({profile.totalRatings} {t('rating.totalRatings')})</span>
              </div>
            )}
            {!uploadingPicture && (
              <p className="text-xs text-gray-500 mt-2">Click camera icon to upload photo (Max 2MB)</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0 text-sm sm:text-base w-full sm:w-auto"
          >
            {isEditing ? t('common.cancel') : t('profile.editProfile')}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4">{t('profile.editProfile')}</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.name')}</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.phone')}</label>
              <input
                type="text"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm sm:text-base"
              />
            </div>
            {userRole === 'driver' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('auth.address')}</label>
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('driver.lorryType')}</label>
                  <input
                    type="text"
                    value={editData.lorryType}
                    onChange={(e) => setEditData({ ...editData, lorryType: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('driver.maxCapacity')}</label>
                  <input
                    type="text"
                    value={editData.maxCapacity}
                    onChange={(e) => setEditData({ ...editData, maxCapacity: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </>
            )}
            <button
              onClick={handleUpdateProfile}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Personal Info */}
      {!isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">{t('profile.personalInfo')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t('auth.name')}</p>
              <p className="font-medium">{profile?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('auth.email')}</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('auth.phone')}</p>
              <p className="font-medium">{profile?.phone}</p>
            </div>
            {userRole === 'driver' && profile?.address && (
              <div>
                <p className="text-sm text-gray-500">{t('auth.address')}</p>
                <p className="font-medium">{profile.address}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vehicle Info (Driver Only) */}
      {userRole === 'driver' && !isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">{t('profile.vehicleInfo')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t('driver.lorryType')}</p>
              <p className="font-medium">{profile?.lorryType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('driver.maxCapacity')}</p>
              <p className="font-medium">{profile?.maxCapacity || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rating Breakdown */}
      {Object.keys(ratingBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">{t('profile.ratingBreakdown')}</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-12">{star} ⭐</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full"
                    style={{
                      width: `${profile?.totalRatings ? (ratingBreakdown[star] / profile.totalRatings) * 100 : 0}%`
                    }}
                  />
                </div>
                <span className="w-12 text-right">{ratingBreakdown[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">{t('profile.recentReviews')}</h3>
        {ratings.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('profile.noReviews')}</p>
        ) : (
          <div className="space-y-4">
            {ratings.slice(0, 5).map(rating => {
              const ratingData = userRole === 'driver' ? rating.customerRating : rating.driverRating;
              const raterName = userRole === 'driver' ? rating.customerId?.name : rating.driverId?.name;
              
              return (
                <div key={rating._id} className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{raterName}</p>
                      <p className="text-sm text-gray-500">
                        {rating.loadId?.source} → {rating.loadId?.destination}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">{ratingData?.rating}</span>
                    </div>
                  </div>
                  {ratingData?.review && (
                    <p className="text-gray-700">{ratingData.review}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ratingData?.ratedAt || '').toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManagement;


