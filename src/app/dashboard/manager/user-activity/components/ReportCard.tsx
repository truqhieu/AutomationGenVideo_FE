"use client";

import Image from "next/image";
import React from "react";
import { Check, PieChart as PieIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface TrafficToday {
    fb: number;
    ig: number;
    tiktok: number;
    yt: number;
    thread: number;
    lemon8: number;
    zalo: number;
    twitter: number;
    total: number;
    details?: {
        id: string;
        value: string;
        channel: string;
        platform?: string;
        evidences?: { url: string; name: string; token: string }[];
    }[];
}

interface EmployeeReport {
    id: string;
    name: string;
    position?: string;
    team: string;
    avatar: string;
    status: string;
    submittedAt?: string;
    time?: string;
    checklist: {
        fb: boolean;
        ig: boolean;
        captionHashtag: boolean;
        tiktok: boolean;
        youtube: boolean;
        zalo: boolean;
        lark: boolean;
        reportLink: boolean;
    };
    videoCount: number;
    trafficToday?: TrafficToday | null;
    isMock?: boolean;
    questions: {
        question: string;
        answer: string;
    }[];
}

const getAvatarUrl = (url: string | null, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    if (url.includes("drive.google.com")) {
        const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
        }
    }
    // Strip auth params from Google user content URLs to avoid 403 Forbidden
    if (url.includes("googleusercontent.com")) {
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.delete("authuser");
            urlObj.searchParams.delete("sz");
            return urlObj.toString().replace(/=[sw]\d+(-[sw]\d+)*(?=[?#]|$)/, "=w200");
        } catch {
            return url;
        }
    }
    return url;
};

const formatTrafficNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString("vi-VN");
};

import { SiFacebook, SiInstagram, SiTiktok, SiYoutube, SiThreads, SiZalo, SiX } from "react-icons/si";

const PLATFORM_STYLES: Record<string, { label: string; color: string; bgColor: string; icon?: React.ElementType }> = {
    fb: { label: "Facebook", color: "#3b82f6", bgColor: "rgba(59,130,246,0.85)", icon: SiFacebook },
    ig: { label: "Instagram", color: "#ec4899", bgColor: "rgba(236,72,153,0.85)", icon: SiInstagram },
    tiktok: { label: "TikTok", color: "#1f2937", bgColor: "rgba(31,41,55,0.85)", icon: SiTiktok },
    yt: { label: "Youtube", color: "#ef4444", bgColor: "rgba(239,68,68,0.85)", icon: SiYoutube },
    thread: { label: "Thread", color: "#6b7280", bgColor: "rgba(107,114,128,0.85)", icon: SiThreads },
    zalo: { label: "Zalo", color: "#0ea5e9", bgColor: "rgba(14,165,233,0.85)", icon: SiZalo },
    lemon8: { label: "Lemon8", color: "#eab308", bgColor: "rgba(234,179,8,0.85)" },
    twitter: { label: "X", color: "#111827", bgColor: "rgba(17,24,39,0.85)", icon: SiX },
};

const HorizontalTraffic = ({ trafficToday }: { trafficToday: TrafficToday }) => {
    if (!trafficToday) return null;

    const platforms = [
        { key: "tiktok", label: "TIKTOK", icon: SiTiktok, color: "#1f2937" },
        { key: "fb", label: "FACEBOOK", icon: SiFacebook, color: "#3b82f6" },
        { key: "ig", label: "INSTAGRAM", icon: SiInstagram, color: "#ec4899" },
        { key: "zalo", label: "ZALO", icon: SiZalo, color: "#0ea5e9" },
        { key: "thread", label: "THREAD", icon: SiThreads, color: "#6b7280" },
    ];

    const totalTraffic = trafficToday.total || 0;

    return (
        <div className="border border-slate-100 rounded-[1.5rem] p-2.5 bg-slate-50/30">
            <p className="text-[15px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5" /> PHÂN PHỐI TRAFFIC THEO KÊNH
            </p>

            <div className="text-center mb-3">
                <span className="text-[16px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">
                    TỔNG TRAFFIC
                </span>
                <span className="text-[30px] font-black text-slate-800 tracking-tight">
                    {formatTrafficNumber(totalTraffic)}
                </span>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {platforms.map((p) => {
                    const val = (trafficToday[p.key as keyof TrafficToday] as number) || 0;
                    if (val === 0) return null;
                    return (
                        <div key={p.key} className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                                <span className="text-[13px] font-black text-slate-400 uppercase tracking-wider">
                                    {p.label}
                                </span>
                                <span className="text-xs">🔥</span>
                            </div>
                            <span className="text-[18px] font-black text-slate-800">
                                {formatTrafficNumber(val)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ReportCard = ({ report }: { report: EmployeeReport }) => {
    const avatarSrc = getAvatarUrl(report.avatar, report.name);

    const statusRaw = (report.status || "").toString().toUpperCase();
    const isCompleted = statusRaw === "ĐÃ BÁO CÁO ĐỦ" || statusRaw === "SUBMITTED" || statusRaw === "ĐÚNG HẠN";
    const isPartial = statusRaw === "CHƯA BÁO CÁO TRAFFIC" || statusRaw === "CHƯA BÁO CÁO MEMBER";
    const isUnreported = statusRaw === "CHƯA BÁO CÁO" || statusRaw === "" || statusRaw === "PENDING";
    const isLate = statusRaw.includes("TRỄ") || statusRaw.includes("LATE");
    const isOnTime = isCompleted && !isLate;
    const showTime = report.time && report.time !== "Chưa báo cáo";

    const hasTraffic =
        report.trafficToday &&
        Object.entries(PLATFORM_STYLES).some(
            ([key]) => ((report.trafficToday?.[key as keyof TrafficToday] as number) || 0) > 0,
        );

    const pos = (report.position || "").toLowerCase();
    const isLeaderReport = pos === "leader" || pos.includes("leader") || pos.includes("trưởng nhóm");

    return (
        <div
            className={`rounded-[2rem] p-3.5 shadow-2xl shadow-slate-200/50 h-full flex flex-col gap-2.5 border-2 transition-all duration-500 hover:scale-[1.01] ${report.isMock ? "bg-white border-blue-100" :
                isOnTime
                    ? "bg-slate-50/50 border-emerald-100"
                    : isLate
                        ? "bg-amber-50/30 border-amber-100"
                        : isUnreported
                            ? "bg-red-50/30 border-red-100"
                            : "bg-white border-slate-100"
                }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Image
                            src={avatarSrc}
                            alt={report.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(report.name)}&background=random`;
                            }}
                            width={56}
                            height={56}
                            unoptimized
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-800 text-[20px] uppercase tracking-tight">{report.name}</h3>
                            {report.position && (
                                <span
                                    className={`text-[13px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${report.position.toLowerCase().includes("lead")
                                        ? "bg-orange-100 text-orange-600"
                                        : "bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    {report.position}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">
                            Team: {report.team}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {report.isMock && (
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[15px] font-black text-white uppercase tracking-[0.15em]">DEMO MODE</span>
                        </div>
                    )}
                    <div
                        className={`px-5 py-2 rounded-xl text-[15px] font-black tracking-widest uppercase flex items-center gap-2 ${isOnTime
                            ? "bg-emerald-100 text-emerald-700"
                            : isLate
                                ? "bg-amber-100 text-amber-700"
                                : isUnreported
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-800"
                            }`}
                    >
                        <span>
                            {isOnTime
                                ? "ĐÚNG HẠN"
                                : isLate
                                    ? "TRỄ HẠN"
                                    : isUnreported
                                        ? "CHƯA BÁO CÁO"
                                        : report.status || "STATUS"}
                        </span>
                        {showTime && <span className="opacity-50 text-[13px]">• {report.time}</span>}
                    </div>
                </div>
            </div>

            {/* Content: Nếu chưa báo cáo thì CHỈ hiển thị card nhỏ gọn, không render data trống */}
            {isUnreported ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-300 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <span className="text-4xl mb-3">📋</span>
                    <span className="text-[15px] font-black uppercase tracking-[0.2em]">
                        Chưa báo cáo hôm nay
                    </span>
                </div>
            ) : (report.questions && report.questions.length > 0) || hasTraffic ? (
                <div className="space-y-3 flex-1">
                    {/* Traffic Horizontal */}
                    {hasTraffic && report.trafficToday && (
                        <HorizontalTraffic trafficToday={report.trafficToday} />
                    )}

                    {/* Checklist & Questions - Only show if report exists */}
                    {report.questions && report.questions.length > 0 && (
                        <>


                            {/* Video Count Section */}
                            {!isLeaderReport && (
                                <div className="bg-blue-600 rounded-xl p-2 flex items-center justify-between border border-blue-500 shadow-lg shadow-blue-500/10">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-white/20 p-1.5 rounded-lg">
                                            <SiYoutube className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-[12px] font-black text-blue-50 uppercase tracking-widest leading-tight">
                                            SỐ VIDEO EDIT SỬ DỤNG<br />&gt;50% SOURCE TỰ QUAY:
                                        </span>
                                    </div>
                                    <span className="text-3xl font-black text-white leading-none">
                                        {report.videoCount}
                                    </span>
                                </div>
                            )}

                            {/* Questions Section */}
                            <div className="space-y-2">
                                {report.questions.map((q, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-100 rounded-[2rem] p-3 bg-slate-50/50 hover:bg-white transition-colors duration-300"
                                    >
                                        <div className="flex gap-2">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-200 text-lg">
                                                {index + 1}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[15px] text-blue-600 uppercase font-black tracking-widest leading-relaxed">
                                                    {q.question}
                                                </p>
                                                <p className="text-[18px] text-slate-700 font-bold leading-relaxed">
                                                    {q.answer}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-300 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <span className="text-4xl mb-3">📋</span>
                    <span className="text-[15px] font-black uppercase tracking-[0.2em] opacity-60">
                        Chưa có dữ liệu
                    </span>
                </div>
            )}
        </div>
    );
};

export default ReportCard;
