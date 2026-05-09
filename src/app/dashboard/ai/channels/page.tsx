"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    Users, Eye, Heart, MessageSquare, TrendingUp, TrendingDown,
    RefreshCw, Youtube, Instagram, Facebook, Globe, Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

// ── TikTok icon (lucide không có)
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/>
    </svg>
);

const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    all:       { label: "Tất cả",   color: "#8b5cf6", icon: <Globe size={16} />,     bg: "bg-violet-500/20" },
    facebook:  { label: "Facebook", color: "#1877f2", icon: <Facebook size={16} />,  bg: "bg-blue-500/20" },
    instagram: { label: "Instagram",color: "#e1306c", icon: <Instagram size={16} />, bg: "bg-pink-500/20" },
    tiktok:    { label: "TikTok",   color: "#010101", icon: <TikTokIcon />,           bg: "bg-gray-700/50" },
    youtube:   { label: "YouTube",  color: "#ff0000", icon: <Youtube size={16} />,   bg: "bg-red-500/20" },
};

const COLORS = ["#1877f2", "#e1306c", "#010101", "#ff0000", "#8b5cf6"];

interface ChannelRow {
    display_name: string;
    platform: string;
    team: string;
    owner_name: string;
    username: string;
}

interface KPI { label: string; value: string; sub: string; icon: React.ReactNode; trend?: string; up?: boolean }

function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
}

function KpiCard({ kpi }: { kpi: KPI }) {
    return (
        <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{kpi.label}</span>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">{kpi.icon}</div>
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{kpi.sub}</div>
            </div>
            {kpi.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                    {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {kpi.trend}
                </div>
            )}
        </div>
    );
}

export default function ChannelAnalyticsPage() {
    const [platform, setPlatform] = useState("all");
    const [channels, setChannels] = useState<ChannelRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.post("/ai/chat", {
                message: `Lấy danh sách tất cả kênh${platform !== "all" ? ` platform ${platform}` : ""} với thông tin owner và team`,
                history: [],
            });
            // Parse từ dashboard table block nếu có, hoặc gọi trực tiếp
            const { data: raw } = await apiClient.get(`/ai/channels?platform=${platform === "all" ? "" : platform}`);
            setChannels(raw || []);
        } catch {
            // Fallback: gọi BE proxy → AI tool trực tiếp
            try {
                const { data } = await apiClient.post("/ai/chat", {
                    message: platform === "all"
                        ? "get_channels_with_owners limit 200"
                        : `get_channels_with_owners platform ${platform} limit 200`,
                    history: [],
                });
                if (data?.dashboard?.blocks) {
                    const tableBlock = data.dashboard.blocks.find((b: any) => b.type === "table");
                    if (tableBlock) setChannels(tableBlock.data || []);
                }
            } catch { /* ignore */ }
        }
        setLoading(false);
    }, [platform]);

    useEffect(() => { load(); }, [load]);

    // Tính KPIs từ channels
    const filtered = channels.filter(c => {
        const p = (c.platform || "").toLowerCase();
        const matchPlatform = platform === "all" || p.includes(platform);
        const matchSearch = !search || c.display_name?.toLowerCase().includes(search.toLowerCase()) || c.owner_name?.toLowerCase().includes(search.toLowerCase());
        return matchPlatform && matchSearch;
    });

    // Thống kê theo platform
    const platformStats = Object.entries(
        channels.reduce((acc: Record<string, number>, ch) => {
            const p = (ch.platform || "Other").split(" ")[0];
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    // Thống kê theo team
    const teamStats = Object.entries(
        filtered.reduce((acc: Record<string, number>, ch) => {
            const t = ch.team || "Chưa phân team";
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {})
    ).map(([team, count]) => ({ team, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    const kpis: KPI[] = [
        { label: "Tổng kênh", value: fmt(filtered.length), sub: "đang hoạt động", icon: <Globe size={16} />, trend: "Từ bảng huyk_channels", up: true },
        { label: "Facebook", value: fmt(channels.filter(c => (c.platform || "").toLowerCase().includes("facebook")).length), sub: "kênh", icon: <Facebook size={16} /> },
        { label: "TikTok", value: fmt(channels.filter(c => (c.platform || "").toLowerCase().includes("tiktok")).length), sub: "kênh", icon: <TikTokIcon /> },
        { label: "YouTube", value: fmt(channels.filter(c => (c.platform || "").toLowerCase().includes("youtube")).length), sub: "kênh", icon: <Youtube size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-[#0f0d1a] text-white p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Kênh Viễn Chí Bảo</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Thống kê toàn bộ kênh MXH theo nền tảng & team</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
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
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/8"
                        }`}>
                        {cfg.icon}{cfg.label}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                {/* Bar: kênh theo platform */}
                <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Số kênh theo nền tảng</h3>
                    {loading ? <div className="h-44 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-violet-400" /></div> : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={platformStats} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#1a1625", border: "1px solid #ffffff20", borderRadius: 8 }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {platformStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie: phân bổ platform */}
                <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Phân bổ kênh theo nền tảng</h3>
                    {loading ? <div className="h-44 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-violet-400" /></div> : (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={platformStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}>
                                    {platformStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#1a1625", border: "1px solid #ffffff20", borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Bar: kênh theo team */}
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Số kênh theo team</h3>
                {loading ? <div className="h-44 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-violet-400" /></div> : (
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={teamStats} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="team" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#1a1625", border: "1px solid #ffffff20", borderRadius: 8 }} />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Table: danh sách kênh */}
            <div className="bg-[#1a1625] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-300">Danh sách kênh ({filtered.length})</h3>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm kênh..."
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 w-48" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">Không có dữ liệu</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    {["Tên kênh", "Nền tảng", "Owner", "Team"].map(h => (
                                        <th key={h} className="text-left py-2 px-3 text-gray-400 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 50).map((ch, i) => {
                                    const p = (ch.platform || "").toLowerCase();
                                    const cfg = Object.entries(PLATFORM_CONFIG).find(([k]) => p.includes(k))?.[1] ?? PLATFORM_CONFIG.all;
                                    return (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-2.5 px-3 text-white font-medium">{ch.display_name}</td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} text-white`}>
                                                    {cfg.icon}{ch.platform}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-300">{ch.owner_name || "—"}</td>
                                            <td className="py-2.5 px-3">
                                                <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">{ch.team || "—"}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length > 50 && (
                            <p className="text-center text-xs text-gray-600 mt-3">Hiển thị 50/{filtered.length} kênh</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
