'use client';

import Image from "next/image";
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
                <Card key={idx} className="relative bg-gradient-to-br from-white to-blue-50/30 border-slate-200/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 border-b-2 border-b-blue-500">
                    <CardContent className="p-3 relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{kpi.title}</h3>
                            <div className="bg-blue-600/5 p-1 rounded-lg">
                                <Target className="w-2.5 h-2.5 text-blue-600" />
                            </div>
                        </div>

                        {/* Row 1: Progress circle + main value */}
                        <div className="flex items-center justify-center gap-3 mb-3">
                            {kpi.groupKey !== 'channels' && (
                                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                                            strokeDasharray={125.6}
                                            strokeDashoffset={125.6 * (1 - kpi.percentage / 100)}
                                            strokeLinecap="round"
                                            className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                        />
                                    </svg>
                                    <span className="absolute text-[11px] font-black text-slate-900">{kpi.percentage}%</span>
                                </div>
                            )}
                            <div className="flex flex-col justify-center">
                                <div className="text-[20px] sm:text-[24px] lg:text-[28px] font-black text-slate-900 leading-none mb-1.5 tracking-tighter whitespace-nowrap drop-shadow-sm">
                                    {kpi.value}
                                </div>
                                <div className={`text-[10px] font-bold flex items-center gap-1 ${kpi.groupKey === 'channels' ? 'invisible' : 'text-blue-600/70'}`}>
                                    <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0"></span>
                                    MT: <span className="text-blue-700">{kpi.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Global / VN breakdown - always on its own row */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                            {/* Global */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1 leading-none mb-0.5 flex-wrap justify-center">
                                    <span className="text-base sm:text-lg font-black text-slate-800">
                                        {formatNumber(groupContributions?.global?.[kpi.groupKey as keyof typeof groupContributions.global] || 0)}
                                    </span>
                                    {kpi.groupKey !== 'channels' && (
                                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-500">
                                            {groupContributions?.global?.[kpi.pctKey as keyof typeof groupContributions.global] || 0}%
                                        </span>
                                    )}
                                </div>
                                <div className="text-[9px] font-black text-amber-600/70 uppercase flex items-center gap-0.5">
                                    <Globe className="w-2.5 h-2.5" />
                                    Global
                                </div>
                            </div>

                            {/* VN */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-baseline gap-1 leading-none mb-0.5 flex-wrap justify-center">
                                    {kpi.groupKey !== 'channels' && (
                                        <span className="text-[10px] sm:text-[11px] font-bold text-blue-600">
                                            {groupContributions?.vn?.[kpi.pctKey as keyof typeof groupContributions.vn] || 0}%
                                        </span>
                                    )}
                                    <span className="text-base sm:text-lg font-black text-slate-800">
                                        {formatNumber(groupContributions?.vn?.[kpi.groupKey as keyof typeof groupContributions.vn] || 0)}
                                    </span>
                                </div>
                                <div className="text-[9px] font-black text-blue-600/70 uppercase flex items-center gap-0.5">
                                    VN <Image src="/vn-flag.png" alt="VN" className="w-4 h-2.5 rounded-sm filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]" width={16} height={10} unoptimized />
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
