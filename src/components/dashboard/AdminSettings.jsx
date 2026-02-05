import React, { useState } from 'react';
import {
    Settings,
    Shield,
    Bell,
    Save,
    Lock,
    Globe,
    Mail,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import api from '../../services/api';

const { authAPI } = api;

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // General Settings State
    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'LabMate360',
        supportEmail: 'support@labmate360.com',
        contactPhone: '+91 98765 43210',
        maintenanceMode: false
    });

    // Security Settings State (Password Change)
    const [securitySettings, setSecuritySettings] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Notification Settings State
    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        systemAnnouncements: true,
        marketingEmails: false
    });

    const handleGeneralSave = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setMessage({ type: 'success', text: 'General settings updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }, 1000);
    };

    const handleSecuritySave = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (securitySettings.newPassword !== securitySettings.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (securitySettings.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setLoading(true);
            // Assuming authAPI.updateProfile handles password updates or a specific endpoint exists
            // Since we don't have a specific change-password endpoint, we'll try updateProfile
            // Note: backend implementation of updateProfile might need to handle password specially
            // For now, consistent with user dashboard profile updates
            await authAPI.updateProfile({
                password: securitySettings.newPassword
            });

            setLoading(false);
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setLoading(false);
            setMessage({ type: 'error', text: error.message || 'Failed to update password' });
        }
    };

    const handleNotificationToggle = (key) => {
        setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
        // Auto-save simulation
        setMessage({ type: 'success', text: 'Preference saved' });
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    };

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors w-full md:w-auto ${activeTab === id
                    ? 'bg-primary-50 text-primary-600 border border-primary-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-500">Manage global configurations and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 border-b border-gray-200 pb-4 mb-6">
                <TabButton id="general" icon={Globe} label="General" />
                <TabButton id="security" icon={Shield} label="Security" />
                <TabButton id="notifications" icon={Bell} label="Notifications" />
            </div>

            {/* Feedback Message */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} className="mr-2" /> : <AlertCircle size={20} className="mr-2" />}
                    {message.text}
                </div>
            )}

            {/* General Settings */}
            {activeTab === 'general' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <Settings className="mr-2 text-gray-400" size={20} />
                        Platform Configuration
                    </h2>
                    <form onSubmit={handleGeneralSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                                <input
                                    type="text"
                                    value={generalSettings.siteName}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                                <input
                                    type="email"
                                    value={generalSettings.supportEmail}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                                <input
                                    type="text"
                                    value={generalSettings.contactPhone}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                                <p className="text-sm text-gray-500">Temporarily disable access for users</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={generalSettings.maintenanceMode}
                                    onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                            >
                                {loading ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <Lock className="mr-2 text-gray-400" size={20} />
                        Security & Authentication
                    </h2>
                    <form onSubmit={handleSecuritySave} className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={securitySettings.newPassword}
                                onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={securitySettings.confirmPassword}
                                onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                            >
                                {loading ? 'Updating...' : <><Save size={18} className="mr-2" /> Update Password</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <Mail className="mr-2 text-gray-400" size={20} />
                        Email Notifications
                    </h2>
                    <div className="space-y-6">
                        {[
                            { id: 'emailAlerts', label: 'Critical Alerts', desc: 'Receive emails about critical system issues' },
                            { id: 'systemAnnouncements', label: 'System Announcements', desc: 'Receive updates about new features and maintenance' },
                            { id: 'marketingEmails', label: 'Marketing Communications', desc: 'Receive promotional emails and offers' }
                        ].map((setting) => (
                            <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <h3 className="font-medium text-gray-900">{setting.label}</h3>
                                    <p className="text-sm text-gray-500">{setting.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notificationSettings[setting.id]}
                                        onChange={() => handleNotificationToggle(setting.id)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
