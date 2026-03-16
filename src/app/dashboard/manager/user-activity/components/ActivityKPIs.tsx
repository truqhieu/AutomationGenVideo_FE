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
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{kpi.title}</h3>
                            <div className="bg-blue-600/5 p-1.5 rounded-lg">
                                <Target className="w-3 h-3 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                            {kpi.groupKey !== 'channels' && (
                                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            className="text-slate-50"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={175.9}
                                            strokeDashoffset={175.9 * (1 - kpi.percentage / 100)}
                                            strokeLinecap="round"
                                            className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                        />
                                    </svg>
                                    {kpi.groupKey !== 'channels' && (
                                        <span className="absolute text-sm font-black text-slate-900">
                                            {kpi.percentage}%
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className={`text-3xl font-black text-slate-900 leading-none mb-2 tracking-tighter truncate drop-shadow-sm ${kpi.groupKey === 'channels' ? 'text-center py-2' : ''}`}>
                                    {kpi.value}
                                </div>
                                <div className={`text-[11px] font-black uppercase flex items-center gap-1.5 ${kpi.groupKey === 'channels' ? 'invisible select-none' : 'text-blue-600/70'}`}>
                                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                    MT: <span className="text-blue-700">{kpi.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Global vs VN */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <div className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1 mb-1">
                                    <Globe className="w-2.5 h-2.5 text-amber-500" />
                                    Global
                                </div>
                                <div className="flex items-baseline gap-1.5 h-6">
                                    <span className="text-lg font-black text-slate-800 leading-none">{formatNumber(groupContributions?.global?.[kpi.groupKey as keyof typeof groupContributions.global] || 0)}</span>
                                    {kpi.groupKey !== 'channels' ? (
                                        <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-1 rounded">
                                            {groupContributions?.global?.[kpi.pctKey as keyof typeof groupContributions.global] || 0}%
                                        </span>
                                    ) : (
                                        <span className="w-[30px]"></span>
                                    )}
                                </div>
                            </div>

                            <div className="w-px h-8 bg-slate-200"></div>

                            <div className="flex flex-col text-right">
                                <div className="text-[10px] font-black text-blue-600 uppercase flex items-center justify-end gap-1 mb-1">
                                    Việt Nam
                                    <img src="/vn-flag.png" alt="VN" className="w-6 h-4 object-contain rounded-sm shadow-sm" />
                                </div>
                                <div className="flex items-baseline justify-end gap-1.5 h-6">
                                    {kpi.groupKey !== 'channels' ? (
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                                            {groupContributions?.vn?.[kpi.pctKey as keyof typeof groupContributions.vn] || 0}%
                                        </span>
                                    ) : (
                                        <span className="w-[30px]"></span>
                                    )}
                                    <span className="text-lg font-black text-slate-800 leading-none">{formatNumber(groupContributions?.vn?.[kpi.groupKey as keyof typeof groupContributions.vn] || 0)}</span>
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
