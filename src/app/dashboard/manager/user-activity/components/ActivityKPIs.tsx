'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface ActivityKPIsProps {
    summary?: {
        totalVideoTarget: number;
        totalVideoCompleted: number;
        totalTrafficTarget: number;
        totalTrafficCompleted: number;
        totalRevenueTarget: number;
        totalRevenueCompleted: number;
    };
    teamContributions?: {
        team: string;
        videoPct: number;
        trafficPct: number;
        revenuePct: number;
    }[];
}

const ActivityKPIs = ({ summary, teamContributions }: ActivityKPIsProps) => {
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
            key: 'videoPct'
        },
        {
            title: 'TỔNG TRAFFIC',
            value: formatNumber(summary?.totalTrafficCompleted || 0),
            total: formatNumber(summary?.totalTrafficTarget || 0),
            percentage: calculatePercentage(summary?.totalTrafficCompleted || 0, summary?.totalTrafficTarget || 0),
            key: 'trafficPct'
        },
        {
            title: 'TỔNG DOANH THU',
            value: formatNumber(summary?.totalRevenueCompleted || 0),
            total: formatNumber(summary?.totalRevenueTarget || 0),
            percentage: calculatePercentage(summary?.totalRevenueCompleted || 0, summary?.totalRevenueTarget || 0),
            key: 'revenuePct'
        }
    ];

    const hasAnyKpi = (summary?.totalVideoTarget || 0) + (summary?.totalVideoCompleted || 0) +
        (summary?.totalTrafficTarget || 0) + (summary?.totalTrafficCompleted || 0) +
        (summary?.totalRevenueTarget || 0) + (summary?.totalRevenueCompleted || 0) > 0;

    const getTeamColor = (idx: number) => {
        const colors = [
            'bg-blue-500',
            'bg-red-500',
            'bg-orange-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-cyan-500',
            'bg-emerald-500'
        ];
        return colors[idx % colors.length];
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="bg-gradient-to-br from-white to-blue-50/50 border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.1)] rounded-[2rem] overflow-hidden hover:scale-[1.01] transition-all duration-300 border-b-2 border-b-blue-500">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">{kpi.title}</h3>
                            <div className="bg-blue-600/10 p-2 rounded-xl">
                                <Target className="w-4 h-4 text-blue-600" />
                            </div>
                        </div>

                        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-8">
                            <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                                {/* Enhanced Circular Progress */}
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(59,130,246,0.1)]">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="38"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-slate-100"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="38"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={238.76}
                                        strokeDashoffset={238.76 * (1 - kpi.percentage / 100)}
                                        strokeLinecap="round"
                                        className={`transition-all duration-1000 ${kpi.percentage >= 100 ? "text-emerald-500" : "text-blue-600"}`}
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-xl font-black text-slate-900">
                                        {kpi.percentage}%
                                    </span>
                                </div>
                            </div>

                            <div className="text-center xl:text-right min-w-0 flex-1">
                                <div className="text-3xl 2xl:text-4xl font-black text-blue-600 leading-tight mb-3 tracking-tighter break-all">
                                    {kpi.value}
                                </div>
                                <div className="inline-block px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                                    <span className="text-[10px] font-bold text-blue-600 whitespace-nowrap uppercase">MT: {kpi.total}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            ))
            }
            {!hasAnyKpi && summary && (
                <p className="col-span-full text-center text-xs text-slate-500 mt-2">
                    Nếu toàn bộ số liệu là 0: kiểm tra đã đồng bộ KPI từ Lark chưa và tháng đang chọn có dữ liệu trong Lark.
                </p>
            )}
        </div>
    );
};

export default ActivityKPIs;
