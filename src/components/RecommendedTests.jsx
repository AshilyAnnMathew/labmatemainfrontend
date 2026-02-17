
import React from 'react';
import { AlertCircle, ArrowRight, Activity, Thermometer, Droplet, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecommendedTests = ({ recommendations, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-gray-100 rounded"></div>
                    <div className="h-20 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!recommendations || recommendations.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">No New Recommendations</h2>
                </div>
                <p className="text-gray-500 text-sm">
                    Based on your recent vitals and lab results, everything looks stable. Keep up the good work!
                </p>
            </div>
        );
    }

    // Helper to get priority color
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-50 text-red-700 border-red-100';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const handleBookTest = (testName) => {
        // Navigate to booking page, potentially pre-filling search
        // For now, just go to booking page with a query param if supported, or just the page
        navigate('/user/dashboard/book-test');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Activity className="w-5 h-5 text-indigo-600 mr-2" />
                        Recommended Tests
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">AI-driven suggestions for your health profile</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                    {recommendations.length} New
                </span>
            </div>

            <div className="space-y-4">
                {recommendations.map((rec, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-indigo-100 hover:shadow-xs transition-all duration-200">
                        <div className="flex-1">
                            <div className="flex items-center mb-1">
                                <h3 className="font-medium text-gray-900">{rec.testName}</h3>
                                <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(rec.priority)}`}>
                                    {rec.priority} Priority
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-start mt-1">
                                <AlertCircle className="w-3 h-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                                {rec.reason}
                            </p>
                        </div>
                        <button
                            onClick={() => handleBookTest(rec.testName)}
                            className="mt-3 sm:mt-0 sm:ml-4 flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Book Now
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedTests;
