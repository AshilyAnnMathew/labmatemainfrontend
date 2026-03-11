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
    Coffee,
    X,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Loader2,
    Calendar,
    Zap,
    HeartPulse,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mentalWellnessAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Swal from 'sweetalert2';

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
        <div className="w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                <div>
                    <div className="inline-flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-xl mb-4 border border-purple-100">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Cognitive State Monitoring</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-purple-100 decoration-8 underline-offset-8">Mental Equilibrium</h1>
                    <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Neuro-psychological tracking and wellness insights</p>
                </div>

                <div className="flex bg-gray-100/50 p-1.5 rounded-[2rem] backdrop-blur-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('assessment')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assessment' ? 'bg-white shadow-xl text-purple-600' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        Neuro Scan
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-xl text-purple-600' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        Insight Vault
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'assessment' ? (
                    <motion.div key="assessment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <AssessmentWizard onSuccess={() => { fetchHistory(); setActiveTab('dashboard'); }} />
                    </motion.div>
                ) : (
                    <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <DashboardView history={history} />
                    </motion.div>
                )}
            </AnimatePresence>
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
            title: "Cortisol Response Assessment",
            subtitle: "How profound is your current relaxation state?",
            icon: Sun,
            lowLabel: "Systemic Tension",
            highLabel: "Deep Calm",
            desc: "Evaluation of physiological and psychological workload markers."
        },
        {
            key: 'sleepQuality',
            title: "Circadian Integrity Scan",
            subtitle: "Rate the restorative efficiency of your last rest cycle.",
            icon: Moon,
            lowLabel: "Fragmented",
            highLabel: "Optimized",
            desc: "Detection of REM cycle depth and awakening frequency."
        },
        {
            key: 'mood',
            title: "Affective Polarity Test",
            subtitle: "Quantify your overall emotional frequency today.",
            icon: Smile,
            lowLabel: "Negative Polarity",
            highLabel: "Positive Polarity",
            desc: "Assessment of neuro-transmitter balance and mood stability."
        },
        {
            key: 'anxiety',
            title: "Neural Excitation Evaluation",
            subtitle: "Level of anticipation regarding future temporal nodes?",
            icon: Activity,
            lowLabel: "Hyper-Alert",
            highLabel: "Serene",
            desc: "Monitoring of cognitive loops and future-oriented tension."
        },
        {
            key: 'focus',
            title: "Cognitive Attentional Width",
            subtitle: "Assess your ability to maintain task-specific focus.",
            icon: Coffee,
            lowLabel: "Diffused",
            highLabel: "Laser Sharp",
            desc: "Evaluation of distractions and executive function efficiency."
        }
    ];

    const currentQ = questions[step];

    const handleNext = async () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            setSubmitting(true);
            try {
                await mentalWellnessAPI.submitAssessment(answers);
                onSuccess();
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'Data Uplink Interrupted', text: 'Cognitive data failed to sync with the vault.', confirmButtonColor: '#ef4444' });
            } finally {
                setSubmitting(false);
            }
        }
    };

    return (
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-purple-900/5 border border-purple-50 max-w-3xl mx-auto overflow-hidden relative">
            {/* Progress Bar Overhaul */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-50">
                <motion.div
                    className="bg-purple-600 h-1"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                ></motion.div>
            </div>

            <div className="p-16 text-center min-h-[550px] flex flex-col items-center justify-center">
                <motion.div
                    key={step}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-purple-50 text-purple-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-purple-100 border border-purple-100"
                >
                    <currentQ.icon className="w-10 h-10" />
                </motion.div>

                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">{currentQ.title}</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-12 italic">{currentQ.subtitle}</p>

                <div className="w-full max-w-md mb-16">
                    <div className="flex justify-between text-[9px] font-black text-gray-400 mb-6 px-2 uppercase tracking-[0.2em]">
                        <span>{currentQ.lowLabel}</span>
                        <span>{currentQ.highLabel}</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={answers[currentQ.key]}
                            onChange={(e) => setAnswers({ ...answers, [currentQ.key]: parseInt(e.target.value) })}
                            className="w-full h-4 bg-gray-100 rounded-full appearance-none cursor-pointer accent-purple-600 group-hover:h-6 transition-all"
                        />
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-950 text-white px-4 py-2 rounded-xl text-[14px] font-black opacity-0 group-active:opacity-100 transition-opacity">
                            {answers[currentQ.key]}/10
                        </div>
                    </div>
                </div>

                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-xs mb-12">
                    {currentQ.desc}
                </div>

                <div className="flex items-center justify-between w-full pt-10 border-t border-gray-50 mt-auto">
                    <button
                        disabled={step === 0}
                        onClick={() => setStep(step - 1)}
                        className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${step === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        Previous
                    </button>
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Node {step + 1}/{questions.length}</div>
                    <button
                        onClick={handleNext}
                        disabled={submitting}
                        className="bg-gray-950 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 transition-all flex items-center gap-4 group"
                    >
                        {step === questions.length - 1 ? (submitting ? 'Encrypting Data...' : 'Finalize Scan') : 'Advance Protocol'}
                        {!submitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="p-24 text-center bg-white rounded-[4rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <Brain className="h-20 w-20 text-gray-100 mb-8" />
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Neural Vault Empty</h3>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-xs">Initiate your first neuro-scan to populate diagnostic history.</p>
        </div>
    );

    const latest = history[0];

    const getRiskStyles = (level) => {
        if (level === 'High Stress Risk') return 'text-red-600 bg-red-50 border-red-100 shadow-red-500/5';
        if (level === 'Moderate Stress') return 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/5';
        return 'text-green-600 bg-green-50 border-green-100 shadow-green-500/5';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Wellness Core Card */}
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 lg:col-span-5 flex flex-col items-center text-center">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.4em] mb-12">Aggregate Wellness</h3>

                <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="128" cy="128" r="110" stroke="#f8fafc" strokeWidth="16" fill="none" />
                        <motion.circle
                            cx="128" cy="128" r="110"
                            stroke={latest.wellnessScore > 75 ? '#10b981' : latest.wellnessScore > 50 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="16"
                            fill="none"
                            strokeDasharray={700}
                            initial={{ strokeDashoffset: 700 }}
                            animate={{ strokeDashoffset: 700 - (700 * latest.wellnessScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-7xl font-black text-gray-900 tracking-tighter">{latest.wellnessScore}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2 italic">Neural Base Index</span>
                    </div>
                </div>

                <div className={`w-full py-4 rounded-[1.5rem] border text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 ${getRiskStyles(latest.riskLevel)}`}>
                    {latest.riskLevel}
                </div>

                <div className="mt-12 w-full space-y-6">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-left px-4 italic">Biometric Breakdown</h5>
                    <div className="space-y-4 px-4 text-left">
                        {Object.entries(latest.responses).map(([k, v]) => (
                            <div key={k} className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-700">
                                    <span>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span>{v}/10</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${v * 10}%` }}
                                        className={`h-full rounded-full ${v > 7 ? 'bg-green-500' : v > 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendations & Optimization */}
            <div className="lg:col-span-7 space-y-10">
                <div className="bg-gray-950 rounded-[4rem] p-12 text-white border border-white/5 relative overflow-hidden shadow-2xl shadow-purple-950/10 h-full flex flex-col">
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[150px] opacity-10 -mr-48 -mb-48"></div>

                    <h3 className="text-[12px] font-black text-purple-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                        <Zap className="w-5 h-5" /> Optimization Protocols
                    </h3>

                    {latest.recommendations && latest.recommendations.length > 0 ? (
                        <div className="space-y-6 flex-1">
                            {latest.recommendations.map((rec, i) => (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={i} className="flex p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md items-start space-x-6 hover:bg-white/10 transition-all group">
                                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-purple-400 font-black text-[14px] shadow-sm border border-white/5 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        {i + 1}
                                    </div>
                                    <p className="text-[12px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest italic group-hover:text-white transition-colors">"{rec}"</p>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-[3rem] border border-white/10 border-dashed">
                            <HeartPulse className="w-20 h-20 text-green-500 mb-8 opacity-50" />
                            <h4 className="text-2xl font-black uppercase tracking-tight mb-4">Integrity Verified</h4>
                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Cognitive metrics within optimal thresholds. Maintain current neuro-hygiene.</p>
                        </div>
                    )}

                    <div className="mt-12 p-8 bg-white/5 rounded-[2rem] border border-white/5 flex items-start gap-4">
                        <div className="h-10 w-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400"><Info className="h-5 w-5" /></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            Insights are generated via neural-pattern sentiment analysis. For clinical neuro-consultation, please contact our psychiatric wing.
                        </p>
                    </div>
                </div>
            </div>

            {/* Dynamic Trend Architecture */}
            <div className="bg-white p-12 rounded-[5rem] border border-gray-100 shadow-sm lg:col-span-12">
                <div className="flex items-center justify-between mb-12 px-8">
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] flex items-center">
                        <TrendingUp className="w-6 h-6 mr-4 text-purple-600" /> Neural Baseline Trend
                    </h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wellness Index</span>
                        </div>
                    </div>
                </div>

                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...history].reverse().map(h => ({ date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), score: h.wellnessScore }))}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: '900', letterSpacing: '0.1em' }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontWeight: '900' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '2rem',
                                    border: 'none',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                    padding: '1.5rem',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#8b5cf6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Temporal Wellness Mapping System</p>
                </div>
            </div>
        </div>
    );
};

export default MentalWellness;
