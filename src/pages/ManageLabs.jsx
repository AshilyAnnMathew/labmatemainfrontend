import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Edit, Trash2, Search, Loader,
  AlertCircle, MapPin, Phone, Mail, Calendar,
  ShieldCheck, Zap, Activity, Globe, Info,
  CheckCircle2, FlaskConical, Boxes, ArrowRight,
  X, ChevronRight, Globe2, Link as LinkIcon,
  Clock, Save, Camera, Smartphone, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';

const { labAPI, testAPI, packageAPI } = api;

const ManageLabs = () => {
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showEditLabModal, setShowEditLabModal] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newLab, setNewLab] = useState({
    name: '', description: '', address: '', city: '', state: '', pincode: '',
    phone: '', email: '', operatingHours: { start: '09:00', end: '20:00' },
    availableTests: [], availablePackages: [], status: 'active',
    image: null, imagePreview: null
  });

  useEffect(() => {
    fetchLabs();
    fetchTests();
    fetchPackages();
  }, []);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const response = await labAPI.getLabs();
      setLabs(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch global nodes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await testAPI.getTests();
      setTests(response.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchPackages = async () => {
    try {
      const response = await packageAPI.getPackages();
      setPackages(response.data || []);
    } catch (err) { console.error(err); }
  };

  const handleAction = async (isUpdate = false) => {
    try {
      setLoading(true);
      setError('');
      setFieldErrors({});

      const errors = {};
      if (!newLab.name) errors.name = 'Required';
      if (!newLab.address) errors.address = 'Required';
      if (!newLab.city) errors.city = 'Required';
      if (!newLab.phone) errors.phone = 'Required';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }

      const labData = {
        name: newLab.name,
        description: newLab.description || 'Clinical intelligence node.',
        image: newLab.image, // Include image file
        address: {
          street: newLab.address, city: newLab.city, state: newLab.state,
          zipCode: newLab.pincode, country: 'India'
        },
        location: {
          lat: parseFloat(newLab.lat || 0),
          lng: parseFloat(newLab.lng || 0)
        },
        contact: { phone: newLab.phone, email: newLab.email, website: '' },
        operatingHours: {
          monday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          tuesday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          wednesday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          thursday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          friday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          saturday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: true },
          sunday: { open: newLab.operatingHours.start, close: newLab.operatingHours.end, isOpen: false }
        },
        availableTests: newLab.availableTests,
        availablePackages: newLab.availablePackages,
        isActive: newLab.status === 'active'
      };

      isUpdate ? await labAPI.updateLab(selectedLab._id, labData) : await labAPI.createLab(labData);

      fetchLabs();
      setShowAddLabModal(false); setShowEditLabModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Neural Node Sync',
        text: `Facility node ${isUpdate ? 'calibrated' : 'integrated'} successfully.`,
        confirmButtonColor: '#0f172a'
      });
    } catch (err) {
      setError(err.message || 'Transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lab) => {
    const result = await Swal.fire({
      title: 'Terminate Node?',
      text: `Permanent decommissioning of ${lab.name} from global network.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, Terminate',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await labAPI.deleteLab(lab._id);
        fetchLabs();
        Swal.fire({ icon: 'success', title: 'Node Deactivated', confirmButtonColor: '#0f172a' });
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Deactivation Failed', text: err.message });
      }
    }
  };

  const openEditModal = (lab) => {
    setSelectedLab(lab);
    setNewLab({
      name: lab.name || '',
      description: lab.description || '',
      address: lab.address?.street || '',
      city: lab.address?.city || '',
      state: lab.address?.state || '',
      pincode: lab.address?.zipCode || '',
      phone: lab.contact?.phone || '',
      email: lab.contact?.email || '',
      operatingHours: {
        start: lab.operatingHours?.monday?.open || '09:00',
        end: lab.operatingHours?.monday?.close || '20:00'
      },
      availableTests: lab.availableTests?.map(t => typeof t === 'object' ? t._id : t) || [],
      availablePackages: lab.availablePackages?.map(p => typeof p === 'object' ? p._id : p) || [],
      status: lab.isActive ? 'active' : 'inactive',
      lat: lab.location?.lat || 0,
      lng: lab.location?.lng || 0,
      imagePreview: lab.image ? (lab.image.startsWith('http') ? lab.image : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}/${lab.image.replace(/\\/g, '/')}`) : null,
      image: null
    });
    setShowEditLabModal(true);
  };

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = (lab.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lab.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (lab.isActive ? 'active' : 'inactive') === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Network Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Facility Network Node
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Global Infrastructure Matrix
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Clinical <span className="text-indigo-600">Facility</span> Network
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Monitoring the operational status and diagnostic capabilities of regional laboratory nodes.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-100 flex items-center gap-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Globe2 size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Active Nodes</p>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{labs.filter(l => l.isActive).length} / {labs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
          <input
            type="text"
            placeholder="Identify Geographical Node..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200"
          />
        </div>
        <div className="lg:w-64">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest focus:ring-8 focus:ring-slate-900/5 appearance-none cursor-pointer"
          >
            <option value="all">Network Status</option>
            <option value="active">Online Node</option>
            <option value="inactive">Offline Node</option>
          </select>
        </div>
        <button
          onClick={() => {
            setNewLab({
              name: '', description: '', address: '', city: '', state: '', pincode: '',
              phone: '', email: '', operatingHours: { start: '09:00', end: '20:00' },
              availableTests: [], availablePackages: [], status: 'active',
              image: null, imagePreview: null
            });
            setShowAddLabModal(true);
          }}
          className="px-10 py-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Integrate Node</span>
        </button>
      </div>

      {/* Helper function for image upload */}
      {(() => {
        if (!ManageLabs.handleImageUpload) {
          ManageLabs.handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (file) {
              if (file.size > 5 * 1024 * 1024) return Swal.fire('Error', 'Image size exceeds 5MB limit.', 'error');
              const reader = new FileReader();
              reader.onload = (ev) => {
                setNewLab(prev => ({ ...prev, image: file, imagePreview: ev.target.result }));
              };
              reader.readAsDataURL(file);
            }
          };
        }
        return null;
      })()}

      {/* Network Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
        {loading && labs.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center opacity-20">
            <Loader className="h-10 w-10 animate-spin" />
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em]">Calibrating Sensors...</p>
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center opacity-20">
            <Globe size={80} strokeWidth={1} />
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em]">Network Spectrum Null</p>
          </div>
        ) : (
          filteredLabs.map((lab, idx) => (
            <motion.div
              key={lab._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 group flex flex-col relative overflow-hidden h-full"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2 truncate max-w-[150px]">{lab.name}</h4>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${lab.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${lab.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {lab.isActive ? 'Node Online' : 'Transmission Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(lab)}
                    className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(lab)}
                    className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 transition-all shadow-sm group/del"
                  >
                    <Trash2 size={14} className="group-hover/del:text-white" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-6 mb-10">
                <div className="flex items-center gap-4">
                  <MapPin size={16} className="text-indigo-400 shrink-0" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {lab.address?.city || 'Null Sector'}, {lab.address?.state || 'Grid'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Smartphone size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{lab.contact?.phone || 'No Data'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Clock size={14} className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {lab.operatingHours?.monday?.open || '09:00'} - {lab.operatingHours?.monday?.close || '20:00'} Pulse
                  </span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {lab.availableTests?.length || 0} Units
                  </div>
                  <div className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {lab.availablePackages?.length || 0} Bundles
                  </div>
                </div>
                <button
                  onClick={() => openEditModal(lab)}
                  className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-slate-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none">
                <Network size={150} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Lab Modal */}
      <AnimatePresence>
        {(showAddLabModal || showEditLabModal) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[4rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-4xl border border-slate-100"
            >
              <div className="p-10 lg:p-16 flex justify-between items-center shrink-0 border-b border-slate-50">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                    Node <span className="text-indigo-600">{showEditLabModal ? 'Calibration' : 'Integration'}</span>
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Facility Parameters Matrix</p>
                </div>
                <button
                  onClick={() => { setShowAddLabModal(false); setShowEditLabModal(false); }}
                  className="p-6 bg-slate-50 text-slate-300 rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  {/* Basic Spectrum */}
                  <div className="space-y-10">
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] border-l-4 border-indigo-600 pl-4">Operational Identity</h5>

                    {/* Image Upload UI */}
                    <div className="relative group rounded-[2.5rem] overflow-hidden bg-slate-50 h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:bg-slate-100 transition-all">
                      {newLab.imagePreview ? (
                        <>
                          <img src={newLab.imagePreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="text-white h-8 w-8" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Camera size={48} strokeWidth={1} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Facility Visual Capture</span>
                        </div>
                      )}
                      <input type="file" onChange={ManageLabs.handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Facility Name</label>
                        <input
                          type="text"
                          value={newLab.name}
                          onChange={(e) => setNewLab({ ...newLab, name: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner"
                          placeholder="e.g. NEURAL CORE LAB"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Node Description</label>
                        <textarea
                          rows={3}
                          value={newLab.description}
                          onChange={(e) => setNewLab({ ...newLab, description: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all shadow-inner resize-none"
                          placeholder="Clinical intelligence parameters..."
                        />
                      </div>
                    </div>

                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] border-l-4 border-indigo-600 pl-4 pt-10">Geographical Vector</h5>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Street Vector</label>
                        <input
                          type="text"
                          value={newLab.address}
                          onChange={(e) => setNewLab({ ...newLab, address: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">City Node</label>
                        <input
                          type="text"
                          value={newLab.city}
                          onChange={(e) => setNewLab({ ...newLab, city: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">State Sector</label>
                        <input
                          type="text"
                          value={newLab.state}
                          onChange={(e) => setNewLab({ ...newLab, state: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Latitude Vector</label>
                        <input
                          type="number"
                          step="any"
                          value={newLab.lat}
                          onChange={(e) => setNewLab({ ...newLab, lat: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                          placeholder="e.g. 12.9716"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Longitude Vector</label>
                        <input
                          type="number"
                          step="any"
                          value={newLab.lng}
                          onChange={(e) => setNewLab({ ...newLab, lng: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                          placeholder="e.g. 77.5946"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Spectrum */}
                  <div className="space-y-10">
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] border-l-4 border-indigo-600 pl-4">Communication Uplink</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Phone Matrix</label>
                        <input
                          type="text"
                          value={newLab.phone}
                          onChange={(e) => setNewLab({ ...newLab, phone: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Email Protocol</label>
                        <input
                          type="email"
                          value={newLab.email}
                          onChange={(e) => setNewLab({ ...newLab, email: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                    </div>

                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] border-l-4 border-indigo-600 pl-4 pt-10">Operational Cycles</h5>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Cycle Initiation</label>
                        <input
                          type="time"
                          value={newLab.operatingHours.start}
                          onChange={(e) => setNewLab({ ...newLab, operatingHours: { ...newLab.operatingHours, start: e.target.value } })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Cycle Termination</label>
                        <input
                          type="time"
                          value={newLab.operatingHours.end}
                          onChange={(e) => setNewLab({ ...newLab, operatingHours: { ...newLab.operatingHours, end: e.target.value } })}
                          className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-900/5 shadow-inner"
                        />
                      </div>
                    </div>

                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] border-l-4 border-indigo-600 pl-4 pt-10">Diagnostic Spectrum</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Available Diagnostic Units</label>
                        <div className="h-48 overflow-y-auto bg-slate-50 rounded-[1.5rem] p-6 space-y-2 shadow-inner border border-slate-100">
                          {tests.map(test => (
                            <label key={test._id} className="flex items-center gap-4 p-3 bg-white rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors group">
                              <input
                                type="checkbox"
                                checked={newLab.availableTests?.includes(test._id)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...(newLab.availableTests || []), test._id]
                                    : (newLab.availableTests || []).filter(id => id !== test._id);
                                  setNewLab({ ...newLab, availableTests: updated });
                                }}
                                className="h-5 w-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{test.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Integrated Test Bundles</label>
                        <div className="h-48 overflow-y-auto bg-slate-50 rounded-[1.5rem] p-6 space-y-2 shadow-inner border border-slate-100">
                          {packages.map(pkg => (
                            <label key={pkg._id} className="flex items-center gap-4 p-3 bg-white rounded-xl cursor-pointer hover:bg-emerald-50 transition-colors group">
                              <input
                                type="checkbox"
                                checked={newLab.availablePackages?.includes(pkg._id)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...(newLab.availablePackages || []), pkg._id]
                                    : (newLab.availablePackages || []).filter(id => id !== pkg._id);
                                  setNewLab({ ...newLab, availablePackages: updated });
                                }}
                                className="h-5 w-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">{pkg.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between border border-white/10 shadow-xl mt-10">
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${newLab.status === 'active' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-rose-400/20 text-rose-400'}`}>
                          <Activity size={24} />
                        </div>
                        <div>
                          <h5 className="text-sm font-black uppercase tracking-tight mb-1">Network Presence</h5>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Global Node Visibility Status</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNewLab({ ...newLab, status: newLab.status === 'active' ? 'inactive' : 'active' })}
                        className="h-10 w-20 bg-white/10 border border-white/20 rounded-full relative group transition-all"
                      >
                        <div className={`absolute top-1 h-8 w-8 bg-white rounded-full transition-transform ${newLab.status === 'active' ? 'left-11' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 lg:p-16 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0 gap-6">
                <button
                  onClick={() => { setShowAddLabModal(false); setShowEditLabModal(false); }}
                  className="px-10 py-5 bg-white border border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  Abort Sequence
                </button>
                <button
                  onClick={() => handleAction(showEditLabModal)}
                  disabled={loading}
                  className="px-12 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
                >
                  {loading ? <Loader className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {showEditLabModal ? 'Commit Calibration' : 'Initialize Node'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ManageLabs;