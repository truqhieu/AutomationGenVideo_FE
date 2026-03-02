'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Video, Activity, TrendingUp, Layout, CheckSquare, Users, ChevronUp, ChevronDown } from 'lucide-react';
import UserActivityCard from './UserActivityCard';

interface PersonalChartsProps {
    history: any[];
    teamStats: {
        teamName: string;
        userVideo: number;
        teamVideo: number;
        userTraffic: number;
        teamTraffic: number;
        userRevenue: number;
        teamRevenue: number;
        teamChannels?: number;
    } | null;
    companyStats?: {
        totalVideo: number;
        totalTraffic: number;
        totalRevenue: number;
        totalChannels: number;
    } | null;
    userActivity?: any;
    members?: any[];
    allReports?: any[];
}

const PersonalCharts = ({ history, teamStats, companyStats, userActivity, members = [], allReports = [] }: PersonalChartsProps) => {

    const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'video', direction: 'desc' });

    const sortedMembers = React.useMemo(() => {
        // Only show members who have a team name
        let sortableMembers = members.filter(m => m.team && m.team.trim() !== '');
        if (sortConfig !== null) {
            sortableMembers.sort((a, b) => {
                let aValue: any = a[sortConfig.key];
                let bValue: any = b[sortConfig.key];

                // Special handling for formatted strings
                if (sortConfig.key === 'video') {
                    aValue = parseInt(a.video?.split(' ')[0] || '0');
                    bValue = parseInt(b.video?.split(' ')[0] || '0');
                } else if (sortConfig.key === 'traffic' || sortConfig.key === 'revenue') {
                    aValue = parseInt((a[sortConfig.key] || '0').toString().replace(/\./g, '').replace(/,/g, ''));
                    bValue = parseInt((b[sortConfig.key] || '0').toString().replace(/\./g, '').replace(/,/g, ''));
                } else if (sortConfig.key === 'channels') {
                    aValue = parseInt(a.channels || '0');
                    bValue = parseInt(b.channels || '0');
                } else if (sortConfig.key === 'checklist') {
                    aValue = parseInt(a.checklist?.split('/')[0] || '0');
                    bValue = parseInt(b.checklist?.split('/')[0] || '0');
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableMembers;
    }, [members, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        const isActive = sortConfig?.key === key;
        if (!isActive) return <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-50 transition-all" />;

        return sortConfig?.direction === 'desc'
            ? <ChevronDown className="w-3.5 h-3.5 text-white animate-bounce-subtle" />
            : <ChevronUp className="w-3.5 h-3.5 text-white animate-bounce-subtle" />;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* 1. Enhanced Personal Summary - Compact Premium Look */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-[2rem] border border-white/40 shadow-2xl shadow-blue-900/10 bg-white/70 backdrop-blur-2xl relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 -z-10" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

                <div className="flex flex-col md:flex-row items-stretch">
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 flex flex-row md:flex-col items-center justify-center gap-3 md:min-w-[150px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner border border-white/20 relative z-10">
                            <Layout className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-center relative z-10 text-center">
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md truncate max-w-[120px]">
                                VCB REPORT
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[8px] font-bold text-blue-100 uppercase tracking-widest opacity-80">
                                    TOÀN CÔNG TY
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
                        {[
                            {
                                label: 'Số video',
                                icon: Video,
                                color: 'from-blue-500 to-blue-600',
                                textColor: 'text-blue-600',
                                value: (companyStats?.totalVideo || 0).toLocaleString('vi-VN'),
                                unit: 'Tổng video công ty'
                            },
                            {
                                label: 'Tổng traffic',
                                icon: Activity,
                                color: 'from-indigo-500 to-indigo-600',
                                textColor: 'text-indigo-600',
                                value: (companyStats?.totalTraffic || 0).toLocaleString('vi-VN'),
                                unit: 'Tổng view công ty'
                            },
                            {
                                label: 'Doanh thu',
                                icon: TrendingUp,
                                color: 'from-emerald-500 to-emerald-600',
                                textColor: 'text-emerald-600',
                                value: (companyStats?.totalRevenue || 0).toLocaleString('vi-VN'),
                                unit: 'VNĐ (Toàn công ty)'
                            },
                            {
                                label: 'Số kênh',
                                icon: Layout,
                                color: 'from-violet-500 to-violet-600',
                                textColor: 'text-violet-600',
                                value: (companyStats?.totalChannels || 0).toString(),
                                unit: 'Tổng kênh hệ thống'
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="p-4 hover:bg-white/40 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.color}" />

                                <div className="flex items-center justify-between mb-1.5">
                                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color} shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-500`}>
                                        <item.icon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                                        {item.label}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-xl font-black ${item.textColor} tracking-tight tabular-nums drop-shadow-sm group-hover:scale-[1.02] origin-left transition-transform`}>
                                        {item.value}
                                    </span>
                                    <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">
                                        {item.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* 2. Detailed Member Performance Table - Clean & Modern */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-[1.5rem] border border-blue-50 shadow-xl shadow-blue-900/5 overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-blue-50 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Chi tiết hiệu suất nhân viên</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                        <span>* Click vào tiêu đề cột để sắp xếp</span>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-blue-600 shadow-sm">
                                <th className="px-4 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 w-12 text-center">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10">
                                    Họ tên
                                </th>
                                <th onClick={() => requestSort('video')} className="px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 cursor-pointer hover:bg-blue-700 transition-colors group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Số VD</span>
                                        {getSortIcon('video')}
                                    </div>
                                </th>
                                <th onClick={() => requestSort('traffic')} className="px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 cursor-pointer hover:bg-blue-700 transition-colors group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Số Traffic</span>
                                        {getSortIcon('traffic')}
                                    </div>
                                </th>
                                <th onClick={() => requestSort('revenue')} className="px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest border-r border-white/10 cursor-pointer hover:bg-blue-700 transition-colors group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Số doanh thu</span>
                                        {getSortIcon('revenue')}
                                    </div>
                                </th>
                                <th onClick={() => requestSort('channels')} className="px-6 py-3 text-[10px] font-black text-white uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-colors group">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Số kênh</span>
                                        {getSortIcon('channels')}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedMembers.map((member, idx) => (
                                <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${member.isLeader ? 'bg-orange-50/20' : ''}`}>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-[10px] font-black text-slate-400">
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {member.isLeader && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                                            <span className={`text-xs font-bold ${member.isLeader ? 'text-orange-600' : 'text-slate-700'}`}>
                                                {member.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-black ${member.isLeader ? 'text-orange-600' : 'text-blue-600'}`}>
                                            {member.video}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{member.traffic}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{member.revenue}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{member.channels}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* 3. Member Activity Cards Grid */}
            <div className="space-y-6 mt-12">
                <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Thẻ chi tiết nhân viên</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-10">
                    {allReports.map((report, idx) => (
                        <UserActivityCard
                            key={report.id || idx}
                            data={{
                                ...report,
                                reportStatus: report.status
                            }}
                            isActive={userActivity?.name === report.name}
                        />
                    ))}
                    {allReports.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu thẻ nhân viên</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalCharts;
