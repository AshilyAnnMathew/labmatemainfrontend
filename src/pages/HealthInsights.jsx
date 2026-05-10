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
    Brain,
    ShieldCheck,
    Zap,
    TrendingUp,
    RefreshCw,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import RecommendedTests from '../components/RecommendedTests';

const HealthInsights = () => {
    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [predResponse, recResponse] = await Promise.allSettled([
                api.predictionAPI.getRiskPrediction(),
                api.recommendationAPI.getRecommendations()
            ]);

            if (predResponse.status === 'fulfilled' && predResponse.value.success) {
                setPrediction(predResponse.value.data);
            } else {
                throw new Error(predResponse.reason || 'Intelligence Link Failure');
            }

            if (recResponse.status === 'fulfilled' && recResponse.value.success) {
                setRecommendations(recResponse.value.recommendations);
            }
        } catch (err) {
            setError(err.message?.includes('unavailable') ? 'Neural interpretation offline' : 'Intelligence stream disconnected');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-amber-500';
            case 'low': return 'text-green-500';
            default: return 'text-blue-500';
        }
    };

    const getRecommendationForFactor = (factor) => {
        const f = factor.toLowerCase();
        if (f.includes('blood pressure')) return "OPTIMIZE SODIUM INTAKE. DEPLOY STRESS MITIGATION PROTOCOLS. FREQUENT BP MONITORING.";
        if (f.includes('sugar') || f.includes('diabetes')) return "RESTRICT GLUCOSE/CARBOHYDRATE INTAKE. ACTIVATE AEROBIC METABOLISM.";
        if (f.includes('cholesterol')) return "IMPLEMENT LIPID-STABILIZING NUTRITION. REDUCE SATURATED FAT INGRESS.";
        if (f.includes('heart rate')) return "CARDIAC EVALUATION RECOMMENDED IF PALPITATIONS ARE PERSISTENT.";
        if (f.includes('oxygen')) return "SATURATION ANOMALY. CONSULT CLINICAL EXPERT IF DYSPNEA OCCURS.";
        if (f.includes('age')) return "AGE-APPROPRIATE PROPHYLACTIC SCREENINGS MANDATED.";
        return "PREVENTATIVE CARE CONSULTATION ADVISED.";
    };

    const MetricCard = ({ label, value, icon: Icon, status }) => {
        const isWarning = status === 'warning';
        return (
            <motion.div whileHover={{ scale: 1.02 }} className={`p-8 rounded-[2.5rem] border ${isWarning ? 'bg-red-50/30 border-red-100 shadow-xl shadow-red-500/5' : 'bg-white border-gray-100 shadow-sm'} transition-all`}>
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${isWarning ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</span>
                </div>
                <div className={`text-2xl font-black ${isWarning ? 'text-red-600' : 'text-gray-900'} uppercase tracking-tight`}>
                    {value}
                </div>
            </motion.div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
                <div className="relative h-24 w-24">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <Loader2 className="h-24 w-24 text-blue-600 animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mt-12">Neural Health Scan</h3>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Synthesizing clinical data points...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 bg-white rounded-[4rem] border border-red-50 shadow-2xl shadow-red-500/5 text-center flex flex-col items-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-8">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Neural Link Interrupted</h3>
                <p className="text-gray-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-4 mb-10 max-w-sm">{error}</p>
                <button onClick={fetchData} className="px-10 py-4 bg-gray-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all">Re-initiate Protocol</button>
            </div>
        );
    }

    return (
        <div className="w-full pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
                <div>
                    <div className="inline-flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-xl mb-4 border border-purple-100">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Advanced Intelligence Engine</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-purple-100 decoration-8 underline-offset-8">Health Insights</h1>
                    <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Real-time risk assessment via clinical biometric analysis</p>
                </div>
                <button onClick={fetchData} className="flex items-center px-8 py-4 bg-white border border-gray-100 text-gray-900 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl shadow-indigo-900/5">
                    <RefreshCw className="w-4 h-4 mr-3 text-purple-600" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Risk Architecture Card */}
                <div className="lg:col-span-5 bg-gray-950 rounded-[4rem] p-12 text-white relative overflow-hidden group border border-white/5 shadow-2xl shadow-purple-950/20">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[150px] opacity-10 -mr-48 -mt-48"></div>

                    <div className="relative z-10">
                        <h2 className="text-[14px] font-black text-purple-400 uppercase tracking-[0.4em] mb-12">Risk Index Core</h2>

                        <div className="flex flex-col items-center">
                            <div className="relative w-64 h-64 mb-12">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="128" cy="128" r="110" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
                                    <motion.circle
                                        cx="128" cy="128" r="110"
                                        stroke={prediction.riskLevel === 'High' ? '#ef4444' : prediction.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'}
                                        strokeWidth="16"
                                        fill="none"
                                        strokeDasharray={700}
                                        initial={{ strokeDashoffset: 700 }}
                                        animate={{ strokeDashoffset: 700 - (700 * prediction.riskScore) / 100 }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        strokeLinecap="round"
                                        className="shadow-2xl"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-7xl font-black tracking-tighter">{prediction.riskScore}</span>
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mt-2 italic">Quantum Score</span>
                                </div>
                            </div>

                            <div className={`px-10 py-3 rounded-full text-[11px] font-black uppercase tracking-widest mb-8 border ${prediction.riskLevel === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : prediction.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                {prediction.riskLevel} STRATA Risk
                            </div>

                            <p className="text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed italic">
                                "{prediction.riskLevel === 'High' ? 'CRITICAL ANOMALIES DETECTED. IMMEDIATE CLINICAL INTERVENTION MANDATED.' : prediction.riskLevel === 'Medium' ? 'DEVIATIONS IDENTIFIED. PREVENTATIVE LIFESTYLE OPTIMIZATION REQUIRED.' : 'BIOMETRIC INTEGRITY VERIFIED. MAINTAIN CURRENT PROTOCOLS.'}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recommendations Neural Feed */}
                <div className="lg:col-span-7 space-y-8 flex flex-col">
                    <div className="flex items-start justify-between bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-sm flex-1">
                        <div className="w-full">
                            <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <Zap className="w-5 h-5 text-purple-600" /> Neural Optimization Feed
                            </h2>

                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
                                {prediction.riskFactors?.length > 0 ? (
                                    prediction.riskFactors.map((factor, index) => (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} key={index} className="group p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:border-purple-200 hover:bg-white hover:shadow-2xl transition-all duration-500">
                                            <div className="flex items-start space-x-6">
                                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-red-500 border border-red-50 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all duration-500">
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-2">{factor}</h4>
                                                    <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-widest italic">
                                                        {getRecommendationForFactor(factor)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-green-50/30 rounded-[3rem] border border-green-100 border-dashed">
                                        <ShieldCheck className="w-16 h-16 text-green-500 mb-6" />
                                        <h3 className="text-xl font-black text-green-900 uppercase tracking-tight">Zero Anomalies</h3>
                                        <p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest mt-2">All scanned metrics pass clinical integrity verfication.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metric Stratification */}
            <div className="mt-16">
                <div className="flex items-center justify-between mb-8 px-6">
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.4em] flex items-center"><Activity className="h-6 w-6 mr-4 text-purple-600" /> Analyzed Biometrics</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantum Timestamp: {new Date(prediction.timestamp).toISOString().slice(0, 16).replace('T', ' ')}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                    <MetricCard
                        label="Cardiac Frequency"
                        value={`${prediction.inputData.heartRate} BPM`}
                        icon={Heart}
                        status={prediction.inputData.heartRate > 100 || prediction.inputData.heartRate < 60 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Oxygen Saturation"
                        value={`${prediction.inputData.spo2}% SPO2`}
                        icon={Activity}
                        status={prediction.inputData.spo2 < 95 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Vascular Pressure"
                        value={`${prediction.inputData.systolicBP}/${prediction.inputData.diastolicBP}`}
                        icon={TrendingUp}
                        status={prediction.inputData.systolicBP > 130 || prediction.inputData.diastolicBP > 85 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Glucose Concentration"
                        value={prediction.inputData.bloodSugar ? `${prediction.inputData.bloodSugar} MG/DL` : 'UNKNOWN'}
                        icon={Droplet}
                        status={prediction.inputData.bloodSugar > 100 ? 'warning' : 'good'}
                    />
                    <MetricCard
                        label="Lipid Profile"
                        value={prediction.inputData.cholesterol ? `${prediction.inputData.cholesterol} MG/DL` : 'UNKNOWN'}
                        icon={ShieldCheck}
                        status={prediction.inputData.cholesterol > 200 ? 'warning' : 'good'}
                    />
                </div>
            </div>

            {/* Recommended Tests Overhaul Wrapper */}
            <div className="mt-24 space-y-12">
                <div className="flex items-center space-x-6 px-10">
                    <div className="h-0.5 flex-1 bg-gray-100"></div>
                    <h2 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.6em]">Proactive Protocols</h2>
                    <div className="h-0.5 flex-1 bg-gray-100"></div>
                </div>
                <RecommendedTests recommendations={recommendations} loading={loading} />
            </div>

            {/* Disclaimer Section */}
            <div className="mt-20 p-10 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row items-center gap-8 border-l-[1rem] border-l-purple-600 shadow-2xl shadow-indigo-900/5">
                <div className="h-16 w-16 bg-purple-100 rounded-[1.5rem] flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Info className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest mb-2">Clinical Protocol Disclaimer</h4>
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest italic">
                        The Neural Insight Engine utilizes advanced algorithmic modeling for informational purposes. This is <strong className="text-gray-900">NOT A CLINICAL DIAGNOSIS</strong>. Verification by a human Medical Professional is strictly mandated for clinical decision-making.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HealthInsights;
