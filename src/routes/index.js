import Dashboard from '../components/Dashboard/Dashboard';
import EnquiriesList from '../components/Enquiries/EnquiriesList';
import UsersList from '../components/Users/UsersList'; // Keep file path same
import ProductsList from '../components/Products/ProductsList';
import OrdersList from '../components/Orders/OrdersList';
import Categories from '../components/Category/Category';
import BusinessTypes from '../components/UserTypes/UserTypes'; // ✅ same file, renamed usage
import NotFound from '../components/Common/NotFound';
import SeoManagement from '../components/Seo/SeoManagement';
import VideoCallAppointmentsList from '../components/VideoCallAppointmentsList/VideoCallAppointmentsList';
import StaffRegistration from '../components/Staff/StaffRegistration';
import StaffList from '../components/Staff/StaffList';
import ContactsList from '../components/Contact/ContactsList';

import Sliders from '../components/Sliders/Sliders';
import Profile from '../components/Profile/Profile';

// Public routes
export const publicRoutes = [
  {
    path: '/login',
    element: 'Login',
    title: 'Login',
    isPublic: true,
  },
  {
    path: '/contact',
    element: ContactsList,
    title: 'Contact Us',
    isPublic: true,
  },
];

// Protected routes - Updated requiredAccess to match role table
export const protectedRoutes = [
  {
    path: '/dashboard',
    element: Dashboard,
    title: 'Dashboard',
    icon: 'dashboard',
    isPublic: false,
    requiredAccess: 'requireDashboardAccess',
  },
  {
    path: '/orders',
    element: OrdersList,
    title: 'Orders',
    icon: 'orders',
    isPublic: false,
    requiredAccess: 'requireOrdersAccess',
  },
  {
    path: '/enquiries/order-enquiries',
    element: EnquiriesList,
    title: 'Order Enquiries',
    icon: 'order-enquiries',
    isPublic: false,
    parent: 'enquiries',
    requiredAccess: 'requireEnquiriesAccess',
  },
  {
    path: '/enquiries/video-call-appointments',
    element: VideoCallAppointmentsList,
    title: 'Video Call Appointments',
    icon: 'video-call-appointments',
    isPublic: false,
    parent: 'enquiries',
    requiredAccess: 'requireEnquiriesAccess',
  },
  {
    path: '/products',
    element: ProductsList,
    title: 'Products',
    icon: 'products',
    isPublic: false,
    requiredAccess: 'requireProductsAccess',
  },
  {
    path: '/users',
    element: UsersList,
    title: 'Customers',
    icon: 'customers',
    isPublic: false,
    requiredAccess: 'requireCustomersAccess',
  },
  {
    path: '/categories',
    element: Categories,
    title: 'Categories',
    icon: 'category',
    isPublic: false,
    requiredAccess: 'requireCategoriesAccess',
  },
  {
    path: '/manage-business-types',
    element: BusinessTypes,
    title: 'Business Types',
    icon: 'business-types',
    isPublic: false,
    requiredAccess: 'requireBusinessTypesAccess',
  },
  {
    path: '/staff-registration',
    element: StaffRegistration,
    title: 'Staff Registration',
    icon: 'staff-registration',
    isPublic: false,
    requiredAccess: 'requireStaffManagementAccess',
  },
  {
    path: '/staff-list',
    element: StaffList,
    title: 'Staff List',
    icon: 'staff-management',
    isPublic: false,
    requiredAccess: 'requireStaffManagementAccess',
  },
  {
    path: '/seo',
    element: SeoManagement,
    title: 'SEO Management',
    icon: 'seo',
    isPublic: false,
    requiredAccess: 'requireSeoAccess',
  },
  {
    path: '/contacts',
    element: ContactsList,
    title: 'Contacts',
    icon: 'contacts',
    isPublic: false,
    requiredAccess: 'requireContactsAccess',
  },
  {
    path: '/contacts/:id',
    element: ContactsList,
    title: 'Contact Details',
    icon: 'contacts',
    isPublic: false,
    requiredAccess: 'requireContactsAccess',
  },
  {
    path: '/sliders',
    element: Sliders,
    title: 'Slider Management',
    icon: 'sliders',
    isPublic: false,
    requiredAccess: 'requireSlidersAccess',
  },
  {
    path: '/profile',
    element: Profile,
    title: 'My Profile',
    icon: 'users',
    isPublic: false,
    requiredAccess: null, // Basic access for all authenticated users
  },
];

// Navigation menu items
export const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { id: 'orders', label: 'Orders', path: '/orders', icon: 'orders' },
  {
    id: 'enquiries',
    label: 'Enquiries',
    icon: 'enquiries',
    subItems: [
      { id: 'order-enquiries', label: 'Order Enquiries', path: '/enquiries/order-enquiries', icon: 'order-enquiries' },
      { id: 'video-call-appointments', label: 'Video Call Appointments', path: '/enquiries/video-call-appointments', icon: 'video-call-appointments' },
    ],
  },
  { id: 'products', label: 'Products', path: '/products', icon: 'products' },
  { id: 'customers', label: 'Customers', path: '/users', icon: 'customers' },
  {
    id: 'staff-management',
    label: 'Staff Management',
    icon: 'staff-management',
    subItems: [
      { id: 'staff-registration', label: 'Create Staff', path: '/staff-registration', icon: 'staff-registration' },
      { id: 'staff-list', label: 'Staff List', path: '/staff-list', icon: 'staff-management' },
    ],
  },
  { id: 'business-types', label: 'Business Types', path: '/manage-business-types', icon: 'business-types' }, // ✅ standalone
  { id: 'category', label: 'Categories', path: '/categories', icon: 'category' },
  { id: 'sliders', label: 'Sliders', path: '/sliders', icon: 'sliders' },
  { id: 'seo', label: 'SEO Management', path: '/seo', icon: 'seo' },
  { id: 'contacts', label: 'Contacts', path: '/contacts', icon: 'contacts' },
];

// Default route
export const defaultRoute = '/dashboard';

// Get route by path
export const getRouteByPath = (path) => {
  return protectedRoutes.find((route) => route.path === path) || protectedRoutes[0];
};

// Get current page from path
export const getCurrentPageFromPath = (path) => {
  if (path === '/' || path === '/dashboard') return 'dashboard';
  const route = protectedRoutes.find((r) => r.path === path || (r.path.includes(':id') && path.startsWith(r.path.split(':')[0])));
  return route ? route.icon : 'dashboard';
};

// Check if route exists
export const isRouteExists = (path) => {
  return protectedRoutes.some((route) => route.path === path || (route.path.includes(':id') && path.startsWith(route.path.split(':')[0])));
};

// Get 404 component
export const getNotFoundComponent = () => NotFound;

// Updated Sidebar.jsx iconMap
export const sidebarIconMap = {
  dashboard: 'LayoutDashboard',
  enquiries: 'MessageSquare',
  orders: 'ShoppingCart',
  products: 'Package',
  customers: 'Users',
  category: 'Folder',
  'business-types': 'Briefcase', // ✅ Changed icon for Business Types
  seo: 'Search',
  'video-call-appointments': 'Video',
  'order-enquiries': 'MessageSquare',
  'staff-registration': 'UserPlus',
  'staff-management': 'Users',
  contacts: 'Mail',
  sliders: 'Image',
};