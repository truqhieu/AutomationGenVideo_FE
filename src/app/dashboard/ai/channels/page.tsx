"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    RefreshCw, Youtube, Instagram, Facebook, Globe, Loader2,
    Eye, Heart, MessageSquare, Share2, Video, TrendingUp,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/>
    </svg>
);

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    all:       { label: "Tất cả",    color: "#8b5cf6", icon: <Globe size={16}/>,     bg: "bg-violet-500/20" },
    facebook:  { label: "Facebook",  color: "#1877f2", icon: <Facebook size={16}/>,  bg: "bg-blue-500/20" },
    instagram: { label: "Instagram", color: "#e1306c", icon: <Instagram size={16}/>, bg: "bg-pink-500/20" },
    tiktok:    { label: "TikTok",    color: "#010101", icon: <TikTokIcon/>,           bg: "bg-gray-700/50" },
    youtube:   { label: "YouTube",   color: "#ff0000", icon: <Youtube size={16}/>,   bg: "bg-red-500/20" },
};

const COLORS = ["#1877f2","#e1306c","#010101","#ff0000","#8b5cf6","#06b6d4"];

function fmt(n: any): string {
    const v = Number(n) || 0;
    if (v >= 1_000_000) return (v/1_000_000).toFixed(1)+"M";
    if (v >= 1_000)     return (v/1_000).toFixed(1)+"K";
    return String(v);
}

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color+"22", color }}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}

