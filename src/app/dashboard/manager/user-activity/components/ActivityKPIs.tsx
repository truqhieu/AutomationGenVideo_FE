'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Globe, Flag } from 'lucide-react';

interface ActivityKPIsProps {
    summary?: {
        totalVideoTarget: number;
        totalVideoCompleted: number;
        totalTrafficTarget: number;
        totalTrafficCompleted: number;
        totalRevenueTarget: number;
        totalRevenueCompleted: number;
    };
    teamContributions?: any[];
    groupContributions?: {
        global: { videos: number, traffic: number, revenue: number, videoPct: number, trafficPct: number, revenuePct: number };
        vn: { videos: number, traffic: number, revenue: number, videoPct: number, trafficPct: number, revenuePct: number };
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
        }
    ];

    const hasAnyKpi = (summary?.totalVideoTarget || 0) + (summary?.totalVideoCompleted || 0) +
        (summary?.totalTrafficTarget || 0) + (summary?.totalTrafficCompleted || 0) +
        (summary?.totalRevenueTarget || 0) + (summary?.totalRevenueCompleted || 0) > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="bg-gradient-to-br from-white to-blue-50/30 border-slate-200/60 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 border-b-2 border-b-blue-500">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{kpi.title}</h3>
                            <div className="bg-blue-600/5 p-1.5 rounded-lg">
                                <Target className="w-3 h-3 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="28"
                                        cy="28"
                                        r="24"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        fill="transparent"
                                        className="text-slate-50"
                                    />
                                    <circle
                                        cx="28"
                                        cy="28"
                                        r="24"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        fill="transparent"
                                        strokeDasharray={150.8}
                                        strokeDashoffset={150.8 * (1 - kpi.percentage / 100)}
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-black text-slate-900">
                                    {kpi.percentage}%
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-2xl font-black text-blue-600 leading-none mb-1 tracking-tighter truncate">
                                    {kpi.value}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">
                                    MT: <span className="text-blue-500">{kpi.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Global vs VN */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                                <div className="text-[8px] font-black text-amber-600 uppercase flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5 text-amber-500" />
                                    Global
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-black text-slate-800">{formatNumber(groupContributions?.global?.[kpi.groupKey as keyof typeof groupContributions.global] || 0)}</span>
                                    <span className="text-[8px] font-bold text-amber-500 italic">({groupContributions?.global?.[kpi.pctKey as keyof typeof groupContributions.global] || 0}%)</span>
                                </div>
                            </div>

                            <div className="w-px h-6 bg-slate-100"></div>

                            <div className="flex flex-col text-right">
                                <div className="text-[8px] font-black text-blue-600 uppercase flex items-center justify-end gap-1">
                                    Việt Nam
                                    <Flag className="w-2.5 h-2.5 text-blue-500" />
                                </div>
                                <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-[8px] font-bold text-blue-500 italic">({groupContributions?.vn?.[kpi.pctKey as keyof typeof groupContributions.vn] || 0}%)</span>
                                    <span className="text-xs font-black text-slate-800">{formatNumber(groupContributions?.vn?.[kpi.groupKey as keyof typeof groupContributions.vn] || 0)}</span>
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
