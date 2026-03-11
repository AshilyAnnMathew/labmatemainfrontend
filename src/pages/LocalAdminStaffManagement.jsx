import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, User, Mail, Phone, Building2,
  Search, Filter, ShieldCheck, Zap, Activity, Microscope,
  Layers, ChevronRight, X, UserCheck, UserPlus, Fingerprint,
  Shield, AlertTriangle, Key, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';

const LocalAdminStaffManagement = ({ assignedLab }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    password: '',
    confirmPassword: '',
    useRandomPassword: true
  });

  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handlePasswordToggle = (useRandom) => {
    if (useRandom) {
      const randomPassword = generateRandomPassword();
      setNewStaff(prev => ({
        ...prev,
        useRandomPassword: true,
        password: randomPassword,
        confirmPassword: randomPassword
      }));
    } else {
      setNewStaff(prev => ({
        ...prev,
        useRandomPassword: false,
        password: '',
        confirmPassword: ''
      }));
    }
  };

  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchStaffMembers();
    }
  }, [assignedLab]);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      const response = await api.localAdminAPI.getLabStaff(assignedLab._id);
      if (response.success) {
        setStaffMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      setError('');
      if (!newStaff.useRandomPassword) {
        if (!newStaff.password || !newStaff.confirmPassword) {
          setError('Authorization credentials required.');
          return;
        }
        if (newStaff.password !== newStaff.confirmPassword) {
          setError('Credential mismatch detected.');
          return;
        }
      }
      const response = await api.localAdminAPI.createLabStaff(assignedLab._id, newStaff);
      if (response.success) {
        setShowAddModal(false);
        setNewStaff({
          firstName: '', lastName: '', email: '', phone: '',
          role: 'staff', department: '', password: '',
          confirmPassword: '', useRandomPassword: true
        });
        fetchStaffMembers();
        Swal.fire({
          icon: 'success',
          title: 'Asset Authenticated',
          text: 'New specialist integrated into the clinical node.',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      const response = await api.localAdminAPI.updateLabStaff(assignedLab._id, selectedStaff._id, selectedStaff);
      if (response.success) {
        setShowEditModal(false);
        setSelectedStaff(null);
        fetchStaffMembers();
        Swal.fire({
          icon: 'success',
          title: 'Asset Updated',
          text: 'Specialist parameters recalibrated.',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Update failed.', 'error');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    const result = await Swal.fire({
      title: 'Deauthorize Asset?',
      text: 'This operation will terminate specialist access immediately.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'Confirm Deauthorization'
    });
    if (!result.isConfirmed) return;
    try {
      const response = await api.localAdminAPI.deleteLabStaff(assignedLab._id, staffId);
      if (response.success) {
        fetchStaffMembers();
        Swal.fire('Deauthorized', 'Access revoked.', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Termination sequence failed.', 'error');
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (staff.firstName || '').toLowerCase().includes(searchLower) ||
      (staff.lastName || '').toLowerCase().includes(searchLower) ||
      (staff.email || '').toLowerCase().includes(searchLower) ||
      (staff.role || '').toLowerCase().includes(searchLower)
    );
  });

  const getRoleConfig = (role) => {
    const configs = {
      staff: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Auxiliary' },
      lab_technician: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Lab Tech' },
      xray_technician: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Imaging Tech' }
    };
    return configs[role] || configs.staff;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 animate-pulse">
        <Fingerprint className="h-12 w-12 text-slate-100 mb-6" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Synchronizing Asset Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-24"
    >
      {/* Cinematic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Human Resource Intelligence
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Laboratory Asset Control
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
            Specialist <span className="text-indigo-600">Inventory</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Management of authenticated clinical personnel and specialized technical units.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Search Personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white border border-slate-50 rounded-2xl shadow-sm focus:outline-none focus:ring-8 focus:ring-slate-900/5 transition-all text-[10px] font-black uppercase tracking-widest placeholder:text-slate-200 w-64 lg:w-80"
            />
          </div>
          <button
            onClick={() => {
              const randomPassword = generateRandomPassword();
              setNewStaff({
                firstName: '', lastName: '', email: '', phone: '',
                role: 'staff', department: '', password: randomPassword,
                confirmPassword: randomPassword, useRandomPassword: true
              });
              setError('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-100 hover:scale-[1.05] active:scale-95 transition-all group"
          >
            <UserPlus className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Integrate Asset</span>
          </button>
        </div>
      </div>

      {/* Specialist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredStaff.map((staff, idx) => {
            const config = getRoleConfig(staff.role);
            return (
              <motion.div
                key={staff._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 group hover:border-slate-100 transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="h-16 w-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-slate-100 group-hover:scale-110 transition-transform overflow-hidden">
                    <User className="h-7 w-7" />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full ${config.bg} ${config.text} text-[9px] font-black uppercase tracking-widest border border-slate-100/50`}>
                    {config.label}
                  </div>
                </div>

                <div className="mb-10 flex-1">
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-2">
                    {staff.firstName} {staff.lastName}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`h-1.5 w-1.5 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{staff.isActive ? 'Active Node' : 'Inactive'}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-4 group/item">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all shadow-inner">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 lowercase truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-4 group/item">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all shadow-inner">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{staff.phone}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedStaff(staff);
                      setShowEditModal(true);
                    }}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-3 w-3" /> Calibrate
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff._id)}
                    className="p-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl transition-all border border-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6 lg:p-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3.5rem] p-12 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Asset Integration</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">First Name</label>
                  <input
                    type="text"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Last Name</label>
                  <input
                    type="text"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Electronic Node (Email)</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Mobile Directive</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Functional Designation</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="staff">Staff</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="xray_technician">X-Ray Technician</option>
                  </select>
                </div>
              </div>

              {/* Security Matrix */}
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Security Protocol</span>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handlePasswordToggle(true)}
                    className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${newStaff.useRandomPassword ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
                      }`}
                  >
                    Neural Generation
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePasswordToggle(false)}
                    className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${!newStaff.useRandomPassword ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
                      }`}
                  >
                    Manual Override
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {newStaff.useRandomPassword ? (
                    <motion.div
                      key="random"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-2">Calculated Security Key</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newStaff.password}
                          readOnly
                          className="flex-1 px-5 py-3 bg-white border border-slate-100 rounded-xl font-mono text-xs text-slate-900 shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => handlePasswordToggle(true)}
                          className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:text-slate-900 hover:shadow-lg transition-all"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <input
                        type="password"
                        placeholder="Security Key"
                        value={newStaff.password}
                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 transition-all text-xs"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Key"
                        value={newStaff.confirmPassword}
                        onChange={(e) => setNewStaff({ ...newStaff, confirmPassword: e.target.value })}
                        className="w-full px-5 py-3 bg-white border border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-900/5 transition-all text-xs"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4" /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-6 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-2xl shadow-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Confirm Integration
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal (Condensed logic similar to add) */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6 lg:p-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3.5rem] p-12 w-full max-w-lg shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Recalibration</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-4 bg-slate-50 text-slate-400 rounded-2xl transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={selectedStaff.firstName}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, firstName: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                  required
                />
                <input
                  type="text"
                  value={selectedStaff.lastName}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, lastName: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                  required
                />
              </div>
              <input
                type="email"
                value={selectedStaff.email}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                required
              />
              <input
                type="tel"
                value={selectedStaff.phone}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold"
                required
              />
              <select
                value={selectedStaff.role}
                onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white transition-all text-sm font-bold appearance-none cursor-pointer"
              >
                <option value="staff">Staff</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="xray_technician">X-Ray Technician</option>
              </select>

              <button
                type="submit"
                className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Apply Recalibration
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default LocalAdminStaffManagement;