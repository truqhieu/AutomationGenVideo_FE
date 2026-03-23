"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import ActivityFilters from "./components/ActivityFilters";
import UserActivityCard from "./components/UserActivityCard";

// Heavy components: loaded only when the matching tab is active (Rule 2.4)
const ActivityKPIs = dynamic(() => import("./components/ActivityKPIs"), { ssr: false });
const DashboardAnalytics = dynamic(() => import("./components/DashboardAnalytics"), { ssr: false });
const ReportCard = dynamic(() => import("./components/ReportCard"), { ssr: false });
const RankingView = dynamic(() => import("./components/RankingView"), { ssr: false });
const PersonalCharts = dynamic(() => import("./components/PersonalCharts"), { ssr: false });
const ChecklistContainer = dynamic(
    () => import("@/components/checklist/ChecklistContainer"),
    { ssr: false },
);
import {
    RefreshCw,
    User,
    FileText,
    ClipboardList,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    ShieldCheck,
    Calendar,
    BarChart3,
    Check,
    Clock,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useSearchParams } from "next/navigation";
import { UserRole } from "@/types/auth";
import { useActivityData } from "./hooks/useActivityData";
import { useActivityFilters, CARDS_PER_BATCH, CHECKLIST_PAGE_SIZE } from "./hooks/useActivityFilters";

const normalize = (str: any) => (str || "").toString().toLowerCase().trim().replace(/\s+/g, "");

