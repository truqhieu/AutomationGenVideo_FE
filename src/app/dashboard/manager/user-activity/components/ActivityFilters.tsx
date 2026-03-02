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
    userRole?: string | null;
    userTeam?: string | null;
    activeTab?: string;
    globalTeams?: string[]; // New
    vnTeams?: string[];     // New
    dateRange: { start: Date; end: Date };
    setDateRange: (range: { start: Date; end: Date }) => void;
    timeType: string;
    setTimeType: (type: string) => void;
}

const ActivityFilters = ({
    activeTeam,
    setActiveTeam,
    selectedDate,
    setSelectedDate,
    searchName,
    setSearchName,
    userRole,
    userTeam,
    activeTab,
    globalTeams = [], // Fallback
    vnTeams = [],      // Fallback
    dateRange,
    setDateRange,
    timeType,
    setTimeType
}: ActivityFiltersProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeFilterRef = useRef<HTMLDivElement>(null);

    const isAdmin = userRole === 'admin';
    const isLeader = userRole === 'leader';
    const isRankingTab = activeTab === 'ranking';
    const isPersonalTab = activeTab === 'personal';
    const isPerformanceTab = activeTab === 'performance';

    // Team filter: 
    // - Show in Ranking and Performance for everyone
    // - Otherwise only for Admin
    const canSeeTeamFilter = (isAdmin || isRankingTab || isPerformanceTab);

    // Team label (for Leader):
    // - Show only if main filter is hidden
    const showTeamLabel = !canSeeTeamFilter && isLeader && userTeam;



    const isAllGlobal = activeTeam === 'All Global';
    const isAllVN = activeTeam === 'All VN';
    const isGlobalActive = isAllGlobal || globalTeams.includes(activeTeam);
    const isVNActive = isAllVN || vnTeams.includes(activeTeam);
    const isAllActive = activeTeam === 'All' || (!isGlobalActive && !isVNActive && activeTeam !== 'All');

    const timeOptions = [
        { id: 'today', label: 'Hôm nay' },
        { id: 'yesterday', label: 'Hôm qua' },
        { id: 'this_week', label: 'Tuần này' },
        { id: 'last_week', label: 'Tuần trước' },
        { id: 'this_month', label: 'Tháng này' },
        { id: 'last_month', label: 'Tháng trước' },
        { id: 'custom', label: 'Chọn khoảng ngày' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (timeFilterRef.current && !timeFilterRef.current.contains(event.target as Node)) {
                    setOpenDropdown(null);
                }
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

    const handleSelectTimeType = (typeId: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start = new Date(today);
        let end = new Date(today);
        end.setHours(23, 59, 59, 999);

        switch (typeId) {
            case 'today':
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end = new Date(start);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                const day = today.getDay(); // 0 is Sunday
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                start.setDate(diff);
                break;
            case 'last_week':
                const lastWeekDay = today.getDay();
                const lastWeekDiff = today.getDate() - lastWeekDay - 6;
                start.setDate(lastWeekDiff);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                setShowDatePicker(true);
                break;
        }

        setTimeType(typeId);
        setDateRange({ start, end });
        if (typeId !== 'custom') {
            setSelectedDate(start); // For backward compatibility
            setOpenDropdown(null);
        }
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
        const d = new Date(currentYear, currentMonth, day);
        return d.getTime() === dateRange.start.getTime() || d.getTime() === dateRange.end.getTime();
    };

    const isInRange = (day: number) => {
        const d = new Date(currentYear, currentMonth, day);
        return d.getTime() >= dateRange.start.getTime() && d.getTime() <= dateRange.end.getTime();
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);

        if (timeType !== 'custom') {
            setSelectedDate(newDate);
            setDateRange({ start: newDate, end: new Date(newDate.getTime() + 24 * 60 * 60 * 1000 - 1) });
            setInputValue(formatDate(newDate));
            setShowDatePicker(false);
        } else {
            // Range selection logic
            if (dateRange.start.getTime() === dateRange.end.getTime()) {
                if (newDate < dateRange.start) {
                    setDateRange({ start: newDate, end: dateRange.start });
                    setShowDatePicker(false);
                } else {
                    setDateRange({ start: dateRange.start, end: newDate });
                    setShowDatePicker(false);
                }
            } else {
                setDateRange({ start: newDate, end: newDate });
                // Don't close yet, wait for second click
            }
        }
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

    // Get display label for dropdown buttons
    const getGlobalLabel = () => {
        if (isAllGlobal) return 'Tất cả Global';
        if (globalTeams.includes(activeTeam)) return activeTeam;
        return 'Global';
    };

    const getVNLabel = () => {
        if (isAllVN) return 'Tất cả VN';
        if (vnTeams.includes(activeTeam)) return activeTeam;
        return 'Việt Nam';
    };

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-y-4 gap-x-6 py-4 px-2">
            {canSeeTeamFilter && (
                <div className="flex flex-wrap items-center gap-2" ref={dropdownRef}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 mr-1">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Nhóm Team
                        </span>
                    </div>

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
                            {getGlobalLabel()}
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
                                    {/* All Global option */}
                                    <button
                                        onClick={() => handleSelectTeam('All Global')}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition-colors border-b border-blue-100/50"
                                    >
                                        <span className="flex items-center gap-2">
                                            {activeTeam === 'All Global' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                            🌏 Tất cả Global
                                        </span>
                                        {activeTeam === 'All Global' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                    </button>
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
                            {getVNLabel()}
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
                                    {/* All VN option */}
                                    <button
                                        onClick={() => handleSelectTeam('All VN')}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold text-red-700 bg-red-50/50 hover:bg-red-100 transition-colors border-b border-red-100/50"
                                    >
                                        <span className="flex items-center gap-2">
                                            {activeTeam === 'All VN' && <div className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                                            🇻🇳 Tất cả VN
                                        </span>
                                        {activeTeam === 'All VN' && <Check className="w-3.5 h-3.5 text-red-600" />}
                                    </button>
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
            )}
            {showTeamLabel && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Team: {userTeam}</span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2" ref={timeFilterRef}>
                {/* Time Type Filter */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('timeType')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${timeType !== 'today'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                            }`}
                    >
                        <Calendar className={`w-3.5 h-3.5 ${timeType !== 'today' ? 'text-blue-100' : 'text-blue-500'}`} />
                        <span className="text-xs font-bold truncate max-w-[100px]">
                            {timeOptions.find(opt => opt.id === timeType)?.label || 'Hôm nay'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openDropdown === 'timeType' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {openDropdown === 'timeType' && (
                            <motion.div
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute top-full right-0 mt-2 w-44 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[70] py-1"
                            >
                                {timeOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelectTimeType(opt.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-[11px] font-bold transition-colors ${timeType === opt.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt.label}
                                        {timeType === opt.id && <Check className="w-3 h-3" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Name Filter - Hidden in Personal unless Admin/Leader */}
                {(!isPersonalTab || isAdmin || isLeader) && (
                    <div className="relative group">
                        <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:border-blue-400 group-hover:border-blue-200 ${searchName ? 'border-blue-300 bg-blue-50/5' : 'border-gray-200'}`}>
                            <Search className={`w-3.5 h-3.5 transition-colors ${searchName ? 'text-blue-500' : 'text-gray-400'}`} />
                            <input
                                type="text"
                                placeholder="Tìm tên..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-700 w-32 placeholder:text-gray-300 placeholder:font-normal"
                            />
                            {searchName && (
                                <button
                                    onClick={() => setSearchName('')}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-2.5 h-2.5 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Date Picker Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md group ${showDatePicker
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 group-hover:bg-blue-50/30'
                            }`}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${showDatePicker ? 'text-blue-100' : 'text-gray-400 group-hover:text-blue-500'}`}>
                            {timeType === 'custom' || timeType.includes('week') || timeType.includes('month') ? 'KHOẢNG:' : 'NGÀY:'}
                        </span>
                        <span className="text-xs font-bold">
                            {timeType === 'custom' || timeType.includes('week') || timeType.includes('month')
                                ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                                : formatDate(selectedDate)
                            }
                        </span>
                        <Calendar className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${showDatePicker ? 'text-white' : 'text-blue-500'}`} />
                    </button>

                    <AnimatePresence>
                        {showDatePicker && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full mt-2 right-0 w-80 bg-slate-900 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-800 p-7 z-[60]"
                            >
                                {/* Typing Input Area */}
                                <div className="mb-6 bg-slate-800/50 p-4 rounded-3xl border border-slate-700 group-within:border-blue-500 group-within:bg-blue-500/10 transition-all">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Nhập ngày (DD/MM/YYYY):</label>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        placeholder="12/02/2026"
                                        className="w-full bg-transparent text-xl font-black text-white focus:outline-none placeholder:text-slate-700 tracking-wider"
                                        autoFocus
                                    />
                                </div>

                                <div className="h-px bg-slate-800 mb-6 mx-2" />

                                {/* Calendar Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-2.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ChevronDown className="w-5 h-5 rotate-90" />
                                    </button>
                                    <div className="text-sm font-black text-white uppercase tracking-widest">
                                        {viewDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-2.5 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ChevronDown className="w-5 h-5 -rotate-90" />
                                    </button>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-3">
                                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                                        <div key={day} className="text-center text-[10px] font-black text-slate-500">
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
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110 z-10'
                                                            : isInRange(day)
                                                                ? 'bg-blue-500/20 text-blue-200'
                                                                : isToday(day)
                                                                    ? 'bg-blue-900/50 text-blue-400 ring-1 ring-blue-500/30'
                                                                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
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
                                <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between gap-3">
                                    <button
                                        onClick={() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            setSelectedDate(today);
                                            setDateRange({ start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) });
                                            setTimeType('today');
                                            setInputValue(formatDate(today));
                                            setViewDate(new Date(today));
                                            setShowDatePicker(false);
                                        }}
                                        className="flex-1 py-3 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 rounded-2xl hover:bg-blue-500/20 transition-colors"
                                    >
                                        Hôm nay
                                    </button>
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="flex-1 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800 rounded-2xl hover:bg-slate-800 hover:text-slate-300 transition-colors"
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
