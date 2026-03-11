import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, TestTube, Building2, Users, Calendar,
  BarChart3, Settings as SettingsIcon, Plus, Edit, Trash2,
  UserCheck, UserPlus, Mail, Phone, MapPin, Search,
  Filter, Download, Upload, Loader, AlertCircle,
  Activity, Zap, ShieldCheck, Microscope, Layers,
  FlaskConical, Boxes, Info, ArrowRight, X, ChevronRight,
  Database, Fingerprint, Network, Radio, Save,
  Camera, Smartphone, Clock, Beaker, FileText,
  Tag, IndianRupee, Thermometer, Droplet, Heart,
  Gem, Eye, Cpu, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import DashboardLayout from '../layouts/DashboardLayout';
import PlaceholderPage from '../components/common/PlaceholderPage';
import ManageLabs from './ManageLabs';
import AdminBookings from './AdminBookings';
import AdminReports from './AdminReports';
import AdminOverview from '../components/dashboard/AdminOverview';
import AdminSettings from '../components/dashboard/AdminSettings';
import api from '../services/api';

const { testAPI, packageAPI, staffAPI } = api;

const AdminDashboard = () => {
  const sidebarItems = [
    { path: '/admin/dashboard', label: 'Neural Overview', icon: LayoutDashboard },
    { path: '/admin/dashboard/tests', label: 'Diagnostic Units', icon: TestTube },
    { path: '/admin/dashboard/labs', label: 'Facility Network', icon: Building2 },
    { path: '/admin/dashboard/users', label: 'Human Assets', icon: Users },
    { path: '/admin/dashboard/bookings', label: 'Logistics Ledger', icon: Calendar },
    { path: '/admin/dashboard/reports', label: 'Analytical Flow', icon: BarChart3 },
    { path: '/admin/dashboard/settings', label: 'Core Parameters', icon: SettingsIcon }
  ];

  // --- Sub-component: Manage Tests & Packages (Refactored) ---
  const ManageTests = () => {
    const [activeTab, setActiveTab] = useState('tests');
    const [showAddTestModal, setShowAddTestModal] = useState(false);
    const [showAddPackageModal, setShowAddPackageModal] = useState(false);
    const [showEditTestModal, setShowEditTestModal] = useState(false);
    const [showEditPackageModal, setShowEditPackageModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const [tests, setTests] = useState([]);
    const [packages, setPackages] = useState([]);

    const [newTest, setNewTest] = useState({
      name: '', description: '', category: 'blood', price: '',
      duration: '', preparation: '', resultFields: [], image: null, imagePreview: null
    });

    const [newPackage, setNewPackage] = useState({
      name: '', description: '', price: '', discount: '',
      selectedTests: [], duration: '', benefits: '', image: null, imagePreview: null
    });

    useEffect(() => {
      fetchTests();
      fetchPackages();
    }, []);

    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await testAPI.getTests();
        setTests(response.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch diagnostic units.');
      } finally {
        setLoading(false);
      }
    };

    const fetchPackages = async () => {
      try {
        const response = await packageAPI.getPackages();
        setPackages(response.data || []);
      } catch (err) {
        console.error('Error fetching bundles:', err);
      }
    };

    const handleImageUpload = (e, target) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) return setError('Asset size exceeds 5MB limit.');
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (target === 'test') {
            setNewTest(prev => ({ ...prev, image: file, imagePreview: ev.target.result }));
          } else {
            setNewPackage(prev => ({ ...prev, image: file, imagePreview: ev.target.result }));
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleAction = async (type, isUpdate = false) => {
      try {
        setLoading(true);
        setError('');
        setFieldErrors({});

        const currentData = type === 'test' ? newTest : newPackage;
        const errors = {};
        if (!currentData.name) errors.name = 'Required Field';
        if (!currentData.description) errors.description = 'Required Field';
        if (!currentData.price) errors.price = 'Required Field';
        if (type === 'test' && !currentData.duration) errors.duration = 'Required Field';
        if (type === 'package' && currentData.selectedTests.length === 0) errors.selectedTests = 'Min 1 Unit';

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setLoading(false);
          return;
        }

        const apiCall = type === 'test'
          ? (isUpdate ? testAPI.updateTest(selectedTest._id, newTest) : testAPI.createTest(newTest))
          : (isUpdate ? packageAPI.updatePackage(selectedPackage._id, newPackage) : packageAPI.createPackage(newPackage));

        await apiCall;
        type === 'test' ? fetchTests() : fetchPackages();

        setShowAddTestModal(false); setShowAddPackageModal(false);
        setShowEditTestModal(false); setShowEditPackageModal(false);

        Swal.fire({
          icon: 'success',
          title: 'Neural Matrix Sync',
          text: `${type === 'test' ? 'Diagnostic unit' : 'Therapeutic bundle'} ${isUpdate ? 'calibrated' : 'integrated'} successfully.`,
          confirmButtonColor: '#0f172a'
        });
      } catch (err) {
        setError(err.message || 'Transmission failed.');
      } finally {
        setLoading(false);
      }
    };

    const handleDelete = async (item, type) => {
      const result = await Swal.fire({
        title: 'Terminate Unit?',
        text: `Permanent deletion of ${item.name} from global catalog.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Yes, Terminate',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        try {
          type === 'test' ? await testAPI.deleteTest(item._id) : await packageAPI.deletePackage(item._id);
          type === 'test' ? fetchTests() : fetchPackages();
          Swal.fire({ icon: 'success', title: 'Asset Purged', confirmButtonColor: '#0f172a' });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Purge Failed', text: err.message });
        }
      }
    };

    const addResultField = () => {
      setNewTest({
        ...newTest,
        resultFields: [...newTest.resultFields, { label: '', unit: '', referenceRange: '', type: 'number', required: true }]
      });
    };

    const removeResultField = (index) => {
      const updated = [...newTest.resultFields];
      updated.splice(index, 1);
      setNewTest({ ...newTest, resultFields: updated });
    };

    const updateResultField = (index, field, value) => {
      const updated = [...newTest.resultFields];
      updated[index][field] = value;
      setNewTest({ ...newTest, resultFields: updated });
    };

    const filteredTests = tests.filter(test =>
      ((test.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === 'all' || test.category === filterCategory)
    );

    const filteredPackages = packages.filter(pkg =>
      (pkg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-10 pb-32"
      >
        {/* Intelligence Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                Diagnostic Intelligence Unit
              </span>
              <div className="h-0.5 w-16 bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Global Asset Management
              </span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
              Diagnostic <span className="text-indigo-600">Assets</span> Matrix
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl">
              Configuring the global catalog of clinical tests and therapeutic bundles with sub-millimeter precision.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 flex shadow-inner">
              {[
                { id: 'tests', icon: TestTube, label: 'Units' },
                { id: 'packages', icon: Boxes, label: 'Bundles' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl border border-slate-50' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Search & Action */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder={`Identify ${activeTab === 'tests' ? 'Unit' : 'Bundle'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200"
            />
          </div>
          {activeTab === 'tests' && (
            <div className="lg:w-64">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest focus:ring-8 focus:ring-slate-900/5 appearance-none cursor-pointer"
              >
                <option value="all">Global Vectors</option>
                <option value="blood">Blood Units</option>
                <option value="urine">Urine Units</option>
                <option value="imaging">Imaging Nodes</option>
                <option value="cardiology">Cardio Node</option>
                <option value="pathology">Pathology Node</option>
              </select>
            </div>
          )}
          <button
            onClick={() => {
              if (activeTab === 'tests') {
                setNewTest({ name: '', description: '', category: 'blood', price: '', duration: '', preparation: '', resultFields: [], image: null, imagePreview: null });
                setShowAddTestModal(true);
              } else {
                setNewPackage({ name: '', description: '', price: '', discount: '', selectedTests: [], duration: '', benefits: '', image: null, imagePreview: null });
                setShowAddPackageModal(true);
              }
            }}
            className="px-10 py-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Integrate Asset</span>
          </button>
        </div>

        {/* Matrix Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {(activeTab === 'tests' ? filteredTests : filteredPackages).map((item, idx) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className={`${activeTab === 'packages' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'} rounded-[3.5rem] overflow-hidden border border-slate-50 shadow-2xl shadow-slate-200 group relative flex flex-col h-full`}
              >
                {item.image && (
                  <div className="h-56 w-full overflow-hidden relative">
                    <img
                      src={item.image.startsWith('http') ? item.image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/${item.image.replace(/\\/g, '/')}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 font-bold"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${activeTab === 'packages' ? 'from-slate-900' : 'from-white'} via-transparent to-transparent`} />
                  </div>
                )}
                <div className="p-10 relative flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6 shrink-0">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${activeTab === 'packages' ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600'}`}>
                      {activeTab === 'tests' ? <TestTube size={20} /> : <Boxes size={20} className="text-indigo-400" />}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (activeTab === 'tests') {
                            setSelectedTest(item);
                            setNewTest({
                              ...item,
                              name: item.name || '',
                              description: item.description || '',
                              price: item.price || '',
                              duration: item.duration || '',
                              preparation: item.preparation || '',
                              resultFields: item.resultFields || [],
                              imagePreview: item.image ? (item.image.startsWith('http') ? item.image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/${item.image.replace(/\\/g, '/')}`) : null,
                              image: null
                            });
                            setShowEditTestModal(true);
                          } else {
                            setSelectedPackage(item);
                            setNewPackage({
                              ...item,
                              name: item.name || '',
                              description: item.description || '',
                              price: item.price || '',
                              discount: item.discount || '',
                              selectedTests: item.selectedTests?.map(t => typeof t === 'string' ? t : t._id) || [],
                              imagePreview: item.image ? (item.image.startsWith('http') ? item.image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/${item.image.replace(/\\/g, '/')}`) : null,
                              image: null
                            });
                            setShowEditPackageModal(true);
                          }
                        }}
                        className={`p-3 border rounded-xl transition-all ${activeTab === 'packages' ? 'bg-white/5 border-white/10 hover:bg-white/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-900 hover:text-white'}`}
                      >
                        <Edit size={14} className={activeTab === 'tests' ? '' : 'text-white'} />
                      </button>
                      <button
                        onClick={() => handleDelete(item, activeTab === 'tests' ? 'test' : 'package')}
                        className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-rose-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-8 flex-1">
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${activeTab === 'packages' ? 'text-white/40' : 'text-slate-300'}`}>
                      {activeTab === 'tests' ? item.category : `${item.selectedTests?.length || 0} Units Included`}
                    </p>
                    <h4 className="text-2xl font-black uppercase tracking-tighter leading-tight mb-4">{item.name}</h4>
                    <p className={`text-xs font-medium leading-relaxed line-clamp-3 ${activeTab === 'packages' ? 'text-white/50' : 'text-slate-500'}`}>{item.description}</p>
                  </div>
                  <div className={`flex items-center justify-between pt-8 border-t shrink-0 ${activeTab === 'packages' ? 'border-white/10' : 'border-slate-50'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'packages' ? 'text-white/30' : 'text-slate-300'}`}>Unit Value</span>
                      <span className="text-xl font-black tracking-tighter">₹{item.price}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'packages' ? 'text-white/30' : 'text-slate-300'}`}>Temporal</span>
                      <span className="text-sm font-black uppercase tracking-tight">{item.duration} Pulse</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Global Test Integration Modal */}
        <AnimatePresence>
          {(showAddTestModal || showEditTestModal) && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 lg:p-12 font-bold">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[4rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-4xl border border-slate-100"
              >
                <div className="p-10 lg:p-16 flex justify-between items-center shrink-0 border-b border-slate-50">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                      {showEditTestModal ? 'Unit Calibration' : 'Asset Integration'}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Diagnostic Unit Parameters</p>
                  </div>
                  <button onClick={() => { setShowAddTestModal(false); setShowEditTestModal(false); }} className="p-6 bg-slate-50 text-slate-300 rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-10">
                      <div className="relative group rounded-[2.5rem] overflow-hidden bg-slate-50 h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:bg-slate-100 transition-all">
                        {newTest.imagePreview ? (
                          <>
                            <img src={newTest.imagePreview} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="text-white h-8 w-8" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-slate-300">
                            <Camera size={48} strokeWidth={1} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Asset Visual Capture</span>
                          </div>
                        )}
                        <input type="file" onChange={(e) => handleImageUpload(e, 'test')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Unit Identity</label>
                          <input
                            type="text" value={newTest.name} onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                            className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] font-bold shadow-inner border-none focus:ring-4 focus:ring-slate-900/5 transition-all text-sm"
                            placeholder="TEST NAME"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Catalog Category</label>
                          <select
                            value={newTest.category} onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
                            className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] font-bold shadow-inner border-none focus:ring-4 focus:ring-slate-900/5 transition-all text-sm appearance-none"
                          >
                            <option value="blood">BLOOD UNIT</option>
                            <option value="urine">URINE UNIT</option>
                            <option value="imaging">IMAGING NODE</option>
                            <option value="cardiology">CARDIO NODE</option>
                            <option value="pathology">PATHOLOGY NODE</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Pricing Pulse</label>
                            <input
                              type="number" value={newTest.price} onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                              className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] font-bold shadow-inner border-none text-sm" placeholder="₹"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Temporal Cycle</label>
                            <input
                              type="text" value={newTest.duration} onChange={(e) => setNewTest({ ...newTest, duration: e.target.value })}
                              className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] font-bold shadow-inner border-none text-sm" placeholder="e.g. 24H"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Analytical Parameters (Result Fields)</label>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {newTest.resultFields.map((field, idx) => (
                            <div key={idx} className="p-8 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100 relative group">
                              <input
                                type="text" value={field.label} onChange={(e) => updateResultField(idx, 'label', e.target.value)}
                                className="w-full bg-transparent border-b-2 border-slate-200 text-xs font-black uppercase tracking-widest focus:border-indigo-600 transition-all pb-2 outline-none"
                                placeholder="PARAMETER LABEL"
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={field.unit} onChange={(e) => updateResultField(idx, 'unit', e.target.value)} className="bg-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm" placeholder="UNIT (e.g. mg/dL)" />
                                <input type="text" value={field.referenceRange} onChange={(e) => updateResultField(idx, 'referenceRange', e.target.value)} className="bg-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm" placeholder="RANGE (e.g. 70-110)" />
                              </div>
                              <button onClick={() => removeResultField(idx)} className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><X size={12} /></button>
                            </div>
                          ))}
                          <button onClick={addResultField} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-3">
                            <Plus size={14} /> Add Parameter Node
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Pre-diagnostic Protocol</label>
                        <textarea
                          rows={4} value={newTest.preparation} onChange={(e) => setNewTest({ ...newTest, preparation: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] font-bold shadow-inner border-none text-xs resize-none"
                          placeholder="Special instructions for patient preparation..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 lg:p-16 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0 gap-6">
                  <button onClick={() => { setShowAddTestModal(false); setShowEditTestModal(false); }} className="px-10 py-5 bg-white border border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-slate-900 transition-all">Abort Sequence</button>
                  <button onClick={() => handleAction('test', showEditTestModal)} className="px-12 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl flex items-center gap-4 transition-all">
                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Sync Unit
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Bundle Integration Modal */}
        <AnimatePresence>
          {(showAddPackageModal || showEditPackageModal) && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 lg:p-12 font-bold">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 rounded-[4rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-4xl border border-white/5 text-white"
              >
                <div className="p-10 lg:p-16 flex justify-between items-center shrink-0 border-b border-white/5">
                  <div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                      {showEditPackageModal ? 'Bundle Calibration' : 'Bundle Integration'}
                    </h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Therapeutic Protocol Parameters</p>
                  </div>
                  <button onClick={() => { setShowAddPackageModal(false); setShowEditPackageModal(false); }} className="p-6 bg-white/5 text-white/40 rounded-[2rem] hover:bg-white hover:text-slate-900 transition-all"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="space-y-10">
                      <div className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:bg-white/10 transition-all">
                        {newPackage.imagePreview ? (
                          <>
                            <img src={newPackage.imagePreview} className="w-full h-full object-cover font-bold" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="text-white h-8 w-8" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-white/20">
                            <Camera size={48} strokeWidth={1} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Visual Capture</span>
                          </div>
                        )}
                        <input type="file" onChange={(e) => handleImageUpload(e, 'package')} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Protocol Identity</label>
                          <input
                            type="text" value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 rounded-[1.5rem] font-bold border-none focus:ring-4 focus:ring-white/5 transition-all text-sm text-white"
                            placeholder="BUNDLE NAME"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Core Philosophy (Description)</label>
                          <textarea
                            rows={4} value={newPackage.description} onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 rounded-[1.5rem] font-bold border-none text-xs resize-none text-white/70"
                            placeholder="Protocol objectives..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Unit Matrix Integration</label>
                        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {tests.map(test => (
                            <div
                              key={test._id}
                              onClick={() => {
                                const selected = newPackage.selectedTests.includes(test._id);
                                setNewPackage({
                                  ...newPackage,
                                  selectedTests: selected
                                    ? newPackage.selectedTests.filter(id => id !== test._id)
                                    : [...newPackage.selectedTests, test._id]
                                });
                              }}
                              className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${newPackage.selectedTests.includes(test._id) ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${newPackage.selectedTests.includes(test._id) ? 'bg-white/20' : 'bg-white/5'}`}>
                                  <TestTube size={14} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-tight">{test.name}</span>
                              </div>
                              {newPackage.selectedTests.includes(test._id) && <CheckCircle2 size={16} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Consolidated Value</label>
                          <input
                            type="number" value={newPackage.price} onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 rounded-[1.5rem] font-bold border-none text-sm text-white" placeholder="₹"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Efficiency Discount</label>
                          <input
                            type="number" value={newPackage.discount} onChange={(e) => setNewPackage({ ...newPackage, discount: e.target.value })}
                            className="w-full px-8 py-5 bg-white/5 rounded-[1.5rem] font-bold border-none text-sm text-white" placeholder="₹"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 lg:p-16 border-t border-white/5 bg-white/5 flex justify-end shrink-0 gap-6">
                  <button onClick={() => { setShowAddPackageModal(false); setShowEditPackageModal(false); }} className="px-10 py-5 bg-white/5 border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-white hover:text-slate-900 transition-all font-bold">Abort Sequence</button>
                  <button onClick={() => handleAction('package', showEditPackageModal)} className="px-12 py-5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-indigo-500/20 flex items-center gap-4 transition-all hover:scale-[1.05] active:scale-95 font-bold">
                    {loading ? <Loader className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Sync Protocol
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // --- Sub-component: Manage Users (Restored) ---
  const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      fetchUsers();
    }, []);

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await staffAPI.getUsers();
        setUsers(response.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const toggleBlockStatus = async (user) => {
      try {
        const result = await Swal.fire({
          title: user.isBlocked ? 'Unblock User?' : 'Block User?',
          text: `Are you sure you want to ${user.isBlocked ? 'restore access for' : 'suspend access for'} ${user.name}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: user.isBlocked ? '#10b981' : '#dc2626',
          confirmButtonText: user.isBlocked ? 'Yes, Unblock' : 'Yes, Block',
          reverseButtons: true
        });

        if (result.isConfirmed) {
          await staffAPI.updateUserBlockStatus(user._id, { isBlocked: !user.isBlocked });
          fetchUsers();
          Swal.fire({
            icon: 'success',
            title: 'Registry Updated',
            text: `User ${user.isBlocked ? 'unblocked' : 'blocked'} successfully.`,
            confirmButtonColor: '#0f172a'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err.message,
          confirmButtonColor: '#0f172a'
        });
      }
    };

    const filteredUsers = users.filter(u =>
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                Human Intelligence Registry
              </span>
              <div className="h-0.5 w-16 bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Authorized Personnel Grid
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
              Human <span className="text-indigo-600">Assets</span> Matrix
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl">
              Global registry of clinical specialists, operational staff, and patient nodes.
            </p>
          </div>
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Identify Human Vector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-xl shadow-slate-100 focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200"
            />
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-50 shadow-2xl shadow-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em]">Identity Node</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em]">Communication Vector</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em]">Access Role</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em]">Pulse Status</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-right">Operational Logic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <Loader className="animate-spin h-10 w-10 mx-auto text-indigo-600" />
                      <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Calibrating Registry Sensors...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-24 text-center italic text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching human vectors found in matrix.</td>
                  </tr>
                ) : filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-indigo-600 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                          {user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">UUID: {user._id.slice(-12).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xs font-bold text-slate-600">{user.email}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{user.phone || 'NO SECURE LINE'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-600 text-white' : user.role === 'staff' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        {user.role} NODE
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${user.isBlocked ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${user.isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {user.isBlocked ? 'Network Denied' : 'Signal Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button
                        onClick={() => toggleBlockStatus(user)}
                        className={`p-4 rounded-2xl transition-all shadow-sm ${user.isBlocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}
                      >
                        {user.isBlocked ? <UserCheck size={18} /> : <Trash2 size={18} />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="max-w-[1600px] mx-auto">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="tests" element={<ManageTests />} />
          <Route path="labs" element={<ManageLabs />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
