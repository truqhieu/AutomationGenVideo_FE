"use client";

import React, { useCallback, useRef } from "react";

interface PersonalHistory {
    history: any[];
    teamStats: any | null;
    companyStats?: any | null;
    userActivity: any | null;
    members: any[];
}

interface KpiMeta {
    kpiTotalInDb?: number;
    kpiFilteredForMonth?: number;
    kpiMonthFallback?: boolean;
}

interface UseActivityDataParams {
    user: any;
    dateRange: { start: Date; end: Date };
    activeTeam: string;
    timeType: string;
    searchName: string;
    activeTab: string;
}

interface UseActivityDataReturn {
    reports: any[];
    summary: any;
    rankings: any;
    teamContributions: any[];
    groupContributions: any;
    reportOutstandings: any[];
    kpiMeta: KpiMeta | null;
    loading: boolean;
    userRole: string | null;
    userTeam: string | null;
    personalHistory: PersonalHistory;
    fetchReports: (showLoading?: boolean) => Promise<void>;
    fetchHistory: () => Promise<void>;
    handleUpdateStatus: (id: string, status: string) => Promise<void>;
}

const getAvatarUrl = (url: string | null, name: string) => {
    if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    if (url.includes("drive.google.com")) {
        const match = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w200`;
        }
    }
    return url;
};

const mapReportItem = (item: any) => {
    const pos = (item.position || "").toLowerCase();
    const role = (item.role || "").toLowerCase();
    const isLeaderReport =
        pos.includes("leader") || pos.includes("lead") || pos.includes("manager") ||
        pos.includes("trưởng nhóm") || role.includes("leader") || role.includes("manager") ||
        !!(item.answers && (
            item.answers["1. Bạn đã kiểm tra chất lượng nội dung video đầu ra của team mình chưa?"] ||
            item.answers["2. Team bạn hôm qua có thành viên nào có video Win nhất?"]
        ));

    return {
        id: item.id,
        name: item.name,
        position: item.position || (isLeaderReport ? "Leader" : "Member"),
        team: item.team,
        avatar: getAvatarUrl(item.avatar, item.name),
        status: item.status,
        submittedAt: item.date,
        email: item.email,
        time: item.date
            ? `${new Date(item.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${new Date(item.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }).replace(/\//g, "-")}`
            : "Chưa báo cáo",
        dailyGoal: item.dailyGoal || 0,
        done: item.done || 0,
        traffic: item.traffic_month ? item.traffic_month.toLocaleString("vi-VN") : "0",
        revenue: item.revenue_month ? item.revenue_month.toLocaleString("vi-VN") : "0",
        monthlyProgress: item.monthlyProgress || 0,
        checklist: {
            fb: item.checklist?.fb || false,
            ig: item.checklist?.ig || false,
            tiktok: item.checklist?.tiktok || false,
            youtube: item.checklist?.youtube || false,
            zalo: item.checklist?.zalo || false,
            lark: item.checklist?.lark || false,
            captionHashtag: item.checklist?.caption || false,
            reportLink: item.answers?.["Báo cáo Lark - Bạn đã gửi link báo cáo video chưa?"] || false,
        },
        videoCount: item.answers
            ? Number(item.answers[Object.keys(item.answers).find((k) => k.toLowerCase().includes("50%")) || ""] || 0)
            : 0,
        task_progress: item.task_progress || null,
        trafficToday: item.trafficToday || null,
        questions: [
            {
                question: isLeaderReport
                    ? "ĐÃ KIỂM TRA CHẤT LƯỢNG VIDEO ĐẦU RA CỦA TEAM CHƯA?"
                    : "NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?",
                answer: isLeaderReport
                    ? item.answers?.["1. Bạn đã kiểm tra chất lượng nội dung video đầu ra của team mình chưa?"] || "Không có"
                    : item.answers?.["1. Ngày hôm qua công việc bạn có cái gì khiến bạn tự hào và thích thú nhất?"] ||
                      item.answers?.["1.Ngày hôm qua công việc bạn có cái gì khiến bạn tự hào và thích thú nhất?"] || "Không có",
            },
            {
                question: isLeaderReport
                    ? "TEAM BẠN HÔM QUA CÓ THÀNH VIÊN NÀO CÓ VIDEO WIN NHẤT?"
                    : "HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?",
                answer: isLeaderReport
                    ? item.answers?.["2. Team bạn hôm qua có thành viên nào có video Win nhất?"] || "Không có"
                    : item.answers?.["2. Hôm qua có đổi mới sáng tạo gì được áp dụng vào công việc của bạn không?"] ||
                      item.answers?.["2. HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỂ ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?"] || "Không có",
            },
            {
                question: isLeaderReport
                    ? "TEAM BẠN HÔM QUA CÓ GÌ ĐỔI MỚI ĐƯỢC ÁP DỤNG KHÔNG?"
                    : "BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?",
                answer: isLeaderReport
                    ? item.answers?.["3. Team bạn hôm qua có gì đổi mới được áp dụng không?"] || "Không có"
                    : item.answers?.["3. Bạn có gặp khó khăn nào cần hỗ trợ không?"] ||
                      item.answers?.["3. BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?"] || "Không có",
            },
            {
                question: isLeaderReport
                    ? "TEAM BẠN CÓ AI TRỄ DEADLINE HÔM QUA KHÔNG? LÝ DO?"
                    : "BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?",
                answer: isLeaderReport
                    ? item.answers?.["4. Team bạn có ai trễ Deadline hôm qua không? Lý do và phương án?"] || "Không có"
                    : item.answers?.["4. Bạn có đóng góp ý tưởng hay đề xuất gì không?"] ||
                      item.answers?.["4. BẠN CÓ ĐÓNG GÓP Ý TƯỞNG HAY ĐỀ XUẤT GÌ KHÔNG?"] || "Không có",
            },
            {
                question: isLeaderReport
                    ? "TEAM BẠN HÔM QUA CÓ SẢN PHẨM NÀO WIN MỚI KHÔNG?"
                    : "BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG?",
                answer: isLeaderReport
                    ? item.answers?.["5. Team bạn hôm qua có sản phẩm nào win mới không? Đã thông tin lên Group New Product chưa?"] || "Không có"
                    : item.answers?.["5. Bạn có sản phẩm (A4 - A5) nào win mới không? (>5k view - >10 CMT hỏi giá?)"] ||
                      item.answers?.["5. Bạn có sản phẩm (A4 - A5) nào win mới không? (>5k view - >10 cmt hỏi giá?)"] ||
                      item.answers?.["5. BẠN CÓ SẢN PHẨM (A4 - A5) NÀO WIN MỚI KHÔNG? (>5K VIEW - >10 CMT HỎI GIÁ?)"] || "Không có",
            },
        ],
    };
};

export function useActivityData({
    user,
    dateRange,
    activeTeam,
    timeType,
    searchName,
    activeTab,
}: UseActivityDataParams): UseActivityDataReturn {
    const [reports, setReports] = React.useState<any[]>([]);
    const [summary, setSummary] = React.useState<any>(null);
    const [rankings, setRankings] = React.useState<any>(null);
    const [teamContributions, setTeamContributions] = React.useState<any[]>([]);
    const [groupContributions, setGroupContributions] = React.useState<any>(null);
    const [reportOutstandings, setReportOutstandings] = React.useState<any[]>([]);
    const [kpiMeta, setKpiMeta] = React.useState<KpiMeta | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [userRole, setUserRole] = React.useState<string | null>(null);
    const [userTeam, setUserTeam] = React.useState<string | null>(null);
    const [personalHistory, setPersonalHistory] = React.useState<PersonalHistory>({
        history: [],
        teamStats: null,
        companyStats: null,
        userActivity: null,
        members: [],
    });

    // Store latest searchName/userRole in refs so fetchHistory doesn't depend on them directly.
    // This prevents re-fetching on every keystroke (Rule 5.15 - useRef for transient values).
    const searchNameRef = useRef(searchName);
    const userRoleRef = useRef(userRole);
    searchNameRef.current = searchName;
    userRoleRef.current = userRole;

    const fetchReports = useCallback(async (showLoading = true) => {
        if (!user?.email) return;
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange?.start) {
                const s = dateRange.start;
                params.append("startDate", `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`);
            }
            if (dateRange?.end) {
                const e = dateRange.end;
                params.append("endDate", `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`);
            }
            if (activeTeam !== "All") params.append("team", activeTeam);
            params.append("requesterEmail", user.email);
            if (timeType) params.append("timeType", timeType);

            const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/lark/user-activity?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.userRole) setUserRole(data.userRole.toLowerCase());
            setUserTeam(data.userTeam || (user as any)?.team || null);
            setReports((data.reports || []).map(mapReportItem));
            setSummary(data.summary || null);
            setRankings(data.rankings || null);
            setTeamContributions(data.teamContributions || []);
            setGroupContributions(data.groupContributions || null);
            setReportOutstandings(data.reportOutstandings || []);
            setKpiMeta(data.meta || null);
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [user?.email, dateRange, activeTeam, timeType]);

    // fetchHistory intentionally only depends on user?.email — searchName/userRole
    // are read from refs so the effect doesn't re-run on every keystroke (Rule 5.15).
    const fetchHistory = useCallback(async () => {
        if (!user?.email) return;
        try {
            const params = new URLSearchParams();
            params.append("email", user.email);
            const role = userRoleRef.current;
            if (searchNameRef.current && (role === "admin" || role === "manager" || role === "leader")) {
                params.append("name", searchNameRef.current);
            }
            const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/lark/personal-history?${params.toString()}`;
            const response = await fetch(url);
            const data = await response.json();
            setPersonalHistory(data);
        } catch (error) {
            console.error("Failed to fetch personal history:", error);
        }
    }, [user?.email]);

    const handleUpdateStatus = useCallback(async (id: string, status: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/lark/update-outstanding-status`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, status, approvedBy: user?.full_name }),
                },
            );
            if (response.ok) {
                setReportOutstandings((prev) =>
                    prev.map((r) =>
                        r.id === id ? { ...r, status, approval_status: status, approved_by: user?.full_name } : r,
                    ),
                );
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    }, [user?.full_name]);

    React.useEffect(() => {
        fetchReports(true);
        const intervalId = setInterval(() => fetchReports(false), 60000);
        return () => clearInterval(intervalId);
    }, [fetchReports]);

    React.useEffect(() => {
        if (activeTab === "personal" || activeTab === "performance") {
            fetchHistory();
        }
    }, [activeTab, fetchHistory]);

    return {
        reports, summary, rankings, teamContributions, groupContributions,
        reportOutstandings, kpiMeta, loading, userRole, userTeam, personalHistory,
        fetchReports, fetchHistory, handleUpdateStatus,
    };
}
