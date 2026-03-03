'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Video, Activity } from 'lucide-react';

interface DashboardAnalyticsProps {
    dateRange: { start: Date; end: Date };
    activeTeam: string;
}

const DashboardAnalytics = ({ dateRange, activeTeam }: DashboardAnalyticsProps) => {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (dateRange.start) {
                    const start = dateRange.start;
                    params.append('startDate', `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`);
                }
                if (dateRange.end) {
                    const end = dateRange.end;
                    params.append('endDate', `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`);
                }
                if (activeTeam !== 'All') {
                    params.append('team', activeTeam);
                }

                const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/lark/dashboard-analytics?${params.toString()}`;
                const response = await fetch(url);
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch dashboard analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateRange, activeTeam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data || !data.chartData) return null;

    const { chartData, summary } = data;
    const diff = summary.totalVideos - summary.prevVideos;
    const pctChange = summary.prevVideos === 0 ? 100 : Math.round((diff / summary.prevVideos) * 100);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Overview */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-white to-slate-50 border-blue-100 shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu suất sản xuất</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-blue-100/50">
                                <Video className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-700">Số video sản xuất</h4>
                        </div>
                        <div className="flex items-baseline gap-3 mt-2">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                                {summary.totalVideos}
                            </span>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {diff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(pctChange)}%
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                            {diff >= 0 ? 'Tăng' : 'Giảm'} {Math.abs(diff)} video so với kỳ trước
                        </p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tổng Traffic</span>
                            </div>
                            <span className="text-sm font-black text-slate-900">{summary.totalTraffic.toLocaleString('vi-VN')}</span>
                        </div>

                        {/* List of Content Lines */}
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                            {chartData.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-white border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.name === 'A4' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-blue-500'}`} />
                                        <span className="font-bold text-slate-600 uppercase">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 font-medium">{item.videoCount} VD</span>
                                        <span className="font-black text-slate-800">{formatNumber(item.traffic)} View</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Bar Chart */}
            <Card className="lg:col-span-2 bg-white border-blue-50 shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden p-6 relative">
                <div className="absolute top-6 left-6 z-10">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Số lượng vd and Traffic</h3>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số lượng video</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Traffic</span>
                        </div>
                    </div>
                </div>

                <div className="w-full h-[350px] mt-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            barGap={8}
                        >
                            <defs>
                                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9} />
                                </linearGradient>
                                <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                                dy={10}
                                label={{ value: 'Tuyến ND', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                                dx={-5}
                                tickFormatter={(val) => formatNumber(val)}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                    padding: '12px',
                                    backgroundColor: '#ffffff'
                                }}
                                itemStyle={{
                                    fontSize: '12px',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    color: '#0f172a',
                                    padding: '2px 0'
                                }}
                                labelStyle={{
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    marginBottom: '8px',
                                    color: '#1e293b',
                                    borderBottom: '1px solid #f1f5f9',
                                    paddingBottom: '4px'
                                }}
                            />
                            <Bar
                                dataKey="videoCount"
                                name="Số video"
                                fill="url(#blueGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                            <Bar
                                dataKey="traffic"
                                name="Traffic"
                                fill="url(#roseGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default DashboardAnalytics;
