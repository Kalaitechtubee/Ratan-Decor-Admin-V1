import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Package, ShoppingCart, Users } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Package size={20} />, label: 'Products', path: '/products' },
    { icon: <ShoppingCart size={20} />, label: 'Orders', path: '/orders' },
    { icon: <Users size={20} />, label: 'Users', path: '/users' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 font-roboto">
      <div className="max-w-4xl w-full text-center">
        {/* Animated 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary animate-bounce">
            4
            <span className="text-red-400 animate-pulse">0</span>
            4
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 animate-fade-in">
            Oops! Page Not Found
          </h2>
          <p className="text-xl text-gray-600 mb-6 animate-fade-in-delay">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-lg text-gray-500 animate-fade-in-delay-2">
            Don't worry, you can navigate back to safety using the links below.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 animate-fade-in-delay-3">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for pages, products, or orders..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-all duration-300 hover:border-gray-300"
            />
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8 animate-fade-in-delay-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {quickLinks.map((link, index) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="group p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-primary group-hover:scale-110 transition-transform duration-300 mb-2">
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
          >
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Home size={20} />
            <span>Go to Dashboard</span>
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 opacity-10 animate-float">
          <Package size={60} className="text-primary" />
        </div>
        <div className="absolute top-20 right-20 opacity-10 animate-float-delay">
          <ShoppingCart size={50} className="text-red-400" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 animate-float-delay-2">
          <Users size={40} className="text-yellow-500" />
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float 6s ease-in-out infinite 2s;
        }
        
        .animate-float-delay-2 {
          animation: float 6s ease-in-out infinite 4s;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeIn 0.8s ease-out 0.4s both;
        }
        
        .animate-fade-in-delay-3 {
          animation: fadeIn 0.8s ease-out 0.6s both;
        }
        
        .animate-fade-in-delay-4 {
          animation: fadeIn 0.8s ease-out 0.8s both;
        }
        
        .animate-fade-in-delay-5 {
          animation: fadeIn 0.8s ease-out 1s both;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
