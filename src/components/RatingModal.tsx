import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, API_URL } from '../config';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  targetId: string;
  targetName: string;
  type: 'customer' | 'driver';
  onSuccess: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  loadId,
  targetId,
  targetName,
  type,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingExisting, setIsFetchingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing rating when modal opens
  useEffect(() => {
    if (isOpen && loadId) {
      fetchExistingRating();
    } else {
      // Reset when modal closes
      setRating(0);
      setReview('');
      setIsEditing(false);
      setError(null);
    }
  }, [isOpen, loadId]);

  const fetchExistingRating = async () => {
    setIsFetchingExisting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ratings/load/${loadId}`, {
        headers: { 'x-auth-token': token }
      });

      if (response.data) {
        const existingRating = type === 'driver' 
          ? response.data.customerRating 
          : response.data.driverRating;
        
        if (existingRating && existingRating.rating) {
          setRating(existingRating.rating);
          setReview(existingRating.review || '');
          setIsEditing(true);
        }
      }
    } catch (err: any) {
      // If 404, no existing rating - that's fine
      if (err.response?.status !== 404) {
        console.error('Error fetching existing rating:', err);
      }
    } finally {
      setIsFetchingExisting(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'driver' 
        ? '/api/ratings/customer-rate-driver'
        : '/api/ratings/driver-rate-customer';

      const payload = type === 'driver'
        ? { loadId, driverId: targetId, rating, review }
        : { loadId, customerId: targetId, rating, review };

      await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: { 'x-auth-token': token }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to submit rating');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
            {isEditing 
              ? t('rating.updateRating')
              : (type === 'driver' ? t('rating.rateDriver') : t('rating.rateCustomer'))
            }
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {isFetchingExisting ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  {isEditing ? 'Editing rating for: ' : 'Rating for: '}
                  <span className="font-semibold">{targetName}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">{t('rating.yourRating')}</label>
                <div className="flex space-x-1 sm:space-x-2 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`h-8 w-8 sm:h-10 sm:w-10 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('rating.review')}
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base"
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={t('rating.writeReview')}
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 sm:py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={rating === 0 || isLoading}
                  className="flex-1 py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('common.loading') : (isEditing ? t('rating.updateRating') : t('rating.submitRating'))}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingModal;



