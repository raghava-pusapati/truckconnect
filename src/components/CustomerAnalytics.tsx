import React, { useEffect, useState } from 'react';
import { TrendingUp, Package, DollarSign, Clock, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';

interface AnalyticsData {
  totalLoads: number;
  loadsByStatus: {
    pending: number;
    assigned: number;
    completed: number;
    cancelled: number;
  };
  totalSpending: number;
  avgDeliveryTime: number;
  monthlyData: Array<{
    _id: { year: number; month: number };
    spending: number;
    count: number;
  }>;
}

const CustomerAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/analytics/customer`, {
        headers: { 'x-auth-token': token }
      });
      setData(response.data);
      
      // Extract unique years from monthly data
      if (response.data.monthlyData && response.data.monthlyData.length > 0) {
        const years = [...new Set(response.data.monthlyData.map((item: any) => item._id.year))].sort((a, b) => b - a);
        setAvailableYears(years);
        // Set current year or latest year if current year has no data
        if (!years.includes(new Date().getFullYear())) {
          setSelectedYear(years[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Failed to load analytics'}
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Filter data by selected year and show all 12 months
  const filteredMonthlyData = data.monthlyData.filter(item => item._id.year === selectedYear);
  
  // Create data for all 12 months
  const chartData = monthNames.map((month, index) => {
    const monthData = filteredMonthlyData.find(item => item._id.month === index + 1);
    return {
      name: month,
      spending: monthData?.spending || 0,
      loads: monthData?.count || 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('analytics.dashboard')}</h2>
        <BarChart3 className="h-8 w-8 text-orange-600" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('analytics.totalLoads')}</p>
              <p className="text-3xl font-bold mt-2">{data.totalLoads}</p>
            </div>
            <Package className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('analytics.totalSpending')}</p>
              <p className="text-3xl font-bold mt-2">₹{data.totalSpending.toLocaleString()}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t('customer.completed')}</p>
              <p className="text-3xl font-bold mt-2">{data.loadsByStatus.completed}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">{t('analytics.avgDeliveryTime')}</p>
              <p className="text-3xl font-bold mt-2">{data.avgDeliveryTime.toFixed(1)} days</p>
            </div>
            <Clock className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.loadsByStatus')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{data.loadsByStatus.pending}</p>
            <p className="text-sm text-gray-600 mt-1">{t('customer.pending')}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{data.loadsByStatus.assigned}</p>
            <p className="text-sm text-gray-600 mt-1">{t('customer.assigned')}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{data.loadsByStatus.completed}</p>
            <p className="text-sm text-gray-600 mt-1">{t('customer.completed')}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.loadsByStatus.cancelled}</p>
            <p className="text-sm text-gray-600 mt-1">{t('customer.cancelled')}</p>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('analytics.monthlyTrends')}</h3>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spending" fill="#f97316" name="Spending (₹)" />
            <Bar dataKey="loads" fill="#3b82f6" name="Loads" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomerAnalytics;






