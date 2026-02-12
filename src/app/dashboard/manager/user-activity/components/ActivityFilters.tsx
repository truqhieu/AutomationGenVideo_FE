'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Globe, MapPin, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFiltersProps {
    activeTeam: string;
    setActiveTeam: (team: string) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

const ActivityFilters = ({ activeTeam, setActiveTeam, selectedDate, setSelectedDate }: ActivityFiltersProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const globalTeams = ['Global - JP1', 'Global - JP2', 'Global JP3', 'Global JP4'];
    const vnTeams = ['Team K0', 'Team K1', 'Team K2', 'AFF 01'];

    const isGlobalActive = globalTeams.includes(activeTeam);
    const isVNActive = vnTeams.includes(activeTeam);
    const isAllActive = activeTeam === 'All' || (!isGlobalActive && !isVNActive && activeTeam !== 'All');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const toggleDropdown = (id: string) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    const handleSelectTeam = (team: string) => {
        setActiveTeam(team);
        setOpenDropdown(null);
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 }
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap" ref={dropdownRef}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-2">
                    <Layers className="w-3 h-3" /> Lọc Team:
                </span>

                {/* ALL Button */}
                <button
                    onClick={() => handleSelectTeam('All')}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${isAllActive
                        ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-lg shadow-blue-100 scale-105'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30'
                        }`}
                >
                    ALL
                </button>

                {/* Global Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('global')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${isGlobalActive
                            ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-lg shadow-blue-100'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30'
                            }`}
                    >
                        <Globe className={`w-3.5 h-3.5 ${isGlobalActive ? 'text-blue-200' : 'text-gray-400'}`} />
                        {isGlobalActive ? activeTeam : 'Global'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openDropdown === 'global' ? 'rotate-180 text-blue-400' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {openDropdown === 'global' && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 mt-2 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] py-1"
                            >
                                {globalTeams.map((team) => (
                                    <button
                                        key={team}
                                        onClick={() => handleSelectTeam(team)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            {activeTeam === team && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                            {team}
                                        </span>
                                        {activeTeam === team && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Việt Nam Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('vietnam')}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${isVNActive
                            ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-lg shadow-blue-100'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30'
                            }`}
                    >
                        <MapPin className={`w-3.5 h-3.5 ${isVNActive ? 'text-blue-200' : 'text-gray-400'}`} />
                        {isVNActive ? activeTeam : 'Việt Nam'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openDropdown === 'vietnam' ? 'rotate-180 text-blue-400' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {openDropdown === 'vietnam' && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full left-0 mt-2 w-52 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] py-1"
                            >
                                {vnTeams.map((team) => (
                                    <button
                                        key={team}
                                        onClick={() => handleSelectTeam(team)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            {activeTeam === team && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                            {team}
                                        </span>
                                        {activeTeam === team && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Date Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-200 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-400 transition-colors">Ngày:</span>
                        <span className="text-sm font-bold text-gray-700">{formatDate(selectedDate)}</span>
                        <Calendar className="w-4 h-4 text-blue-500 transition-transform group-hover:scale-110" />
                    </button>

                    <AnimatePresence>
                        {showDatePicker && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-4 z-[60]"
                            >
                                <input
                                    type="date"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setSelectedDate(new Date(e.target.value));
                                        setShowDatePicker(false);
                                    }}
                                    className="border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-bold text-gray-700 shadow-inner"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ActivityFilters;
