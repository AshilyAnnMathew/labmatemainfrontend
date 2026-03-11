import React, { useState, useEffect } from 'react';
import {
  TestTube, Package, Search, Filter, Microscope,
  Beaker, ChevronRight, X, ShieldCheck, Zap,
  Activity, Layers, Info, Trash2, Plus,
  ArrowRight, CheckCircle2, FlaskConical, Boxes
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';

const LocalAdminTestsPackages = ({ assignedLab }) => {
  const [tests, setTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests');
  const [searchTerm, setSearchTerm] = useState('');

  const [showSelectTestsModal, setShowSelectTestsModal] = useState(false);
  const [showSelectPackagesModal, setShowSelectPackagesModal] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchTests();
      fetchPackages();
    }
  }, [assignedLab]);

  const fetchTests = async () => {
    try {
      const response = await api.localAdminAPI.getLabTests(assignedLab._id);
      if (response.success) setTests(response.data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await api.localAdminAPI.getLabPackages(assignedLab._id);
      if (response.success) setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTests = async () => {
    try {
      const response = await api.localAdminAPI.getAvailableTests(assignedLab._id);
      if (response.success) {
        setAvailableTests(response.data);
        const assignedTestIds = response.data
          .filter(test => test.isAssignedToLab)
          .map(test => test._id);
        setSelectedTestIds(assignedTestIds);
        setShowSelectTestsModal(true);
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load test vault.', 'error');
    }
  };

  const handleSelectPackages = async () => {
    try {
      const response = await api.localAdminAPI.getAvailablePackages(assignedLab._id);
      if (response.success) {
        setAvailablePackages(response.data);
        const assignedPackageIds = response.data
          .filter(pkg => pkg.isAssignedToLab)
          .map(pkg => pkg._id);
        setSelectedPackageIds(assignedPackageIds);
        setShowSelectPackagesModal(true);
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load package vault.', 'error');
    }
  };

  const handleSaveTestAssignments = async () => {
    try {
      const response = await api.localAdminAPI.assignTestsToLab(assignedLab._id, selectedTestIds);
      if (response.success) {
        setShowSelectTestsModal(false);
        fetchTests();
        Swal.fire({
          icon: 'success',
          title: 'Matrix Updated',
          text: 'Diagnostic units synchronized with facility parameters.',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Update sequence failed.', 'error');
    }
  };

  const handleSavePackageAssignments = async () => {
    try {
      const response = await api.localAdminAPI.assignPackagesToLab(assignedLab._id, selectedPackageIds);
      if (response.success) {
        setShowSelectPackagesModal(false);
        fetchPackages();
        Swal.fire({
          icon: 'success',
          title: 'Catalogs Updated',
          text: 'Scientific bundles deployed to the node.',
          confirmButtonColor: '#0f172a'
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Update sequence failed.', 'error');
    }
  };

  const toggleTestSelection = (testId) => {
    setSelectedTestIds(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  const togglePackageSelection = (packageId) => {
    setSelectedPackageIds(prev =>
      prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
    );
  };

  const filteredTests = tests.filter(test =>
    (test.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (test.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPackages = packages.filter(pkg =>
    (pkg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pkg.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center animate-pulse">
        <FlaskConical className="h-12 w-12 text-slate-100 mb-6" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Deciphering Catalog Matrix...</p>
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
              Diagnostic Catalog Matrix
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Facility Configuration Terminal
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Clinical <span className="text-indigo-600">Assets</span> & Units
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            High-precision management of diagnostic test units and structured therapeutic bundles.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 flex shadow-inner">
            {[
              { id: 'tests', icon: TestTube, label: 'Scientific Units' },
              { id: 'packages', icon: Boxes, label: 'Bundled Nodes' }
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

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
          <input
            type="text"
            placeholder={`Identify ${activeTab === 'tests' ? 'Analytical Unit' : 'Bundled Protocol'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-sm font-bold placeholder:text-slate-200"
          />
        </div>
        <button
          onClick={activeTab === 'tests' ? handleSelectTests : handleSelectPackages}
          className="px-10 py-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl shadow-slate-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Configure Matrix</span>
        </button>
      </div>

      {/* Asset Display Context */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {activeTab === 'tests' ? (
            filteredTests.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center opacity-20">
                <Microscope size={80} strokeWidth={1} />
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em]">Node Inventory Null</p>
              </div>
            ) : (
              filteredTests.map((test, idx) => (
                <motion.div
                  key={test._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <TestTube className="h-6 w-6" />
                    </div>
                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                      ID: {test._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 mb-10">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{test.category}</p>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-4">{test.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed line-clamp-2">{test.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pricing</span>
                      <span className="text-xl font-black text-indigo-600 tracking-tighter">₹{test.price}</span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Transmission</span>
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{test.duration} H Pulse</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )
          ) : (
            filteredPackages.length === 0 ? (
              <div className="col-span-full py-32 flex flex-col items-center opacity-20">
                <Boxes size={80} strokeWidth={1} />
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em]">Protocol Archive Null</p>
              </div>
            ) : (
              filteredPackages.map((pkg, idx) => (
                <motion.div
                  key={pkg._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-200 group flex flex-col relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Package className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Verified Node</span>
                      </div>
                    </div>
                    <div className="flex-1 mb-10">
                      <h4 className="text-3xl font-black uppercase tracking-tighter leading-tight mb-4">{pkg.name}</h4>
                      <p className="text-xs font-medium text-white/50 uppercase tracking-widest leading-relaxed line-clamp-3 mb-8">{pkg.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {pkg.selectedTests?.slice(0, 3).map((t, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60">
                            {t.name}
                          </span>
                        ))}
                        {pkg.selectedTests?.length > 3 && (
                          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/60">
                            +{pkg.selectedTests.length - 3} Units
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-10 border-t border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Value Transmission</span>
                        <span className="text-2xl font-black text-white tracking-tighter">₹{pkg.price}</span>
                      </div>
                      <div className="px-6 py-4 bg-white rounded-2xl text-slate-900 text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-400 group-hover:text-white transition-all cursor-pointer">
                        Explore Units
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:opacity-[0.15] transition-opacity">
                    <Boxes size={200} />
                  </div>
                </motion.div>
              ))
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Selection Matrix Modals */}
      <AnimatePresence>
        {(showSelectTestsModal || showSelectPackagesModal) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[110] p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[4rem] p-12 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-4xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-10 shrink-0">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                    {showSelectTestsModal ? 'Unit Integration' : 'Bundle Deployment'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Authorized Laboratory Catalog Expansion Node
                  </p>
                </div>
                <button
                  onClick={() => { setShowSelectTestsModal(false); setShowSelectPackagesModal(false); }}
                  className="p-6 bg-slate-50 text-slate-400 rounded-[2rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 pb-10">
                {(showSelectTestsModal ? availableTests : availablePackages).map((item) => (
                  <motion.div
                    key={item._id}
                    whileHover={{ x: 10 }}
                    onClick={() => showSelectTestsModal ? toggleTestSelection(item._id) : togglePackageSelection(item._id)}
                    className={`p-10 rounded-[3rem] border-4 cursor-pointer transition-all flex items-center justify-between ${(showSelectTestsModal ? selectedTestIds : selectedPackageIds).includes(item._id)
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xl'
                        : 'bg-white border-slate-50 hover:border-slate-100 text-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-10">
                      <div className={`p-1 w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${(showSelectTestsModal ? selectedTestIds : selectedPackageIds).includes(item._id)
                          ? 'border-indigo-400 bg-indigo-400'
                          : 'border-slate-100 bg-white'
                        }`}>
                        {(showSelectTestsModal ? selectedTestIds : selectedPackageIds).includes(item._id) && (
                          <CheckCircle2 strokeWidth={3} size={20} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-2xl font-black uppercase tracking-tighter mb-2">{item.name}</h5>
                        <div className="flex items-center gap-6">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${(showSelectTestsModal ? selectedTestIds : selectedPackageIds).includes(item._id) ? 'text-white/40' : 'text-slate-400'
                            }`}>₹{item.price} Global Unit</span>
                          {showSelectTestsModal && <span className={`text-[10px] font-bold uppercase tracking-widest ${(selectedTestIds.includes(item._id)) ? 'text-white/40' : 'text-slate-400'
                            }`}>{item.category}</span>}
                        </div>
                      </div>
                    </div>
                    {item.isAssignedToLab && (
                      <div className="px-6 py-3 bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl backdrop-blur-md">
                        Currently Mapped
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-end shrink-0">
                <button
                  onClick={showSelectTestsModal ? handleSaveTestAssignments : handleSavePackageAssignments}
                  className="px-16 py-6 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2.5rem] shadow-2xl shadow-slate-100 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Apply Catalog Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LocalAdminTestsPackages;