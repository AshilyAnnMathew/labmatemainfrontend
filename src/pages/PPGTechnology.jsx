import React, { useState, useEffect } from 'react';
import {
    Activity,
    Heart,
    Wind,
    TrendingUp,
    Info,
    Calendar,
    AlertCircle,
    CheckCircle,
    BarChart2,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import PPGMonitor from '../components/PPG/PPGMonitor';
import { vitalsAPI } from '../services/api';

const PPGTechnology = () => {
    const [activeTab, setActiveTab] = useState('monitor'); // monitor, history, analysis
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [showMonitor, setShowMonitor] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await vitalsAPI.getHistory();
            if (response.success && response.data) {
                // Format data for charts
                const formattedData = response.data.map(item => ({
                    ...item,
                    date: new Date(item.createdAt).toLocaleDateString(),
                    time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullDate: new Date(item.createdAt),
                })).reverse(); // Show oldest first for charts

                setHistory(formattedData);
                analyzeData(formattedData);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (data) => {
        if (!data || data.length === 0) return;

        // Calculate averages
        const totalHR = data.reduce((sum, item) => sum + (item.heartRate || 0), 0);
        const totalSpO2 = data.reduce((sum, item) => sum + (item.spo2 || 0), 0);
        const count = data.length;

        const avgHR = Math.round(totalHR / count);
        const avgSpO2 = Math.round(totalSpO2 / count);

        // Find trends (simple comparison of last 3 vs previous 3)
        let trend = 'stable';
        if (count >= 2) {
            const recent = data[count - 1].heartRate;
            const previous = data[count - 2].heartRate;
            if (recent > previous + 5) trend = 'rising';
            if (recent < previous - 5) trend = 'falling';
        }

        setAnalysis({
            avgHeartRate: avgHR,
            avgSpO2: avgSpO2,
            totalReadings: count,
            lastReading: data[count - 1],
            trend
        });
    };

    const handleMeasurementComplete = (result) => {
        setShowMonitor(false);
        fetchHistory(); // Refresh data
        setActiveTab('analysis'); // Switch to see results
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
                    <p className="font-medium text-gray-900 mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">{entry.value}</span>
                            {entry.name === 'Heart Rate' ? ' BPM' : '%'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Activity className="w-6 h-6 text-red-500 mr-2" />
                            PPG Technology
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Photoplethysmography (PPG) uses light to measure blood flow changes.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowMonitor(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                        >
                            <Activity className="w-4 h-4 mr-2" />
                            New Measurement
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 mt-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'monitor' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Overview
                        {activeTab === 'monitor' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        History & Logs
                        {activeTab === 'history' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'analysis' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Insights & Trends
                        {activeTab === 'analysis' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Measurement Modal */}
            {showMonitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative">
                        <button
                            onClick={() => setShowMonitor(false)}
                            className="absolute top-3 right-3 p-1 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 z-10"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <PPGMonitor onComplete={handleMeasurementComplete} />
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="space-y-6">
                {/* OVERVIEW TAB */}
                {activeTab === 'monitor' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* What is PPG */}
                        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Info className="w-5 h-5 text-red-500 mr-2" />
                                How it Works
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                PPG measures cardiovascular data by detecting blood volume changes in the microvascular bed of tissue.
                                The camera flashlight illuminates the skin, and the camera sensor captures the subtle color variations
                                caused by your heartbeat.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                                    <span>Non-invasive optical technique</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                                    <span>Measures Heart Rate Variability (HRV)</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                                    <span>Estimates Blood Oxygen (SpO2)</span>
                                </li>
                            </ul>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                                <div className="p-3 bg-red-50 rounded-full mb-3">
                                    <Heart className="w-6 h-6 text-red-500" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {analysis ? analysis.avgHeartRate : '--'}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Avg Heart Rate</span>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                                <div className="p-3 bg-blue-50 rounded-full mb-3">
                                    <Wind className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">
                                    {analysis ? analysis.avgSpO2 + '%' : '--'}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wide mt-1">Avg SpO2</span>
                            </div>
                        </div>

                        {/* Recent Measurements Mini Table */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Recent Measurements</h3>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Heart Rate</th>
                                            <th className="px-4 py-3">SpO2</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {history.slice(0, 3).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-600">{item.date} {item.time}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{item.heartRate} bpm</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{item.spo2}%</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.heartRate > 100 || item.heartRate < 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {item.heartRate > 100 || item.heartRate < 60 ? 'Irregular' : 'Normal'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {history.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                    No measurements recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h3 className="font-semibold text-gray-900">Full Measurement History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4">Heart Rate (BPM)</th>
                                        <th className="px-6 py-4">SpO2 (%)</th>
                                        <th className="px-6 py-4">Confidence</th>
                                        <th className="px-6 py-4">Analysis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.date}</div>
                                                        <div className="text-xs text-gray-500">{item.time}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{item.heartRate}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold ${item.spo2 < 95 ? 'text-amber-600' : 'text-gray-900'}`}>
                                                    {item.spo2}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-green-500 h-1.5 rounded-full"
                                                        style={{ width: `${item.confidence}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1 block">{item.confidence}%</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.heartRate > 100 ? (
                                                    <span className="inline-flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                        <TrendingUp className="w-3 h-3 mr-1" /> Tachycardia Risk
                                                    </span>
                                                ) : item.heartRate < 60 ? (
                                                    <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                        <TrendingUp className="w-3 h-3 mr-1" /> Bradycardia Risk
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Normal Range
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                        <Activity className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <p>No measurement history available.</p>
                                                    <button
                                                        onClick={() => setShowMonitor(true)}
                                                        className="mt-4 text-blue-600 hover:underline text-sm font-medium"
                                                    >
                                                        Take your first measurement
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ANALYSIS TAB */}
                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Total Recordings</h4>
                                <div className="text-3xl font-bold text-gray-900">{analysis?.totalReadings || 0}</div>
                                <div className="text-xs text-green-600 mt-2 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> All time data
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Heart Rate Trend</h4>
                                <div className="flex items-center">
                                    <div className="text-2xl font-bold text-gray-900 capitalize mr-2">{analysis?.trend || 'Stable'}</div>
                                    {analysis?.trend === 'rising' && <TrendingUp className="w-5 h-5 text-red-500" />}
                                    {analysis?.trend === 'falling' && <TrendingUp className="w-5 h-5 text-blue-500 transform rotate-180" />}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Based on last few readings</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Health Score</h4>
                                <div className="text-3xl font-bold text-gray-900">
                                    {analysis ? (analysis.avgSpO2 >= 95 && analysis.avgHeartRate < 100 ? 'Good' : 'Attention Needed') : '--'}
                                </div>
                                <div className="text-xs text-gray-500 mt-2">Combined Vitals Assessment</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Heart Rate Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                                <h3 className="font-semibold text-gray-900 mb-6 flex items-center">
                                    <Heart className="w-5 h-5 text-red-500 mr-2" /> Heart Rate Trends
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history.slice().reverse()}> {/* Pass array copy, reverse to normal chronological order */}
                                        <defs>
                                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <YAxis domain={[40, 160]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="heartRate"
                                            name="Heart Rate"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorHr)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* SpO2 Chart */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                                <h3 className="font-semibold text-gray-900 mb-6 flex items-center">
                                    <Wind className="w-5 h-5 text-blue-500 mr-2" /> Oxygen Saturation (SpO2)
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history.slice().reverse()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="spo2"
                                            name="SpO2"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recommendation Banner */}
                        {analysis && (analysis.avgHeartRate > 100 || analysis.avgSpO2 < 95) && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start">
                                <AlertCircle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-800">Health Alert</h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Your recent readings show some irregularities.
                                        {analysis.avgHeartRate > 100 && " Your average heart rate is higher than normal."}
                                        {analysis.avgSpO2 < 95 && " Your oxygen saturation levels are slightly low."}
                                        We recommend consulting a healthcare provider for a thorough checkup.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PPGTechnology;
