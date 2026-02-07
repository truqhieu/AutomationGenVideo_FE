'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertCircle, FileText, Target, CheckCircle2 } from 'lucide-react';

interface UserActivity {
    name: string;
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

const UserActivityCard = ({ data }: { data: UserActivity }) => {
    const isPending = data.reportStatus === 'CHƯA BÁO CÁO';

    return (
        <Card className={`relative rounded-[2rem] overflow-hidden border-2 transition-all hover:shadow-xl ${isPending ? 'border-red-500 bg-white' : 'border-gray-100 bg-white'
            }`}>
            <CardContent className="p-5 flex flex-col items-center">
                {/* Warning Icon */}
                <div className="absolute top-4 right-4">
                    <AlertCircle className={`w-5 h-5 ${isPending ? 'text-red-500' : 'text-gray-300'}`} />
                </div>

                {/* Profile Info */}
                <div className="w-16 h-16 rounded-full border-2 border-red-500 p-0.5 mb-2 overflow-hidden bg-gray-100">
                    <img src={data.avatar} alt={data.name} className="w-full h-full object-cover rounded-full" />
                </div>

                <h4 className="text-sm font-bold text-gray-900 tracking-tight">{data.name}</h4>
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase mb-4 tracking-wider">
                    {data.team}
                </span>

                {/* Metrics List */}
                <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">TGBC</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-900">{data.time}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">MỤC TIÊU NGÀY</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{data.dailyGoal}</span>
                    </div>

                    <div className="flex items-center justify-between text-gray-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">ĐÃ XONG</span>
                        </div>
                        <span className="text-xs font-bold text-red-600">{data.done}</span>
                    </div>
                </div>

                {/* Report Status Button */}
                <button className={`w-auto px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-6 border shadow-sm ${isPending
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-blue-500 border-blue-500'
                    }`}>
                    {data.reportStatus}
                </button>

                {/* Monthly Progress */}
                <div className="w-full space-y-1 mb-4">
                    <div className="flex justify-between items-center text-[9px] font-bold tracking-tight">
                        <span className="text-red-500 uppercase">TIẾN ĐỘ THÁNG</span>
                        <span className="text-blue-500">{data.monthlyProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${data.monthlyProgress}%` }}
                        />
                    </div>
                </div>

                {/* Traffic & Revenue Footer */}
                <div className="grid grid-cols-2 w-full border-t border-gray-100 pt-3 gap-2">
                    <div className="text-center space-y-1">
                        <span className="text-[8px] font-bold text-blue-500 uppercase">TRAFFIC</span>
                        <div className="bg-[#f0f9ff] text-[#2563eb] text-[10px] font-extrabold py-1.5 rounded-md px-1 truncate">
                            {data.traffic}
                        </div>
                    </div>
                    <div className="text-center space-y-1 border-l border-gray-100 pl-2">
                        <span className="text-[8px] font-bold text-green-500 uppercase">DOANH THU</span>
                        <div className="bg-[#f0fdf4] text-[#16a34a] text-[10px] font-extrabold py-1.5 rounded-md px-1 truncate">
                            {data.revenue}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserActivityCard;
export type { UserActivity };
