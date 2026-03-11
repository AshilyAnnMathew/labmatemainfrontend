import React, { useState, useEffect } from 'react';
import {
  Building2, MapPin, Phone, Mail, Clock, Users, Save,
  Edit, ShieldCheck, Zap, Activity, Globe, Info,
  CheckCircle2, AlertTriangle, Briefcase, Calendar,
  Settings as SettingsIcon, Globe2, Link as LinkIcon,
  X, HelpCircle, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';

const LocalAdminSettings = ({ assignedLab }) => {
  const [labData, setLabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    contact: { phone: '', email: '', website: '' },
    operatingHours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false }
    },
    capacity: { dailyCapacity: '', currentBookings: '' }
  });

  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchLabDetails();
    }
  }, [assignedLab]);

  const fetchLabDetails = async () => {
    try {
      setLoading(true);
      const response = await api.labAPI.getLab(assignedLab._id);
      if (response.success) {
        setLabData(response.data);
        setFormData({
          name: response.data.name || '',
          description: response.data.description || '',
          address: {
            street: response.data.address?.street || '',
            city: response.data.address?.city || '',
            state: response.data.address?.state || '',
            zipCode: response.data.address?.zipCode || '',
            country: response.data.address?.country || ''
          },
          contact: {
            phone: response.data.contact?.phone || '',
            email: response.data.contact?.email || '',
            website: response.data.contact?.website || ''
          },
          operatingHours: response.data.operatingHours || formData.operatingHours,
          capacity: {
            dailyCapacity: response.data.capacity?.dailyCapacity || '',
            currentBookings: response.data.capacity?.currentBookings || ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching lab details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section === 'operatingHours') {
      setFormData(prev => ({
        ...prev,
        operatingHours: { ...prev.operatingHours, [field]: { ...prev.operatingHours[field], ...value } }
      }));
    } else if (['address', 'contact', 'capacity'].includes(section)) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.labAPI.updateLab(assignedLab._id, formData);
      if (response.success) {
        setEditing(false);
        setLabData(response.data);
        Swal.fire({
          icon: 'success',
          title: 'Matrix Synchronized',
          text: 'Facility parameters updated across the clinical network.',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Update sequence failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center animate-pulse">
        <HardDrive className="h-12 w-12 text-slate-100 mb-6" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Calibrating Node Parameters...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-24"
    >
      {/* Cinematic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Facility Matrix Node
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Core Configuration Terminal
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Node <span className="text-indigo-600">Parameters</span> & Bio-Data
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Fine-tuning administrative settings, operational windows, and regional infrastructure identity.
          </p>
        </div>

        <div className="flex items-center gap-5">
          {editing ? (
            <div className="flex gap-4">
              <button
                onClick={() => { setEditing(false); fetchLabDetails(); }}
                className="px-8 py-4 bg-white border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm hover:bg-slate-50 transition-all"
              >
                Abort Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-100 flex items-center gap-3 hover:scale-[1.05] active:scale-95 disabled:opacity-50 transition-all"
              >
                {saving ? <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" /> : <Save className="h-4 w-4" />}
                Synchronize Matrix
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-100 flex items-center gap-3 hover:scale-[1.05] transition-all"
            >
              <Edit className="h-4 w-4" />
              Calibrate Node
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Identity & Location */}
        <div className="lg:col-span-8 space-y-10">

          {/* Section: Identity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3.5rem] p-12 border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden relative"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Clinical Identity</h3>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Facility Designation</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('', 'name', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200 disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Public Brief/Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('', 'description', e.target.value)}
                  disabled={!editing}
                  rows="4"
                  className="w-full px-8 py-6 bg-slate-50 border border-transparent rounded-[2rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200 disabled:opacity-60"
                />
              </div>
            </div>
            <div className="absolute top-10 right-10 opacity-[0.03]">
              <Building2 size={120} />
            </div>
          </motion.div>

          {/* Section: Location Matrix */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[3.5rem] p-12 border border-slate-50 shadow-2xl shadow-slate-100"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Geographical Matrix</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Street Vector</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">City Node</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">State Sector</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Zip Alpha-Numeric</label>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold disabled:opacity-60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Nation Sovereign</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                  disabled={!editing}
                  className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold disabled:opacity-60"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Operating Hours & Contact */}
        <div className="lg:col-span-4 space-y-10">

          {/* Section: Operational Windows */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-200"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Temporal Nodes</h3>
            </div>

            <div className="space-y-4">
              {dayLabels.map((day) => {
                const hours = formData.operatingHours[day] || { closed: false, open: '', close: '' };
                return (
                  <div key={day} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 hover:border-white/10 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 w-24 capitalize">{day}</span>
                    <div className="flex items-center gap-4">
                      {hours.closed ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">Node Inactive</span>
                      ) : (
                        <div className="flex items-center gap-2 text-white/40">
                          <span className="text-[10px] font-bold text-white">{hours.open}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-20">to</span>
                          <span className="text-[10px] font-bold text-white">{hours.close}</span>
                        </div>
                      )}
                      {editing && (
                        <button
                          onClick={() => handleInputChange('operatingHours', day, { closed: !hours.closed })}
                          className={`p-2 rounded-lg transition-all ${hours.closed ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/40 hover:text-white'}`}
                        >
                          <Zap size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Section: Contact & Capacity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 space-y-10"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Comm Channels</span>
              </div>
              <div className="space-y-4">
                <input
                  type="tel"
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                  disabled={!editing}
                  placeholder="Transmission Line (+91...)"
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white text-xs font-bold disabled:opacity-60"
                />
                <input
                  type="url"
                  value={formData.contact.website}
                  onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                  disabled={!editing}
                  placeholder="Web Node (https://...)"
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white text-xs font-bold disabled:opacity-60"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Node Capacity</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Daily Cap</label>
                  <input
                    type="number"
                    value={formData.capacity.dailyCapacity}
                    onChange={(e) => handleInputChange('capacity', 'dailyCapacity', e.target.value)}
                    disabled={!editing}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white text-sm font-black disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Reserve</label>
                  <input
                    type="number"
                    value={formData.capacity.currentBookings}
                    onChange={(e) => handleInputChange('capacity', 'currentBookings', e.target.value)}
                    disabled={!editing}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white text-sm font-black disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LocalAdminSettings;