'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Globe } from 'lucide-react';

interface ActivityKPIsProps {
    summary?: {
        totalVideoTarget: number;
        totalVideoCompleted: number;
        totalTrafficTarget: number;
        totalTrafficCompleted: number;
        totalRevenueTarget: number;
        totalRevenueCompleted: number;
        totalChannels: number;
    };
    teamContributions?: any[];
    groupContributions?: {
        global: { videos: number, traffic: number, revenue: number, channels: number, videoPct: number, trafficPct: number, revenuePct: number, channelPct: number };
        vn: { videos: number, traffic: number, revenue: number, channels: number, videoPct: number, trafficPct: number, revenuePct: number, channelPct: number };
    } | null;
}

const ActivityKPIs = ({ summary, teamContributions, groupContributions }: ActivityKPIsProps) => {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const calculatePercentage = (current: number, target: number) => {
        if (!target) return 0;
        return Math.round((current / target) * 100);
    };

    const kpis = [
        {
            title: 'MỤC TIÊU VIDEO',
            value: formatNumber(summary?.totalVideoCompleted || 0),
            total: `${formatNumber(summary?.totalVideoTarget || 0)} Video`,
            percentage: calculatePercentage(summary?.totalVideoCompleted || 0, summary?.totalVideoTarget || 0),
            groupKey: 'videos',
            pctKey: 'videoPct',
            tone: {
                card: 'from-blue-50/95 via-white to-indigo-50/80 border-blue-200/70',
                title: 'text-blue-700',
                icon: 'text-blue-600 bg-blue-600/10',
            },
        },
        {
            title: 'TỔNG TRAFFIC',
            value: formatNumber(summary?.totalTrafficCompleted || 0),
            total: formatNumber(summary?.totalTrafficTarget || 0),
            percentage: calculatePercentage(summary?.totalTrafficCompleted || 0, summary?.totalTrafficTarget || 0),
            groupKey: 'traffic',
            pctKey: 'trafficPct',
            tone: {
                card: 'from-sky-50/95 via-white to-cyan-50/80 border-sky-200/70',
                title: 'text-sky-700',
                icon: 'text-sky-600 bg-sky-600/10',
            },
        },
        {
            title: 'TỔNG DOANH THU',
            value: formatNumber(summary?.totalRevenueCompleted || 0),
            total: formatNumber(summary?.totalRevenueTarget || 0),
            percentage: calculatePercentage(summary?.totalRevenueCompleted || 0, summary?.totalRevenueTarget || 0),
            groupKey: 'revenue',
            pctKey: 'revenuePct',
            tone: {
                card: 'from-emerald-50/95 via-white to-teal-50/80 border-emerald-200/70',
                title: 'text-emerald-700',
                icon: 'text-emerald-600 bg-emerald-600/10',
            },
        },
        {
            title: 'SỐ KÊNH ĐANG HOẠT ĐỘNG',
            value: formatNumber(summary?.totalChannels || 0),
            total: `Kênh`,
            percentage: 100,
            groupKey: 'channels',
            pctKey: 'channelPct',
            tone: {
                card: 'from-violet-50/95 via-white to-fuchsia-50/80 border-violet-200/70',
                title: 'text-violet-700',
                icon: 'text-violet-600 bg-violet-600/10',
            },
        }
    ];

    const hasAnyKpi = (summary?.totalVideoTarget || 0) + (summary?.totalVideoCompleted || 0) +
        (summary?.totalTrafficTarget || 0) + (summary?.totalTrafficCompleted || 0) +
        (summary?.totalRevenueTarget || 0) + (summary?.totalRevenueCompleted || 0) +
        (summary?.totalChannels || 0) > 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi, idx) => (
                <Card
                    key={idx}
                    className={`bg-gradient-to-br ${kpi.tone.card} border shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all duration-300`}
                >
                    <CardContent className="p-2.5">
                        <div className="flex justify-between items-center mb-1.5">
                            <h3 className={`text-[9px] font-black uppercase tracking-widest leading-none ${kpi.tone.title}`}>{kpi.title}</h3>
                            <div className={`p-1 rounded-md ${kpi.tone.icon}`}>
                                <Target className="w-2.5 h-2.5" />
                            </div>
                        </div>

                        {/* Row 1: Progress circle + main value */}
                        <div className="flex items-center justify-center gap-2.5 mb-2">
                            {kpi.groupKey !== 'channels' && (
                                <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-slate-100" />
                                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3.5" fill="transparent"
                                            strokeDasharray={100.5}
                                            strokeDashoffset={100.5 * (1 - kpi.percentage / 100)}
                                            strokeLinecap="round"
                                            className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                        />
                                    </svg>
                                    <span className="absolute text-[10px] font-black text-slate-900">{kpi.percentage}%</span>
                                </div>
                            )}
                            <div className="flex flex-col justify-center">
                                <div className="text-[18px] sm:text-[22px] lg:text-[24px] font-black text-slate-900 leading-none mb-1 tracking-tighter whitespace-nowrap">
                                    {kpi.value}
                                </div>
                                <div className={`text-[9px] font-bold flex items-center gap-1 ${kpi.groupKey === 'channels' ? 'invisible' : 'text-blue-600/70'}`}>
                                    <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                                    MT: <span className="text-blue-700">{kpi.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Global / VN breakdown - always on its own row */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100/80">
                            {/* Global */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1 leading-none mb-0.5 flex-wrap justify-center">
                                    <span className="text-[15px] sm:text-base font-black text-slate-800">
                                        {formatNumber(groupContributions?.global?.[kpi.groupKey as keyof typeof groupContributions.global] || 0)}
                                    </span>
                                    {kpi.groupKey !== 'channels' && (
                                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-500">
                                            {groupContributions?.global?.[kpi.pctKey as keyof typeof groupContributions.global] || 0}%
                                        </span>
                                    )}
                                </div>
                                <div className="text-[8px] font-black text-amber-600/75 uppercase flex items-center gap-0.5">
                                    <Globe className="w-2.5 h-2.5" />
                                    Global
                                </div>
                            </div>

                            {/* VN */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1 leading-none mb-0.5 flex-wrap justify-center">
                                    {kpi.groupKey !== 'channels' && (
                                        <span className="text-[9px] sm:text-[10px] font-bold text-blue-600">
                                            {groupContributions?.vn?.[kpi.pctKey as keyof typeof groupContributions.vn] || 0}%
                                        </span>
                                    )}
                                    <span className="text-[15px] sm:text-base font-black text-slate-800">
                                        {formatNumber(groupContributions?.vn?.[kpi.groupKey as keyof typeof groupContributions.vn] || 0)}
                                    </span>
                                </div>
                                <div className="text-[8px] font-black text-blue-600/75 uppercase flex items-center gap-0.5">
                                    VN <img src="/vn-flag.png" alt="VN" className="w-4 h-2.5 rounded-sm" />
                                </div>
                            </div>
                        </div>
                    </CardContent>

                </Card>
            ))}
            {!hasAnyKpi && summary && (
                <p className="col-span-full text-center text-xs text-slate-500 mt-2">
                    Nếu toàn bộ số liệu là 0: kiểm tra đã đồng bộ KPI từ Lark chưa và tháng đang chọn có dữ liệu trong Lark.
                </p>
            )}
        </div>
    );
};

export default ActivityKPIs;
