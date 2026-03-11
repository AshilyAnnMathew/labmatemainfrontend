import React, { useState } from 'react';
import {
    Settings, Shield, Bell, Save, Lock,
    Globe, Mail, AlertCircle, CheckCircle,
    Zap, Activity, ShieldCheck, Microscope,
    Layers, Radio, Fingerprint, Database,
    Server, Cpu, DatabaseZap, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Swal from 'sweetalert2';

const { authAPI } = api;

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'LabMate360 Intelligence',
        supportEmail: 'command@labmate360.ai',
        contactPhone: '+91 98765 43210',
        maintenanceMode: false
    });

    const [securitySettings, setSecuritySettings] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSave = async (type) => {
        try {
            setLoading(true);
            await new Promise(r => setTimeout(r, 1000)); // Simulating calibrate sequence
            Swal.fire({
                icon: 'success',
                title: 'Core Parameters Synchronized',
                text: `${type.toUpperCase()} vectors updated in ecosystem matrix.`,
                confirmButtonColor: '#0f172a'
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Calibration Failed' });
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, icon: Icon, label, desc }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-start gap-4 p-6 rounded-[2rem] border transition-all text-left group ${activeTab === id
                ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200'
                : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                }`}
        >
            <div className={`p-3 rounded-xl ${activeTab === id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white'} transition-colors`}>
                <Icon size={20} className={activeTab === id ? 'text-indigo-400' : 'text-slate-300'} />
            </div>
            <div>
                <span className="block text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
                <span className={`text-[9px] font-medium uppercase tracking-widest ${activeTab === id ? 'text-white/40' : 'text-slate-300'}`}>{desc}</span>
            </div>
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-12"
        >
            {/* Settings Header */}
            <div>
                <div className="flex items-center space-x-2 mb-4">
                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                        Global Configuration Terminal
                    </span>
                    <div className="h-0.5 w-16 bg-slate-200"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Core Intelligence Parameters
                    </span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
                    System <span className="text-indigo-600">Calibration</span> Center
                </h1>
                <p className="text-xl text-slate-500 font-medium max-w-2xl">
                    Configuring the fundamental parameters and security protocols of the clinical intelligence grid.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Tactical Navigation */}
                <div className="lg:col-span-1 space-y-4">
                    <TabButton id="general" icon={Globe} label="Ecosystem" desc="Platform Basis" />
                    <TabButton id="security" icon={ShieldCheck} label="Cipher" desc="Access Protocols" />
                    <TabButton id="notifications" icon={Bell} label="Telemetry" desc="Alert Vectors" />

                    <div className="mt-12 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center text-center">
                        <Cpu className="text-indigo-600 mb-4 animate-pulse" size={32} />
                        <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Neural Engine V2.4</h6>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">System Status: Optimal</p>
                    </div>
                </div>

                {/* Configuration Matrix */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white rounded-[4rem] p-12 border border-slate-50 shadow-2xl shadow-slate-100 relative overflow-hidden"
                        >
                            {activeTab === 'general' && (
                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <DatabaseZap className="text-indigo-600" size={24} />
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Platform <span className="text-indigo-600">Foundations</span></h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Neural Identity</label>
                                            <input
                                                type="text"
                                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                                                value={generalSettings.siteName}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Support Vector</label>
                                            <input
                                                type="email"
                                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                                                value={generalSettings.supportEmail}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between border border-white/10 shadow-xl">
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                                                <AlertCircle size={24} />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black uppercase tracking-tight mb-1">Grid Maintenance Node</h5>
                                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Squelch all unauthorized access</p>
                                            </div>
                                        </div>
                                        <button className="h-10 w-20 bg-white/10 border border-white/20 rounded-full relative group transition-all">
                                            <div className="absolute top-1 left-1 h-8 w-8 bg-white rounded-full transition-transform" />
                                        </button>
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 flex justify-end">
                                        <button
                                            onClick={() => handleSave('General')}
                                            className="px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:scale-105 transition-all shadow-xl shadow-slate-200"
                                        >
                                            Commit Calibration
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <ShieldCheck className="text-indigo-600" size={24} />
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access <span className="text-indigo-600">Cipher</span> Control</h3>
                                    </div>
                                    <div className="space-y-3 max-w-md">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Primary Cipher Transformation</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <input
                                                type="password"
                                                placeholder="NEW CIPHER STRING"
                                                className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                                                value={securitySettings.newPassword}
                                                onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Server size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Multifactor Authentication Nodes</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest leading-loose">
                                            Enforcing structural verification on all authorized administrative entrypoints.
                                            Status: Operational.
                                        </p>
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 flex justify-end">
                                        <button
                                            onClick={() => handleSave('Security')}
                                            className="px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:scale-105 transition-all shadow-xl shadow-slate-200"
                                        >
                                            Finalize Security Cipher
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-10 relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <Network className="text-indigo-600" size={24} />
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Telemetry <span className="text-indigo-600">Alert Vectors</span></h3>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { label: 'Critical Node Alerts', desc: 'Real-time telemetry on facility failure', val: true },
                                            { label: 'Intelligence Broadcasts', desc: 'Updates on global clinical trends', val: true },
                                            { label: 'Analytical Summaries', desc: 'Automated ecosystem performance matrix', val: false }
                                        ].map((pref, i) => (
                                            <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all flex items-center justify-between group">
                                                <div>
                                                    <h6 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{pref.label}</h6>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{pref.desc}</p>
                                                </div>
                                                <div className={`h-8 w-14 rounded-full p-1 transition-all ${pref.val ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                    <div className={`h-6 w-6 bg-white rounded-full shadow-sm transition-transform ${pref.val ? 'translate-x-6' : 'translate-x-0'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                                <Database size={400} />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminSettings;
