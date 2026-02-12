'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Globe, MapPin, Layers, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFiltersProps {
    activeTeam: string;
    setActiveTeam: (team: string) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    searchName: string;
    setSearchName: (name: string) => void;
}

const ActivityFilters = ({ activeTeam, setActiveTeam, selectedDate, setSelectedDate, searchName, setSearchName }: ActivityFiltersProps) => {
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

    // --- Custom Calendar Logic ---
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const days = [];
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startDay = firstDayOfMonth(currentYear, currentMonth);

    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);
        setInputValue(formatDate(newDate)); // Update input when calendar date is picked
        setShowDatePicker(false);
    };

    // --- Direct Input Logic ---
    const [inputValue, setInputValue] = useState(formatDate(selectedDate));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 8) val = val.slice(0, 8);

        // Format as DD/MM/YYYY
        let formatted = '';
        if (val.length > 0) {
            formatted = val.slice(0, 2);
            if (val.length > 2) {
                formatted += '/' + val.slice(2, 4);
                if (val.length > 4) {
                    formatted += '/' + val.slice(4, 8);
                }
            }
        }
        setInputValue(formatted);

        // Try to parse if complete
        if (val.length === 8) {
            const d = parseInt(val.slice(0, 2));
            const m = parseInt(val.slice(2, 4)) - 1;
            const y = parseInt(val.slice(4, 8));
            const date = new Date(y, m, d);

            if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
                setSelectedDate(date);
                setViewDate(new Date(date));
            }
        }
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
                {/* Name Filter */}
                <div className="relative group">
                    <div className={`flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:border-blue-400 group-hover:border-blue-200 ${searchName ? 'border-blue-300 bg-blue-50/5' : 'border-gray-200'}`}>
                        <Search className={`w-4 h-4 transition-colors ${searchName ? 'text-blue-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên..."
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm font-bold text-gray-700 w-40 placeholder:text-gray-300 placeholder:font-normal"
                        />
                        {searchName && (
                            <button
                                onClick={() => setSearchName('')}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Date Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md group ${showDatePicker
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 hover:border-blue-400'
                            }`}
                    >
                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${showDatePicker ? 'text-blue-200' : 'text-gray-400 group-hover:text-blue-400'}`}>Ngày:</span>
                        <span className={`text-sm font-bold ${showDatePicker ? 'text-white' : 'text-gray-700'}`}>{formatDate(selectedDate)}</span>
                        <Calendar className={`w-4 h-4 transition-transform group-hover:scale-110 ${showDatePicker ? 'text-white' : 'text-blue-500'}`} />
                    </button>

                    <AnimatePresence>
                        {showDatePicker && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full mt-2 right-0 w-80 bg-white/98 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 p-7 z-[60]"
                            >
                                {/* Typing Input Area */}
                                <div className="mb-6 bg-gray-50/50 p-4 rounded-3xl border border-gray-100 group-within:border-blue-200 group-within:bg-blue-50/20 transition-all">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Nhập ngày (DD/MM/YYYY):</label>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        placeholder="12/02/2026"
                                        className="w-full bg-transparent text-xl font-black text-gray-800 focus:outline-none placeholder:text-gray-200 tracking-wider"
                                        autoFocus
                                    />
                                </div>

                                <div className="h-px bg-gray-100 mb-6 mx-2" />

                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-2.5 hover:bg-blue-50 rounded-2xl text-blue-600 transition-colors"
                                    >
                                        <ChevronDown className="w-5 h-5 rotate-90" />
                                    </button>
                                    <div className="text-sm font-black text-gray-800 uppercase tracking-widest">
                                        {viewDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-2.5 hover:bg-blue-50 rounded-2xl text-blue-600 transition-colors"
                                    >
                                        <ChevronDown className="w-5 h-5 -rotate-90" />
                                    </button>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-3">
                                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                                        <div key={day} className="text-center text-[10px] font-black text-gray-400">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-2">
                                    {days.map((day, idx) => (
                                        <div key={idx} className="aspect-square flex items-center justify-center">
                                            {day ? (
                                                <button
                                                    onClick={() => handleDateSelect(day)}
                                                    className={`w-full h-full flex items-center justify-center text-xs font-bold rounded-2xl transition-all duration-200
                                                        ${isSelected(day)
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 z-10'
                                                            : isToday(day)
                                                                ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-100'
                                                                : 'hover:bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ) : (
                                                <div className="w-full h-full" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Actions */}
                                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between gap-3">
                                    <button
                                        onClick={() => {
                                            const today = new Date();
                                            setSelectedDate(today);
                                            setInputValue(formatDate(today));
                                            setViewDate(new Date(today));
                                            setShowDatePicker(false);
                                        }}
                                        className="flex-1 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors"
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="flex-1 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ActivityFilters;
