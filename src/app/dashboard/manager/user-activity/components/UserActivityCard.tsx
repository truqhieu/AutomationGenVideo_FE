'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    reportStatus: 'CHƯA BÁO CÁO' | 'ĐÃ XONG' | 'ĐÃ BÁO CÁO';
    monthlyProgress: number;
}

interface UserActivityCardProps {
    data: UserActivity;
    onClick?: () => void;
    isActive?: boolean;
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

const UserActivityCard = ({ data, onClick, isActive }: UserActivityCardProps) => {
    const dailyGoal = data.dailyGoal || 0;
    const done = data.done || 0;

    let statusType: 'warning' | 'completed' | 'exceeded' = 'warning';
    if (done > dailyGoal) statusType = 'exceeded';
    else if (done === dailyGoal) statusType = 'completed';
    else statusType = 'warning';

    const statusStyles = {
        warning: {
            card: 'border-red-100 bg-gradient-to-br from-white via-white to-red-50/30 hover:border-red-400 shadow-[0_4px_20px_rgb(0,0,0,0.03)]',
            avatar: 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.1)]',
            icon: 'text-red-500',
            badge: 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-none shadow-sm',
            text: 'text-red-600',
            glow: 'hover:shadow-[0_12px_24px_-8px_rgba(239,68,68,0.12)]',
            accent: 'bg-red-50'
        },
        completed: {
            card: 'border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/30 hover:border-emerald-400 shadow-[0_4px_20px_rgb(0,0,0,0.03)]',
            avatar: 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
            icon: 'text-emerald-500',
            badge: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-none shadow-sm',
            text: 'text-emerald-600',
            glow: 'hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.12)]',
            accent: 'bg-emerald-50'
        },
        exceeded: {
            card: 'border-amber-200 bg-gradient-to-br from-amber-50/20 via-white to-yellow-50/20 hover:border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.04)]',
            avatar: 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
            icon: 'text-amber-600',
            badge: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white border-none shadow-md',
            text: 'text-amber-700 font-extrabold',
            glow: 'hover:shadow-[0_15px_30px_-10px_rgba(245,158,11,0.2)]',
            accent: 'bg-amber-100/20'
        }
    };

    const style = statusStyles[statusType];
    const isPending = data.reportStatus === 'CHƯA BÁO CÁO';

    return (
        <Card
            onClick={onClick}
            className={`relative rounded-[2rem] overflow-hidden border transition-all duration-300 cursor-pointer ${style.card} ${isActive
                ? 'ring-2 ring-blue-500/30 shadow-xl scale-[1.01] z-10 border-blue-400'
                : `hover:scale-[1.005] ${style.glow}`
                }`}>

            {/* Tight decors */}
            <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl opacity-10 ${style.accent}`} />
            <div className={`absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl opacity-10 ${style.accent}`} />

            <CardContent className="p-4 flex flex-col items-center relative z-10">
                {/* Warning/Status Icon */}
                <div className="absolute top-1.5 right-1.5">
                    {statusType === 'exceeded' ? (
                        <div className="bg-amber-100/80 p-1.5 rounded-xl animate-bounce">
                            <Target className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                    ) : (
                        <div className={`${isPending ? 'bg-red-50' : 'bg-gray-50'} p-1.5 rounded-xl`}>
                            <AlertCircle className={`w-3.5 h-3.5 ${isPending ? 'text-red-500 animate-pulse' : style.icon}`} />
                        </div>
                    )}
                </div>

                {/* Profile Info */}
                <div className="mt-1 mb-2">
                    <div className={`w-14 h-14 rounded-full border ${style.avatar} p-0.5 transition-all bg-white shadow-sm`}>
                        <img
                            src={getAvatarUrl(data.avatar, data.name)}
                            alt={data.name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
                            }}
                        />
                    </div>
                </div>

                <div className="text-center mb-3">
                    <h4 className="text-xs font-black text-gray-900 tracking-tight leading-tight mb-1 truncate max-w-[150px]">{data.name}</h4>
                    <div className="flex items-center justify-center gap-1.5">
                        {data.position && (
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border shadow-xs ${['leader', 'lead', 'quản lý', 'tp ', 'trưởng'].some(key => data.position?.toLowerCase().includes(key))
                                ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 border-orange-100'
                                : 'bg-white text-gray-500 border-gray-100'
                                }`}>
                                {data.position}
                            </span>
                        )}
                        <span className="text-[7px] font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-50">
                            {data.team}
                        </span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="w-full grid grid-cols-1 gap-1 mb-3">
                    <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50/40 border border-slate-100/30">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500 uppercase">TGBC</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-700">{data.time}</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50/40 border border-slate-100/30">
                        <div className="flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-500 uppercase">TIÊU</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-900">{data.dailyGoal}</span>
                    </div>

                    <div className={`flex items-center justify-between p-1.5 rounded-xl border ${statusType === 'exceeded' ? 'bg-amber-50/60 border-amber-100' : 'bg-slate-50/40 border-slate-100/30'}`}>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3 h-3 ${style.icon}`} />
                            <span className="text-[8px] font-bold text-slate-500 uppercase">XONG</span>
                        </div>
                        <span className={`text-[10px] font-black ${style.text}`}>{data.done}</span>
                    </div>
                </div>

                {/* Report Status Badge */}
                <button className={`w-full py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] mb-3 shadow-xs transition-opacity active:opacity-80 ${isPending
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                    : style.badge
                    }`}>
                    {data.reportStatus}
                </button>

                {/* Monthly Progress */}
                <div className="w-full space-y-1 mb-3">
                    <div className="flex justify-between items-center text-[8px] font-black">
                        <span className="text-slate-400 uppercase">TIẾN ĐỘ THÁNG</span>
                        <span className={`${statusType === 'exceeded' ? 'text-amber-600' : 'text-blue-600'}`}>{data.monthlyProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-700 shadow-sm ${statusType === 'exceeded'
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                            style={{ width: `${Math.min(data.monthlyProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Traffic & Revenue Footer */}
                <div className="grid grid-cols-2 w-full gap-2 mt-1">
                    <div className="bg-blue-50/30 p-2 rounded-xl border border-blue-100/30 text-center">
                        <span className="block text-[6px] font-black text-blue-400 uppercase mb-0.5">TRAFFIC</span>
                        <div className="text-[9px] font-black text-blue-700 truncate">{data.traffic}</div>
                    </div>
                    <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/30 text-center">
                        <span className="block text-[6px] font-black text-emerald-400 uppercase mb-0.5">REVENUE</span>
                        <div className="text-[9px] font-black text-emerald-700 truncate">{data.revenue}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserActivityCard;
export type { UserActivity };
