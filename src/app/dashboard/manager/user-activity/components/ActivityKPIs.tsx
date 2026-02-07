'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ActivityKPIs = () => {
    const kpis = [
        {
            title: 'MỤC TIÊU VIDEO',
            value: '804',
            total: '4.350 Video',
            percentage: 18,
            color: 'red',
        },
        {
            title: 'TỔNG TRAFFIC',
            value: '20.261.543',
            total: '357.000.000',
            percentage: 6,
            color: 'red',
        },
        {
            title: 'TỔNG DOANH THU',
            value: '719.513.500',
            total: '11.978.250.000',
            percentage: 6,
            color: 'red',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <Card key={idx} className="bg-white border-gray-100 shadow-sm rounded-2xl overflow-hidden">
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
                                        className="text-red-500"
                                    />
                                </svg>
                                <span className="absolute text-sm font-bold text-red-600">{kpi.percentage}%</span>
                            </div>

                            <div className="text-right">
                                <div className="text-3xl font-extrabold text-gray-900 leading-none mb-2">{kpi.value}</div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Mục tiêu: {kpi.total}</div>
                            </div>
                        </div>

                        {/* Horizontal Progress Bar */}
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${kpi.percentage}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default ActivityKPIs;
