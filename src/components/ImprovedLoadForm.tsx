import React, { useState } from 'react';
import { Package, MapPin, Truck, DollarSign } from 'lucide-react';

interface LoadFormProps {
  onSubmit: (loadData: any) => Promise<void>;
  onCancel: () => void;
}

const ImprovedLoadForm: React.FC<LoadFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    loadType: '',
    quantity: '',
    estimatedFare: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit({
        ...formData,
        quantity: Number(formData.quantity),
        estimatedFare: Number(formData.estimatedFare)
      });
      
      // Reset form
      setFormData({
        source: '',
        destination: '',
        loadType: '',
        quantity: '',
        estimatedFare: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to post load');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Post a New Load</h2>
        <p className="text-sm sm:text-base text-gray-600">Fill in the details to find the perfect driver for your shipment</p>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Source and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Pickup Location
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="Enter pickup city"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Delivery Location
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="Enter delivery city"
            />
          </div>
        </div>

        {/* Load Type */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
            <Package className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Load Type
          </label>
          <select
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg"
            value={formData.loadType}
            onChange={(e) => setFormData({ ...formData, loadType: e.target.value })}
          >
            <option value="">Select load type</option>
            <option value="General Cargo">General Cargo</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Food Items">Food Items</option>
            <option value="Construction Materials">Construction Materials</option>
            <option value="Textiles">Textiles</option>
            <option value="Machinery">Machinery</option>
            <option value="Chemicals">Chemicals</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Quantity and Fare */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              <Truck className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Quantity (in tons)
            </label>
            <input
              type="number"
              required
              min="0.1"
              step="0.1"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g., 5.5"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              <DollarSign className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Estimated Fare (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-lg"
              value={formData.estimatedFare}
              onChange={(e) => setFormData({ ...formData, estimatedFare: e.target.value })}
              placeholder="e.g., 15000"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 border-2 border-gray-300 rounded-lg shadow-sm text-sm sm:text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </span>
            ) : (
              'Post Load'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImprovedLoadForm;