export default function ChannelAnalyticsPage() {
    const [platform, setPlatform] = useState("all");
    const [channels, setChannels] = useState<any[]>([]);
    const [stats, setStats]       = useState<any>(null);
    const [loading, setLoading]   = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [search, setSearch]     = useState("");

    const today = new Date();
    const [year]  = useState(today.getFullYear());
    const [month] = useState(today.getMonth() + 1);

    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/ai/channels?platform=${platform === "all" ? "" : platform}&limit=200`);
            setChannels(Array.isArray(data) ? data : []);
        } catch { setChannels([]); }
        finally { setLoading(false); }
    }, [platform]);

    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const { data } = await apiClient.get(`/ai/social-stats?year=${year}&month=${month}&platform=${platform === "all" ? "" : platform}`);
            setStats(data);
        } catch { setStats(null); }
        finally { setStatsLoading(false); }
    }, [platform, year, month]);

    useEffect(() => { loadChannels(); loadStats(); }, [loadChannels, loadStats]);

    const filtered = channels.filter(c => {
        const p = (c.platform || "").toLowerCase();
        const matchP = platform === "all" || p.includes(platform);
        const matchS = !search || c.display_name?.toLowerCase().includes(search.toLowerCase())
                                || c.owner_name?.toLowerCase().includes(search.toLowerCase());
        return matchP && matchS;
    });

    const platformStats = Object.entries(
        channels.reduce((acc: Record<string,number>, ch) => {
            const p = (ch.platform||"Other").split(" ")[0];
            acc[p] = (acc[p]||0)+1; return acc;
        }, {})
    ).map(([name,value]) => ({name, value})).sort((a,b) => b.value-a.value);

    const summary = stats?.summary || {};
    const byTeam  = (stats?.by_team || []).map((t: any) => ({ team: t.team, views: Number(t.views)||0 }));
    const hasStats = Number(summary.total_videos) > 0;

    return (
        <div className="min-h-screen bg-[#0f0d1a] text-white p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Kênh Viễn Chí Bảo</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Thống kê tháng {month}/{year} từ dữ liệu crawl</p>
                </div>
                <button onClick={() => { loadChannels(); loadStats(); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm transition-colors">
                    <RefreshCw size={14} className={(loading||statsLoading) ? "animate-spin" : ""}/>
                    Làm mới
                </button>
            </div>

            {/* Platform tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setPlatform(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            platform === key
                                ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                        }`}>
                        {cfg.icon}{cfg.label}
                    </button>
                ))}
            </div>

            {/* ── Traffic Stats từ social_video_report ── */}
            {statsLoading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                    <Loader2 size={14} className="animate-spin"/> Đang tải thống kê traffic...
                </div>
            ) : hasStats ? (
                <>
                    <p className="text-xs text-gray-500 mb-3">Dữ liệu traffic tháng {month}/{year} từ bảng <span className="text-violet-400">social_video_report</span></p>

                    {/* KPI traffic */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        <KpiCard icon={<Eye size={16}/>}          label="Tổng Views"    value={fmt(summary.total_views)}    color="#8b5cf6"/>
                        <KpiCard icon={<Heart size={16}/>}        label="Tổng Likes"    value={fmt(summary.total_likes)}    color="#e1306c"/>
                        <KpiCard icon={<MessageSquare size={16}/>}label="Tổng Comments" value={fmt(summary.total_comments)} color="#06b6d4"/>
                        <KpiCard icon={<Share2 size={16}/>}       label="Tổng Shares"   value={fmt(summary.total_shares)}   color="#10b981"/>
                        <KpiCard icon={<Video size={16}/>}        label="Tổng Videos"   value={fmt(summary.total_videos)}   color="#f59e0b"/>
                        <KpiCard icon={<TrendingUp size={16}/>}   label="Kênh có data" value={fmt(summary.channels)}       color="#8b5cf6"/>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Views theo platform */}
                        <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Views theo nền tảng</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={(stats?.by_platform||[]).map((p:any) => ({
                                    name: p.platform, views: Number(p.views)||0
                                }))} margin={{top:4,right:8,left:-20,bottom:0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
                                    <XAxis dataKey="name" tick={{fill:"#9ca3af",fontSize:11}}/>
                                    <YAxis tick={{fill:"#9ca3af",fontSize:11}}/>
                                    <Tooltip contentStyle={{background:"#1a1625",border:"1px solid #ffffff20",borderRadius:8}}
                                        formatter={(v:any) => fmt(v)}/>
                                    <Bar dataKey="views" radius={[6,6,0,0]}>
                                        {(stats?.by_platform||[]).map((_:any,i:number) =>
                                            <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Views theo team */}
                        <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Views theo team (top 8)</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={byTeam.slice(0,8)} margin={{top:4,right:8,left:-20,bottom:0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
                                    <XAxis dataKey="team" tick={{fill:"#9ca3af",fontSize:9}}/>
                                    <YAxis tick={{fill:"#9ca3af",fontSize:11}}/>
                                    <Tooltip contentStyle={{background:"#1a1625",border:"1px solid #ffffff20",borderRadius:8}}
                                        formatter={(v:any) => fmt(v)}/>
                                    <Bar dataKey="views" fill="#8b5cf6" radius={[6,6,0,0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top 10 videos */}
                    {(stats?.top_views||[]).length > 0 && (
                        <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5 mb-6">
                            <h3 className="text-sm font-semibold text-gray-300 mb-4">Top 10 video Views cao nhất — tháng {month}/{year}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            {["#","Tên video","Kênh","Team","Views","Likes","Cmt","Ngày"].map(h =>
                                                <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium text-xs">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(stats?.top_views||[]).map((v:any, i:number) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-2 px-3 text-gray-500">{i+1}</td>
                                                <td className="py-2 px-3 text-gray-200 max-w-[200px] truncate">
                                                    {v.video_url ? <a href={v.video_url} target="_blank" className="hover:text-violet-400 transition-colors">{v.title||"(no title)"}</a> : v.title||"(no title)"}
                                                </td>
                                                <td className="py-2 px-3 text-gray-300 whitespace-nowrap">{v.channel_name}</td>
                                                <td className="py-2 px-3"><span className="text-xs bg-white/5 px-2 py-0.5 rounded">{v.team||"—"}</span></td>
                                                <td className="py-2 px-3 text-violet-400 font-medium">{fmt(v.views)}</td>
                                                <td className="py-2 px-3 text-pink-400">{fmt(v.likes)}</td>
                                                <td className="py-2 px-3 text-cyan-400">{fmt(v.comments)}</td>
                                                <td className="py-2 px-3 text-gray-500 text-xs whitespace-nowrap">{(v.published_at||"").slice(0,10)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-6 mb-6 text-center text-gray-500 text-sm">
                    Chưa có dữ liệu traffic tháng {month}/{year} trong <span className="text-violet-400">social_video_report</span>.
                    <br/>Chạy script crawl để có dữ liệu.
                </div>
            )}

            {/* ── Danh sách kênh từ huyk_channels ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Tổng kênh", value: fmt(filtered.length), color: "#8b5cf6" },
                    { label: "Facebook",  value: fmt(channels.filter(c=>(c.platform||"").toLowerCase().includes("facebook")).length), color: "#1877f2" },
                    { label: "TikTok",    value: fmt(channels.filter(c=>(c.platform||"").toLowerCase().includes("tiktok")).length), color: "#010101" },
                    { label: "YouTube",   value: fmt(channels.filter(c=>(c.platform||"").toLowerCase().includes("youtube")).length), color: "#ff0000" },
                ].map((k,i) => (
                    <div key={i} className="bg-[#1a1625] border border-white/10 rounded-2xl p-4">
                        <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                        <p className="text-2xl font-bold text-white">{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts kênh */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Số kênh theo nền tảng</h3>
                    {loading ? <div className="h-44 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-violet-400"/></div> : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={platformStats} margin={{top:4,right:8,left:-20,bottom:0}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10"/>
                                <XAxis dataKey="name" tick={{fill:"#9ca3af",fontSize:11}}/>
                                <YAxis tick={{fill:"#9ca3af",fontSize:11}}/>
                                <Tooltip contentStyle={{background:"#1a1625",border:"1px solid #ffffff20",borderRadius:8}}/>
                                <Bar dataKey="value" radius={[6,6,0,0]}>
                                    {platformStats.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Phân bổ kênh</h3>
                    {loading ? <div className="h-44 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-violet-400"/></div> : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={platformStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                                    {platformStats.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                                </Pie>
                                <Tooltip contentStyle={{background:"#1a1625",border:"1px solid #ffffff20",borderRadius:8}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Danh sách kênh */}
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">Danh sách kênh ({filtered.length})</h3>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm kênh..."
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 w-48"/>
                </div>
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-violet-400"/></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Tên kênh","Nền tảng","Owner","Team"].map(h =>
                                        <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0,50).map((ch,i) => {
                                    const p = (ch.platform||"").toLowerCase();
                                    const cfg = Object.entries(PLATFORM_CONFIG).find(([k]) => p.includes(k))?.[1] ?? PLATFORM_CONFIG.all;
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-2.5 px-3 text-white font-medium">{(ch.display_name||"").trim() || "—"}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} text-white`}>
                                                    {cfg.icon}{ch.platform}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-300">{ch.owner_name||"—"}</td>
                                            <td className="py-2.5 px-3">
                                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">{ch.team||"—"}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length > 50 && <p className="text-center text-xs text-gray-600 mt-3">Hiển thị 50/{filtered.length} kênh</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
