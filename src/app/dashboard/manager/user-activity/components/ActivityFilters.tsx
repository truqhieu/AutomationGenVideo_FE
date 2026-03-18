'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Globe, MapPin, Layers, Search, X, Camera } from 'lucide-react';
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
    onCapture?: () => void;
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
    setTimeType,
    onCapture
}: ActivityFiltersProps) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'day' | 'week' | 'month' | 'year' | 'range'>(() => {
        if (timeType === 'month' || timeType === 'this_month' || timeType === 'last_month') return 'month';
        if (timeType === 'this_week' || timeType === 'last_week') return 'week';
        if (timeType === 'this_year') return 'year';
        if (timeType === 'custom') return 'range';
        return 'day';
    });

    // Sync filterMode when timeType changes from outside
    useEffect(() => {
        if (timeType === 'month' || timeType === 'this_month' || timeType === 'last_month') setFilterMode('month');
        else if (timeType === 'this_week' || timeType === 'last_week') setFilterMode('week');
        else if (timeType === 'this_year') setFilterMode('year');
        else if (timeType === 'custom') setFilterMode('range');
        else setFilterMode('day');
    }, [timeType]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeFilterRef = useRef<HTMLDivElement>(null);

    const isAdmin = userRole === 'admin';
    const isLeader = userRole === 'leader';
    const isRankingTab = activeTab === 'ranking';
    const isPersonalTab = activeTab === 'personal';
    const isPerformanceTab = activeTab === 'performance';

    // Team filter: visible to all roles
    const canSeeTeamFilter = true;

    // Team label: no longer needed since filter is always visible
    const showTeamLabel = false;



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
        { id: 'this_year', label: 'Năm nay' },
        { id: 'custom', label: 'Chọn ngày' },
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
                setFilterMode('day');
                break;
            case 'yesterday':
                setFilterMode('day');
                start.setDate(today.getDate() - 1);
                end = new Date(start);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
            case 'last_week':
                setFilterMode('week');
                const targetDay = typeId === 'this_week' ? today : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                const dayOfWeek = targetDay.getDay();
                const diff = targetDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start = new Date(targetDay);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                setFilterMode('month');
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'last_month':
                setFilterMode('month');
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'this_year':
                setFilterMode('year');
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'custom':
                setFilterMode('range');
                setShowDatePicker(true);
                break;
        }

        setTimeType(typeId);
        setDateRange({ start, end });
        if (typeId !== 'custom') {
            setSelectedDate(start);
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

        if (filterMode === 'day') {
            setSelectedDate(newDate);
            setDateRange({ start: newDate, end: new Date(newDate.setHours(23, 59, 59, 999)) });
            setOpenDropdown(null);
        } else if (filterMode === 'week') {
            const dayOfWeek = newDate.getDay();
            const diff = newDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const start = new Date(newDate);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            setDateRange({ start, end });
            setOpenDropdown(null);
        } else if (filterMode === 'range') {
            if (dateRange.start.getTime() === dateRange.end.getTime()) {
                if (newDate < dateRange.start) {
                    setDateRange({ start: newDate, end: dateRange.start });
                    setOpenDropdown(null);
                } else {
                    setDateRange({ start: dateRange.start, end: newDate });
                    setOpenDropdown(null);
                }
            } else {
                setDateRange({ start: newDate, end: newDate });
            }
        }
    };

    const handleMonthSelect = (monthIdx: number) => {
        const start = new Date(viewDate.getFullYear(), monthIdx, 1, 0, 0, 0, 0);
        const end = new Date(viewDate.getFullYear(), monthIdx + 1, 0, 23, 59, 59, 999);
        setDateRange({ start, end });
        setOpenDropdown(null);
    };

    const handleYearSelect = (year: number) => {
        const start = new Date(year, 0, 1, 0, 0, 0, 0);
        const end = new Date(year, 11, 31, 23, 59, 59, 999);
        setDateRange({ start, end });
        setOpenDropdown(null);
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-y-3 gap-x-4 py-2 px-2">
            {canSeeTeamFilter && (
                <div className="flex flex-wrap items-center gap-2" ref={dropdownRef}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 rounded-xl border border-blue-100/50 mr-1">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-black text-slate-950 uppercase tracking-widest">
                            Nhóm Team
                        </span>
                    </div>

                    {/* ALL Button */}
                    <button
                        onClick={() => handleSelectTeam('All')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 border flex items-center gap-2 ${isAllActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                            : 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100'
                            }`}
                    >
                        ALL
                    </button>

                    {/* Global Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('global')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 border flex items-center gap-2 ${isGlobalActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100'
                                }`}
                        >
                            <Globe className={`w-3.5 h-3.5 ${isGlobalActive ? 'text-blue-200' : 'text-blue-600'}`} />
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
                                                {team.toLowerCase().includes('global - indo') && (
                                                    <img src="/indo-flag.png" alt="INDO" className="w-5 h-3.5 object-contain rounded-sm" />
                                                )}
                                                {team.toLowerCase().includes('global thái lan') && (
                                                    <img src="/thailand-flag.png" alt="TH" className="w-5 h-3.5 object-contain rounded-sm" />
                                                )}
                                                {(team.toLowerCase().includes('jp') || team.toLowerCase().includes('nhật bản')) && (
                                                    <img src="/japan-flag.png" alt="JP" className="w-5 h-3.5 object-contain rounded-sm border border-gray-100" />
                                                )}
                                                {team.toLowerCase().includes('đài loan') && (
                                                    <img src="/taiwan-flag.png" alt="TW" className="w-5 h-3.5 object-contain rounded-sm" />
                                                )}
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
                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-300 border flex items-center gap-2 ${isVNActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100'
                                }`}
                        >
                            <img src="/vn-flag.png" alt="VN" className="w-6 h-4 object-contain rounded-sm shadow-sm" />
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
                                        className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100 transition-colors border-b border-blue-100/50"
                                    >
                                        <span className="flex items-center gap-2">
                                            {activeTeam === 'All VN' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                            <img src="/vn-flag.png" alt="VN" className="w-6 h-4 object-contain rounded-sm shadow-sm" />
                                            Tất cả VN
                                        </span>
                                        {activeTeam === 'All VN' && <Check className="w-3.5 h-3.5 text-blue-600" />}
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

            <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto lg:ml-auto" ref={timeFilterRef}>
                {/* Unified Time Filter */}
                <div className="relative group/time">
                    <button
                        onClick={() => toggleDropdown('timeSelector')}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md group ${openDropdown === 'timeSelector' || (timeType !== 'today')
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-blue-50/60 border-blue-100/50 text-blue-600/70 hover:border-blue-300'
                            }`}
                    >
                        <Calendar className={`w-3.5 h-3.5 ${openDropdown === 'timeSelector' || (timeType !== 'today') ? 'text-blue-100' : 'text-blue-500'}`} />
                        <div className="flex flex-col items-start leading-tight">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${openDropdown === 'timeSelector' || (timeType !== 'today') ? 'text-blue-200' : 'text-blue-600 group-hover:text-blue-500'}`}>
                                {timeType === 'custom' ? 'Khoảng thời gian' : (filterMode === 'month' ? 'Tháng' : filterMode === 'year' ? 'Năm' : (timeOptions.find(opt => opt.id === timeType)?.label || 'Thời gian'))}
                            </span>
                            <span className={`text-xs font-black ${openDropdown === 'timeSelector' || (timeType !== 'today') ? 'text-white' : 'text-slate-950'}`}>
                                {filterMode === 'year' ? dateRange.start.getFullYear() :
                                    filterMode === 'month' ? `Tháng ${dateRange.start.getMonth() + 1}/${dateRange.start.getFullYear()}` :
                                        (timeType === 'custom' || filterMode === 'week' || filterMode === 'range')
                                            ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                                            : formatDate(selectedDate)
                                }
                            </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openDropdown === 'timeSelector' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Quick Clear Time Filter Button - Top Right Edge */}
                    {timeType !== 'today' && (
                        <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTimeType('today');
                            }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10 border-2 border-white"
                            title="Tắt bộ lọc thời gian"
                        >
                            <X className="w-2.5 h-2.5 font-bold" />
                        </motion.button>
                    )}

                    <AnimatePresence>
                        {openDropdown === 'timeSelector' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full mt-2 right-0 w-[300px] bg-slate-900 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-800 p-6 z-[80]"
                            >
                                {/* Tabbed Picker */}
                                <div className="flex flex-col">
                                    {/* Tabs */}
                                    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-2xl mb-6">
                                        {(['day', 'week', 'month', 'year', 'range'] as const).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setFilterMode(mode)}
                                                className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${filterMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : mode === 'month' ? 'Tháng' : mode === 'year' ? 'Năm' : 'Khoảng'}
                                            </button>
                                        ))}
                                    </div>

                                    {filterMode === 'month' ? (
                                        <div className="grid grid-cols-3 gap-3">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleMonthSelect(i)}
                                                    className={`py-4 rounded-2xl text-xs font-bold border transition-all ${dateRange.start.getMonth() === i && dateRange.start.getFullYear() === viewDate.getFullYear()
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-blue-500/50 hover:text-white'
                                                        }`}
                                                >
                                                    Tháng {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    ) : filterMode === 'year' ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {[2024, 2025, 2026, 2027].map(yr => (
                                                <button
                                                    key={yr}
                                                    onClick={() => handleYearSelect(yr)}
                                                    className={`py-8 rounded-3xl text-lg font-black border transition-all ${dateRange.start.getFullYear() === yr
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-blue-500/50 hover:text-white'
                                                        }`}
                                                >
                                                    {yr}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Calendar Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ChevronDown className="w-4 h-4 rotate-90" /></button>
                                                <div className="text-xs font-black text-white uppercase tracking-widest">{viewDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</div>
                                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
                                            </div>

                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                                                    <div key={day} className="text-center text-[10px] font-black text-slate-500">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {days.map((day, idx) => (
                                                    <div key={idx} className="aspect-square flex items-center justify-center">
                                                        {day ? (
                                                            <button
                                                                onClick={() => handleDateSelect(day)}
                                                                className={`w-full h-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all
                                                                    ${isSelected(day) || (filterMode === 'week' && isInRange(day))
                                                                        ? 'bg-blue-600 text-white shadow-lg'
                                                                        : isInRange(day)
                                                                            ? 'bg-blue-500/20 text-blue-200'
                                                                            : isToday(day)
                                                                                ? 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/30'
                                                                                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                                                                    }`}
                                                            >
                                                                {day}
                                                            </button>
                                                        ) : <div className="w-full h-full" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    <div className="mt-auto pt-6 flex justify-end">
                                        <button onClick={() => setOpenDropdown(null)} className="px-6 py-2 text-xs font-black text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest">Hoàn tất</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Name Filter - visible to all roles */}
                {(true) && (
                    <div className="relative group">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-sm focus-within:shadow-md focus-within:border-blue-400 group-hover:border-blue-200 ${searchName ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50/60 border-blue-100/50'}`}>
                            <Search className={`w-3.5 h-3.5 transition-colors ${searchName ? 'text-white' : 'text-blue-600'}`} />
                            <input
                                type="text"
                                placeholder="Tìm tên..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className={`bg-transparent border-none focus:outline-none text-xs font-black w-28 placeholder:font-normal ${searchName ? 'text-white placeholder:text-blue-200' : 'text-slate-950 placeholder:text-slate-400'}`}
                            />
                            {searchName && (
                                <button
                                    onClick={() => setSearchName('')}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-2.5 h-2.5 text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Clear Filters Button - Prominent Style */}
                {(activeTeam !== 'All' || searchName !== '' || (timeType !== 'today')) && (
                    <button
                        onClick={() => {
                            setActiveTeam('All');
                            setSearchName('');
                            handleSelectTimeType('today');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all duration-300 hover:shadow-lg shadow-red-200/50 active:scale-95 group"
                    >
                        <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-tight">Tắt lọc</span>
                    </button>
                )}

                {/* Screenshot Button */}
                {onCapture && (
                    <button
                        type="button"
                        onClick={onCapture}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest
                                   bg-slate-900 text-white hover:bg-black transition-all shadow-sm hover:shadow-md ml-1"
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Chụp
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActivityFilters;
