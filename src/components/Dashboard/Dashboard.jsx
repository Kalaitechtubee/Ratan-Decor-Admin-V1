import React, { useState, useEffect } from 'react';
import { getAllUsers, getAllEnquiries, getCategories } from '../../services/Api';
import adminOrderApi from '../Orders/adminOrderApi';
import appointmentApi from '../VideoCallAppointmentsList/appointmentApi';
import { Users, MessageSquare, ShoppingCart, Activity, Briefcase, UserCheck, Video, Package } from 'lucide-react';

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
    userGrowth: 0,
    enquiryGrowth: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
    monthlyRevenue: 0
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        // Parallel data fetching
        const [usersRes, enquiriesRes, ordersRes, appointmentsRes, categoriesRes] = await Promise.all([
          getAllUsers({ includeStaff: 'true', limit: 1 }),
          getAllEnquiries({ limit: 1 }),
          adminOrderApi.getOrders({ limit: 1 }),
          appointmentApi.getAllAppointments({ limit: 1 }),
          getCategories({ includeSubcategories: true, limit: 100 })
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

        setStats({
          totalCustomers: totalUsers,
          newEnquiries: totalEnquiries,
          totalOrders: totalOrdersCount,
          pendingOrders,
          videoCallAppointments,
          architectsCount,
          dealersCount,
          customersCount,
          userGrowth: 0, // Placeholder
          enquiryGrowth: 0, // Placeholder
          orderGrowth: 0, // Placeholder
          revenueGrowth: 0,
          monthlyRevenue: 0
        });

        // Process categories for counts
        if (categoriesRes.success) {
          const processedCategories = (categoriesRes.categories || []).map(cat => {
            const subCats = cat.subCategories || [];
            const subProductCount = subCats.reduce((sum, sub) => sum + (sub.productCount || 0), 0);
            return {
              ...cat,
              totalProductCount: (cat.productCount || 0) + subProductCount,
              subCategories: subCats
            };
          });
          setCategoryStats(processedCategories);
        }

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

        {/* Unified Dashboard Metrics */}
        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total End Consumers"
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
              title="Order Enquiries"
              value={stats.newEnquiries.toString()}
              icon={<MessageSquare className="text-emerald-600" />}
              color="bg-emerald-50"
              gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
            />

            <StatCard
              title="Video Appointments"
              value={stats.videoCallAppointments.toString()}
              icon={<Video className="text-purple-600" />}
              color="bg-purple-50"
              gradient="bg-gradient-to-br from-purple-400 to-purple-600"
            />
            <StatCard
              title="Architect / Interior Designer"
              value={stats.architectsCount.toString()}
              icon={<Briefcase className="text-indigo-600" />}
              color="bg-indigo-50"
              gradient="bg-gradient-to-br from-indigo-400 to-indigo-600"
            />
            <StatCard
              title="Dealer / Distributor"
              value={stats.dealersCount.toString()}
              icon={<UserCheck className="text-pink-600" />}
              color="bg-pink-50"
              gradient="bg-gradient-to-br from-pink-400 to-pink-600"
            />
            <StatCard
              title="End Consumer"
              value={stats.customersCount.toString()}
              icon={<Users className="text-teal-600" />}
              color="bg-teal-50"
              gradient="bg-gradient-to-br from-teal-400 to-teal-600"
            />
          </div>
        </section>

        {/* Category Inventory Overview */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <SectionHeader
            title="Category Inventory"
            subtitle="Main category product counts"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryStats.map((category) => (
              <div
                key={category.id}
                className="group p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#ff4747]/20 hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[#ff4747]">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-[#ff4747] transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {category.totalProductCount} Total Products
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;