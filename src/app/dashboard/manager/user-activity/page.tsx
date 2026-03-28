"use client";

import React, { Suspense, useEffect, useState, useCallback, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import ActivityKPIs from './components/ActivityKPIs';
import DashboardAnalytics from './components/DashboardAnalytics';
import ActivityFilters from './components/ActivityFilters';
import UserActivityCard, { UserActivity } from './components/UserActivityCard';
import ReportCard from './components/ReportCard';
import RankingView from './components/RankingView';
import MenberReportWorkspace from './components/MenberReportWorkspace';
import ManagerChecklistWorkspace from './components/ManagerChecklistWorkspace';
import PersonalCharts from './components/PersonalCharts';
import {
    RefreshCw,
    User,
    FileText,
    ClipboardList,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    Check,
    Clock,
    AlertCircle,
    CheckCircle2,
    LayoutDashboard,
    Layout,
    CheckSquare,
    Calendar,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSearchParams } from "next/navigation";
import { UserRole } from "@/types/auth";
import { useActivityData } from "./hooks/useActivityData";
import { useActivityFilters, CARDS_PER_BATCH, CHECKLIST_PAGE_SIZE } from "./hooks/useActivityFilters";
import ChecklistContainer from '@/components/checklist/ChecklistContainer';

const normalize = (str: any) => (str || "").toString().toLowerCase().trim().replace(/\s+/g, "");

const TAB_MAP: Record<string, ActiveTab> = {
    activity_performance: "performance",
    performance: "performance",
    activity_dashboard: "dashboard",
    dashboard: "dashboard",
    activity_ranking: "ranking",
    ranking: "ranking",
    activity_personal: "personal",
    personal: "personal",
    activity_checklist: "daily_checklist",
    daily_checklist: "daily_checklist",
    activity_report: "daily_report",
    daily_report: "daily_report",
    activity_outstanding: "daily_outstanding",
    daily_outstanding: "daily_outstanding",
};

const ACTIVE_TAB_IDS: ActiveTab[] = [
    "dashboard",
    "performance",
    "ranking",
    "personal",
    "daily_checklist",
    "daily_report",
    "daily_outstanding",
];

function activeTabFromSearchParam(tab: string | null): ActiveTab | null {
    if (!tab) return null;
    const key = tab.trim();
    if (TAB_MAP[key]) return TAB_MAP[key];
    if (ACTIVE_TAB_IDS.includes(key as ActiveTab)) return key as ActiveTab;
    return null;
}

type ActiveTab =
    | "dashboard"
    | "performance"
    | "ranking"
    | "personal"
    | "daily_checklist"
    | "daily_report"
    | "daily_outstanding";

const CardSkeleton = () => (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-white animate-pulse">
        <div className="p-4 flex flex-col items-center">
            <div className="mt-2 mb-3">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
            </div>
            <div className="text-center mb-4 w-full flex flex-col items-center">
                <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                <div className="flex gap-1.5">
                    <div className="h-4 w-14 bg-slate-100 rounded" />
                    <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
            </div>
            <div className="w-full space-y-1.5 mb-4 px-1">
                <div className="h-9 bg-slate-100 rounded-2xl" />
                <div className="h-9 bg-slate-100 rounded-2xl" />
                <div className="h-9 bg-slate-100 rounded-2xl" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded-2xl mb-4" />
            <div className="w-full space-y-1.5 mb-4 px-1">
                <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-3 w-8 bg-slate-100 rounded" />
                </div>
                <div className="h-2 bg-slate-100 rounded-full" />
            </div>
            <div className="grid grid-cols-2 w-full gap-2 px-1">
                <div className="h-14 bg-slate-100 rounded-2xl" />
                <div className="h-14 bg-slate-100 rounded-2xl" />
            </div>
        </div>
    </div>
);

const UserActivityPageContent = () => {
    const { user, token } = useAuthStore();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const reportParam = searchParams.get("report");

    const [activeTab, setActiveTab] = React.useState<ActiveTab>(
        () => activeTabFromSearchParam(tabParam) ?? "performance",
    );
    const [reportType, setReportType] = React.useState<"select" | "daily" | "monthly">(() => {
        const r = reportParam?.trim().toLowerCase();
        if (r === "daily") return "daily";
        if (r === "monthly") return "monthly";
        return "select";
    });
    const [dailySubtype, setDailySubtype] = React.useState<"select" | "traffic" | "work">("work");
    const [reportMode, setReportMode] = React.useState<"select" | "member" | "leader">("select");
    const [allowedMenuIds, setAllowedMenuIds] = React.useState<string[]>([]);
    const [selectedIssue, setSelectedIssue] = React.useState<any | null>(null);
    
    // Auth and API
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

    const {
        activeTeam, setActiveTeam, selectedDate, setSelectedDate,
        searchName, setSearchName, dailyFilter, setDailyFilter,
        timeType, setTimeType, dateRange, setDateRange,
        visibleCount, setVisibleCount, checklistPage, setChecklistPage,
        checklistRoleFilter, setChecklistRoleFilter, loadMoreRef,
    } = useActivityFilters();

    const {
        reports, summary, rankings, teamContributions, groupContributions,
        reportOutstandings, kpiMeta, loading, userRole, userTeam, personalHistory,
        fetchReports, fetchHistory, handleUpdateStatus,
    } = useActivityData({
        user,
        dateRange,
        activeTeam,
        timeType,
        searchName,
        activeTab,
    });

    const sysRoles = user?.roles || [];
    const isLeaderUser = userRole === 'leader' || sysRoles.includes(UserRole.LEADER);
    const isAdminUser = userRole === 'admin' || userRole === 'manager' || sysRoles.includes(UserRole.ADMIN) || sysRoles.includes(UserRole.MANAGER);

    // Fetch dynamic permissions
    React.useEffect(() => {
        const fetchPermissions = async () => {
            if (!token) return;
            try {
                const response = await fetch(`${apiBaseUrl}/role-permissions/my-tabs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllowedMenuIds(data);

                    if (data.length > 0) {
                        const isCurrentAllowed = data.some((id: string) => TAB_MAP[id] === activeTab || id === activeTab);
                        if (!isCurrentAllowed && !tabParam) {
                             const firstAllowedId = data[0];
                             const firstAllowedTab = TAB_MAP[firstAllowedId];
                             if (firstAllowedTab) setActiveTab(firstAllowedTab);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch activity permissions", err);
            }
        };
        fetchPermissions();
    }, [token, apiBaseUrl, activeTab, tabParam]);

    const [isPersonalDetailed, setIsPersonalDetailed] = React.useState(false);
    const [showTabMenu, setShowTabMenu] = React.useState(false);
    const [initialTeamSet, setInitialTeamSet] = React.useState(false);

    // useDeferredValue: filter/sort chỉ chạy sau khi trình duyệt xử lý input xong
    const deferredSearchName = React.useDeferredValue(searchName);

    // Đồng bộ ?tab= & ?report= từ URL (Sidebar và deep link)
    React.useEffect(() => {
        const next = activeTabFromSearchParam(tabParam);
        if (next) setActiveTab(next);
    }, [tabParam]);

    React.useEffect(() => {
        const r = reportParam?.trim().toLowerCase();
        if (r === "daily") setReportType("daily");
        else if (r === "monthly") setReportType("monthly");
    }, [reportParam]);

    // Infinite scroll: load more cards when sentinel enters viewport
    React.useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisibleCount(prev => prev + CARDS_PER_BATCH);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reports.length, loadMoreRef, setVisibleCount]);

    // Team categorization
    const [allKnownTeams, setAllKnownTeams] = React.useState<string[]>([]);
    React.useEffect(() => {
        if (!teamContributions || teamContributions.length === 0) return;
        setAllKnownTeams((prev) => {
            const next = new Set(prev);
            let changed = false;
            teamContributions.forEach((item) => {
                const t = item.team;
                if (t && t !== "Khác" && !next.has(t)) { next.add(t); changed = true; }
            });
            return changed ? Array.from(next) : prev;
        });
    }, [teamContributions]);

    const { globalTeams, vnTeams } = React.useMemo(() => {
        const globals: string[] = [];
        const vns: string[] = [];
        const GLOBAL_KEYWORDS = ["global", "jp", "thái lan", "đài loan", "indo"];
        allKnownTeams.forEach((teamName) => {
            const isGlobal = GLOBAL_KEYWORDS.some((kw) => teamName.toLowerCase().includes(kw));
            if (isGlobal && !globals.includes(teamName)) globals.push(teamName);
            else if (!isGlobal && !vns.includes(teamName)) vns.push(teamName);
        });
        return { globalTeams: globals.sort(), vnTeams: vns.sort() };
    }, [allKnownTeams]);

    const matchTeam = React.useCallback((teamName: string | null | undefined): boolean => {
        if (activeTeam === 'All') return true;
        const safeTeam = normalize(teamName || 'Khác');
        const safeActive = normalize(activeTeam);
        if (activeTeam === 'All Global') return globalTeams.some(t => normalize(t) === safeTeam);
        if (activeTeam === 'All VN') return vnTeams.some(t => normalize(t) === safeTeam);
        return safeTeam === safeActive;
    }, [activeTeam, globalTeams, vnTeams]);

    // Filter Logic: If not Admin, handle team routing
    React.useEffect(() => {
        if (!isAdminUser && userTeam && !initialTeamSet) {
            setActiveTeam(userTeam);
            setInitialTeamSet(true);
        }
    }, [isAdminUser, userTeam, initialTeamSet, setActiveTeam]);

    const handleCaptureFullPage = async () => {
        const container = document.getElementById("report-view-container");
        if (!container) return;
        try {
            const { toPng } = await import("html-to-image");
            const scrollY = window.scrollY;
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 1000));
            const dataUrl = await toPng(container, {
                quality: 1.0,
                pixelRatio: 2,
                backgroundColor: "#ffffff",
                style: { transform: "scale(1)", transformOrigin: "top left" },
            });
            const now = new Date();
            const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `VCB_Report_${ts}.png`;
            link.click();
            window.scrollTo(0, scrollY);
        } catch (e) {
            console.error("Capture screenshot failed:", e);
        }
    };

    const allTabs = React.useMemo(() => [
        { id: 'performance', label: 'Hiệu Suất', icon: RefreshCw },
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'ranking', label: 'Bảng xếp hạng', icon: Layout },
        { id: 'personal', label: 'Tiến độ', icon: User },
        { id: 'daily_report', label: 'Báo cáo', icon: FileText },
        { id: 'daily_outstanding', label: 'Vấn đề & Win', icon: ClipboardList },
        { id: 'daily_checklist', label: 'Checklist', icon: CheckSquare }
    ], []);

    const visibleTabs = React.useMemo(() => {
        if (isAdminUser) return allTabs;
        return allTabs.filter(tab => tab.id !== 'dashboard');
    }, [allTabs, isAdminUser]);

    const filteredPerformanceReports = React.useMemo(() => {
        return reports.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(deferredSearchName.toLowerCase()));
    }, [reports, matchTeam, deferredSearchName]);

    const filteredPersonalMembers = React.useMemo(() => personalHistory.members.filter(m => matchTeam(m.team)), [personalHistory.members, matchTeam]);

    const filteredAllReports = React.useMemo(() => {
        return reports.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(deferredSearchName.toLowerCase()));
    }, [reports, matchTeam, deferredSearchName]);

    const filteredChecklistReports = React.useMemo(() => {
        const uniqueKeys = new Set();
        return reportOutstandings.filter(r => {
            // --- NEW RULES for Workflow Priority ---
            const isMyReport = user?.email && r.email && normalize(r.email) === normalize(user.email);
            const isMyTeam = (userTeam && r.team) && normalize(r.team) === normalize(userTeam);
            const rRole = (r.role || '').toLowerCase();
            const rPos = (r.position || '').toLowerCase();
            const isReportFromLeader = rRole.includes('leader') || rPos.includes('leader');
            
            if (!isAdminUser) {
                // Non-admins (Leaders/Members) can ONLY see their own team's outstanding reports
                // Exception: ALWAYS allow seeing own reports even if team has slight naming mismatch
                if (!isMyTeam && !isMyReport) return false;
            }

            const statusText = (r.approval_status || '').toLowerCase();
            const isLeaderHandled = statusText.includes('leader đã duyệt') || statusText.includes('leader từ chối');
            const isLegacyHandled = statusText === 'đã duyệt' || statusText === 'từ chối' || statusText === 'không duyệt';
            const isAdminHandled = statusText.includes('admin đã duyệt') || statusText.includes('admin từ chối');
            
            if (isAdminUser) {
                // Admin ONLY sees reports AFTER Leader handled them (or legacy or admin handled)
                // Exception: If no team, no leader exists -> show directly to admin
                const hasNoTeam = !r.team || r.team.trim() === '' || normalize(r.team) === 'khac';
                if (!isLeaderHandled && !isLegacyHandled && !isAdminHandled && !hasNoTeam) return false;
            }

            // Normal filters
            if (!matchTeam(r.team) && !isMyReport) return false;
            if (!(r.name || 'Unknown').toLowerCase().includes(deferredSearchName.toLowerCase())) return false;

            const key = `${r.name}_${r.category}_${r.content}`.toLowerCase().trim();
            if (uniqueKeys.has(key)) return false;
            uniqueKeys.add(key);
            return true;
        });
    }, [reportOutstandings, matchTeam, deferredSearchName, isAdminUser, userTeam]);

    const checklistFilteredReports = React.useMemo(() => {
        let roleFiltered = reports.filter(r => matchTeam(r.team) && (r.name || 'Unknown').toLowerCase().includes(deferredSearchName.toLowerCase()));
        return roleFiltered.filter(r => {
            if (checklistRoleFilter === 'all') return true;
            const pos = (r.position || '').toLowerCase();
            const isReportLeader = pos === 'leader' || pos.includes('leader') || pos.includes('trưởng nhóm');
            return checklistRoleFilter === 'leader' ? isReportLeader : !isReportLeader;
        });
    }, [reports, matchTeam, deferredSearchName, checklistRoleFilter]);

    // Mock details for the dialog
    const getReportDetails = (report: any) => {
        return [
            { q: 'Hôm nay bạn đã làm gì?', a: report.work_done || 'Đã hoàn thành các task trong checklist.' },
            { q: 'Khó khăn / Vấn đề cần hỗ trợ?', a: report.content || 'Không có vấn đề gì.' },
            { q: 'Kế hoạch ngày mai?', a: report.plan_tomorrow || 'Tiếp tục triển khai theo kế hoạch.' }
        ];
    };

    return (
        <div id="report-view-container" className="min-h-screen bg-slate-50/20 space-y-3 selection:bg-blue-500/30">
            {activeTab !== "daily_report" && (
                <div className="sticky top-[48px] z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm px-4 py-2">
                    <ActivityFilters
                        activeTeam={activeTeam}
                        setActiveTeam={setActiveTeam}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        searchName={searchName}
                        setSearchName={setSearchName}
                        userRole={userRole}
                        userTeam={userTeam}
                        activeTab={activeTab}
                        globalTeams={globalTeams}
                        vnTeams={vnTeams}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        timeType={timeType}
                        setTimeType={setTimeType}
                        onCapture={handleCaptureFullPage}
                        isNavbar={false}
                    />
                </div>
            )}

            <div className="relative z-10 space-y-2 p-2 sm:p-4">
                {activeTab !== "personal" &&
                    activeTab !== "daily_report" &&
                    activeTab !== "daily_checklist" &&
                    activeTab !== "daily_outstanding" && (
                        <div className="relative z-10 transition-all duration-500 space-y-2">
                            {kpiMeta && kpiMeta.kpiTotalInDb === 0 && (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                                    <strong>Chưa có dữ liệu bảng larkKPI.</strong> Số liệu thống kê và card nhân viên
                                    lấy từ bảng này. Vui lòng đồng bộ KPI từ Lark (gọi API sync KPI hoặc dùng menu cấu
                                    hình backend).
                                </div>
                            )}
                            {kpiMeta?.kpiMonthFallback && (
                                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                                    Đang hiển thị toàn bộ KPI trong DB vì không có bản ghi khớp tháng đang chọn. Để lọc
                                    đúng tháng, hãy đặt cột &quot;Tháng&quot; trong Lark đúng format (VD: T2, 2, Tháng
                                    2) rồi đồng bộ lại.
                                </div>
                            )}
                            {loading && !summary ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-3xl border border-slate-200/60 p-3 animate-pulse">
                                            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="w-16 h-16 rounded-full bg-slate-100" />
                                                <div className="flex-1">
                                                    <div className="h-8 w-20 bg-slate-200 rounded mb-2" />
                                                    <div className="h-3 w-28 bg-slate-100 rounded" />
                                                </div>
                                            </div>
                                            <div className="border-t border-slate-100 pt-3 flex justify-between">
                                                <div className="h-6 w-16 bg-slate-100 rounded" />
                                                <div className="h-6 w-16 bg-slate-100 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ActivityKPIs
                                    summary={summary}
                                    teamContributions={teamContributions}
                                    groupContributions={groupContributions}
                                />
                            )}
                        </div>
                    )}

                <main className="min-h-[60vh]">
                    {activeTab === "dashboard" ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <DashboardAnalytics dateRange={dateRange} activeTeam={activeTeam} />
                        </div>
                    ) : activeTab === "performance" ? (
                        loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                    {filteredPerformanceReports.slice(0, visibleCount).map((report, idx) => {
                                        const isOwnName = report.name && user?.full_name && normalize(report.name) === normalize(user.full_name);
                                        const isOwnEmail = report.email && user?.email && normalize(report.email) === normalize(user.email);
                                        const isOwnCard = isOwnName || isOwnEmail;
                                        const canClickCard =
                                            isAdminUser ||
                                            (isLeaderUser && report.team && userTeam && normalize(report.team) === normalize(userTeam)) ||
                                            isOwnCard;
                                        return (
                                            <div
                                                key={report.id || idx}
                                                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                                                style={{ animationDelay: `${Math.min(idx, 9) * 50}ms`, animationFillMode: "backwards" }}
                                            >
                                                <UserActivityCard
                                                    data={{ ...report, reportStatus: report.status }}
                                                    timeType={timeType}
                                                    canClick={canClickCard}
                                                    onClick={() => {
                                                        setSearchName(report.name);
                                                        setIsPersonalDetailed(true);
                                                        setActiveTab("personal");
                                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                {visibleCount < filteredPerformanceReports.length && (
                                    <div ref={loadMoreRef} className="flex justify-center py-8">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Đang tải thêm...
                                        </div>
                                    </div>
                                )}
                            </>
                        )
                    ) : activeTab === "ranking" ? (
                        <RankingView rankings={rankings} />
                    ) : activeTab === "personal" ? (
                        <div className="space-y-12">
                            <PersonalCharts
                                history={personalHistory.history}
                                teamStats={personalHistory.teamStats}
                                companyStats={personalHistory.companyStats}
                                userActivity={personalHistory.userActivity}
                                members={filteredPersonalMembers}
                                allReports={filteredAllReports}
                                setSearchName={setSearchName}
                                isDetailedMode={isPersonalDetailed}
                                setIsDetailedMode={setIsPersonalDetailed}
                                userRole={userRole || (isAdminUser ? "admin" : isLeaderUser ? "leader" : "member")}
                                userTeam={userTeam}
                                currentUserName={user?.full_name}
                                currentUserEmail={user?.email}
                            />
                        </div>
                    ) : activeTab === "daily_outstanding" ? (
                        <div className="space-y-4 w-full max-w-[2420px] px-3 pb-6 mx-auto">
                            {filteredChecklistReports.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-8 mt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-400/20">
                                                <ClipboardList className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                        Vấn đề nổi bật & Video Win
                                                    </h3>
                                                    {/* Badge phân quyền */}
                                                    {isAdminUser ? (
                                                        <span className="px-3 py-1.5 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 text-xs font-black uppercase tracking-widest shadow-sm">
                                                            Toàn công ty
                                                        </span>
                                                    ) : isLeaderUser ? (
                                                        <span className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest shadow-sm">
                                                            Team: {userTeam || 'Của tôi'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 text-xs font-black uppercase tracking-widest shadow-sm">
                                                            Cá nhân
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-base text-slate-500 font-bold italic mt-1">Tổng quát các vấn đề cần lưu ý và thành tích trong ngày</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-2xl shadow-blue-500/5 overflow-hidden">
                                        <div className="max-h-[800px] overflow-y-auto scrollbar-thin">
                                            <table className="w-full border-collapse text-left">
                                                <thead className="sticky top-0 z-20 bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[13px] font-black uppercase text-blue-50 tracking-widest bg-transparent border-b border-white/10 text-center">Chức danh</th>
                                                        <th className="px-8 py-3 text-[13px] font-black uppercase text-blue-50 tracking-widest bg-transparent border-b border-white/10 text-left">Nhân viên</th>
                                                        <th className="px-6 py-3 text-[13px] font-black uppercase text-blue-50 tracking-widest bg-transparent border-b border-white/10 text-center">Phân loại</th>
                                                        <th className="px-8 py-3 text-[13px] font-black uppercase text-blue-50 tracking-widest bg-transparent border-b border-white/10 text-left">Nội dung</th>
                                                        <th className="px-8 py-3 text-[13px] font-black uppercase text-blue-50 tracking-widest bg-transparent border-b border-white/10 text-center">
                                                            Thao tác / Chi tiết
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {filteredChecklistReports.map((r, idx) => {
                                                        const statusText = (r.approval_status || '').toLowerCase();
                                                        const isLegacyApproved = statusText === 'đã duyệt' || statusText === 'duyệt';
                                                        const isLegacyRejected = statusText === 'từ chối' || statusText === 'không duyệt';
                                                        const isLeaderApproved = statusText.includes('leader đã duyệt');
                                                        const isLeaderRejected = statusText.includes('leader từ chối');
                                                        const isAdminApproved = statusText.includes('admin đã duyệt') || isLegacyApproved;
                                                        const isAdminRejected = statusText.includes('admin từ chối') || isLegacyRejected;
                                                        
                                                        // Check if report is older than 1 day
                                                        let isExpired = false;
                                                        if (r.date) {
                                                            let rDateObj = new Date(r.date);
                                                            if (r.date.includes('/')) {
                                                                const parts = r.date.split('/');
                                                                if (parts.length === 3) rDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                                            }
                                                            if (!isNaN(rDateObj.getTime())) {
                                                                // > 24 hours
                                                                if (new Date().getTime() - rDateObj.getTime() > 24 * 60 * 60 * 1000) {
                                                                    isExpired = true;
                                                                }
                                                            }
                                                        }

                                                        // Permissions
                                                        // BỔ SUNG: Nếu report là từ Leader, hoặc KHÔNG CÓ TEAM, thì chỉ Admin mới được duyệt.
                                                        const canLeaderAction = !isExpired && isLeaderUser && !isAdminUser && r.team && r.team.trim() !== '' && r.team === userTeam && !isAdminHandled && !isReportFromLeader;
                                                        const canAdminAction = !isExpired && isAdminUser; // Màn Admin có thể thao tác hết
                                                        const isAutoRejected = isExpired && !isAdminHandled;

                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-blue-50/40 transition-all group">
                                                                <td className="px-6 py-3 border-r border-slate-50 text-center">
                                                                    <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-black uppercase tracking-widest shadow-sm">
                                                                        {r.role || 'Member'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-3 border-r border-slate-50">
                                                                    <div className="font-black text-slate-900 text-[18px] mb-1">{r.name}</div>
                                                                    <div className="flex items-center gap-2 text-[12px] text-blue-700 font-bold">
                                                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100">{r.team}</span>
                                                                        <span className="text-slate-400 font-medium italic">{r.date}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 border-r border-slate-50 text-center">
                                                                    <span className={`px-3 py-2 rounded-xl text-[12px] font-black uppercase tracking-tight ${r.category?.toLowerCase().includes('win')
                                                                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-200 shadow-sm shadow-purple-100'
                                                                        : 'bg-amber-100 text-amber-800 border-2 border-amber-200 shadow-sm shadow-amber-100'
                                                                        }`}>
                                                                        {r.category || '-'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-3 border-r border-slate-50">
                                                                    <div className="text-[17px] text-slate-900 font-bold leading-relaxed max-w-[800px]">
                                                                        {r.content || 'Không có nội dung'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3.5 text-center">
                                                                    <div className="flex justify-center flex-col gap-2 relative">
                                                                        {/* Trạng thái hiển thị */}
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            {/* Member View */}
                                                                            {(!isAdminUser && !isLeaderUser) && (
                                                                                <>
                                                                                    {isAdminApproved ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt</span>
                                                                                    ) : isAdminRejected ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Đã từ chối</span>
                                                                                    ) : isLeaderRejected ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Leader từ chối</span>
                                                                                    ) : isAutoRejected ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Không được duyệt</span>
                                                                                    ) : isLeaderApproved ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Leader đã duyệt (Chờ duyệt)</span>
                                                                                    ) : (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1">
                                                                                            <Clock className="w-3.5 h-3.5" /> {(isReportFromLeader || !r.team || r.team.trim() === '' || normalize(r.team) === 'khac') ? 'Chờ Admin duyệt' : 'Chờ Leader duyệt'}
                                                                                        </span>
                                                                                    )}
                                                                                </>
                                                                            )}

                                                                            {/* Leader View (chỉ hiện kết quả của Manager) */}
                                                                            {(isLeaderUser && !isAdminUser) && (
                                                                                <>
                                                                                    {isAdminApproved ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt</span>
                                                                                    ) : isAdminRejected ? (
                                                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Đã từ chối</span>
                                                                                    ) : (!canLeaderAction && r.team === userTeam && !(isAdminApproved || isAdminRejected)) ? (
                                                                                        isLeaderApproved ? (
                                                                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (Đã khóa)</span>
                                                                                        ) : isLeaderRejected ? (
                                                                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Đã từ chối (Đã khóa)</span>
                                                                                        ) : (isReportFromLeader || !r.team || r.team.trim() === '' || normalize(r.team) === 'khac') ? (
                                                                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Chờ Admin duyệt</span>
                                                                                        ) : (
                                                                                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Không được duyệt (Quá hạn)</span>
                                                                                        )
                                                                                    ) : null}
                                                                                </>
                                                                            )}

                                                                            {/* Admin View */}
                                                                            {isAdminUser && (
                                                                                <>
                                                                                    {isLeaderApproved ? (
                                                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${isExpired ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} border flex items-center gap-1`}><CheckCircle2 className="w-3.5 h-3.5" /> Leader đã duyệt {isExpired && '(Khóa)'}</span>
                                                                                    ) : isLeaderRejected ? (
                                                                                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${isExpired ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-red-50 text-red-700 border-red-200'} border flex items-center gap-1`}><AlertCircle className="w-3.5 h-3.5" /> Leader từ chối {isExpired && '(Khóa)'}</span>
                                                                                    ) : null}
                                                                                </>
                                                                            )}
                                                                        </div>

                                                                        {/* Các nút hành động */}
                                                                        <div className="flex justify-center flex-wrap gap-2 mt-1">
                                                                            {canLeaderAction && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isLeaderApproved ? 'Chưa duyệt' : 'Leader đã duyệt')}
                                                                                        className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 ${isLeaderApproved ? 'bg-slate-200 text-slate-700' : 'bg-emerald-600 text-white shadow-emerald-200/50'}`}
                                                                                    >
                                                                                        <Check className="w-3.5 h-3.5" strokeWidth={4} /> {isLeaderApproved ? 'Hủy duyệt' : 'Duyệt'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isLeaderRejected ? 'Chưa duyệt' : 'Leader từ chối')}
                                                                                        className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 ${isLeaderRejected ? 'bg-slate-200 text-slate-700' : 'bg-red-600 text-white shadow-red-200/50'}`}
                                                                                    >
                                                                                        <X className="w-3.5 h-3.5" strokeWidth={4} /> {isLeaderRejected ? 'Hủy từ chối' : 'Từ chối'}
                                                                                    </button>
                                                                                </>
                                                                            )}

                                                                            {canAdminAction && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isAdminApproved ? (isLeaderApproved ? 'Leader đã duyệt' : isLeaderRejected ? 'Leader từ chối' : 'Chưa duyệt') : `Admin đã duyệt | ${isLeaderApproved ? 'Leader đã duyệt' : isLeaderRejected ? 'Leader từ chối' : ''}`)}
                                                                                        className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 ${isAdminApproved ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white shadow-blue-200/50'}`}
                                                                                    >
                                                                                        <Check className="w-3.5 h-3.5" strokeWidth={4} /> {isAdminApproved ? 'Hủy duyệt' : 'Duyệt'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isAdminRejected ? (isLeaderApproved ? 'Leader đã duyệt' : isLeaderRejected ? 'Leader từ chối' : 'Chưa duyệt') : `Admin từ chối | ${isLeaderApproved ? 'Leader đã duyệt' : isLeaderRejected ? 'Leader từ chối' : ''}`)}
                                                                                        className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 ${isAdminRejected ? 'bg-slate-200 text-slate-700' : 'bg-red-600 text-white shadow-red-200/50'}`}
                                                                                    >
                                                                                        <X className="w-3.5 h-3.5" strokeWidth={4} /> {isAdminRejected ? 'Hủy từ chối' : 'Từ chối'}
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            
                                                                            {/* Nút Xem chi tiết báo cáo */}
                                                                            <button 
                                                                                onClick={() => setSelectedIssue({
                                                                                    n: r.name,
                                                                                    init: r.name?.charAt(0) || '?',
                                                                                    c: 3,
                                                                                    bg: r.category?.toLowerCase().includes('win') ? 'bg-purple-600' : 'bg-amber-500',
                                                                                    details: getReportDetails(r)
                                                                                })}
                                                                                className="mt-1 px-3 py-2 rounded-lg text-[11px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-105 active:scale-95 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                            >
                                                                                <FileText className="w-3.5 h-3.5" /> Xem chi tiết
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-inner">
                                    <div className="p-4 bg-slate-50 rounded-full mb-4">
                                        <ClipboardList className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Không có vấn đề nổi bật nào trong ngày</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'daily_checklist' ? (
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-blue-600" /> Chi tiết báo cáo ngày
                                        </h3>
                                        {/* Badge phân quyền */}
                                        {isAdminUser ? (
                                            <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-black uppercase tracking-widest">
                                                Toàn công ty
                                            </span>
                                        ) : isLeaderUser ? (
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                                                Team: {userTeam || 'Của tôi'}
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                                Cá nhân
                                            </span>
                                        )}
                                    </div>

                                    {/* Filter All/Leader/Member — chỉ hiện với admin/manager/leader */}
                                    {(isAdminUser || isLeaderUser) && (
                                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                            <button
                                                onClick={() => { setChecklistRoleFilter('all'); setChecklistPage(1); }}
                                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                onClick={() => { setChecklistRoleFilter('leader'); setChecklistPage(1); }}
                                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'leader' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Leader
                                            </button>
                                            <button
                                                onClick={() => { setChecklistRoleFilter('member'); setChecklistPage(1); }}
                                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === 'member' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Member
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {loading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                                                    <div>
                                                        <div className="h-4 w-28 bg-slate-200 rounded mb-2" />
                                                        <div className="h-3 w-20 bg-slate-100 rounded" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-3 w-full bg-slate-100 rounded" />
                                                    <div className="h-3 w-3/4 bg-slate-100 rounded" />
                                                </div>
                                            </div>
                                        ))
                                    ) : checklistFilteredReports.length > 0 ? (
                                        checklistFilteredReports
                                            .slice((checklistPage - 1) * CHECKLIST_PAGE_SIZE, checklistPage * CHECKLIST_PAGE_SIZE)
                                            .map((report, idx) => (
                                                <div key={report.id || idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                    <ReportCard report={report} />
                                                </div>
                                            ))
                                    ) : (
                                        <div className="col-span-full text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-xs font-black text-slate-400 italic">
                                            KHÔNG TÌM THẤY BÁO CÁO CHI TIẾT
                                        </div>
                                    )}
                                </div>

                                {!loading && checklistFilteredReports.length > CHECKLIST_PAGE_SIZE && (
                                    <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                                        <button
                                            onClick={() => setChecklistPage((p) => Math.max(1, p - 1))}
                                            disabled={checklistPage === 1}
                                            className={`p-2 rounded-xl border transition-all ${checklistPage === 1 ? "opacity-30 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100" : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200"}`}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE) }).map((_, i) => {
                                                const pageNum = i + 1;
                                                const totalPages = Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE);
                                                const isCurrent = pageNum === checklistPage;
                                                const isVisible = pageNum === 1 || pageNum === totalPages || (pageNum >= checklistPage - 1 && pageNum <= checklistPage + 1);
                                                if (isVisible) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => setChecklistPage(pageNum)}
                                                            className={`min-w-[40px] h-10 rounded-xl font-black text-sm transition-all border ${isCurrent ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200"}`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                }
                                                if (pageNum === 2 && checklistPage > 3) return <span key="dots1" className="px-2 text-slate-400 font-bold">...</span>;
                                                if (pageNum === totalPages - 1 && checklistPage < totalPages - 2) return <span key="dots2" className="px-2 text-slate-400 font-bold">...</span>;
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => setChecklistPage((p) => Math.min(Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE), p + 1))}
                                            disabled={checklistPage === Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE)}
                                            className={`p-2 rounded-xl border transition-all ${checklistPage === Math.ceil(checklistFilteredReports.length / CHECKLIST_PAGE_SIZE) ? "opacity-30 cursor-not-allowed bg-slate-50 text-slate-400 border-slate-100" : "bg-white text-blue-600 border-blue-100 hover:bg-blue-50/50 hover:border-blue-200"}`}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === "daily_report" ? (
                        (isAdminUser || isLeaderUser) ? (
                            <ManagerChecklistWorkspace reports={reports} />
                        ) : (
                            <MenberReportWorkspace />
                        )
                    ) : null}
                </main>
            </div>

            {/* Modal chi tiết báo cáo (Vấn đề nổi bật) */}
            {selectedIssue && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-[600px] bg-white rounded-[2.5rem] shadow-[0_32px_96px_-12px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white relative">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform -rotate-3 ${selectedIssue.bg || 'bg-amber-500'}`}>
                                    {selectedIssue.init}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-950 text-xl uppercase tracking-tighter leading-tight">{selectedIssue.n}</h3>
                                    <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Chi tiết báo cáo hoạt động</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedIssue(null)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 hover:rotate-90">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto bg-slate-50/50 scrollbar-thin">
                            {selectedIssue.details.map((d: any, idx: number) => (
                                <div key={idx} className="relative group">
                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-100 group-hover:bg-blue-400 transition-colors rounded-full" />
                                    <h4 className="flex items-center gap-3 text-sm font-black text-blue-700 uppercase tracking-widest mb-3">
                                        <FileText className="w-4 h-4" /> {d.q}
                                    </h4>
                                    <div className="text-[16px] font-bold text-slate-800 leading-relaxed bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm group-hover:shadow-md transition-all duration-300">
                                        {d.a.split('\n').map((line: string, i: number) => (
                                            <React.Fragment key={i}>
                                                {line}
                                                {i < d.a.split('\n').length - 1 && <br />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-center bg-white">
                            <button 
                                className="px-10 py-4 rounded-2xl font-black text-white bg-blue-600 shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 uppercase tracking-widest text-xs" 
                                onClick={() => setSelectedIssue(null)}
                            >
                                Đã xem và ghi nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PAGE_FALLBACK = (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
        </div>
    </div>
);

const UserActivityPage = () => (
    <Suspense fallback={PAGE_FALLBACK}>
        <UserActivityPageContent />
    </Suspense>
);

export default UserActivityPage;
