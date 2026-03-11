import React, { useState, useEffect, useRef } from 'react';
import {
    Heart,
    Wind,
    Activity,
    AlertTriangle,
    CheckCircle,
    Play,
    RotateCcw,
    History,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Loader2,
    Info,
    TrendingUp,
    Zap,
    X,
    ChevronRight,
    Search,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { respiratoryAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';

const RespiratoryWellness = () => {
    const [activeTab, setActiveTab] = useState('assessment');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

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
            console.error('Neural Sync Failure', err);
        }
    };

    return (
        <div className="w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                <div>
                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl mb-4 border border-blue-100">
                        <Wind className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pulmonary Dynamics Analysis</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-blue-100 decoration-8 underline-offset-8">Respiratory Intelligence</h1>
                    <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Advanced lung capacity monitoring and guided breathing diagnostics</p>
                </div>

                <div className="flex bg-gray-100/50 p-1.5 rounded-[2rem] backdrop-blur-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('assessment')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assessment' ? 'bg-white shadow-xl text-blue-600' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        Initiate Scan
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-xl text-blue-600' : 'text-gray-400 hover:text-gray-900'
                            }`}
                    >
                        Diagnostic Logs
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'assessment' ? (
                    <motion.div key="assessment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <AssessmentView onSuccess={() => { fetchHistory(); setActiveTab('dashboard'); }} />
                    </motion.div>
                ) : (
                    <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <DashboardStats history={history} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AssessmentView = ({ onSuccess }) => {
    const [step, setStep] = useState('intro');
    const [breathHoldData, setBreathHoldData] = useState([]);
    const [symptoms, setSymptoms] = useState({
        breathlessness: false,
        cough: false,
        chestTightness: false,
        smokingHistory: false,
        historyOfAsthma: false
    });

    const [breathState, setBreathState] = useState('idle');
    const [timer, setTimer] = useState(0);
    const [currentHoldTime, setCurrentHoldTime] = useState(0);
    const intervalRef = useRef(null);
    const holdIntervalRef = useRef(null);

    const startBreathingTest = () => {
        setStep('breathing');
        runBreathingCycle();
    };

    const runBreathingCycle = () => {
        setBreathState('inhale');
        setTimer(4);
        let count = 4;
        intervalRef.current = setInterval(() => {
            count--;
            setTimer(count);
            if (count === 0) {
                clearInterval(intervalRef.current);
                startHoldPhase();
            }
        }, 1000);
    };

    const startHoldPhase = () => {
        setBreathState('hold');
        setCurrentHoldTime(0);
        const startTime = Date.now();
        holdIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setCurrentHoldTime(elapsed.toFixed(1));
        }, 100);
    };

    const stopHolding = () => {
        clearInterval(holdIntervalRef.current);
        const finalHoldTime = parseFloat(currentHoldTime);
        setBreathHoldData([...breathHoldData, finalHoldTime]);
        setBreathState('exhale');
        setTimer(6);
        let count = 6;
        intervalRef.current = setInterval(() => {
            count--;
            setTimer(count);
            if (count === 0) {
                clearInterval(intervalRef.current);
                setBreathState('idle');
            }
        }, 1000);
    };

    const submitAssessment = async () => {
        setStep('submitting');
        const maxHold = Math.max(...breathHoldData, 0);
        const averageHold = breathHoldData.reduce((a, b) => a + b, 0) / (breathHoldData.length || 1);
        const payload = { breathHoldDuration: averageHold, maxBreathHold: maxHold, attempts: breathHoldData.length, symptoms };

        try {
            await respiratoryAPI.submitAssessment(payload);
            onSuccess();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Data Archival Failed', text: 'Diagnostic sequence synchronization failure.', confirmButtonColor: '#ef4444' });
            setStep('questions');
        }
    };

    if (step === 'intro') {
        return (
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-900/5 border border-blue-50 p-16 text-center max-w-3xl mx-auto overflow-hidden relative">
                <div className="bg-blue-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-200 border border-blue-100">
                    <Play className="w-10 h-10 text-white ml-2" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">Start Respiratory Scan</h2>
                <div className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-12 space-y-6 text-left bg-gray-50 p-10 rounded-[3rem] border border-gray-100">
                    <p className="text-gray-900">Clinical Protocol:</p>
                    <ul className="list-none space-y-4">
                        <li className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div> Position body in an upright, relaxed vector.</li>
                        <li className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div> Synchronize with inhale sequence (4.0s).</li>
                        <li className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div> Sustain pulmonary hold at maximum capacity.</li>
                        <li className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-blue-600 rounded-full"></div> Activate "Terminate Hold" when baseline reached.</li>
                    </ul>
                </div>
                <button
                    onClick={startBreathingTest}
                    className="bg-gray-950 hover:bg-black text-white px-12 py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-gray-200"
                >
                    Initialize Protocol
                </button>
            </div>
        );
    }

    if (step === 'breathing') {
        return (
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-900/5 border border-blue-50 p-20 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] -mr-64 -mt-64"></div>

                <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                    <div className="absolute inset-0 border-[1rem] border-gray-50 rounded-full"></div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={breathState}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: breathState === 'inhale' ? 1.4 : breathState === 'hold' ? 1.5 : 0.9,
                                opacity: 1,
                                backgroundColor: breathState === 'inhale' ? '#2563eb' : breathState === 'hold' ? '#9333ea' : '#16a34a'
                            }}
                            transition={{
                                duration: breathState === 'inhale' ? 4 : breathState === 'exhale' ? 6 : 0.5,
                                ease: "easeInOut"
                            }}
                            className="w-40 h-40 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl"
                        >
                            {breathState === 'hold' ? currentHoldTime : timer}
                        </motion.div>
                    </AnimatePresence>
                    {breathState === 'hold' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            className="absolute inset-0 bg-purple-600 rounded-full animate-ping"
                        ></motion.div>
                    )}
                </div>

                <div className="text-center">
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                        {breathState === 'inhale' ? 'Inhalation Phase' : breathState === 'hold' ? 'Pulmonary Hold' : breathState === 'exhale' ? 'Controlled Exhale' : 'Scan Stabilized'}
                    </h2>
                    <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.3em] mb-12">
                        Attempt Vector {breathHoldData.length + 1}
                    </p>
                </div>

                <div className="flex gap-6 mt-6">
                    {breathState === 'hold' && (
                        <button
                            onClick={stopHolding}
                            className="bg-gray-950 text-white px-12 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl ring-8 ring-purple-50 transition-all hover:bg-black"
                        >
                            Terminate Hold & Release
                        </button>
                    )}

                    {breathState === 'idle' && (
                        <div className="flex flex-col items-center gap-8">
                            <div className="px-8 py-4 bg-blue-50 rounded-2xl border border-blue-100 italic">
                                <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Attempt {breathHoldData.length} Integrity: {breathHoldData[breathHoldData.length - 1]}s</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={runBreathingCycle}
                                    className="px-8 py-4 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" /> Recalibrate
                                </button>
                                <button
                                    onClick={() => setStep('questions')}
                                    className="bg-gray-950 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center gap-2"
                                >
                                    Final Diagnostics <Play className="w-4 h-4" />
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
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-blue-900/5 border border-blue-50 p-16 max-w-3xl mx-auto overflow-hidden">
                <div className="flex items-center space-x-4 mb-10">
                    <div className="h-10 w-1.5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Biometric Conditions</h2>
                </div>
                <div className="space-y-4 mb-12">
                    {[
                        { key: 'breathlessness', label: 'EXPERIENCE SHORTNESS OF BREATH DURING PHYSICAL VECTORS?' },
                        { key: 'cough', label: 'SUFFERS FROM PERSISTENT OR RECURRING COUGH ANOMALIES?' },
                        { key: 'chestTightness', label: 'SYSTEMIC TIGHTNESS OR PULMONARY HEAVINESS DETECTED?' },
                        { key: 'historyOfAsthma', label: 'CLINICAL HISTORY OF ASTHMA OR BRONCHIAL ISSUES?' },
                        { key: 'smokingHistory', label: 'ACTIVE OR PREVIOUS EXPOSURE TO LUNG IRRITANTS (SMOKING)?' },
                    ].map((q) => (
                        <div key={q.key} className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 gap-4">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex-1">{q.label}</span>
                            <div className="flex bg-white p-1 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setSymptoms({ ...symptoms, [q.key]: true })}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${symptoms[q.key] ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setSymptoms({ ...symptoms, [q.key]: false })}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${!symptoms[q.key] ? 'bg-gray-600 text-white shadow-lg' : 'text-gray-400'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-10 border-t border-gray-50">
                    <button
                        onClick={submitAssessment}
                        className="bg-gray-950 hover:bg-black text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 transition-all flex items-center gap-4"
                    >
                        Generate Quantum Report <ArrowRight className="w-5 h-5 text-blue-400" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            <Loader2 className="h-20 w-20 text-blue-600 animate-spin" />
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mt-12">Neural Synthesis</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic">Archiving pulmonary data nodes...</p>
        </div>
    );
};

const DashboardStats = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="p-24 text-center bg-white rounded-[4rem] border border-gray-100 shadow-sm flex flex-col items-center">
                <Wind className="h-20 w-20 text-gray-100 mb-8" />
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Pulmonary Archive Empty</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest max-w-xs">Initiate a respiratory scan to populate diagnostic trends.</p>
            </div>
        );
    }

    const latest = history[0];
    const chartData = [...history].reverse().map(h => ({
        date: new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: h.riskScore
    }));

    const getRiskStyles = (level) => {
        if (level === 'High Risk') return 'text-red-600 bg-red-50 border-red-100 shadow-red-500/5';
        if (level === 'Mild Risk') return 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/5';
        return 'text-green-600 bg-green-50 border-green-100 shadow-green-500/5';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Aggregate Core */}
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 lg:col-span-4 flex flex-col items-center text-center">
                <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.4em] mb-12">Latest Analysis</h3>

                <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="#f8fafc" strokeWidth="12" fill="none" />
                        <motion.circle
                            cx="96" cy="96" r="80"
                            stroke={latest.riskScore > 80 ? '#ef4444' : latest.riskScore > 40 ? '#f59e0b' : '#10b981'}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={500}
                            initial={{ strokeDashoffset: 500 }}
                            animate={{ strokeDashoffset: 500 - (500 * latest.riskScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{latest.riskScore}</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Risk Unit</span>
                    </div>
                </div>

                <div className={`w-full py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 mb-10 ${getRiskStyles(latest.riskLevel)}`}>
                    {latest.riskLevel}
                </div>

                <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">
                        <span>Max Hold Time</span>
                        <span className="text-gray-900">{latest.maxBreathHold}s</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-4">
                        <span>Anomalies Detected</span>
                        <span className="text-red-500">{Object.entries(latest.symptoms).filter(([k, v]) => v).length} Units</span>
                    </div>
                    <p className="pt-4 text-[9px] font-black text-gray-300 uppercase italic">Archived: {new Date(latest.createdAt).toISOString().slice(0, 16).replace('T', ' ')}</p>
                </div>

                {latest.riskLevel === 'High Risk' && (
                    <div className="mt-8 bg-red-100 p-8 rounded-[2.5rem] border border-red-200 flex flex-col items-center gap-4 border-l-[0.8rem] border-l-red-600">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-relaxed">
                            CRITICAL LUNG CAPACITY ANOMALY DETECTED. IMMEDIATE CLINICAL CONSULTATION MANDATED.
                        </p>
                    </div>
                )}
            </div>

            {/* Pulmonary Trends */}
            <div className="bg-white p-12 rounded-[5rem] border border-gray-100 shadow-sm lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-12 px-8">
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] flex items-center">
                        <Activity className="w-6 h-6 mr-4 text-blue-600" /> Capacity Stability Trend
                    </h3>
                </div>

                <div className="h-80 w-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
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
                                domain={[0, 100]}
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
                                stroke="#2563eb"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorBlue)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Historical Sequence Index */}
            <div className="bg-gray-950 p-12 rounded-[4rem] text-white lg:col-span-12 shadow-2xl shadow-blue-900/10 border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                    <History className="w-5 h-5" /> Pulmonary Diagnostic Index
                </h3>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Temporal Node</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Risk Vector</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Maxhold Integrity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Strata Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map(item => (
                                <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-4">
                                            <Calendar className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
                                            <div>
                                                <div className="text-[11px] font-black uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[9px] font-bold text-gray-600 uppercase italic">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center text-[12px] font-black text-blue-400">{item.riskScore}</td>
                                    <td className="px-8 py-6 text-center text-[11px] font-black">{item.maxBreathHold}S</td>
                                    <td className="px-8 py-6 text-right">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current opacity-70 ${item.riskLevel === 'Normal' ? 'text-green-500' :
                                            item.riskLevel === 'High Risk' ? 'text-red-500' :
                                                'text-amber-500'
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
