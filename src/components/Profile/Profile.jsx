import React from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';

const Profile = ({ currentUser }) => {
    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">Loading profile...</div>
            </div>
        );
    }

    const getRoleDisplay = (role) => {
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Background */}
                <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5"></div>

                {/* Profile Info */}
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end space-x-6">
                            <div className="w-24 h-24 bg-white p-1 rounded-2xl shadow-sm">
                                <div className="w-full h-full bg-primary rounded-xl flex items-center justify-center text-white text-3xl font-bold">
                                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                            </div>
                            <div className="pb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{currentUser.name || 'Admin User'}</h1>
                                <p className="text-gray-500">{currentUser.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-3 mb-2">
                                <Shield className="text-primary" size={20} />
                                <h3 className="font-semibold text-gray-900">Role & Access</h3>
                            </div>
                            <p className="text-gray-600 pl-8">
                                Current Role: <span className="font-medium text-gray-900">{getRoleDisplay(currentUser.role)}</span>
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-3 mb-2">
                                <Mail className="text-primary" size={20} />
                                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                            </div>
                            <p className="text-gray-600 pl-8">
                                Email: <span className="font-medium text-gray-900">{currentUser.email}</span>
                            </p>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-3 mb-2">
                                <User className="text-primary" size={20} />
                                <h3 className="font-semibold text-gray-900">Account ID</h3>
                            </div>
                            <p className="text-gray-600 pl-8">
                                ID: <span className="font-medium text-gray-900">{currentUser.id || 'N/A'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
