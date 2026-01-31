import React, { useState, useEffect } from 'react';
import {
    Brain,
    Smile,
    Moon,
    Activity,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    ChevronRight,
    Sun,
    Coffee
} from 'lucide-react';
import { mentalWellnessAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MentalWellness = () => {
    const [activeTab, setActiveTab] = useState('assessment');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await mentalWellnessAPI.getHistory();
            if (response.success) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Brain className="w-8 h-8 text-purple-600" />
                        Mental Wellness
                    </h1>
                    <p className="text-gray-500">Track your mood, stress, and sleep to maintain a healthy mind.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('assessment')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'assessment' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        Check-In
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        My Insights
                    </button>
                </div>
            </div>

            {activeTab === 'assessment' ? (
                <AssessmentWizard onSuccess={() => { fetchHistory(); setActiveTab('dashboard'); }} />
            ) : (
                <DashboardView history={history} />
            )}
        </div>
    );
};

const AssessmentWizard = ({ onSuccess }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        stressLevel: 5,
        sleepQuality: 5,
        mood: 5,
        anxiety: 5,
        focus: 5
    });
    const [submitting, setSubmitting] = useState(false);

    const questions = [
        {
            key: 'stressLevel',
            title: "How relaxed do you feel lately?",
            icon: Sun,
            lowLabel: "Very Stressed",
            highLabel: "Very Relaxed",
            desc: "Consider your workload and general tension levels."
        },
        {
            key: 'sleepQuality',
            title: "How would you rate your sleep quality?",
            icon: Moon,
            lowLabel: "Poor (Insomnia)",
            highLabel: "Excellent (Restful)",
            desc: "Do you wake up feeling refreshed?"
        },
        {
            key: 'mood',
            title: "How is your overall mood?",
            icon: Smile,
            lowLabel: "Low/Depressed",
            highLabel: "Happy/Stable",
            desc: "Have you felt down or hopeless recently?"
        },
        {
            key: 'anxiety',
            title: "How calm do you feel regarding the future?",
            icon: Activity,
            lowLabel: "Very Anxious",
            highLabel: "Calm/Confident",
            desc: "Do you feel constantly on edge or worried?"
        },
        {
            key: 'focus',
            title: "How is your ability to focus?",
            icon: Coffee,
            lowLabel: "Distracted",
            highLabel: "Sharp/Focused",
            desc: "Can you concentrate on tasks without easy distraction?"
        }
    ];

    const currentQ = questions[step];

    const handleNext = async () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Submit
            setSubmitting(true);
            try {
                await mentalWellnessAPI.submitAssessment(answers);
                onSuccess();
            } catch (err) {
                alert('Failed to submit assessment');
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto overflow-hidden">
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2">
                <div
                    className="bg-purple-600 h-2 transition-all duration-300"
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            <div className="p-8 text-center min-h-[400px] flex flex-col justify-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <currentQ.icon className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQ.title}</h2>
                <p className="text-gray-500 mb-8">{currentQ.desc}</p>

                <div className="mb-8">
                    <div className="flex justify-between text-sm font-medium text-gray-400 mb-4 px-2">
                        <span>{currentQ.lowLabel} (1)</span>
                        <span>{currentQ.highLabel} (10)</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={answers[currentQ.key]}
                        onChange={(e) => setAnswers({ ...answers, [currentQ.key]: parseInt(e.target.value) })}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="mt-4 text-3xl font-bold text-purple-600">
                        {answers[currentQ.key]}/10
                    </div>
                </div>

                <div className="flex justify-between mt-auto">
                    <button
                        disabled={step === 0}
                        onClick={() => setStep(step - 1)}
                        className={`px-6 py-2 rounded-lg font-medium ${step === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={submitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
                    >
                        {step === questions.length - 1 ? (submitting ? 'Analyzing...' : 'Finish') : 'Next Question'}
                        {!submitting && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ history }) => {
    if (!history || history.length === 0) return <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">No data available. Start a check-in!</div>;

    const latest = history[0];

    const getRiskColor = (level) => {
        if (level === 'High Stress Risk') return 'text-red-700 bg-red-50 border-red-200';
        if (level === 'Moderate Stress') return 'text-orange-700 bg-orange-50 border-orange-200';
        return 'text-green-700 bg-green-50 border-green-200';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Score Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                <h3 className="text-gray-500 font-medium mb-4">Current Mental State</h3>
                <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                            <circle
                                cx="80" cy="80" r="70"
                                stroke={latest.wellnessScore > 75 ? '#10b981' : latest.wellnessScore > 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * latest.wellnessScore) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute  flex flex-col items-center">
                            <span className="text-4xl font-bold text-gray-800">{latest.wellnessScore}</span>
                            <span className="text-xs text-gray-400">Wellness Score</span>
                        </div>
                    </div>
                </div>
                <div className={`mt-4 p-3 rounded-xl border text-center font-bold ${getRiskColor(latest.riskLevel)}`}>
                    {latest.riskLevel}
                </div>
                <div className="mt-6 text-sm">
                    <p className="text-gray-500 mb-2 font-medium">Breakdown:</p>
                    <div className="space-y-2">
                        {Object.entries(latest.responses).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center">
                                <span className="capitalize text-gray-600">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${v > 7 ? 'bg-green-400' : v > 4 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${v * 10}%` }}></div>
                                    </div>
                                    <span className="font-bold text-gray-700 w-4 text-right">{v}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendations & Tips */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                <h3 className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-500" /> Personalized Insights
                </h3>
                {latest.recommendations && latest.recommendations.length > 0 ? (
                    <div className="grid gap-4">
                        {latest.recommendations.map((rec, i) => (
                            <div key={i} className="flex p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div className="mr-4 mt-1 bg-white p-2 rounded-full h-8 w-8 flex items-center justify-center text-purple-600 font-bold shadow-sm">
                                    {i + 1}
                                </div>
                                <p className="text-gray-700 italic">"{rec}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                        <h4 className="text-lg font-bold text-green-800">You're doing great!</h4>
                        <p className="text-green-700">Your metrics indicate a balanced state of mind. Keep up your current routine!</p>
                    </div>
                )}
            </div>

            {/* Trend Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3">
                <h3 className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Wellness Trend
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...history].reverse().map(h => ({ date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: h.wellnessScore }))}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default MentalWellness;
