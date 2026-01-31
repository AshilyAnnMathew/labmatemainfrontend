import React, { useState, useEffect, useRef } from 'react';
import {
    Heart,
    Wind,
    Activity,
    AlertTriangle,
    CheckCircle,
    Play,
    RotateCcw,
    History
} from 'lucide-react';
import { respiratoryAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RespiratoryWellness = () => {
    const [activeTab, setActiveTab] = useState('assessment');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await respiratoryAPI.getHistory();
            if (response.success) {
                setHistory(response.data);
            }
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wind className="w-8 h-8 text-blue-500" />
                        Respiratory Wellness
                    </h1>
                    <p className="text-gray-500">Monitor your lung health with our guided assessment tool</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('assessment')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'assessment' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Start Assessment
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        History & Trends
                    </button>
                </div>
            </div>

            {activeTab === 'assessment' ? (
                <AssessmentView onSuccess={() => { fetchHistory(); setActiveTab('dashboard'); }} />
            ) : (
                <DashboardStats history={history} />
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// Breathing Assessment Component
// ----------------------------------------------------------------------
const AssessmentView = ({ onSuccess }) => {
    const [step, setStep] = useState('intro'); // intro, breathing, questions, submitting
    const [breathHoldData, setBreathHoldData] = useState([]);
    const [symptoms, setSymptoms] = useState({
        breathlessness: false,
        cough: false,
        chestTightness: false,
        smokingHistory: false,
        historyOfAsthma: false
    });

    // Breathing Test Logic
    const [breathState, setBreathState] = useState('idle'); // idle, inhale, hold, exhale
    const [timer, setTimer] = useState(0);
    const [currentHoldTime, setCurrentHoldTime] = useState(0);
    const intervalRef = useRef(null);
    const holdIntervalRef = useRef(null);

    // --- Steps flow ---
    const startBreathingTest = () => {
        setStep('breathing');
        runBreathingCycle();
    };

    const runBreathingCycle = () => {
        // INHALE (4s)
        setBreathState('inhale');
        setTimer(4);
        let count = 4;

        intervalRef.current = setInterval(() => {
            count--;
            setTimer(count);
            if (count === 0) {
                clearInterval(intervalRef.current);
                // AUTO-SWITCH TO HOLD
                startHoldPhase();
            }
        }, 1000);
    };

    const startHoldPhase = () => {
        setBreathState('hold');
        setCurrentHoldTime(0);

        // Count UP for user hold duration
        const startTime = Date.now();
        holdIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setCurrentHoldTime(elapsed.toFixed(1));
        }, 100);
    };

    const stopHolding = () => {
        // User clicked "Exhale Now"
        clearInterval(holdIntervalRef.current);
        const finalHoldTime = parseFloat(currentHoldTime);
        setBreathHoldData([...breathHoldData, finalHoldTime]);

        // EXHALE (6s)
        setBreathState('exhale');
        setTimer(6);
        let count = 6;

        intervalRef.current = setInterval(() => {
            count--;
            setTimer(count);
            if (count === 0) {
                clearInterval(intervalRef.current);
                setBreathState('idle');

                // If we have less than 2 attempts, prompt for next
                // But for MVP simplicity, let's just do 3 attempts or allow finish
            }
        }, 1000);
    };

    const submitAssessment = async () => {
        setStep('submitting');

        // Calculate average and max hold
        const maxHold = Math.max(...breathHoldData, 0);
        const averageHold = breathHoldData.reduce((a, b) => a + b, 0) / (breathHoldData.length || 1);

        const payload = {
            breathHoldDuration: averageHold,
            maxBreathHold: maxHold,
            attempts: breathHoldData.length,
            symptoms
        };

        try {
            await respiratoryAPI.submitAssessment(payload);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to save assessment');
            setStep('questions');
        }
    };

    if (step === 'intro') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-2xl mx-auto">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-blue-600 ml-1" />
                </div>
                <h2 className="text-xl font-bold mb-4">Start Respiratory Check</h2>
                <div className="text-gray-600 mb-8 space-y-2 text-left bg-gray-50 p-6 rounded-lg">
                    <p className="font-semibold text-gray-900 mb-2">Instructions:</p>
                    <ul className="list-disc leading-relaxed pl-5 space-y-1">
                        <li>Sit comfortably in an upright position.</li>
                        <li>Follow the on-screen animation to <strong>Inhale</strong> for 4 seconds.</li>
                        <li><strong>Hold your breath</strong> as long as comfortably possible.</li>
                        <li>Press "Exhale" when you can no longer hold it.</li>
                        <li>Repeat 2-3 times for accuracy.</li>
                    </ul>
                </div>
                <button
                    onClick={startBreathingTest}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium text-lg transition-all shadow-lg shadow-blue-200"
                >
                    Start Test
                </button>
            </div>
        );
    }

    if (step === 'breathing') {
        const getCircleClass = () => {
            if (breathState === 'inhale') return 'scale-100 bg-blue-500'; // Expanding
            if (breathState === 'hold') return 'scale-110 bg-purple-500 animate-pulse'; // Pulsing
            if (breathState === 'exhale') return 'scale-75 bg-green-500'; // shrinking
            return 'scale-90 bg-gray-300';
        };

        const getStatusText = () => {
            if (breathState === 'inhale') return `Inhale... (${timer}s)`;
            if (breathState === 'hold') return `Hold It! (${currentHoldTime}s)`;
            if (breathState === 'exhale') return `Exhale Slowly... (${timer}s)`;
            return 'Ready?';
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center">
                {/* Visualizer */}
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    {/* Background rings */}
                    <div className="absolute w-64 h-64 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute w-48 h-48 border-4 border-gray-100 rounded-full"></div>

                    {/* Animated Circle */}
                    <div
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl transition-all duration-[4000ms] ease-in-out ${getCircleClass()}`}
                        style={{
                            transitionDuration: breathState === 'inhale' ? '4000ms' : breathState === 'exhale' ? '6000ms' : '200ms'
                        }}
                    >
                        {breathState === 'hold' ? currentHoldTime : timer}
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-8 text-gray-800">{getStatusText()}</h2>

                <div className="flex gap-4">
                    {breathState === 'hold' && (
                        <button
                            onClick={stopHolding}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg ring-4 ring-purple-100 transition-all"
                        >
                            I Can't Hold Anymore! (Exhale)
                        </button>
                    )}

                    {breathState === 'idle' && (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-gray-600 font-medium">Attempt {breathHoldData.length} Recorded: {breathHoldData[breathHoldData.length - 1]}s</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={runBreathingCycle}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" /> Try Again
                                </button>
                                <button
                                    onClick={() => setStep('questions')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                                >
                                    Next Step <Play className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (step === 'questions') {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-6">Health Questionnaire</h2>
                <div className="space-y-4 mb-8">
                    {[
                        { key: 'breathlessness', label: 'Do you experience shortness of breath during daily activities?' },
                        { key: 'cough', label: 'Do you suffer from a persistent cough?' },
                        { key: 'chestTightness', label: 'Do you feel tightness or heaviness in your chest?' },
                        { key: 'historyOfAsthma', label: 'Do you have a history of Asthma or respiratory issues?' },
                        { key: 'smokingHistory', label: 'Are you a current or former smoker?' },
                    ].map((q) => (
                        <div key={q.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-700">{q.label}</span>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSymptoms({ ...symptoms, [q.key]: true })}
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${symptoms[q.key] ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setSymptoms({ ...symptoms, [q.key]: false })}
                                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${!symptoms[q.key] ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={submitAssessment}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium shadow-md flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Generate Report
                    </button>
                </div>
            </div>
        );
    }

    return <div className="p-8 text-center text-gray-500">Processing...</div>;
};

// ----------------------------------------------------------------------
// Dashboard/History Component
// ----------------------------------------------------------------------
const DashboardStats = ({ history }) => {
    if (!history || history.length === 0) {
        return <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">No assessments found. Start your first test!</div>;
    }

    const latest = history[0];

    // Chart data formatting
    const chartData = [...history].reverse().map(h => ({
        date: new Date(h.createdAt).toLocaleDateString(),
        score: h.riskScore
    }));

    const getRiskColor = (level) => {
        if (level === 'High Risk') return 'text-red-600 bg-red-50 border-red-200';
        if (level === 'Mild Risk') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latest Score Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                <h3 className="text-gray-500 font-medium mb-4">Latest Assessment</h3>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <span className="text-4xl font-bold text-gray-900">{latest.riskScore}</span>
                        <span className="text-gray-400 text-sm">/100</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getRiskColor(latest.riskLevel)}`}>
                        {latest.riskLevel}
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Max Breath Hold</span>
                        <span className="font-medium">{latest.maxBreathHold} sec</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Symptoms</span>
                        <span className="font-medium text-red-500">
                            {Object.entries(latest.symptoms).filter(([k, v]) => v).length} Detected
                        </span>
                    </div>
                    <div className="pt-2 text-xs text-gray-400">
                        Date: {new Date(latest.createdAt).toLocaleString()}
                    </div>
                </div>

                {latest.riskLevel === 'High Risk' && (
                    <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-xs text-red-700 leading-relaxed">
                            Your result indicates a high risk. We recommend consulting a doctor. An alert has been logged.
                        </p>
                    </div>
                )}
            </div>

            {/* Trends Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                <h3 className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Performance Trend
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* History List (Optional/Collapsible) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3">
                <h3 className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Past Records
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Date</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Breath Hold</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {history.map(item => (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-blue-600 font-bold">{item.riskScore}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.maxBreathHold}s</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.riskLevel === 'Normal' ? 'bg-green-100 text-green-700' :
                                                item.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {item.riskLevel}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RespiratoryWellness;
