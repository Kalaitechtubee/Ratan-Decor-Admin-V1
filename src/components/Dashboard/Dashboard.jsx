import React from 'react';
import { Users, MessageSquare, ShoppingCart, IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, Activity } from 'lucide-react';

// Mock data for dashboard stats
const mockDashboardStats = {
  totalUsers: 1250,
  userGrowth: 12.5,
  newEnquiries: 48,
  enquiryGrowth: 8.3,
  pendingOrders: 32,
  orderGrowth: -5.2,
  monthlyRevenue: 1250000,
  revenueGrowth: 15.8
};

// Mock data for chart
const mockChartData = [
  { name: 'Jan', value: 120000 },
  { name: 'Feb', value: 150000 },
  { name: 'Mar', value: 180000 },
  { name: 'Apr', value: 220000 },
  { name: 'May', value: 270000 },
  { name: 'Jun', value: 250000 }
];

function Dashboard() {
  const stats = mockDashboardStats;
  const chartData = mockChartData;

  // StatCard component
  function StatCard({ title, value, growth, icon, color, gradient }) {
    return (
      <div className="group relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Gradient background on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${gradient}`}></div>
        
        <div className="relative flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-3">{value}</p>
            <div className="flex items-center">
              {growth >= 0 ? (
                <div className="flex items-center px-2 py-1 rounded-full bg-emerald-50">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <span className="ml-1 text-sm font-semibold text-emerald-600">
                    {Math.abs(growth)}%
                  </span>
                </div>
              ) : (
                <div className="flex items-center px-2 py-1 rounded-full bg-red-50">
                  <TrendingDown size={14} className="text-red-600" />
                  <span className="ml-1 text-sm font-semibold text-red-600">
                    {Math.abs(growth)}%
                  </span>
                </div>
              )}
              <span className="ml-2 text-xs text-gray-400">vs last month</span>
            </div>
          </div>
          <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="p-8 mx-auto max-w-7xl space-y-8">
        {/* Page Header with gradient accent */}
        <div className="relative">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#ff4747] to-[#ff6b6b] opacity-10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff4747] to-[#ff6b6b] bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 mt-2 text-lg">Monitor your business performance in real-time</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Activity size={16} className="text-[#ff4747]" />
              <span className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid with stagger animation */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            growth={stats.userGrowth}
            icon={<Users size={24} className="text-blue-600" />}
            color="bg-blue-50"
            gradient="bg-gradient-to-br from-blue-400 to-blue-600"
          />
          <StatCard
            title="New Enquiries"
            value={stats.newEnquiries.toString()}
            growth={stats.enquiryGrowth}
            icon={<MessageSquare size={24} className="text-emerald-600" />}
            color="bg-emerald-50"
            gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders.toString()}
            growth={stats.orderGrowth}
            icon={<ShoppingCart size={24} className="text-amber-600" />}
            color="bg-amber-50"
            gradient="bg-gradient-to-br from-amber-400 to-amber-600"
          />
          <StatCard
            title="Monthly Revenue"
            value={`₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`}
            growth={stats.revenueGrowth}
            icon={<IndianRupee size={24} className="text-[#ff4747]" />}
            color="bg-red-50"
            gradient="bg-gradient-to-br from-[#ff4747] to-[#ff6b6b]"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-500 mt-1">Monthly performance overview</p>
              </div>
              <select className="px-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] outline-none bg-white hover:border-[#ff4747] transition-colors">
                <option>Last 6 months</option>
                <option>Last 12 months</option>
              </select>
            </div>
            <div className="flex items-end justify-between space-x-3 h-64 px-2">
              {chartData.map((item, index) => {
                const maxValue = Math.max(...chartData.map(d => d.value));
                const heightPercent = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="group flex flex-col flex-1 items-center">
                    <div className="relative w-full">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 ease-out bg-gradient-to-t from-[#ff4747] to-[#ff6b6b] hover:from-[#ff6b6b] hover:to-[#ff4747] cursor-pointer"
                        style={{ 
                          height: `${(heightPercent / 100) * 200}px`,
                          animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        ₹{(item.value / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <span className="mt-3 text-xs font-medium text-gray-600">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-500 mt-1">Latest updates and actions</p>
              </div>
              <button className="text-sm text-[#ff4747] hover:text-[#ff6b6b] font-medium flex items-center gap-1 transition-colors">
                View all
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { type: 'order', message: 'New order received from John Smith', time: '2 minutes ago', color: 'bg-emerald-400' },
                { type: 'enquiry', message: 'New enquiry about office furniture', time: '15 minutes ago', color: 'bg-blue-400' },
                { type: 'user', message: 'New architect registration pending approval', time: '1 hour ago', color: 'bg-amber-400' },
                { type: 'payment', message: 'Payment received for order #ORD-2024-001', time: '2 hours ago', color: 'bg-purple-400' }
              ].map((activity, index) => (
                <div key={index} className="group flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.color} group-hover:scale-125 transition-transform`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#ff4747] transition-colors">{activity.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500 mt-1">Common tasks and shortcuts</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <button className="group relative p-6 rounded-xl border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-[#ff4747] hover:bg-gradient-to-br hover:from-red-50 hover:to-transparent overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-[#ff4747] transition-colors">
                  <MessageSquare className="text-[#ff4747] group-hover:text-white transition-colors" size={24} />
                </div>
                <p className="text-base font-semibold text-gray-900 group-hover:text-[#ff4747] transition-colors">Create New Enquiry</p>
                <p className="text-sm text-gray-500 mt-1">Start a new customer enquiry</p>
              </div>
            </button>
            <button className="group relative p-6 rounded-xl border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-[#ff4747] hover:bg-gradient-to-br hover:from-red-50 hover:to-transparent overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-[#ff4747] transition-colors">
                  <Users className="text-[#ff4747] group-hover:text-white transition-colors" size={24} />
                </div>
                <p className="text-base font-semibold text-gray-900 group-hover:text-[#ff4747] transition-colors">Add New User</p>
                <p className="text-sm text-gray-500 mt-1">Register a new user account</p>
              </div>
            </button>
            <button className="group relative p-6 rounded-xl border-2 border-dashed border-gray-200 transition-all duration-300 hover:border-[#ff4747] hover:bg-gradient-to-br hover:from-red-50 hover:to-transparent overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-[#ff4747] transition-colors">
                  <ShoppingCart className="text-[#ff4747] group-hover:text-white transition-colors" size={24} />
                </div>
                <p className="text-base font-semibold text-gray-900 group-hover:text-[#ff4747] transition-colors">Create Manual Order</p>
                <p className="text-sm text-gray-500 mt-1">Process a new order manually</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;