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
    Clock,
    Zap,
    ShieldCheck,
    ArrowRight,
    Loader2,
    X,
    Eye,
    Settings,
    Layers,
    ActivitySquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
                const formattedData = response.data.map(item => ({
                    ...item,
                    date: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    time: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    fullDate: new Date(item.createdAt),
                })).reverse();

                setHistory(formattedData);
                analyzeData(formattedData);
            }
        } catch (error) {
            console.error("Vascular Sync Failure", error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = (data) => {
        if (!data || data.length === 0) return;
        const totalHR = data.reduce((sum, item) => sum + (item.heartRate || 0), 0);
        const totalSpO2 = data.reduce((sum, item) => sum + (item.spo2 || 0), 0);
        const count = data.length;
        const avgHR = Math.round(totalHR / count);
        const avgSpO2 = Math.round(totalSpO2 / count);

        let trend = 'stable';
        if (count >= 2) {
            const recent = data[count - 1].heartRate;
            const previous = data[count - 2].heartRate;
            if (recent > previous + 5) trend = 'accelerated';
            if (recent < previous - 5) trend = 'decelerated';
        }

        setAnalysis({ avgHeartRate: avgHR, avgSpO2: avgSpO2, totalReadings: count, lastReading: data[count - 1], trend });
    };

    const handleMeasurementComplete = (result) => {
        setShowMonitor(false);
        fetchHistory();
        setActiveTab('analysis');
    };

    return (
        <div className="w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                <div>
                    <div className="inline-flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-xl mb-4 border border-red-100">
                        <Layers className="h-4 w-4 text-red-600" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Optical Plethysmography Core</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-red-100 decoration-8 underline-offset-8">Vascular Intelligence</h1>
                    <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Real-time cardiovascular monitoring via PPG optical sensor technology</p>
                </div>

                <div className="flex space-x-4">
                    <div className="flex bg-gray-100/50 p-1.5 rounded-[2rem] backdrop-blur-sm border border-gray-100">
                        {['monitor', 'history', 'analysis'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white shadow-xl text-red-600' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab === 'monitor' ? 'Overview' : tab === 'history' ? 'Sequence' : 'Strata'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowMonitor(true)}
                        className="bg-gray-950 text-white px-8 py-3 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center gap-3"
                    >
                        <Activity className="w-4 h-4 text-red-500" /> New Scan
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {showMonitor && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-gray-950/95 backdrop-blur-2xl p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden relative border border-white/5">
                            <button onClick={() => setShowMonitor(false)} className="absolute top-10 right-10 p-3 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 transition-all z-[10]">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="p-12">
                                <PPGMonitor onComplete={handleMeasurementComplete} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                    {activeTab === 'monitor' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Technology Overview */}
                            <div className="lg:col-span-12 bg-gray-950 rounded-[4rem] p-16 text-white relative overflow-hidden group border border-white/5 shadow-2xl shadow-red-950/10">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 group-hover:opacity-20 transition-opacity duration-1000"></div>

                                <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                                    <div>
                                        <h3 className="text-[14px] font-black text-red-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                                            <Info className="w-6 h-6" /> Technology Architecture
                                        </h3>
                                        <p className="text-[14px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest mb-12 italic">
                                            Vascular Intelligence utilizes Photoplethysmography to detect blood volume changes in the microvascular tissue. By illuminating the epidermal layers, we capture cardiac frequency and SpO2 levels with high-precision optical analysis.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {[
                                                { label: 'Optical Modulation', desc: 'Light absorption sensing' },
                                                { label: 'HRV Extraction', desc: 'Heart Rate Variability metrics' },
                                                { label: 'Oximetry Mapping', desc: 'Oxygen saturation detection' },
                                                { label: 'Real-time Pulse', desc: 'Biometric visualization' }
                                            ].map((feature, i) => (
                                                <div key={i} className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{feature.label}</span>
                                                        <span className="text-[8px] font-bold text-gray-500 uppercase">{feature.desc}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md flex flex-col items-center text-center group-hover:border-red-500/20 transition-all">
                                            <div className="p-4 bg-red-500/10 rounded-2xl mb-6"><Heart className="w-8 h-8 text-red-500" /></div>
                                            <h4 className="text-4xl font-black mb-2">{analysis?.avgHeartRate || '--'}</h4>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Baseline BPM</p>
                                        </div>
                                        <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md flex flex-col items-center text-center group-hover:border-blue-500/20 transition-all">
                                            <div className="p-4 bg-blue-500/10 rounded-2xl mb-6"><Wind className="w-8 h-8 text-blue-500" /></div>
                                            <h4 className="text-4xl font-black mb-2">{analysis?.avgSpO2 ? `${analysis.avgSpO2}%` : '--'}</h4>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Oxygen Integrity</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Grid */}
                            <div className="lg:col-span-12">
                                <div className="flex items-center justify-between mb-8 px-8">
                                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] flex items-center"><ActivitySquare className="h-6 w-6 mr-4 text-red-600" /> Recent Biometric Sequence</h3>
                                    <button onClick={() => setActiveTab('history')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Full Access Vault</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {history.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="p-4 bg-gray-50 rounded-2xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all"><Heart className="w-6 h-6" /></div>
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.heartRate > 100 || item.heartRate < 60 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                    {item.heartRate > 100 || item.heartRate < 60 ? 'Deviance' : 'Integrity'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col mb-8">
                                                <h4 className="text-3xl font-black text-gray-900 mb-1">{item.heartRate} <span className="text-[12px] text-gray-400">BPM</span></h4>
                                                <p className="text-[12px] font-black text-blue-600 uppercase tracking-widest">{item.spo2}% SpO2</p>
                                            </div>
                                            <div className="flex items-center space-x-3 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                <Calendar className="w-4 h-4" />
                                                <span>{item.date} • {item.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {history.length === 0 && <div className="col-span-3 p-20 text-center bg-gray-50 rounded-[3rem] border border-gray-100 border-dashed text-gray-400 font-black uppercase text-[12px]">Zero records in current temporal buffer.</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden p-12">
                            <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] mb-12 flex items-center gap-4"><Clock className="w-6 h-6 text-red-600" /> Full Temporal Sequence</h3>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-50">
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cardiac Freq (BPM)</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">SPO2 Integrity (%)</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Confidence Index</th>
                                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Strata Analysis</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {history.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-4">
                                                        <Calendar className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                                                        <div>
                                                            <div className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{item.date}</div>
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase italic">{item.time}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[14px] font-black text-gray-900 tracking-tight">{item.heartRate}</td>
                                                <td className="px-8 py-6 text-[14px] font-black text-blue-600">{item.spo2}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.confidence}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-400 tracking-widest">{item.confidence}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-current ${item.heartRate > 100 || item.heartRate < 60 ? 'text-amber-500 bg-amber-50' : 'text-green-500 bg-green-50'}`}>
                                                        {item.heartRate > 100 ? 'Tachycardia' : item.heartRate < 60 ? 'Bradycardia' : 'Stable'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                {[
                                    { label: 'Temporal Units', val: analysis?.totalReadings, detail: 'Cumulative Records', icon: BarChart2, color: 'text-gray-900', bg: 'bg-gray-100' },
                                    { label: 'Kinetic Trend', val: analysis?.trend, detail: 'Dynamic Motion', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
                                    { label: 'Wellness Strata', val: analysis ? (analysis.avgSpO2 >= 95 ? 'HEALED' : 'CAUTION') : '--', detail: 'Cardiac Integration', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl mb-8`}><stat.icon className="w-8 h-8" /></div>
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{stat.label}</h4>
                                        <div className={`text-3xl font-black uppercase tracking-tighter ${stat.color}`}>{stat.val}</div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 italic">{stat.detail}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm h-[450px] flex flex-col">
                                    <h3 className="text-[14px] font-black text-red-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-4"><Heart className="w-6 h-6" /> Pulse Architecture</h3>
                                    <div className="flex-1 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history.slice().reverse()}>
                                                <defs>
                                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" hide />
                                                <YAxis domain={[40, 160]} hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '1.5rem', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                                />
                                                <Area type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorHr)" animationDuration={2000} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm h-[450px] flex flex-col">
                                    <h3 className="text-[14px] font-black text-blue-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-4"><Wind className="w-6 h-6" /> Oxygen Stratification</h3>
                                    <div className="flex-1 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history.slice().reverse()}>
                                                <defs>
                                                    <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="date" hide />
                                                <YAxis domain={[80, 100]} hide />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', padding: '1.5rem', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                                                />
                                                <Area type="monotone" dataKey="spo2" name="Oxygen %" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSp)" animationDuration={2000} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {analysis && (analysis.avgHeartRate > 100 || analysis.avgSpO2 < 95) && (
                                <div className="p-12 bg-amber-50 rounded-[4rem] border border-amber-200 flex flex-col md:flex-row items-center gap-8 border-l-[1rem] border-l-amber-600 shadow-2xl shadow-indigo-900/5">
                                    <div className="h-16 w-16 bg-amber-100 rounded-[1.5rem] flex items-center justify-center text-amber-600 flex-shrink-0">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-2">Cardiac Performance Alert</h4>
                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest italic">
                                            {analysis.avgHeartRate > 100 ? "DYNAMIC TACHYCARDIA SIGNATURE DETECTED." : "ANOMALOUS OXYGEN INTEGRITY DETECTED."} SYSTEMIC PARAMETERS DEVIATING FROM OPTIMAL BASELINE. CLINICAL RE-EVALUATION RECOMMENDED.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default PPGTechnology;