const TAB_MAP: Record<string, ActiveTab> = {
    activity_performance: "performance",
    performance: "performance",
    activity_dashboard: "dashboard",
    activity_ranking: "ranking",
    activity_personal: "personal",
    activity_checklist: "daily_checklist",
    activity_report: "daily_report",
    activity_outstanding: "daily_outstanding",
    daily_outstanding: "daily_outstanding",
};

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

    const [activeTab, setActiveTab] = React.useState<ActiveTab>("performance");
    const [reportType, setReportType] = React.useState<"select" | "daily" | "monthly">("select");
    const [dailySubtype, setDailySubtype] = React.useState<"select" | "traffic" | "work">("select");
    const [reportMode, setReportMode] = React.useState<"select" | "member" | "leader">("select");
    const [allowedMenuIds, setAllowedMenuIds] = React.useState<string[]>([]);
    const [isPersonalDetailed, setIsPersonalDetailed] = React.useState(false);

    const {
        activeTeam, setActiveTeam, selectedDate, setSelectedDate, searchName, setSearchName,
        dailyFilter, setDailyFilter, timeType, setTimeType, dateRange, setDateRange,
        visibleCount, setVisibleCount, checklistPage, setChecklistPage,
        checklistRoleFilter, setChecklistRoleFilter, loadMoreRef,
    } = useActivityFilters();

    const {
        reports, summary, rankings, teamContributions, groupContributions,
        reportOutstandings, kpiMeta, loading, userRole, userTeam, personalHistory,
        handleUpdateStatus,
    } = useActivityData({ user, dateRange, activeTeam, timeType, searchName, activeTab });

    const sysRoles = user?.roles || [];
    const isAdminUser =
        sysRoles.includes(UserRole.ADMIN) ||
        sysRoles.includes(UserRole.MANAGER) ||
        userRole === "admin" ||
        userRole === "manager";
    const isLeaderUser = sysRoles.includes(UserRole.LEADER) || userRole === "leader";

    // Team categorization: accumulate known teams across fetches, then categorize
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

    const matchTeam = React.useCallback(
        (teamName: string | null | undefined): boolean => {
            if (activeTeam === "All") return true;
            const safeTeam = normalize(teamName || "Khác");
            if (activeTeam === "All Global") return globalTeams.some((t) => normalize(t) === safeTeam);
            if (activeTeam === "All VN") return vnTeams.some((t) => normalize(t) === safeTeam);
            return safeTeam === normalize(activeTeam);
        },
        [activeTeam, globalTeams, vnTeams],
    );

    // Infinite scroll: load more cards when sentinel enters viewport
    React.useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisibleCount((prev) => prev + CARDS_PER_BATCH); },
            { rootMargin: "200px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [reports.length, loadMoreRef, setVisibleCount]);

    // Sync activeTab from URL param immediately
    React.useEffect(() => {
        const validTabs = Object.values(TAB_MAP) as string[];
        if (tabParam && validTabs.includes(tabParam)) {
            setActiveTab(tabParam as ActiveTab);
        }
    }, [tabParam]);

    // Fetch permissions and adjust initial tab if needed
    React.useEffect(() => {
        if (!token) return;
        const fetchPermissions = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/role-permissions/my-tabs`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) return;
                const data = await response.json();
                setAllowedMenuIds(data);

                if (tabParam && Object.values(TAB_MAP).includes(tabParam as ActiveTab)) {
                    setActiveTab(tabParam === "dashboard" && !isAdminUser ? "performance" : tabParam as ActiveTab);
                } else {
                    const isPerformanceAllowed = data.includes("activity_performance") || data.includes("performance");
                    const allowedSubTabs = data.filter((id: string) => id.startsWith("activity_") || id === "performance");
                    if (!isAdminUser && allowedSubTabs.length > 0 && !isPerformanceAllowed) {
                        const firstAllowed = allowedSubTabs[0];
                        if (TAB_MAP[firstAllowed]) setActiveTab(TAB_MAP[firstAllowed]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch activity permissions", err);
            }
        };
        fetchPermissions();
    }, [token, tabParam, isAdminUser]);

    // Sync reportType from URL param when navigating from Header flyout
    React.useEffect(() => {
        if (activeTab !== "daily_report") return;
        if (reportParam === "daily") {
            setReportType("daily");
            setDailySubtype("select");
            setReportMode("select");
        } else if (reportParam === "monthly") {
            setReportType("monthly");
        } else {
            setReportType("select");
        }
    }, [reportParam, activeTab]);

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
            alert("Lỗi chụp màn hình. Hãy thử lại.");
        }
    };

    const filteredPerformanceReports = React.useMemo(() => {
        return reports.filter((r) => {
            const safeUserTeam = normalize(userTeam);
            const safeReportTeam = normalize(r.team);
            const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;
            const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
            const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);
            const isVisible = isAdminUser || !userTeam || isTeamMatch || isOwnName || isOwnEmail;
            return isVisible && matchTeam(r.team) && (r.name || "Unknown").toLowerCase().includes(searchName.toLowerCase());
        });
    }, [reports, userTeam, isAdminUser, matchTeam, searchName, user?.full_name, user?.email]);

    const filteredPersonalMembers = React.useMemo(() => {
        return personalHistory.members.filter((m) => {
            const safeUserTeam = normalize(userTeam);
            const safeMemberTeam = normalize(m.team);
            const isTeamMatch = safeUserTeam && safeMemberTeam === safeUserTeam;
            const isOwnName = m.name && user?.full_name && normalize(m.name) === normalize(user.full_name);
            const isOwnEmail = m.email && user?.email && normalize(m.email) === normalize(user.email);
            return isAdminUser || !userTeam || isTeamMatch || isOwnName || isOwnEmail;
        });
    }, [personalHistory.members, userTeam, isAdminUser, user?.full_name, user?.email]);

    const filteredAllReports = React.useMemo(() => {
        return reports.filter((r) => {
            const safeUserTeam = normalize(userTeam);
            const safeReportTeam = normalize(r.team);
            const isTeamMatch = safeUserTeam && safeReportTeam === safeUserTeam;
            const isOwnName = r.name && user?.full_name && normalize(r.name) === normalize(user.full_name);
            const isOwnEmail = r.email && user?.email && normalize(r.email) === normalize(user.email);
            return (isAdminUser || !userTeam || isTeamMatch || isOwnName || isOwnEmail) &&
                (r.name || "Unknown").toLowerCase().includes(searchName.toLowerCase());
        });
    }, [reports, userTeam, isAdminUser, searchName, user?.full_name, user?.email]);

    const filteredChecklistReports = React.useMemo(() => {
        return reportOutstandings.filter(
            (r) => matchTeam(r.team) && (r.name || "Unknown").toLowerCase().includes(searchName.toLowerCase()),
        );
    }, [reportOutstandings, matchTeam, searchName]);

    const checklistFilteredReports = React.useMemo(() => {
        return filteredPerformanceReports.filter((r) => {
            if (checklistRoleFilter === "all") return true;
            const pos = (r.position || "").toLowerCase();
            const isReportLeader = pos === "leader" || pos.includes("leader") || pos.includes("trưởng nhóm");
            return checklistRoleFilter === "leader" ? isReportLeader : !isReportLeader;
        });
    }, [filteredPerformanceReports, checklistRoleFilter]);

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
                                        return (
                                            <div
                                                key={report.id || idx}
                                                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                                                style={{ animationDelay: `${Math.min(idx, 9) * 50}ms`, animationFillMode: "backwards" }}
                                            >
                                                <UserActivityCard
                                                    data={{ ...report, reportStatus: report.status }}
                                                    timeType={timeType}
                                                    canClick={
                                                        isAdminUser ||
                                                        (isLeaderUser && report.team && userTeam && normalize(report.team) === normalize(userTeam)) ||
                                                        isOwnCard
                                                    }
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
                                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                                    Vấn đề nổi bật & Video Win
                                                </h3>
                                                <p className="text-base text-slate-500 font-bold italic">
                                                    Tổng quát các vấn đề cần lưu ý và thành tích trong ngày
                                                </p>
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
                                                            {isAdminUser ? "Thao tác" : "Trạng thái"}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {filteredChecklistReports.map((r, idx) => {
                                                        const statusText = (r.approval_status || "").toLowerCase();
                                                        let isApproved = statusText.includes("đã duyệt") || (statusText.includes("duyệt") && !statusText.includes("chưa") && !statusText.includes("không"));
                                                        let isRejected = statusText.includes("từ chối") || statusText.includes("không duyệt");
                                                        let isPending = !isApproved && !isRejected;

                                                        if (isPending && r.date) {
                                                            let rDateObj = new Date(r.date);
                                                            if (r.date.includes("/")) {
                                                                const parts = r.date.split("/");
                                                                if (parts.length === 3) {
                                                                    rDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                                                }
                                                            }
                                                            if (!isNaN(rDateObj.getTime()) && new Date().getTime() - rDateObj.getTime() > 2592000000) {
                                                                isPending = false;
                                                                isRejected = true;
                                                            }
                                                        }

                                                        if (!isAdminUser && isRejected) return null;

                                                        return (
                                                            <tr key={r.id || idx} className="hover:bg-blue-50/40 transition-all group">
                                                                <td className="px-6 py-3 border-r border-slate-50 text-center">
                                                                    <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[12px] font-black uppercase tracking-widest shadow-sm">
                                                                        {r.role || "Member"}
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
                                                                    <span className={`px-3 py-2 rounded-xl text-[12px] font-black uppercase tracking-tight ${r.category?.toLowerCase().includes("win") ? "bg-purple-100 text-purple-800 border-2 border-purple-200 shadow-sm shadow-purple-100" : "bg-amber-100 text-amber-800 border-2 border-amber-200 shadow-sm shadow-amber-100"}`}>
                                                                        {r.category || "-"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-3 border-r border-slate-50">
                                                                    <div className="text-[17px] text-slate-900 font-bold leading-relaxed max-w-[800px]">
                                                                        {r.content || "Không có nội dung"}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3.5 text-center">
                                                                    <div className="flex justify-center flex-wrap gap-3">
                                                                        {isAdminUser ? (
                                                                            <div className="flex items-center gap-3">
                                                                                {(isPending || isApproved) && (
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isApproved ? "Chưa duyệt" : "Đã duyệt")}
                                                                                        className="px-5 py-2.5 rounded-xl text-[12px] font-black uppercase flex items-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95 bg-emerald-600 text-white shadow-emerald-200/50"
                                                                                    >
                                                                                        <Check className="w-4 h-4" strokeWidth={4} />
                                                                                        {isApproved ? "Đã duyệt" : "Duyệt"}
                                                                                    </button>
                                                                                )}
                                                                                {(isPending || isRejected) && (
                                                                                    <button
                                                                                        onClick={() => handleUpdateStatus(r.id, isRejected ? "Chưa duyệt" : "Từ chối")}
                                                                                        className="px-5 py-2.5 rounded-xl text-[12px] font-black uppercase flex items-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95 bg-red-600 text-white shadow-red-200/50"
                                                                                    >
                                                                                        <X className="w-4 h-4" strokeWidth={4} />
                                                                                        {isRejected ? "Đã từ chối" : "Từ chối"}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-center">
                                                                                {isApproved && (
                                                                                    <span className="px-4 py-2 rounded-xl text-[11px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                                                                                        <CheckCircle2 className="w-4 h-4" /> Đã duyệt
                                                                                    </span>
                                                                                )}
                                                                                {isRejected && (
                                                                                    <span className="px-4 py-2 rounded-xl text-[11px] font-black uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
                                                                                        <AlertCircle className="w-4 h-4" /> Từ chối
                                                                                    </span>
                                                                                )}
                                                                                {isPending && (
                                                                                    <span className="px-4 py-2 rounded-xl text-[11px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-200 flex items-center gap-2 tracking-wider">
                                                                                        <Clock className="w-4 h-4" /> Đang xem xét
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
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
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                                        Không có vấn đề nổi bật nào trong ngày
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === "daily_checklist" ? (
                        <div className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" /> Chi tiết báo cáo ngày
                                    </h3>
                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        {(["all", "leader", "member"] as const).map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => { setChecklistRoleFilter(f); setChecklistPage(1); }}
                                                className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${checklistRoleFilter === f ? `bg-white shadow-sm ${f === "leader" ? "text-orange-600" : f === "member" ? "text-slate-800" : "text-blue-600"}` : "text-slate-500 hover:text-slate-700"}`}
                                            >
                                                {f === "all" ? "Tất cả" : f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
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
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {reportType === "select" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10">
                                    <button
                                        onClick={() => setReportType("daily")}
                                        className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                        <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                            <Calendar className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo ngày</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Báo cáo và đánh giá công việc hàng ngày của Leader và Member.</p>
                                        <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                            Chọn loại báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setReportType("monthly")}
                                        className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-900/40 transition-colors" />
                                        <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo tháng</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Tổng hợp dữ liệu hiệu suất, traffic và doanh thu theo chu kỳ tháng.</p>
                                        <div className="mt-8 flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                            Xem báo cáo tháng <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                        </div>
                                    </button>
                                </div>
                            ) : reportType === "daily" ? (
                                <>
                                    {dailySubtype === "select" ? (
                                        <div className="space-y-6">
                                            <div className="px-4">
                                                <button type="button" onClick={() => setReportType("select")} className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer">
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại chọn Loại
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                                <button onClick={() => setDailySubtype("traffic")} className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-purple-900/40 transition-colors" />
                                                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all duration-500 shadow-inner">
                                                        <BarChart3 className="w-8 h-8 text-purple-400" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Traffic</h3>
                                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Cập nhật số liệu truy cập từ các nền tảng mạng xã hội hôm nay.</p>
                                                    <div className="mt-8 flex items-center gap-2 text-purple-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                        Nhập số liệu <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                    </div>
                                                </button>

                                                <button onClick={() => setDailySubtype("work")} className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                                    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                                        <ClipboardList className="w-8 h-8 text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Công việc hôm nay</h3>
                                                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Báo cáo tiến độ checklist, khó khăn và kế hoạch làm việc.</p>
                                                    <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                        Báo cáo công việc <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    ) : dailySubtype === "traffic" ? (
                                        <div className="space-y-6">
                                            <div className="px-4">
                                                <button type="button" onClick={() => setDailySubtype("select")} className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-bold transition-all group border border-blue-100/50 shadow-sm cursor-pointer">
                                                    <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
                                                </button>
                                            </div>
                                            <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                                <ChecklistContainer mode="member" showOnlyTraffic={true} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {reportMode === "select" ? (
                                                <div className="space-y-6">
                                                    <div className="px-4">
                                                        <button type="button" onClick={() => setDailySubtype("select")} className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer">
                                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                                        {(isAdminUser || !isLeaderUser) && (
                                                            <button onClick={() => setReportMode("member")} className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-900/40 transition-colors" />
                                                                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-inner">
                                                                    <User className="w-8 h-8 text-blue-400" />
                                                                </div>
                                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Member</h3>
                                                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Dành cho Editor & Content báo cáo tiến độ checklist và khó khăn hàng ngày.</p>
                                                                <div className="mt-8 flex items-center gap-2 text-blue-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                                    Bắt đầu báo cáo <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                                </div>
                                                            </button>
                                                        )}
                                                        {(isAdminUser || isLeaderUser) && (
                                                            <button onClick={() => setReportMode("leader")} className="group relative bg-slate-950 p-8 rounded-[3rem] border border-slate-800 shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden text-left">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-950/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-900/40 transition-colors" />
                                                                <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all duration-500 shadow-inner">
                                                                    <ShieldCheck className="w-8 h-8 text-indigo-400" />
                                                                </div>
                                                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Báo cáo Leader</h3>
                                                                <p className="text-sm text-slate-400 font-medium leading-relaxed">Dành cho Team Leader đánh giá chất lượng và quản lý nhân sự hàng ngày.</p>
                                                                <div className="mt-8 flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-widest transition-all duration-500">
                                                                    Bắt đầu đánh giá <ChevronDown className="-rotate-90 w-3 h-3 stroke-[3]" />
                                                                </div>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between px-4">
                                                        <button type="button" onClick={() => setReportMode("select")} className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer">
                                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại chọn Đối tượng
                                                        </button>
                                                    </div>
                                                    <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-8 border border-slate-100 shadow-inner">
                                                        <ChecklistContainer mode={reportMode} showOnlyWork={true} />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="px-4">
                                        <button type="button" onClick={() => setReportType("select")} className="relative z-[500] flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-slate-200 font-bold transition-all group border border-slate-200 shadow-sm cursor-pointer">
                                            <ChevronDown className="rotate-90 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại chọn Loại
                                        </button>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-20 border border-slate-100 shadow-inner text-center">
                                        <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Tính năng Báo cáo tháng</h3>
                                        <p className="text-slate-400 mt-2 text-sm">Đang được phát triển. Vui lòng quay lại sau!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </main>
            </div>
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
