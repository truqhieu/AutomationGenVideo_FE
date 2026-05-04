'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Trash2, RefreshCw, RotateCcw, Plus, Clock, CheckCircle, XCircle, AlertCircle, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { socialApi, SocialPost, PLATFORM_META } from '@/lib/api/social';
import Link from 'next/link';

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ đăng',   color: 'bg-amber-100 text-amber-700',   icon: Clock },
  COMPLETED: { label: 'Đã đăng',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  FAILED:    { label: 'Thất bại',   color: 'bg-red-100 text-red-700',        icon: XCircle },
  CANCELLED: { label: 'Đã huỷ',    color: 'bg-slate-100 text-slate-500',    icon: AlertCircle },
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      const data = await socialApi.schedule.list();
      setPosts(data);
    } catch {
      toast.error('Không tải được danh sách lịch đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(() => {
      // Dừng poll khi tab ẩn — tránh lãng phí API call
      if (!document.hidden) loadPosts();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  const handleCancel = async (id: string) => {
    if (!confirm('Huỷ bài này?')) return;
    setActionId(id);
    try {
      await socialApi.schedule.cancel(id);
      toast.success('Đã huỷ');
      loadPosts();
    } catch {
      toast.error('Không thể huỷ');
    } finally {
      setActionId(null);
    }
  };

  const handleRetry = async (id: string) => {
    setActionId(id);
    try {
      await socialApi.schedule.retry(id);
      toast.success('Đã đưa vào hàng chờ đăng lại');
      loadPosts();
    } catch {
      toast.error('Retry thất bại');
    } finally {
      setActionId(null);
    }
  };

  const groupByStatus = (status: string) => posts.filter((p) => p.status === status);
  const pending   = groupByStatus('PENDING');
  const completed = groupByStatus('COMPLETED');
  const failed    = groupByStatus('FAILED');
  const cancelled = groupByStatus('CANCELLED');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lịch đăng bài</h1>
              <p className="text-slate-500 mt-1">Quản lý các bài đăng đã lên lịch</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/social/calendar"
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold transition-colors"
              >
                <LayoutGrid className="w-4 h-4" /> Xem lịch
              </Link>
              <Link
                href="/dashboard/social/compose"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" /> Lên lịch mới
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5">
            {[
              { label: 'Chờ đăng', count: pending.length,   color: 'text-amber-600' },
              { label: 'Thành công', count: completed.length, color: 'text-emerald-600' },
              { label: 'Thất bại',  count: failed.length,    color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl pt-6 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có bài nào lên lịch</h3>
            <p className="text-slate-500 mb-6">Tạo bài đăng và chọn thời gian đăng tự động</p>
            <Link href="/dashboard/social/compose" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
              Soạn bài ngay
            </Link>
          </div>
        ) : (
          <>
            {[
              { title: `Chờ đăng (${pending.length})`, items: pending },
              { title: `Thất bại (${failed.length})`,  items: failed },
              { title: `Đã hoàn thành (${completed.length})`, items: completed },
              { title: `Đã huỷ (${cancelled.length})`, items: cancelled },
            ]
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <div key={group.title}>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{group.title}</h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {group.items.map((post) => {
                        const meta = PLATFORM_META[post.platform];
                        const cfg  = STATUS_CONFIG[post.status];
                        const Icon = cfg.icon;

                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 ${meta.color} rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0`}>
                                {meta.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-slate-900 text-sm">{meta.label}</span>
                                  {post.account && <span className="text-xs text-slate-400">· {post.account.name}</span>}
                                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                                    <Icon className="w-3 h-3" />{cfg.label}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 line-clamp-2">{post.message}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                  {post.scheduled_at && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(post.scheduled_at).toLocaleString('vi')}
                                    </span>
                                  )}
                                  {post.error_msg && <span className="text-red-400 truncate">{post.error_msg}</span>}
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {post.status === 'FAILED' && (
                                  <button
                                    onClick={() => handleRetry(post.id)}
                                    disabled={actionId === post.id}
                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                    title="Thử lại"
                                  >
                                    {actionId === post.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                  </button>
                                )}
                                {post.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleCancel(post.id)}
                                    disabled={actionId === post.id}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    title="Huỷ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
