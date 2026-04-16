"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Play, X,
  Video, Search, FileVideo, ChevronUp, ChevronDown,
  Users, Activity, Layout, Grid, List, ArrowLeft,
  Calendar, User, ShieldCheck, AlertCircle, TrendingUp,
  Target, FileText, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { Card } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = "ALL" | "pending" | "approved" | "rejected";
type SortKey = "created_at" | "employee_name" | "team" | "status";
type SortDir = "asc" | "desc";
type ViewMode = "TABLE" | "GRID";

interface LarkTask {
  id: string;
  caption: string | null;
  deadline: string | null;
  file_content_url: string | null;
  file_content_name: string | null;
  employee_name: string | null;
  employee_email: string | null;
  avatar_url?: string | null;
  team: string | null;
  status: string | null;
  content_type: string | null;
  product_name: string | null;
  created_at: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTitle = (t: LarkTask) =>
  t.file_content_name ?? t.caption ?? t.product_name ?? "Chưa có tiêu đề";

const getStatusLabel = (s: string | null) => {
  if (!s || s === "pending") return "CHỜ DUYỆT";
  if (s === "approved") return "ĐÃ DUYỆT";
  return "TỪ CHỐI";
};

const getStatusCls = (s: string | null) => {
  if (!s || s === "pending") return "bg-amber-500 text-white border-amber-500";
  if (s === "approved") return "bg-emerald-600 text-white border-emerald-600";
  return "bg-red-600 text-white border-red-600";
};

const getAvatarUrl = (url: string | null | undefined, name: string | null) => {
  if (!url) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? "?")}&background=random`;
  return url;
};

// ─── Components ─────────────────────────────────────────────────────────────

function VideoReviewCard({ task, onClick, onApprove, onReject, actionLoading }: { 
  task: LarkTask; 
  onClick: () => void;
  onApprove: (id: string) => void;
  onReject: (task: LarkTask) => void;
  actionLoading: string | null;
}) {
  const isPending = !task.status || task.status === "pending";
  const isApproved = task.status === "approved";
  const isRejected = task.status === "rejected";
  const isLoad = actionLoading === task.id;

  // Status-based styling matching Personal Progress Card
  let colorStyle = {
    card: "border-slate-200 border-[3px] bg-white hover:bg-slate-50",
    icon: "text-slate-500",
    badge: "bg-slate-600",
    accent: "bg-slate-50"
  };

  if (isPending) {
    colorStyle = {
      card: "border-amber-500 border-[3px] bg-amber-50/40 hover:bg-amber-50/60 shadow-[0_8px_30px_rgba(245,158,11,0.08)]",
      icon: "text-amber-500",
      badge: "bg-amber-500",
      accent: "bg-amber-50"
    };
  } else if (isApproved) {
    colorStyle = {
      card: "border-emerald-500 border-[3px] bg-emerald-50/70 hover:bg-emerald-50/90 shadow-[0_8px_30px_rgba(16,185,129,0.1)]",
      icon: "text-emerald-500",
      badge: "bg-emerald-600",
      accent: "bg-emerald-100"
    };
  } else if (isRejected) {
    colorStyle = {
      card: "border-red-500 border-[3px] bg-red-50/40 hover:bg-red-50/60 shadow-[0_8px_30px_rgba(239,68,68,0.08)]",
      icon: "text-red-500",
      badge: "bg-red-600",
      accent: "bg-red-50"
    };
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={cn(
        "relative rounded-[2rem] overflow-hidden transition-all duration-300 cursor-pointer p-5 flex flex-col",
        colorStyle.card
      )}
    >
      {/* Visual Content (Thumbnail/Icon) - Top Center like Avatar */}
      <div className="absolute top-0 left-0 pointer-events-none opacity-10 filter grayscale">
         <Video className="w-40 h-40 scale-150 rotate-12" />
      </div>

      <div className="flex flex-col items-center relative z-10">
        {/* Status Icon */}
        <div className="absolute top-0 right-0">
          <div className={cn("p-2.5 rounded-2xl border bg-white shadow-sm", isApproved ? "border-emerald-200" : isRejected ? "border-red-200" : "border-amber-200")}>
             {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : isRejected ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
          </div>
        </div>

        {/* Video Thumbnail Surrogate */}
        <div className="mt-2 mb-4">
           <div className={cn("w-20 h-20 rounded-[1.5rem] border-2 p-1 bg-white overflow-hidden shadow-sm flex items-center justify-center", isApproved ? "border-emerald-500 ring-4 ring-emerald-50" : isRejected ? "border-red-500 ring-4 ring-red-50" : "border-amber-500 ring-4 ring-amber-50")}>
              {task.file_content_url ? (
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-white/50">
                   <Play className="w-8 h-8" />
                </div>
              ) : (
                <FileVideo className="w-10 h-10 text-slate-200" />
              )}
           </div>
        </div>

        <div className="text-center mb-6 w-full">
           <h4 className="text-sm font-black text-slate-800 tracking-tight leading-tight mb-2 truncate px-2">{getTitle(task)}</h4>
           <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[10px] font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-sm flex items-center gap-1 uppercase tracking-wider">
                {task.team || "Team VN"}
              </span>
              <span className="text-[10px] font-black text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> {task.employee_name}
              </span>
           </div>
        </div>

        {/* Metrics Grid Style */}
        <div className="w-full grid grid-cols-1 gap-2 mb-5">
           <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Gửi ngày</span>
              </div>
              <span className="text-xs font-black text-slate-800">{new Date(task.created_at).toLocaleDateString("vi-VN")}</span>
           </div>
           
           <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Phân loại</span>
              </div>
              <span className="text-xs font-black text-blue-600 uppercase truncate max-w-[100px]">{task.content_type || "Video Content"}</span>
           </div>
        </div>

        {/* Main Status Badge */}
        <div className="w-full">
           <div className={cn(
             "w-full py-3 rounded-full text-[13px] font-black uppercase tracking-[0.2em] shadow-lg text-center transition-all",
             isApproved ? "bg-emerald-600 text-white shadow-emerald-200/50" : isRejected ? "bg-red-600 text-white shadow-red-200/50" : "bg-amber-500 text-white shadow-amber-200/50"
           )}>
             {isPending ? "ĐANG CHỜ" : isApproved ? "ĐÃ DUYỆT" : "TỪ CHỐI"}
           </div>
        </div>

        {/* Quick Actions if pending */}
        {isPending && (
          <div className="grid grid-cols-2 w-full gap-2 mt-4 px-1">
             <button 
                onClick={(e) => { e.stopPropagation(); onApprove(task.id); }}
                disabled={isLoad}
                className="bg-white py-3 rounded-2xl border border-emerald-100 shadow-sm text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 transition-colors"
             >
               DUYỆT
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); onReject(task); }}
                disabled={isLoad}
                className="bg-white py-3 rounded-2xl border border-red-100 shadow-sm text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-50 transition-colors"
             >
               LOẠI
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RejectDialog({ taskName, onConfirm, onCancel, loading }: {
  taskName: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-[2.5rem] bg-white p-10 shadow-2xl border border-slate-100"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-50 text-red-500 shadow-inner">
            <XCircle className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Từ chối video?</h3>
          <p className="mt-3 text-[11px] font-black text-slate-400 line-clamp-2 px-2 uppercase tracking-widest">{taskName}</p>
        </div>
        
        <p className="mb-10 text-center text-sm font-bold text-slate-600 leading-relaxed px-2">
          Hành động này sẽ gửi thông báo từ chối cho người thực hiện. Bạn chắc chắn chứ?
        </p>

        <div className="flex gap-4">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-2xl border-2 border-slate-100 py-4 text-xs font-black text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] disabled:opacity-50">
            HỦY
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 rounded-2xl bg-red-600 py-4 text-xs font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all uppercase tracking-[0.2em] disabled:opacity-50">
            XÁC NHẬN
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

const TABS: { key: TabFilter; label: string; statsKey: keyof ReviewStats }[] = [
  { key: "ALL",      label: "TỔNG CỘNG",      statsKey: "total"    },
  { key: "pending",  label: "CHỜ DUYỆT",  statsKey: "pending"  },
  { key: "approved", label: "ĐÃ DUYỆT",   statsKey: "approved" },
  { key: "rejected", label: "TỪ CHỐI",    statsKey: "rejected" },
];

export function LeaderVideoReview() {
  const [tasks, setTasks]                 = useState<LarkTask[]>([]);
  const [stats, setStats]                 = useState<ReviewStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab]         = useState<TabFilter>("ALL");
  const [viewMode, setViewMode]           = useState<ViewMode>("GRID");
  const [selectedVideo, setSelectedVideo] = useState<LarkTask | null>(null);
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<LarkTask | null>(null);
  const [sortKey, setSortKey]             = useState<SortKey>("created_at");
  const [sortDir, setSortDir]             = useState<SortDir>("desc");

  const fetchData = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (status && status !== "ALL") params.status = status;
      const [vRes, sRes] = await Promise.all([
        apiClient.get("/videos/review-list", { params }),
        apiClient.get("/videos/review-stats"),
      ]);
      setTasks(vRes.data.videos ?? []);
      setStats(sRes.data.stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(activeTab); }, [activeTab, fetchData]);

  const approve = async (id: string) => {
    try {
      setActionLoading(id);
      await apiClient.patch(`/videos/lark-task/${id}/review`, { action: "APPROVED" });
      if (selectedVideo?.id === id) {
        setSelectedVideo(prev => prev ? { ...prev, status: "approved" } : null);
      }
      await fetchData(activeTab);
    } catch (e: any) { alert(e?.response?.data?.message ?? "Lỗi"); }
    finally { setActionLoading(null); }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoading(rejectTarget.id);
      await apiClient.patch(`/videos/lark-task/${rejectTarget.id}/review`, { action: "REJECTED" });
      if (selectedVideo?.id === rejectTarget.id) {
        setSelectedVideo(prev => prev ? { ...prev, status: "rejected" } : null);
      }
      setRejectTarget(null);
      await fetchData(activeTab);
    } catch (e: any) { alert(e?.response?.data?.message ?? "Lỗi"); }
    finally { setActionLoading(null); }
  };

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
  };

  const getSortIcon = (k: SortKey) => {
    if (sortKey !== k) return <ChevronDown className="w-3 h-3 opacity-20 group-hover:opacity-50 transition-all" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-4 h-4 text-white" />
      : <ChevronUp className="w-4 h-4 text-white" />;
  };

  const sortedAndFiltered = useMemo(() => {
    return tasks
      .filter(t => {
        if (!search) return true;
        const q = search.toLowerCase();
        return getTitle(t).toLowerCase().includes(q)
          || (t.employee_name ?? "").toLowerCase().includes(q)
          || (t.team ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const val = (t: LarkTask) =>
          sortKey === "created_at"    ? t.created_at :
          sortKey === "employee_name" ? (t.employee_name ?? "") :
          sortKey === "team"          ? (t.team ?? "") :
          (t.status ?? "");
        const aVal = val(a);
        const bVal = val(b);
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [tasks, search, sortKey, sortDir]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 min-h-[600px] pb-20 relative">
      
      {/* Decorative Background Elements - like PersonalCharts */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-[120px] -z-10" />
      
      <AnimatePresence mode="wait">
        {selectedVideo ? (
          <motion.div
            key="detailed-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* Header - EXACT SAME as PersonalCharts detailed-view header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="group relative z-[70] cursor-pointer flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-800">Quay lại danh sách</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none truncate max-w-[400px] uppercase">{getTitle(selectedVideo)}</h2>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-[0.25em] leading-none mt-2 inline-block">{selectedVideo.team || 'Cá nhân'}</span>
                </div>
                <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-300">
                  <Video className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Quick Summary Cards - EXACT SAME as PersonalCharts 4-cards summary */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-5"
            >
                {[
                    { label: 'Người thực hiện', value: selectedVideo.employee_name || "—", icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Ngày gửi lên', value: new Date(selectedVideo.created_at).toLocaleDateString("vi-VN"), icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Phân loại content', value: selectedVideo.content_type || "Video", icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Sản phẩm/Task', value: selectedVideo.product_name || "—", icon: Layout, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map((stat, i) => (
                    <Card key={i} className="p-5 rounded-[2rem] border-none shadow-xl bg-white/70 backdrop-blur-sm group hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} shadow-sm group-hover:rotate-6 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-tight mb-1">{stat.label}</p>
                                <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Main Content Area - Layout structure like Charts area */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="rounded-[3rem] overflow-hidden border-none shadow-[0_45px_70px_-15px_rgba(0,0,0,0.2)] bg-slate-900 group relative">
                  <div className="aspect-video w-full flex items-center justify-center overflow-hidden">
                    {selectedVideo.file_content_url ? (
                      <video 
                        src={selectedVideo.file_content_url} 
                        controls 
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-6 text-slate-500">
                        <div className="p-8 rounded-[3rem] bg-white/5 backdrop-blur-md border border-white/10">
                          <FileVideo className="h-20 w-20 opacity-40 animate-pulse" />
                        </div>
                        <span className="font-black uppercase tracking-[0.3em] text-[11px] text-slate-400">Nguồn video không khả dụng</span>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Additional Info / Description Section */}
                <Card className="p-8 rounded-[2.5rem] border-none shadow-2xl bg-white bg-gradient-to-br from-white to-blue-50/20">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                         <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Nội dung & Ghi chú</h3>
                        <p className="text-sm font-black text-slate-800 tracking-tight uppercase">Thông tin bổ sung từ thành viên</p>
                      </div>
                   </div>
                   <div className="space-y-4 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                      {selectedVideo.caption || "Thành viên không gửi kèm ghi chú cụ thể cho video này."}
                   </div>
                </Card>
              </div>

              {/* Sidebar Area - Control Panel */}
              <div className="space-y-8">
                <Card className="p-8 rounded-[3rem] border-none shadow-2xl bg-white space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> TRẠNG THÁI VIDEO
                    </h3>
                    <div className={cn(
                      "w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.3em] shadow-xl transition-all border-4",
                      selectedVideo.status === "approved" ? "bg-emerald-600 text-white border-emerald-100 shadow-emerald-200" : selectedVideo.status === "rejected" ? "bg-red-600 text-white border-red-100 shadow-red-200" : "bg-amber-500 text-white border-amber-100 shadow-amber-200"
                    )}>
                      {selectedVideo.status === "approved" ? <CheckCircle2 className="w-5 h-5" /> : selectedVideo.status === "rejected" ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      {getStatusLabel(selectedVideo.status)}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       <Activity className="w-4 h-4" /> CHI TIẾT CÔNG VIỆC
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: "Email", value: selectedVideo.employee_email || "N/A", icon: Users, color: 'text-slate-500' },
                        { label: "Hạn chót", value: selectedVideo.deadline || "Không có", icon: TrendingUp, color: 'text-orange-500' },
                        { label: "Lúc tạo", value: new Date(selectedVideo.created_at).toLocaleTimeString("vi-VN"), icon: Clock, color: 'text-blue-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-[1.25rem] bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("w-4 h-4", item.color)} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{item.label}</span>
                          </div>
                          <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(!selectedVideo.status || selectedVideo.status === "pending") && (
                    <div className="space-y-4 pt-8 border-t border-slate-100">
                      <button 
                         onClick={() => approve(selectedVideo.id)}
                         disabled={!!actionLoading}
                         className="w-full py-5 rounded-[2rem] bg-emerald-600 text-white font-black uppercase tracking-[0.3em] text-xs shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)] hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                         <CheckCircle className="w-5 h-5" /> PHÊ DUYỆT NGAY
                      </button>
                      <button 
                         onClick={() => setRejectTarget(selectedVideo)}
                         disabled={!!actionLoading}
                         className="w-full py-5 rounded-[2rem] bg-red-50 text-red-600 border-2 border-red-100 font-black uppercase tracking-[0.3em] text-xs hover:bg-red-100 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                         <XCircle className="w-5 h-5" /> TỪ CHỐI VIDEO
                      </button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {/* ═══ STATS BAR — Enhanced Depth ═══ */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[2.5rem] border border-blue-100/50 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12),0_0_20px_rgba(37,99,235,0.05)] bg-white/80 backdrop-blur-3xl relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 -z-10" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl opacity-50" />

              <div className="flex flex-col md:flex-row items-stretch">
                {/* Stat Grid */}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 divide-x divide-blue-50/50">
                  {[
                    { label: "Tổng video", icon: Video, color: "from-blue-500 to-blue-600", textColor: "text-blue-600", value: stats.total, unit: "VCB SYSTEM" },
                    { label: "Chờ duyệt", icon: Clock, color: "from-amber-400 to-amber-500", textColor: "text-amber-600", value: stats.pending, unit: "PENDING" },
                    { label: "Đã duyệt", icon: CheckCircle, color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-600", value: stats.approved, unit: "APPROVED" },
                    { label: "Từ chối", icon: XCircle, color: "from-red-500 to-red-600", textColor: "text-red-600", value: stats.rejected, unit: "REJECTED" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-8 hover:bg-blue-50/30 transition-all duration-500 group relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-4xl font-black ${item.textColor} tracking-tighter tabular-nums drop-shadow-sm group-hover:scale-[1.05] origin-left transition-transform duration-500`}>
                            {loading ? "—" : item.value}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-tight opacity-70">
                            {item.unit}
                          </span>
                        </div>
                      </div>
                      <div className={cn("absolute bottom-0 left-0 w-0 group-hover:w-full h-1.5 bg-gradient-to-r transition-all duration-1000 opacity-70", item.color)} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ═══ CONTROL BAR — Enhanced Depth ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-6 px-1">
              <div className="flex items-center gap-2 p-2 bg-white rounded-[2rem] border border-blue-50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12),0_0_15px_rgba(37,99,235,0.05)] overflow-hidden">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.5rem] px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
                      activeTab === tab.key
                        ? "bg-blue-600 text-white shadow-[0_15px_30px_-5px_rgba(37,99,235,0.5)] scale-[1.05] z-10"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      "rounded-lg px-2.5 py-1 text-[9px] font-black leading-none",
                      activeTab === tab.key ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500",
                    )}>
                      {stats[tab.statsKey]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="TÌM THEO TÊN, TEAM..."
                    className="h-16 w-80 rounded-[2rem] border border-blue-50 bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] pl-16 pr-6 text-xs font-black outline-none focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-slate-300 placeholder:font-black uppercase tracking-widest"
                  />
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-[2rem] border border-blue-50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
                  <button 
                    onClick={() => setViewMode("GRID")}
                    className={cn("p-3.5 rounded-[1.5rem] transition-all", viewMode === "GRID" ? "bg-blue-600 text-white shadow-xl" : "text-slate-300 hover:text-slate-500")}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode("TABLE")}
                    className={cn("p-3.5 rounded-[1.5rem] transition-all", viewMode === "TABLE" ? "bg-blue-600 text-white shadow-xl" : "text-slate-300 hover:text-slate-500")}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ CONTENT AREA ═══ */}
            <AnimatePresence mode="wait">
              {loading ? (
                <div key="loading" className="flex flex-col items-center justify-center py-40 space-y-6">
                   <div className="h-16 w-16 animate-spin rounded-[1.5rem] border-4 border-blue-600 border-t-transparent shadow-2xl shadow-blue-200" />
                   <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">ĐANG TRUY XUẤT DỮ LIỆU...</span>
                </div>
              ) : sortedAndFiltered.length === 0 ? (
                <motion.div 
                  key="empty" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex flex-col items-center justify-center py-40 bg-white/50 backdrop-blur-sm rounded-[4rem] border-4 border-dashed border-slate-100/50"
                >
                  <div className="p-10 rounded-[3rem] bg-slate-50 text-slate-300 mb-6 ring-[20px] ring-slate-50/30">
                    <Video className="h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.3em]">TRỐNG RỖNG</h3>
                  <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">KHÔNG TÌM THẤY VIDEO NÀO PHÙ HỢP VỚI BỘ LỌC</p>
                </motion.div>
              ) : viewMode === "GRID" ? (
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8"
                >
                  {sortedAndFiltered.map(task => (
                    <VideoReviewCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => setSelectedVideo(task)}
                      onApprove={approve}
                      onReject={setRejectTarget}
                      actionLoading={actionLoading}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="table"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/70 backdrop-blur-md rounded-[3rem] border border-blue-50 shadow-2xl shadow-blue-900/5 overflow-hidden"
                >
                  <div className="overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 z-20">
                        <tr className="bg-blue-600 shadow-xl">
                          <th className="px-8 py-5 text-[11px] font-black text-white/70 uppercase tracking-[0.2em] w-16 text-center border-r border-white/10">STT</th>
                          <th className="px-8 py-5 text-[11px] font-black text-white uppercase tracking-[0.3em] border-r border-white/10">NỘI DUNG VIDEO</th>
                          {(["employee_name", "team", "created_at", "status"] as SortKey[]).map((k) => (
                            <th
                              key={k}
                              onClick={() => handleSort(k)}
                              className="px-8 py-5 text-[11px] font-black text-white uppercase tracking-[0.2em] border-r border-white/10 cursor-pointer hover:bg-blue-700 transition-colors group"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{k === "employee_name" ? "THÀNH VIÊN" : k === "team" ? "NHÓM TEAM" : k === "created_at" ? "NGÀY GỬI" : "TRÌNH TRẠNG"}</span>
                                {getSortIcon(k)}
                              </div>
                            </th>
                          ))}
                          <th className="px-8 py-5 text-[11px] font-black text-white uppercase tracking-[0.2em] text-center">HÀNH ĐỘNG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedAndFiltered.map((task, idx) => {
                          const isPending = !task.status || task.status === "pending";
                          const isLoad = actionLoading === task.id;
                          return (
                            <tr key={task.id} className="hover:bg-blue-50/40 transition-all duration-300 group">
                              <td className="px-8 py-6 text-[12px] font-black text-slate-400 text-center">{idx + 1}</td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-5">
                                  <div className="w-16 h-12 rounded-[1.25rem] bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm overflow-hidden">
                                    <Video className="w-6 h-6 text-slate-400 group-hover:text-white" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="max-w-[220px] truncate text-sm font-black text-slate-800 tracking-tight leading-none group-hover:text-blue-600 transition-colors uppercase">{getTitle(task)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-[0.15em]">{task.content_type || "No Category"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3.5">
                                  <img 
                                    src={getAvatarUrl(task.avatar_url, task.employee_name)} 
                                    className="w-9 h-9 rounded-xl ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all duration-500 shadow-sm" 
                                    alt="" 
                                  />
                                  <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">{task.employee_name}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className={cn(
                                  "px-4 py-1.5 rounded-xl border font-black text-[11px] uppercase tracking-widest flex items-center gap-2 w-fit",
                                  task.team?.toLowerCase().includes("việt nam") ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                  {task.team || "CHƯA RÕ"}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-[12px] font-black text-slate-600 tabular-nums">{new Date(task.created_at).toLocaleDateString("vi-VN")}</td>
                              <td className="px-8 py-6">
                                <span className={cn(
                                  "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm",
                                  isPending ? "bg-amber-500 text-white border-amber-400" : task.status === "approved" ? "bg-emerald-600 text-white border-emerald-500" : "bg-red-600 text-white border-red-500"
                                )}>
                                  {isPending ? <Clock className="h-4 w-4" /> : task.status === "approved" ? <ShieldCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                  {getStatusLabel(task.status)}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center justify-center gap-3">
                                  <button onClick={() => setSelectedVideo(task)} className="p-3.5 rounded-[1.25rem] border-2 border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm active:scale-90">
                                    <Play className="w-5 h-5" />
                                  </button>
                                  {isPending && (
                                    <>
                                      <button onClick={() => approve(task.id)} disabled={isLoad} className="px-5 py-3 rounded-[1.25rem] bg-emerald-600 text-[11px] font-black text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all uppercase tracking-widest disabled:opacity-50">DUYỆT</button>
                                      <button onClick={() => setRejectTarget(task)} disabled={isLoad} className="px-5 py-3 rounded-[1.25rem] bg-red-600 text-[11px] font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all uppercase tracking-widest disabled:opacity-50">LOẠI</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">HIỂN THỊ <span className="text-blue-600">{sortedAndFiltered.length}</span> / {tasks.length} VIDEO HỆ THỐNG</p>
                    <div className="flex items-center gap-3">
                       <TrendingUp className="w-4 h-4 text-emerald-500" />
                       <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">REAL-TIME SYSTEM MONITOR</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectDialog 
            taskName={getTitle(rejectTarget)} 
            onConfirm={confirmReject}
            onCancel={() => setRejectTarget(null)} 
            loading={actionLoading === rejectTarget.id} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
