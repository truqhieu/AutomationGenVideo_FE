'use client';

import React from 'react';
import { Calendar, AlertCircle, FileText, Target, CheckCircle2 } from 'lucide-react';

interface UserActivity {
    name: string;
    position?: string;
    team: string;
    avatar: string;
    time: string;
    dailyGoal: number;
    done: number;
    traffic: string;
    revenue: string;
    reportStatus: 'CHƯA BÁO CÁO' | 'ĐÃ XONG' | 'ĐÃ BÁO CÁO' | 'ĐÚNG HẠN';
    monthlyProgress: number;
    task_progress?: {
        task_auto: number;
        task_new: number;
        kpi_status: string;
    } | null;
}

interface UserActivityCardProps {
    data: UserActivity;
    onClick?: () => void;
    canClick?: boolean;
    isActive?: boolean;
    timeType?: string;
}

const getAvatarUrl = (url: string | null, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    if (url.includes('drive.google.com')) {
        // Extract ID from various Drive formats
        const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
        }
    }
    return url;
};

const UserActivityCard = React.memo(({ data, onClick, canClick = true, isActive, timeType }: UserActivityCardProps) => {
    const dailyGoal = data.dailyGoal || 0;
    const done = data.done || 0;

    let statusType: 'warning' | 'completed' | 'exceeded' = 'warning';
    if (done > dailyGoal) statusType = 'exceeded';
    else if (done === dailyGoal) statusType = 'completed';
    else statusType = 'warning';

    const statusStyles = {
        warning: {
            card: `border-red-400 border-2 bg-red-100/60 ${canClick ? 'hover:bg-red-100/80 transition-all shadow-[0_8px_30px_rgba(239,68,68,0.08)]' : ''}`,
            avatar: 'border-red-500 ring-4 ring-red-100',
            icon: 'text-red-500',
            badge: 'bg-red-600 text-white',
            text: 'text-red-600',
            glow: canClick ? 'hover:shadow-red-300/40' : '',
            accent: 'bg-red-100'
        },
        completed: {
            card: `border-emerald-400 border-2 bg-emerald-100/60 ${canClick ? 'hover:bg-emerald-100/80 transition-all shadow-[0_8px_30px_rgba(16,185,129,0.08)]' : ''}`,
            avatar: 'border-emerald-500 ring-4 ring-emerald-100',
            icon: 'text-emerald-500',
            badge: 'bg-emerald-600 text-white',
            text: 'text-emerald-600',
            glow: canClick ? 'hover:shadow-emerald-300/40' : '',
            accent: 'bg-emerald-100'
        },
        exceeded: {
            card: `border-purple-400 border-2 bg-purple-100/60 ${canClick ? 'hover:bg-purple-100/80 transition-all shadow-[0_8px_30px_rgba(168,85,247,0.1)]' : ''}`,
            avatar: 'border-purple-500 ring-4 ring-purple-100',
            icon: 'text-purple-600',
            badge: 'bg-purple-600 text-white',
            text: 'text-purple-700',
            glow: canClick ? 'hover:shadow-purple-300/40' : '',
            accent: 'bg-purple-100'
        }
    };

    const style = statusStyles[statusType];
    const isReportedOnTime = data.reportStatus === 'ĐÚNG HẠN' || data.reportStatus === 'ĐÃ XONG';
    const isRange = timeType && !['today', 'yesterday'].includes(timeType);
    const goalLabel = 'MỤC TIÊU NGÀY';

    return (
        <div
            onClick={canClick ? onClick : undefined}
            className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${canClick ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'} ${style.card} ${isActive
                ? 'ring-4 ring-blue-500/20 shadow-2xl scale-[1.02] z-10 border-blue-500'
                : `${style.glow}`
                }`}>

            <div className="p-4 flex flex-col items-center relative z-10">
                {/* Warning/Status Icon */}
                <div className="absolute top-2 right-2">
                    {statusType === 'exceeded' ? (
                        <div className="bg-purple-100 p-2 rounded-xl border border-purple-200 shadow-sm animate-pulse-slow">
                            <Target className="w-4 h-4 text-purple-600" />
                        </div>
                    ) : (
                        <div className={`${!isReportedOnTime ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'} p-2 rounded-xl border`}>
                            <AlertCircle className={`w-4 h-4 ${!isReportedOnTime ? 'text-red-500 animate-pulse' : style.icon}`} />
                        </div>
                    )}
                </div>

                {/* Profile Info */}
                <div className="mt-2 mb-3">
                    <div className={`w-16 h-16 rounded-full border-2 ${style.avatar} p-0.5 transition-all bg-white overflow-hidden shadow-inner`}>
                        <img
                            src={getAvatarUrl(data.avatar, data.name)}
                            alt={data.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
                            }}
                        />
                    </div>
                </div>

                <div className="text-center mb-4">
                    <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-1 truncate max-w-[170px]">{data.name}</h4>
                    <div className="flex items-center justify-center gap-1.5">
                        {data.position && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border shadow-xs ${['leader', 'lead', 'quản lý', 'tp ', 'trưởng'].some(key => data.position?.toLowerCase().includes(key))
                                ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200'
                                : 'bg-white text-slate-500 border-slate-200'
                                }`}>
                                {data.position?.toUpperCase()}
                            </span>
                        )}
                        <span className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs flex items-center gap-1">
                            {data.team}
                            {data.team?.toLowerCase().includes('thái lan') && (
                                <img src="/thailand-flag.png" alt="TH" className="w-3.5 h-2.5 object-contain" />
                            )}
                            {data.team?.toLowerCase().includes('global - indo') && (
                                <img src="/indo-flag.png" alt="INDO" className="w-3.5 h-2.5 object-contain" />
                            )}
                            {data.team?.toLowerCase().includes('việt nam') && (
                                <img src="/vn-flag.png" alt="VN" className="w-3.5 h-2.5 object-contain" />
                            )}
                            {(data.team?.toLowerCase().includes('jp') || data.team?.toLowerCase().includes('nhật bản')) && (
                                <img src="/japan-flag.png" alt="JP" className="w-3.5 h-2.5 object-contain border border-gray-100" />
                            )}
                            {data.team?.toLowerCase().includes('đài loan') && (
                                <img src="/taiwan-flag.png" alt="TW" className="w-4 h-3 object-contain" />
                            )}
                        </span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="w-full grid grid-cols-1 gap-1.5 mb-4 px-1">
                    <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">TGBC</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{data.time}</span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-2xl border transition-colors ${statusType === 'exceeded' ? 'bg-purple-50/50 border-purple-100' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                            <Target className={`w-3.5 h-3.5 ${statusType === 'exceeded' ? 'text-purple-500' : 'text-slate-400'}`} />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{goalLabel}</span>
                        </div>
                        <span className={`text-sm font-black ${statusType === 'exceeded' ? 'text-purple-700' : 'text-slate-900'}`}>{dailyGoal}</span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-2xl border shadow-sm ${statusType === 'exceeded' ? 'bg-purple-100 border-purple-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${style.icon}`} />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">ĐÃ XONG</span>
                        </div>
                        <span className={`text-sm font-black ${style.text}`}>{done}</span>
                    </div>
                </div>

                {/* Report Status Badge */}
                <div className="w-full flex justify-center mb-4">
                    <div className={`px-5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-md transition-all ${isReportedOnTime
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                        : 'bg-red-600 text-white ring-2 ring-red-500/20'
                        }`}>
                        {data.reportStatus || 'Chưa báo cáo'}
                    </div>
                </div>

                {/* Monthly Progress */}
                <div className="w-full space-y-1.5 mb-4 px-1">
                    <div className="flex justify-between items-center text-[11px] font-black tracking-wider">
                        <span className="text-slate-500 uppercase">TIẾN ĐỘ THÁNG</span>
                        <span className={`${statusType === 'exceeded' ? 'text-purple-600' : 'text-blue-600'}`}>{data.monthlyProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-700 shadow-sm ${statusType === 'exceeded'
                                ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                            style={{ width: `${Math.min(data.monthlyProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Traffic & Revenue Footer */}
                <div className="grid grid-cols-2 w-full gap-2 px-1">
                    <div className="bg-white p-2.5 rounded-2xl border border-blue-100 shadow-sm text-center">
                        <span className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">TRAFFIC</span>
                        <div className="text-xs font-black text-blue-800 truncate leading-none">{data.traffic}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 shadow-sm text-center">
                        <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">DOANH THU</span>
                        <div className="text-xs font-black text-emerald-800 truncate leading-none">{data.revenue}</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

UserActivityCard.displayName = 'UserActivityCard';

export default UserActivityCard;
export type { UserActivity };
