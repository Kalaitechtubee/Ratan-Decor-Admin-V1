import React, { useState, useEffect } from 'react';
import { getAllUsers, getAllEnquiries, getUserTypes, getProducts } from '../../services/Api';
import adminOrderApi from '../Orders/adminOrderApi';
import appointmentApi from '../VideoCallAppointmentsList/appointmentApi';
import { Users, MessageSquare, ShoppingCart, TrendingUp, TrendingDown, Activity, Video, Briefcase, UserCheck, Layers, Package, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newEnquiries: 0,
    totalOrders: 0,
    pendingOrders: 0,
    videoCallAppointments: 0,
    architectsCount: 0,
    dealersCount: 0,
    customersCount: 0,
    businessTypesCount: 0,
    productsCount: 0,
    userGrowth: 0,
    enquiryGrowth: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        // Parallel data fetching
        const [usersRes, enquiriesRes, ordersRes, appointmentsRes, userTypesRes, productsRes] = await Promise.all([
          getAllUsers({ includeStaff: 'true', limit: 1 }),
          getAllEnquiries({ limit: 1 }),
          adminOrderApi.getOrders({ limit: 1 }),
          appointmentApi.getAllAppointments({ limit: 1 }),
          getUserTypes(),
          getProducts({ limit: 1 })
        ]);

        // Calculate stats
        const totalUsers = usersRes.pagination?.totalItems || 0;
        const totalEnquiries = enquiriesRes.pagination?.totalItems || enquiriesRes.pagination?.total || 0;
        const videoCallAppointments = appointmentsRes.pagination?.totalItems || 0;

        // Extract role counts from usersRes.summary.roleBreakdown
        const roleBreakdown = usersRes.summary?.roleBreakdown || {};
        const architectsCount = roleBreakdown['Architect'] || 0;
        const dealersCount = roleBreakdown['Dealer'] || 0;
        const customersCount = roleBreakdown['customer'] || 0;

        // Use orderSummary for filtered counts
        const totalOrdersCount = ordersRes.orderSummary?.totalOrders || ordersRes.pagination?.total || 0;
        const pendingOrders = ordersRes.orderSummary?.statusBreakdown?.['Pending']?.count || 0;
        const businessTypesCount = userTypesRes.userTypes?.length || 0;
        const productsCount = productsRes.pagination?.total || 0;

        setStats({
          totalCustomers: totalUsers,
          newEnquiries: totalEnquiries,
          totalOrders: totalOrdersCount,
          pendingOrders,
          videoCallAppointments,
          architectsCount,
          dealersCount,
          customersCount,
          businessTypesCount,
          productsCount,
          userGrowth: 0, // Placeholder
          enquiryGrowth: 0, // Placeholder
          orderGrowth: 0, // Placeholder
          revenueGrowth: 0,
          monthlyRevenue: 0
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // StatCard component
  function StatCard({ title, value, icon, color, gradient, size = "normal" }) {
    const isLarge = size === "large";

    return (
      <div className={`group relative p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}>
        {/* Subtle background glow on hover */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${gradient} blur-2xl`}></div>

        <div className="relative flex justify-between items-center">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
            <p className={`${isLarge ? 'text-4xl' : 'text-3xl'} font-extrabold text-gray-900 mb-0 transition-all duration-300 group-hover:translate-x-1`}>
              {value}
            </p>
          </div>
          <div className={`flex items-center justify-center ${isLarge ? 'w-16 h-16' : 'w-14 h-14'} rounded-2xl ${color} shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            {React.cloneElement(icon, { size: isLarge ? 28 : 24 })}
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${gradient}`}></div>
      </div>
    );
  }

  const UserDistributionCard = ({ stats }) => {
    const total = stats.architectsCount + stats.dealersCount + stats.customersCount;
    const getWidth = (count) => total > 0 ? (count / total) * 100 : 0;
    const getPercent = (count) => total > 0 ? ((count / total) * 100).toFixed(1) : 0;

    const items = [
      { label: 'Architects', count: stats.architectsCount, icon: <Briefcase size={18} />, color: 'bg-indigo-500', iconColor: 'text-indigo-500' },
      { label: 'Dealers', count: stats.dealersCount, icon: <UserCheck size={18} />, color: 'bg-purple-500', iconColor: 'text-purple-500' },
      { label: 'Customers', count: stats.customersCount, icon: <Users size={18} />, color: 'bg-teal-500', iconColor: 'text-teal-500' },
    ];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 h-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <BarChart3 className="text-indigo-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">User Distribution</h2>
        </div>

        <div className="space-y-8">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <div className={`flex items-center gap-2 font-semibold ${item.iconColor}`}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <div className="font-bold text-gray-900">
                  {item.count.toLocaleString()} <span className="text-gray-400 font-medium ml-1">({getPercent(item.count)}%)</span>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${getWidth(item.count)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-50 flex justify-between items-center text-lg font-bold">
          <span className="text-gray-500">Total Users</span>
          <span className="text-2xl text-gray-900">{total.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <div className="w-1 h-6 bg-[#ff4747] rounded-full"></div>
        {title}
      </h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1 ml-3">{subtitle}</p>}
    </div>
  );

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
          </div>
        </div>

        {/* Key Business Metrics */}
        <section>
          <SectionHeader
            title="Business Performance"
            subtitle="Core operational metrics and customer growth"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers.toLocaleString()}
              size="large"
              icon={<Users className="text-blue-600" />}
              color="bg-blue-50"
              gradient="bg-gradient-to-br from-blue-400 to-blue-600"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders.toString()}
              size="large"
              icon={<ShoppingCart className="text-amber-600" />}
              color="bg-amber-50"
              gradient="bg-gradient-to-br from-amber-400 to-amber-600"
            />
            <StatCard
              title="Pending Orders"
              value={stats.pendingOrders.toString()}
              icon={<Activity className="text-rose-600" />}
              color="bg-rose-50"
              gradient="bg-gradient-to-br from-rose-400 to-rose-600"
            />
            <StatCard
              title="New Enquiries"
              value={stats.newEnquiries.toString()}
              icon={<MessageSquare className="text-emerald-600" />}
              color="bg-emerald-50"
              gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
            />
          </div>
        </section>

        {/* Mid Section: User Distribution & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Distribution - List style as per requested Image */}
          <div className="lg:col-span-2">
            <UserDistributionCard stats={stats} />
          </div>

          {/* Operational Metrics & Insights */}
          <section className="space-y-8">
            <section>
              <SectionHeader
                title="System Insights"
                subtitle="Service status overview"
              />
              <div className="space-y-6">
                <StatCard
                  title="Video Appointments"
                  value={stats.videoCallAppointments.toString()}
                  icon={<Video className="text-purple-600" />}
                  color="bg-purple-50"
                  gradient="bg-gradient-to-br from-purple-400 to-purple-600"
                />
              </div>
            </section>

            {/* Quick Summary Card */}
            <div className="p-6 bg-gradient-to-br from-[#ff4747] to-[#ff6b6b] rounded-2xl shadow-lg text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Workspace Activity</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  You have {stats.pendingOrders} pending orders that require immediate attention.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 w-fit px-3 py-1 rounded-full">
                  <Activity size={12} />
                  System Active
                </div>
              </div>
              <Activity className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;