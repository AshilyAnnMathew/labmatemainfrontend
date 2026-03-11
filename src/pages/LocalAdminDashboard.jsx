import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, TestTube, Calendar,
  Settings as SettingsIcon, Building2, Zap,
  Activity, Cpu, Layers, TrendingUp, ShieldCheck,
  Microscope, Beaker, Package, BarChart3, Clock,
  ArrowRight, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../layouts/DashboardLayout';
import LocalAdminStaffManagement from './LocalAdminStaffManagement';
import LocalAdminTestsPackages from './LocalAdminTestsPackages';
import LocalAdminBookings from './LocalAdminBookings';
import LocalAdminSettings from './LocalAdminSettings';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const LocalAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedLab, setAssignedLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeStaff: 0,
    publishedReports: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    const fetchAssignedLab = async () => {
      try {
        if (user?.assignedLab) {
          const response = await api.labAPI.getLab(user.assignedLab);
          setAssignedLab(response.data);

          // Mimic/Fetch basic stats for dashboard
          const bookingsRes = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 5);
          if (bookingsRes.success) {
            // Just some dummy logic for the premium demo feel if real stats endpoint doesn't exist
            setStats({
              totalBookings: 124,
              activeStaff: 12,
              publishedReports: 89,
              pendingVerifications: 5
            });
          }
        }
      } catch (error) {
        console.error('Error fetching assigned lab:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAssignedLab();
  }, [user]);

  const sidebarItems = [
    { path: '/localadmin/dashboard', label: 'Command Overview', icon: LayoutDashboard },
    { path: '/localadmin/dashboard/staff', label: 'Human Assets', icon: Users },
    { path: '/localadmin/dashboard/tests', label: 'Diagnostic Units', icon: TestTube },
    { path: '/localadmin/dashboard/bookings', label: 'Operation Ledger', icon: Calendar },
    { path: '/localadmin/dashboard/settings', label: 'Node Config', icon: SettingsIcon }
  ];

  const DashboardOverview = () => {
    return (
      <div className="space-y-12 pb-20">
        {/* Cinematic Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                Admin Command Node
              </span>
              <div className="h-0.5 w-16 bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Unit: {assignedLab?.name || 'Scientific Facility'}
              </span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase mb-3">
              Operational <span className="text-indigo-600">Intelligence</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl">
              High-precision control interface for specialized diagnostic infrastructure management.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 italic font-black text-2xl">
              {assignedLab?.name?.[0] || 'L'}
            </div>
          </div>
        </div>

        {/* Global Performance Pulse */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Operation Flux', val: stats.totalBookings, trend: '+12%', icon: Activity, color: 'indigo' },
            { label: 'Active Specialists', val: stats.activeStaff, trend: 'Stable', icon: Users, color: 'emerald' },
            { label: 'Data Transmissions', val: stats.publishedReports, trend: '98% Acc', icon: Zap, color: 'blue' },
            { label: 'Verified Nodes', val: stats.pendingVerifications, trend: 'Critical', icon: ShieldCheck, color: 'rose' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-2xl shadow-slate-100 relative group overflow-hidden"
            >
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-10">
                  <div className={`h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${stat.trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.val}</h3>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <stat.icon size={120} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Action Nodes */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div className="h-px bg-slate-100 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Human Assets', desc: 'Protocol management for laboratory specialists and auxiliary staff.', icon: Users, route: '/localadmin/dashboard/staff' },
                { title: 'Diagnostic Catalog', desc: 'Engineering medical test structures and cinematic package bundles.', icon: Microscope, route: '/localadmin/dashboard/tests' },
                { title: 'Logistics Vault', desc: 'Universal ledger for patient appointments and historical bookings.', icon: Calendar, route: '/localadmin/dashboard/bookings' },
                { title: 'Facility Matrix', desc: 'Secure configuration of regional laboratory operational parameters.', icon: SettingsIcon, route: '/localadmin/dashboard/settings' }
              ].map((node, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 10 }}
                  onClick={() => navigate(node.route)}
                  className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-xl shadow-slate-100 group cursor-pointer"
                >
                  <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                    <node.icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">{node.title}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">{node.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                    Initiate protocol <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Pulse / Reports */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-200 flex-1 relative overflow-hidden group">
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Facility Yield Pulse</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4">Total Scientific Output</h5>
                  <div className="text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40 group-hover:to-indigo-400 transition-all">
                    94.2%
                  </div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                    Operational efficiency detected within optimal clinical thresholds. All nodes synchronized.
                  </p>
                </div>
                <div className="pt-10 flex gap-2">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex-1 bg-white/10 rounded-full overflow-hidden h-12 relative">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 80 + 20}%` }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse', delay: i * 0.1 }}
                        className="absolute bottom-0 left-0 right-0 bg-indigo-500/40"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-10 right-10 opacity-10">
                <Cpu size={100} />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white mb-6 animate-spin">
          <Microscope className="h-8 w-8" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Initializing Administrative Matrix...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      title={`Admin Terminal`}
      sidebarItems={sidebarItems}
      userRole="Administrative Overseer"
      userEmail={user?.email}
    >
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/staff" element={<LocalAdminStaffManagement assignedLab={assignedLab} />} />
        <Route path="/tests" element={<LocalAdminTestsPackages assignedLab={assignedLab} />} />
        <Route path="/bookings" element={<LocalAdminBookings assignedLab={assignedLab} />} />
        <Route path="/settings" element={<LocalAdminSettings assignedLab={assignedLab} />} />
        <Route path="*" element={<Navigate to="/localadmin/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default LocalAdminDashboard;