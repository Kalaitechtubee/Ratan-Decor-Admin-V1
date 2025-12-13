import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, IndianRupee, Download, Calendar } from 'lucide-react';
import { getDashboardStats } from '../../services/Api';

const AnalyticsList = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getDashboardStats(selectedPeriod);
        setDashboard(res.data || {});
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedPeriod]);

  const summary = useMemo(() => {
    const orders = dashboard?.orders || {};
    const users = dashboard?.users || {};
    const enquiries = dashboard?.enquiries || {};
    return {
      revenue: orders.revenue || 0,
      revenueGrowth: orders.revenueGrowth || 0,
      orders: orders.total || 0,
      orderGrowth: orders.orderGrowth || 0,
      users: users.total || 0,
      userGrowth: users.userGrowth || 0,
      enquiries: enquiries.total || 0,
      enquiryGrowth: enquiries.enquiryGrowth || 0,
    };
  }, [dashboard]);

  const chartData = useMemo(() => {
    const recent = dashboard?.orders?.recent || [];
    if (!recent.length) return [];
    const grouped = recent.reduce((acc, order) => {
      const date = new Date(order.orderDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      acc[key] = (acc[key] || 0) + Number(order.total || 0);
      return acc;
    }, {});
    return Object.entries(grouped).map(([key, value]) => ({
      name: key,
      value,
    }));
  }, [dashboard]);

  const stats = {
    monthlyRevenue: summary.revenue,
    revenueGrowth: summary.revenueGrowth,
    pendingOrders: summary.orders,
    orderGrowth: summary.orderGrowth,
    totalUsers: summary.users,
    userGrowth: summary.userGrowth,
    newEnquiries: summary.enquiries,
    enquiryGrowth: summary.enquiryGrowth,
  };

  const metrics = [
    { id: 'revenue', label: 'Revenue', icon: <IndianRupee size={20} />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { id: 'users', label: 'Users', icon: <Users size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 'enquiries', label: 'Enquiries', icon: <BarChart3 size={20} />, color: 'text-green-600', bgColor: 'bg-green-100' }
  ];

  const periods = [
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: '3months', label: 'Last 3 Months' },
    { id: '6months', label: 'Last 6 Months' },
    { id: '1year', label: 'Last Year' }
  ];

  const getMetricData = () => {
    if (!chartData.length) return [];
    switch (selectedMetric) {
      case 'revenue':
        return chartData.map(item => ({ name: item.name, value: item.value }));
      case 'orders':
        return chartData.map(item => ({ name: item.name, value: item.value }));
      case 'users':
        return chartData.map(item => ({ name: item.name, value: item.value }));
      case 'enquiries':
        return chartData.map(item => ({ name: item.name, value: item.value }));
      default:
        return chartData.map(item => ({ name: item.name, value: item.value }));
    }
  };

  const metricData = getMetricData();
  const maxValue = metricData.length ? Math.max(...metricData.map(d => d.value)) : 0;

  if (loading) {
    return <div className="p-6 bg-white rounded-lg shadow-sm">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-6 bg-white rounded-lg shadow-sm text-red-600">Failed to load analytics: {error}</div>;
  }

  return (
    <div className="space-y-6 font-roboto animate-fade-in-left">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg transition-colors bg-primary hover:bg-red-600">
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Metric:</label>
            <div className="flex space-x-2">
              {metrics.map((metric) => (
                <button
                  key={metric.id}
                  onClick={() => setSelectedMetric(metric.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === metric.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metric.icon}
                  <span className="ml-2">{metric.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const currentValue = metric.id === 'revenue' ? stats.monthlyRevenue :
                              metric.id === 'orders' ? stats.pendingOrders :
                              metric.id === 'users' ? stats.totalUsers :
                              stats.newEnquiries;
          
          const growth = metric.id === 'revenue' ? stats.revenueGrowth :
                        metric.id === 'orders' ? stats.orderGrowth :
                        metric.id === 'users' ? stats.userGrowth :
                        stats.enquiryGrowth;

          return (
            <div key={metric.id} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {metric.id === 'revenue' ? `₹${(currentValue / 100000).toFixed(1)}L` : currentValue.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    {growth >= 0 ? (
                      <TrendingUp size={16} className="mr-1 text-green-500" />
                    ) : (
                      <TrendingDown size={16} className="mr-1 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(growth)}%
                    </span>
                    <span className="ml-1 text-sm text-gray-500">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <div className={metric.color}>{metric.icon}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-primary">
            {metrics.find(m => m.id === selectedMetric)?.label} Trend
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>{periods.find(p => p.id === selectedPeriod)?.label}</span>
          </div>
        </div>
        <div className="flex items-end space-x-2 h-64">
          {metricData.map((item, index) => (
            <div key={index} className="flex flex-col flex-1 items-center">
              <div
                className="w-full rounded-t-md transition-all duration-300 bg-primary hover:bg-red-600"
                style={{ height: maxValue ? `${(item.value / maxValue) * 200}px` : '0px' }}
              />
              <span className="mt-2 text-xs text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-primary">Top Performing Products</h3>
          <div className="space-y-4">
            {[
              { name: 'Modern Sofa Set', sales: 45, revenue: 2025000 },
              { name: 'Executive Office Chair', sales: 32, revenue: 576000 },
              { name: 'Queen Size Bed Frame', sales: 28, revenue: 896000 },
              { name: 'Kitchen Cabinet Set', sales: 15, revenue: 1275000 },
              { name: 'Dining Table Set', sales: 22, revenue: 1210000 }
            ].map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex justify-center items-center w-8 h-8 text-sm font-bold text-white rounded-full bg-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sales} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary">₹{(product.revenue / 100000).toFixed(1)}L</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-primary">Customer Insights</h3>
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-medium text-gray-900">User Type Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">General Users</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-gray-900">Architects</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Architects</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-green-600 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-gray-900">Dealers</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dealers</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-purple-600 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-primary">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: 'order', message: 'New order received from John Smith', time: '2 minutes ago', amount: '₹100,300' },
            { type: 'enquiry', message: 'New enquiry about office furniture', time: '15 minutes ago' },
            { type: 'user', message: 'New architect registration pending approval', time: '1 hour ago' },
            { type: 'payment', message: 'Payment received for order #ORD-2024-001', time: '2 hours ago', amount: '₹50,000' },
            { type: 'product', message: 'New product "Dining Table Set" added', time: '3 hours ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'order' ? 'bg-green-400' :
                activity.type === 'enquiry' ? 'bg-blue-400' :
                activity.type === 'user' ? 'bg-yellow-400' :
                activity.type === 'payment' ? 'bg-purple-400' :
                'bg-orange-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  {activity.amount && (
                    <span className="text-xs font-medium text-primary">{activity.amount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
    </div>
  );
};

export default AnalyticsList;
