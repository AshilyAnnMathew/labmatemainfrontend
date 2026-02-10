import React, { useState, useEffect } from 'react';
import {
    Activity,
    Heart,
    AlertTriangle,
    CheckCircle,
    Info,
    Thermometer,
    Droplet,
    ArrowRight,
    Brain
} from 'lucide-react';
import api from '../services/api';

const HealthInsights = () => {
    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPrediction();
    }, []);

    const fetchPrediction = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.predictionAPI.getRiskPrediction();
            if (response.success) {
                setPrediction(response.data);
            } else {
                setError('Could not generate health insights at this time.');
            }
        } catch (err) {
            console.error('Error fetching prediction:', err);
            if (err.message && err.message.includes('unavailable')) {
                setError('The AI Analysis Service is currently unavailable. Please try again later.');
            } else {
                setError('Failed to connect to the AI analysis service.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getRiskBadgeColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-orange-100 text-orange-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper function for recommendations
    const getRecommendationForFactor = (factor) => {
        const f = factor.toLowerCase();
        if (f.includes('blood pressure')) return "Reduce sodium intake, manage stress, and monitor BP regularly.";
        if (f.includes('sugar') || f.includes('diabetes')) return "Limit sugar/carbs, exercise regularly, and monitor glucose.";
        if (f.includes('cholesterol')) return "Adopt a heart-healthy diet, reduce saturated fats, and exercise.";
        if (f.includes('heart rate')) return "Consult a cardiologist if palpitations persist.";
        if (f.includes('oxygen')) return "Monitor oxygen levels; consult a doctor if shortness of breath occurs.";
        if (f.includes('age')) return "Regular screenings are recommended for your age group.";
        return "Consult a preventative care specialist.";
    };

    const MetricCard = ({ label, value, icon: Icon, status }) => {
        const isWarning = status === 'warning';

        return (
            <div className={`p-4 rounded-lg border ${isWarning ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
                } shadow-sm transition-all hover:shadow-md`}>
                <div className="flex items-center space-x-2 text-gray-500 mb-2">
                    <Icon className={`w-4 h-4 ${isWarning ? 'text-orange-500' : 'text-blue-500'}`} />
                    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                </div>
                <div className={`text-xl font-bold ${isWarning ? 'text-orange-700' : 'text-gray-800'
                    }`}>
                    {value}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-800">Analyzing Your Health Profile</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-md text-center">
                    Our AI is reviewing your latest vitals, lab results, and health history to generate personalized insights...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-red-800 font-semibold text-lg">Analysis Unavailable</h3>
                        <p className="text-red-600 mt-2 max-w-lg mx-auto">{error}</p>
                    </div>
                    <button
                        onClick={fetchPrediction}
                        className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Brain className="w-6 h-6 mr-2 text-purple-600" />
                        Health Insights
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Personalized risk assessment based on your health profile
                    </p>
                </div>
                <button
                    onClick={fetchPrediction}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                    <Activity className="w-4 h-4 mr-2 text-blue-600" />
                    Refresh Analysis
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Risk Score Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-1 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6">Risk Assessment</h2>

                    <div className="flex flex-col items-center justify-center flex-1 py-4">
                        <div className={`relative w-48 h-48 rounded-full border-[10px] flex items-center justify-center mb-6 transition-all duration-1000 ${prediction.riskLevel === 'High' ? 'border-red-500 text-red-600 shadow-red-100' :
                            prediction.riskLevel === 'Medium' ? 'border-orange-500 text-orange-600 shadow-orange-100' :
                                'border-green-500 text-green-600 shadow-green-100'
                            } shadow-xl`}>
                            <div className="text-center">
                                <span className="block text-5xl font-bold">{prediction.riskScore}</span>
                                <span className="text-xs uppercase tracking-wider font-medium text-gray-400 mt-1">Risk Score</span>
                            </div>
                        </div>

                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-4 ${getRiskBadgeColor(prediction.riskLevel)}`}>
                            {prediction.riskLevel} Risk Level
                        </div>

                        <p className="text-center text-gray-600 text-sm px-4 leading-relaxed">
                            {prediction.riskLevel === 'High'
                                ? "Your combined health metrics indicate areas requiring attention. We strongly recommend consulting a healthcare provider."
                                : prediction.riskLevel === 'Medium'
                                    ? "Some of your health metrics are outside the optimal range. Preventive lifestyle changes are recommended."
                                    : "Great job! Your health metrics are within the healthy range. Maintain your current lifestyle."}
                        </p>
                    </div>
                </div>

                {/* Contributing Factors & Recommendations */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        Risk Factors & Recommendations
                        {prediction.riskFactors?.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {prediction.riskFactors.length} Found
                            </span>
                        )}
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                        {prediction.riskFactors && prediction.riskFactors.length > 0 ? (
                            prediction.riskFactors.map((factor, index) => (
                                <div key={index} className="flex items-start space-x-4 p-4 bg-red-50/50 rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
                                    <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-red-900">{factor}</h4>
                                        <p className="text-sm text-red-700 mt-1 leading-relaxed">
                                            {getRecommendationForFactor(factor)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50/50 rounded-xl border border-green-100 border-dashed">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-green-900">All Metrics Normal</h3>
                                <p className="text-green-700 max-w-sm mt-2">
                                    Our AI analysis didn't detect any significant risk factors based on your current data.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-start space-x-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-blue-900 text-sm">Medical Disclaimer</h4>
                                <p className="text-xs text-blue-800 mt-1 leading-relaxed opacity-90">
                                    This AI-generated analysis is based on available data and is for informational purposes only. It is <strong>not a medical diagnosis</strong>. Please consult a qualified healthcare professional for medical advice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Data Summary (Metrics) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Analyzed Health Data</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                        Based on latest records & vitals
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <MetricCard
                        label="Heart Rate"
                        value={`${prediction.inputData.heartRate} bpm`}
                        icon={Heart}
                        status={prediction.inputData.heartRate > 100 || prediction.inputData.heartRate < 60 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="SpO2"
                        value={`${prediction.inputData.spo2}%`}
                        icon={Activity}
                        status={prediction.inputData.spo2 < 95 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Blood Pressure"
                        value={`${prediction.inputData.systolicBP}/${prediction.inputData.diastolicBP}`}
                        icon={Activity}
                        status={prediction.inputData.systolicBP > 130 || prediction.inputData.diastolicBP > 85 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Blood Glucose"
                        value={`${prediction.inputData.bloodSugar || 'N/A'} ${prediction.inputData.bloodSugar ? 'mg/dL' : ''}`}
                        icon={Droplet}
                        status={prediction.inputData.bloodSugar > 100 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Cholesterol"
                        value={`${prediction.inputData.cholesterol || 'N/A'} ${prediction.inputData.cholesterol ? 'mg/dL' : ''}`}
                        icon={Droplet}
                        status={prediction.inputData.cholesterol > 200 ? 'warning' : 'good'}
                    />
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center">
                    Analysis Timestamp: {new Date(prediction.timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    );
};

export default HealthInsights;
