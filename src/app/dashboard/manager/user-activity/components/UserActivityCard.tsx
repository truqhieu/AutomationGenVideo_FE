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
            card: 'border-red-400 border-2 bg-red-100/60 hover:bg-red-100/80 transition-all shadow-[0_8px_30px_rgba(239,68,68,0.08)]',
            avatar: 'border-red-500 ring-4 ring-red-100',
            icon: 'text-red-500',
            badge: 'bg-red-600 text-white',
            text: 'text-red-600',
            glow: 'hover:shadow-red-300/40',
            accent: 'bg-red-100'
        },
        completed: {
            card: 'border-emerald-400 border-2 bg-emerald-100/60 hover:bg-emerald-100/80 transition-all shadow-[0_8px_30px_rgba(16,185,129,0.08)]',
            avatar: 'border-emerald-500 ring-4 ring-emerald-100',
            icon: 'text-emerald-500',
            badge: 'bg-emerald-600 text-white',
            text: 'text-emerald-600',
            glow: 'hover:shadow-emerald-300/40',
            accent: 'bg-emerald-100'
        },
        exceeded: {
            card: 'border-amber-400 border-2 bg-amber-100/60 hover:bg-amber-100/80 transition-all shadow-[0_8px_30px_rgba(245,158,11,0.08)]',
            avatar: 'border-amber-500 ring-4 ring-amber-100',
            icon: 'text-amber-600',
            badge: 'bg-amber-600 text-white',
            text: 'text-amber-700',
            glow: 'hover:shadow-amber-300/40',
            accent: 'bg-amber-100'
        }
    };

    const style = statusStyles[statusType];
    const isReportedOnTime = data.reportStatus === 'ĐÚNG HẠN' || data.reportStatus === 'ĐÃ XONG';

    return (
        <Card
            onClick={onClick}
            className={`relative rounded-[2rem] overflow-hidden border transition-all duration-300 cursor-pointer ${style.card} ${isActive
                ? 'ring-4 ring-blue-500/20 shadow-2xl scale-[1.02] z-10 border-blue-500'
                : `hover:scale-[1.01] ${style.glow}`
                }`}>

            <CardContent className="p-4 flex flex-col items-center relative z-10">
                {/* Warning/Status Icon */}
                <div className="absolute top-2 right-2">
                    {statusType === 'exceeded' ? (
                        <div className="bg-amber-100 p-2 rounded-xl border border-amber-200">
                            <Target className="w-4 h-4 text-amber-600" />
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
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`;
                            }}
                        />
                    </div>
                </div>

                <div className="text-center mb-4">
                    <h4 className="text-[13px] font-black text-slate-800 tracking-tight leading-tight mb-1 truncate max-w-[170px]">{data.name}</h4>
                    <div className="flex items-center justify-center gap-1.5">
                        {data.position && (
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border shadow-xs ${['leader', 'lead', 'quản lý', 'tp ', 'trưởng'].some(key => data.position?.toLowerCase().includes(key))
                                ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200'
                                : 'bg-white text-slate-500 border-slate-200'
                                }`}>
                                {data.position?.toUpperCase()}
                            </span>
                        )}
                        <span className="text-[8px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200 shadow-xs">
                            {data.team}
                        </span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="w-full grid grid-cols-1 gap-1.5 mb-4 px-1">
                    <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">TGBC</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-800">{data.time}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">MỤC TIÊU NGÀY</span>
                        </div>
                        <span className="text-[12px] font-black text-slate-900">{dailyGoal}</span>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-2xl border shadow-sm ${statusType === 'exceeded' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 ${style.icon}`} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">ĐÁ XONG</span>
                        </div>
                        <span className={`text-[12px] font-black ${style.text}`}>{done}</span>
                    </div>
                </div>

                {/* Task Details Breakdown */}
                {data.task_progress && (
                    <div className="grid grid-cols-2 gap-1.5 mb-4 px-1">
                        <div className="flex flex-col p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest mb-0.5">TASK AUTO</span>
                            <span className="text-[11px] font-black text-slate-800">{data.task_progress.task_auto}</span>
                        </div>
                        <div className="flex flex-col p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest mb-0.5">TASK MỚI</span>
                            <span className="text-[11px] font-black text-slate-800">{data.task_progress.task_new}</span>
                        </div>
                    </div>
                )}

                {/* Report Status Badge */}
                <div className="w-full flex justify-center mb-4">
                    <div className={`px-5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] shadow-md transition-all ${isReportedOnTime
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                        : 'bg-red-600 text-white ring-2 ring-red-500/20'
                        }`}>
                        {data.reportStatus || 'Chưa báo cáo'}
                    </div>
                </div>

                {/* Monthly Progress */}
                <div className="w-full space-y-1.5 mb-4 px-1">
                    <div className="flex justify-between items-center text-[9px] font-black tracking-wider">
                        <span className="text-slate-500 uppercase">TIẾN ĐỘ THÁNG</span>
                        <span className={`${statusType === 'exceeded' ? 'text-amber-600' : 'text-blue-600'}`}>{data.monthlyProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-700 shadow-sm ${statusType === 'exceeded'
                                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                            style={{ width: `${Math.min(data.monthlyProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Traffic & Revenue Footer */}
                <div className="grid grid-cols-2 w-full gap-2 px-1">
                    <div className="bg-white p-2.5 rounded-2xl border border-blue-100 shadow-sm text-center">
                        <span className="block text-[7px] font-black text-blue-500 uppercase tracking-widest mb-1">TRAFFIC</span>
                        <div className="text-[11px] font-black text-blue-800 truncate leading-none">{data.traffic}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 shadow-sm text-center">
                        <span className="block text-[7px] font-black text-emerald-500 uppercase tracking-widest mb-1">DOANH THU</span>
                        <div className="text-[11px] font-black text-emerald-800 truncate leading-none">{data.revenue}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserActivityCard;
export type { UserActivity };
