'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Area,
    AreaChart,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Video, DollarSign, Activity, Users, PieChart as PieIcon } from 'lucide-react';

interface PersonalChartsProps {
    history: any[];
    teamStats: {
        teamName: string;
        userVideo: number;
        teamVideo: number;
        userTraffic: number;
        teamTraffic: number;
        userRevenue: number;
        teamRevenue: number;
    } | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-xl shadow-blue-900/10">
                <p className="text-xs font-black text-slate-800 mb-2 uppercase tracking-widest">{label}</p>
                {payload.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{item.name}:</span>
                        <span className="text-sm font-black text-slate-900">
                            {typeof item.value === 'number' ?
                                (item.value >= 1000000 ? `${(item.value / 1000000).toFixed(1)}M` :
                                    item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}K` :
                                        item.value)
                                : item.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const ContributionCard = ({ title, userValue, teamTotal, icon: Icon, color, unit = "" }: any) => {
    const percentage = teamTotal > 0 ? Math.round((userValue / teamTotal) * 100) : 0;
    const data = [
        { name: 'Bản thân', value: userValue, color: color },
        { name: 'Thành viên khác', value: Math.max(0, teamTotal - userValue), color: '#f1f5f9' }
    ];

    return (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 self-start">
                <div className={`p-2 rounded-xl bg-opacity-10`} style={{ backgroundColor: color + '20', color: color }}>
                    <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
            </div>

            <div className="relative w-32 h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={35}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800">{percentage}%</span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-xs font-bold text-slate-800">
                    {userValue.toLocaleString()}{unit}
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-slate-400">{teamTotal.toLocaleString()}{unit}</span>
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Đóng góp cho team</p>
            </div>
        </div>
    );
};

const PersonalCharts = ({ history, teamStats }: PersonalChartsProps) => {
    if ((!history || history.length === 0) && !teamStats) return null;

    return (
        <div className="space-y-12">
            {/* Team Contribution Section */}
            {teamStats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-slate-900 p-2.5 rounded-xl">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Đóng góp cho Team</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thống kê phần trăm so với toàn đội {teamStats.teamName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ContributionCard
                            title="Video"
                            userValue={teamStats.userVideo}
                            teamTotal={teamStats.teamVideo}
                            icon={Video}
                            color="#3b82f6"
                        />
                        <ContributionCard
                            title="Traffic"
                            userValue={teamStats.userTraffic}
                            teamTotal={teamStats.teamTraffic}
                            icon={Activity}
                            color="#6366f1"
                        />
                        <ContributionCard
                            title="Doanh thu"
                            userValue={teamStats.userRevenue}
                            teamTotal={teamStats.teamRevenue}
                            icon={TrendingUp}
                            color="#10b981"
                            unit="đ"
                        />
                    </div>
                </motion.div>
            )}

            {/* Historical Trends Section */}
            {history && history.length > 0 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-blue-600 p-2.5 rounded-xl">
                            <PieIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Xu hướng tăng trưởng</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lịch sử hiệu suất cá nhân qua các tháng</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Video Performance Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="bg-blue-50 p-2.5 rounded-xl">
                                    <Video className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tiến độ Video</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoàn thành vs Mục tiêu</p>
                                </div>
                            </div>

                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={history}>
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{
                                                paddingBottom: 20,
                                                fontSize: 10,
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em'
                                            }}
                                        />
                                        <Bar dataKey="video" name="Thực tế" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
                                        <Bar dataKey="videoTarget" name="Mục tiêu" radius={[6, 6, 0, 0]} fill="#e2e8f0" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Traffic Trend Line Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
                        >
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="bg-indigo-50 p-2.5 rounded-xl">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Xu hướng Traffic</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phát triển lượt xem</p>
                                </div>
                            </div>

                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                            tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{
                                                paddingBottom: 20,
                                                fontSize: 10,
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="traffic"
                                            name="Traffic"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fill="url(#areaGradient)"
                                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Revenue Trend Line Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50"
                    >
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="bg-emerald-50 p-2.5 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Hiệu quả Doanh thu</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tăng trưởng doanh thu hàng tháng</p>
                            </div>
                        </div>

                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{
                                            paddingBottom: 20,
                                            fontSize: 10,
                                            fontWeight: 900,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.1em'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="Doanh thu"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenueTarget"
                                        name="Mục tiêu"
                                        stroke="#94a3b8"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PersonalCharts;
