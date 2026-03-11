import React, { useState, useEffect } from 'react';
import {
    MessageCircle, Search, Clock, CheckCircle, Mail,
    User, Reply, Trash2, AlertCircle, Inbox, ArrowLeft,
    ShieldCheck, Zap, Activity, Microscope, Layers,
    Send, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Swal from 'sweetalert2';
import moment from 'moment';

const StaffPatientCommunication = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, read, replied
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMessages();
    }, [filter, page]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.messageAPI.getMessages(filter, page);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.messageAPI.updateMessageStatus(id, status);
            setMessages(messages.map(msg => msg._id === id ? { ...msg, status } : msg));
            if (selectedMessage && selectedMessage._id === id) {
                setSelectedMessage({ ...selectedMessage, status });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleReply = () => {
        Swal.fire({
            title: 'Authorize Reply Protocol?',
            text: `Initiate response to ${selectedMessage.name} (${selectedMessage.email})?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            confirmButtonText: 'Authorize Transmission'
        }).then((result) => {
            if (result.isConfirmed) {
                handleStatusUpdate(selectedMessage._id, 'replied');
                Swal.fire('Success', 'Reply status updated in global ledger.', 'success');
            }
        });
    };

    const filteredMessages = messages.filter(msg =>
        (msg.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-8rem)] flex flex-col space-y-8"
        >
            {/* Cinematic Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                            Protocol Comm Node
                        </span>
                        <div className="h-0.5 w-12 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Secure Messaging Terminal
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                        Communication Intelligence
                    </h1>
                </div>
            </div>

            {/* Terminal Layout */}
            <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden flex">

                {/* Tactical Sidebar */}
                <div className={`${selectedMessage ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[400px] border-r border-slate-50 bg-white`}>
                    <div className="p-8 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Identify Inquiry..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-900/5 transition-all text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300"
                            />
                        </div>

                        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                            {['all', 'new', 'replied'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                        {loading ? (
                            <div className="p-10 text-center animate-pulse">
                                <div className="h-4 w-32 bg-slate-100 rounded-full mx-auto mb-4" />
                                <div className="h-4 w-24 bg-slate-50 rounded-full mx-auto" />
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Inbox className="h-12 w-12 text-slate-100 mb-4" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive Void Detected</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-8">
                                {filteredMessages.map(msg => (
                                    <motion.div
                                        key={msg._id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => {
                                            setSelectedMessage(msg);
                                            if (msg.status === 'new') handleStatusUpdate(msg._id, 'read');
                                        }}
                                        className={`p-6 rounded-[2rem] cursor-pointer transition-all border relative group ${selectedMessage?._id === msg._id
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200'
                                                : 'bg-white border-slate-50 hover:bg-slate-50'
                                            }`}
                                    >
                                        {msg.status === 'new' && selectedMessage?._id !== msg._id && (
                                            <div className="absolute top-6 left-2 h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
                                        )}
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className={`text-[11px] font-black uppercase tracking-widest truncate flex-1 pr-4 ${selectedMessage?._id === msg._id ? 'text-white' : 'text-slate-900'
                                                }`}>
                                                {msg.name}
                                            </h4>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${selectedMessage?._id === msg._id ? 'text-white/40' : 'text-slate-300'
                                                }`}>
                                                {moment(msg.createdAt).format('DD MMM')}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] font-bold truncate mb-2 ${selectedMessage?._id === msg._id ? 'text-white/80' : 'text-slate-600'
                                            }`}>{msg.subject}</p>
                                        <p className={`text-[10px] line-clamp-1 italic ${selectedMessage?._id === msg._id ? 'text-white/40' : 'text-slate-400'
                                            }`}>{msg.message}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Display Node */}
                <div className={`${!selectedMessage ? 'hidden lg:flex' : 'flex'} flex-col flex-1 bg-slate-50/20 h-full relative`}>
                    <AnimatePresence mode="wait">
                        {selectedMessage ? (
                            <motion.div
                                key={selectedMessage._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col h-full"
                            >
                                {/* Vault Header */}
                                <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setSelectedMessage(null)}
                                            className="lg:hidden p-4 bg-slate-50 rounded-2xl text-slate-400"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                                                {selectedMessage.subject}
                                            </h2>
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                    Status: {selectedMessage.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    Received {moment(selectedMessage.createdAt).calendar()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(selectedMessage._id, selectedMessage.status === 'read' ? 'new' : 'read')}
                                            className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all"
                                        >
                                            <RefreshCw className={`h-5 w-5 ${selectedMessage.status === 'new' ? 'text-indigo-600' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Transmission Body */}
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                    <div className="max-w-3xl mx-auto space-y-10">
                                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                                                {selectedMessage.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Authenticated Sender</p>
                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate">{selectedMessage.name}</h4>
                                                <p className="text-xs font-bold text-slate-400 mt-1 lowercase">{selectedMessage.email}</p>
                                            </div>
                                            <a
                                                href={`mailto:${selectedMessage.email}`}
                                                className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[1.2rem] flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-inner"
                                            >
                                                <Reply className="h-5 w-5" />
                                            </a>
                                        </div>

                                        <div className="p-10 bg-white rounded-[3rem] border border-slate-50 shadow-sm min-h-[300px]">
                                            <div className="flex items-center gap-3 mb-8">
                                                <Microscope className="h-4 w-4 text-slate-300" />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Message Payload Data</span>
                                            </div>
                                            <div className="text-sm font-bold text-slate-700 leading-loose uppercase tracking-wide whitespace-pre-wrap">
                                                {selectedMessage.message}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tactical Action Bar */}
                                <div className="p-8 border-t border-slate-50 bg-white flex justify-end gap-4">
                                    <button
                                        onClick={handleReply}
                                        className="px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        <Send className="h-4 w-4" />
                                        Authorize Response
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                                <div className="h-32 w-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8">
                                    <Zap className="h-12 w-12 text-slate-100" />
                                </div>
                                <h3 className="text-lg font-black text-slate-300 uppercase tracking-[0.4em]">Select Transmission Node</h3>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4 max-w-xs">
                                    Encrypted clinical inquiries pending specialist authorization.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default StaffPatientCommunication;
