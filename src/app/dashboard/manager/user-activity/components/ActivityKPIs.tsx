'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
        return Math.min(100, Math.round((current / target) * 100));
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
                <Card key={idx} className="bg-white border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{kpi.title}</h3>

                        <div className="flex items-end justify-between mb-4">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                {/* Simple SVG Circular Progress */}
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        className="text-gray-100"
                                    />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeDasharray={175.92}
                                        strokeDashoffset={175.92 * (1 - kpi.percentage / 100)}
                                        className={kpi.percentage >= 100 ? "text-green-500" : "text-red-500"}
                                    />
                                </svg>
                                <span className={`absolute text-sm font-bold ${kpi.percentage >= 100 ? "text-green-600" : "text-red-600"}`}>
                                    {kpi.percentage}%
                                </span>
                            </div>

                            <div className="text-right">
                                <div className="text-3xl font-extrabold text-gray-900 leading-none mb-2">{kpi.value}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Mục tiêu: {kpi.total}</div>
                            </div>
                        </div>

                        {/* Horizontal Progress Bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                            <div
                                className={`h-full rounded-full ${kpi.percentage >= 100 ? "bg-green-500" : "bg-red-500"}`}
                                style={{ width: `${kpi.percentage}%` }}
                            />
                        </div>

                        {/* Team Contributions Section */}
                        <div className="pt-4 border-t border-gray-50 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Đóng góp theo Team (Tháng)</span>
                            </div>

                            {/* Stacked Percentage Bar */}
                            <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-gray-50">
                                {teamContributions?.map((team, tIdx) => {
                                    const pct = team[kpi.key as keyof typeof team] as number;
                                    if (!pct) return null;
                                    return (
                                        <div
                                            key={tIdx}
                                            className={`h-full border-r border-white/20 transition-all duration-700 ${getTeamColor(tIdx)}`}
                                            style={{ width: `${pct}%` }}
                                            title={`${team.team}: ${pct}%`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend Grid */}
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                {teamContributions?.filter(team => (team[kpi.key as keyof typeof team] as number) > 0).slice(0, 6).map((team, tIdx) => {
                                    const pct = team[kpi.key as keyof typeof team] as number;
                                    return (
                                        <div key={tIdx} className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTeamColor(tIdx)}`} />
                                            <div className="flex items-baseline gap-1 truncate">
                                                <span className="text-[9px] font-bold text-gray-500 truncate">{team.team}</span>
                                                <span className="text-[9px] font-black text-[#1e293b]">{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
            }
        </div >
    );
};

export default ActivityKPIs;
