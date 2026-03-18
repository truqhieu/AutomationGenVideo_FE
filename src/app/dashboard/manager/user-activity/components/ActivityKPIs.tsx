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
            pctKey: 'videoPct'
        },
        {
            title: 'TỔNG TRAFFIC',
            value: formatNumber(summary?.totalTrafficCompleted || 0),
            total: formatNumber(summary?.totalTrafficTarget || 0),
            percentage: calculatePercentage(summary?.totalTrafficCompleted || 0, summary?.totalTrafficTarget || 0),
            groupKey: 'traffic',
            pctKey: 'trafficPct'
        },
        {
            title: 'TỔNG DOANH THU',
            value: formatNumber(summary?.totalRevenueCompleted || 0),
            total: formatNumber(summary?.totalRevenueTarget || 0),
            percentage: calculatePercentage(summary?.totalRevenueCompleted || 0, summary?.totalRevenueTarget || 0),
            groupKey: 'revenue',
            pctKey: 'revenuePct'
        },
        {
            title: 'SỐ KÊNH ĐANG HOẠT ĐỘNG',
            value: formatNumber(summary?.totalChannels || 0),
            total: `Kênh`,
            percentage: 100,
            groupKey: 'channels',
            pctKey: 'channelPct'
        }
    ];

    const hasAnyKpi = (summary?.totalVideoTarget || 0) + (summary?.totalVideoCompleted || 0) +
        (summary?.totalTrafficTarget || 0) + (summary?.totalTrafficCompleted || 0) +
        (summary?.totalRevenueTarget || 0) + (summary?.totalRevenueCompleted || 0) +
        (summary?.totalChannels || 0) > 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="bg-gradient-to-br from-white to-blue-50/30 border-slate-200/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 border-b-2 border-b-blue-500">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{kpi.title}</h3>
                            <div className="bg-blue-600/5 p-1 rounded-lg">
                                <Target className="w-2.5 h-2.5 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 min-h-[3.5rem] flex-wrap sm:flex-nowrap">
                            {/* Left: Progress/Value Cluster */}
                            <div className="flex items-center gap-3">
                                {kpi.groupKey !== 'channels' && (
                                    <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="24"
                                                cy="24"
                                                r="20"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="transparent"
                                                className="text-slate-50"
                                            />
                                            <circle
                                                cx="24"
                                                cy="24"
                                                r="20"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="transparent"
                                                strokeDasharray={125.6}
                                                strokeDashoffset={125.6 * (1 - kpi.percentage / 100)}
                                                strokeLinecap="round"
                                                className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-black text-slate-900">
                                            {kpi.percentage}%
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col justify-center">
                                    <div className="text-2xl font-black text-slate-900 leading-none mb-1 tracking-tighter truncate drop-shadow-sm">
                                        {kpi.value}
                                    </div>
                                    <div className={`text-[10px] font-black uppercase flex items-center gap-1 ${kpi.groupKey === 'channels' ? 'invisible h-0' : 'text-blue-600/70'}`}>
                                        <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                        MT: <span className="text-blue-700">{kpi.total}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Breakdown integrated horizontally */}
                            <div className="flex items-center gap-2 sm:gap-4 border-l border-slate-100 pl-2 sm:pl-4 ml-auto">
                                {/* Global Stats */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-1 leading-none mb-1">
                                        <span className="text-base sm:text-lg font-black text-slate-800">{formatNumber(groupContributions?.global?.[kpi.groupKey as keyof typeof groupContributions.global] || 0)}</span>
                                        {kpi.groupKey !== 'channels' && (
                                            <span className="text-[10px] sm:text-[11px] font-bold text-amber-500">
                                                {groupContributions?.global?.[kpi.pctKey as keyof typeof groupContributions.global] || 0}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black text-amber-600/70 uppercase flex items-center gap-1">
                                        <Globe className="w-2.5 h-2.5" />
                                        Global
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-slate-100"></div>

                                {/* Việt Nam Stats */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-1 leading-none mb-1">
                                        {kpi.groupKey !== 'channels' && (
                                            <span className="text-[11px] font-bold text-blue-600">
                                                {groupContributions?.vn?.[kpi.pctKey as keyof typeof groupContributions.vn] || 0}%
                                            </span>
                                        )}
                                        <span className="text-base sm:text-lg font-black text-slate-800">{formatNumber(groupContributions?.vn?.[kpi.groupKey as keyof typeof groupContributions.vn] || 0)}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-blue-600/70 uppercase flex items-center gap-1">
                                        VN <img src="/vn-flag.png" alt="VN" className="w-4 h-2.5 rounded-sm" />
                                    </div>
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
