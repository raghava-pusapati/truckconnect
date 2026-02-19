import React, { useEffect, useState } from 'react';
import { Users, Truck, Package, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';

interface AnalyticsData {
  totalCustomers: number;
  totalDrivers: number;
  totalLoads: number;
  driversByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  loadsByStatus: {
    pending: number;
    assigned: number;
    completed: number;
    cancelled: number;
  };
  totalRevenue: number;
  platformRevenue: number;
  monthlyLoads: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    count: number;
  }>;
}

const AdminAnalytics: React.FC = () => {
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
      const response = await axios.get(`${API_BASE_URL}/analytics/admin`, {
        headers: { 'x-auth-token': token }
      });
      setData(response.data);
      
      // Extract unique years from monthly data
      if (response.data.monthlyRevenue && response.data.monthlyRevenue.length > 0) {
        const years = [...new Set(response.data.monthlyRevenue.map((item: any) => item._id.year))].sort((a, b) => b - a);
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
  const filteredMonthlyRevenue = data.monthlyRevenue.filter(item => item._id.year === selectedYear);
  const filteredMonthlyLoads = data.monthlyLoads.filter(item => item._id.year === selectedYear);
  
  // Create data for all 12 months
  const revenueChartData = monthNames.map((month, index) => {
    const monthData = filteredMonthlyRevenue.find(item => item._id.month === index + 1);
    return {
      name: month,
      revenue: monthData?.revenue || 0
    };
  });

  const loadsChartData = monthNames.map((month, index) => {
    const monthData = filteredMonthlyLoads.find(item => item._id.month === index + 1);
    return {
      name: month,
      loads: monthData?.count || 0
    };
  });

  const loadStatusData = [
    { name: 'Pending', value: data.loadsByStatus.pending, color: '#fbbf24' },
    { name: 'Assigned', value: data.loadsByStatus.assigned, color: '#3b82f6' },
    { name: 'Completed', value: data.loadsByStatus.completed, color: '#10b981' },
    { name: 'Cancelled', value: data.loadsByStatus.cancelled, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.analytics')}</h2>
        <BarChart3 className="h-8 w-8 text-orange-600" />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('analytics.totalCustomers')}</p>
              <p className="text-3xl font-bold mt-2">{data.totalCustomers}</p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">{t('analytics.totalDrivers')}</p>
              <p className="text-3xl font-bold mt-2">{data.totalDrivers}</p>
            </div>
            <Truck className="h-12 w-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">{t('analytics.totalLoads')}</p>
              <p className="text-3xl font-bold mt-2">{data.totalLoads}</p>
            </div>
            <Package className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('analytics.totalRevenue')}</p>
              <p className="text-3xl font-bold mt-2">₹{data.totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-200" />
          </div>
        </div>
      </div>

      {/* Driver Status */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('analytics.driverApplications')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{data.driversByStatus.pending}</p>
            <p className="text-sm text-gray-600 mt-1">{t('customer.pending')}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{data.driversByStatus.accepted}</p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.accepted')}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{data.driversByStatus.rejected}</p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.rejected')}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Load Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('analytics.loadsDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={loadStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {loadStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Loads */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('analytics.monthlyLoads')}</h3>
            {availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={loadsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="loads" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('analytics.revenueTrends')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name={t('analytics.totalRevenue') + ' (₹)'} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('analytics.platformSummary')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">₹{data.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.totalTransactionValue')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {data.totalLoads > 0 ? (data.totalRevenue / data.totalLoads).toFixed(0) : 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.avgLoadValue')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {data.totalLoads > 0 ? ((data.loadsByStatus.completed / data.totalLoads) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.completionRate')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {data.totalDrivers > 0 ? ((data.driversByStatus.accepted / data.totalDrivers) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-sm text-gray-600 mt-1">{t('analytics.driverAcceptanceRate')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;












