'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const teams = [
    'All', 'AFF 01', 'Global - JP1', 'Global - JP2', 'Global JP3', 'Global JP4',
    'Team ADS', 'Team K0', 'Team K1', 'Team K2'
];

const ActivityFilters = () => {
    const [activeTeam, setActiveTeam] = React.useState('All');
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [showDatePicker, setShowDatePicker] = React.useState(false);



    const formatDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Lọc Team:</span>
                {teams.map((team) => (
                    <button
                        key={team}
                        onClick={() => setActiveTeam(team)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${activeTeam === team
                            ? 'bg-[#1e40af] text-white border-[#1e40af] shadow-md'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {team}
                    </button>
                ))}
                <button className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Date Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Ngày:</span>
                        <span className="text-sm font-bold text-gray-700">{formatDate(selectedDate)}</span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </button>

                    {showDatePicker && (
                        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                            <input
                                type="date"
                                value={selectedDate.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    setSelectedDate(new Date(e.target.value));
                                    setShowDatePicker(false);
                                }}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityFilters;
