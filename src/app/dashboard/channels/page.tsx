'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, X, Loader2, Link as LinkIcon,
  Facebook, Instagram, Music2, Youtube, Globe,
  Pencil, Trash2, ExternalLink, Building2,
  ChevronDown, Tag, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';

interface Channel {
  id: string;
  name: string;
  platform?: string | null;
  channel_id?: string | null;
  link_channel?: string | null;
  status?: string | null;
  team_traffic?: string | null;
  owner?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

interface ChannelFormData {
  name: string; platform: string; channel_id: string;
  link_channel: string; status: string; owner: string; email: string;
}

const EMPTY_FORM: ChannelFormData = {
  name: '', platform: 'facebook', channel_id: '',
  link_channel: '', status: 'active', owner: '', email: '',
};

const PLATFORMS = [
  { value: 'all',       label: 'Tất cả',    icon: Globe,     iconColor: 'text-slate-400',  pillBg: 'bg-slate-100',   pillText: 'text-slate-600',  activeBg: 'bg-slate-800 text-white'  },
  { value: 'facebook',  label: 'Facebook',  icon: Facebook,  iconColor: 'text-blue-500',   pillBg: 'bg-blue-50',     pillText: 'text-blue-700',   activeBg: 'bg-blue-600 text-white'   },
  { value: 'instagram', label: 'Instagram', icon: Instagram, iconColor: 'text-fuchsia-500', pillBg: 'bg-fuchsia-50', pillText: 'text-fuchsia-700', activeBg: 'bg-fuchsia-600 text-white' },
  { value: 'tiktok',    label: 'TikTok',    icon: Music2,    iconColor: 'text-slate-700',  pillBg: 'bg-slate-100',   pillText: 'text-slate-700',  activeBg: 'bg-slate-700 text-white'  },
  { value: 'youtube',   label: 'YouTube',   icon: Youtube,   iconColor: 'text-red-500',    pillBg: 'bg-red-50',      pillText: 'text-red-700',    activeBg: 'bg-red-600 text-white'    },
];

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active:              { label: 'Hoạt động',       dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'đang hoạt động':    { label: 'Đang hoạt động',  dot: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800' },

  inactive:            { label: 'Ngừng hoạt động', dot: 'bg-red-500',     bg: 'bg-red-100',     text: 'text-red-800'    },
  'ngừng hoạt động':   { label: 'Ngừng hoạt động', dot: 'bg-red-500',     bg: 'bg-red-100',     text: 'text-red-800'    },

  'tạm ngừng':         { label: 'Tạm ngừng',       dot: 'bg-orange-400',  bg: 'bg-orange-100',  text: 'text-orange-800' },

  'hủy kênh':          { label: 'Hủy kênh',        dot: 'bg-slate-500',   bg: 'bg-slate-200',   text: 'text-slate-700'  },

  pending:             { label: 'Chờ duyệt',        dot: 'bg-amber-400',   bg: 'bg-amber-100',   text: 'text-amber-800'  },
  'chờ duyệt':         { label: 'Chờ duyệt',        dot: 'bg-amber-400',   bg: 'bg-amber-100',   text: 'text-amber-800'  },
};

function getPlatform(v?: string | null) {
  return PLATFORMS.find(p => p.value === v?.toLowerCase()) ?? PLATFORMS[0];
}
function getStatus(v?: string | null) {
  return STATUS_MAP[v?.toLowerCase() ?? ''] ?? { label: v ?? '—', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-500' };
}

export default function InternalChannelsPage() {
  const { token, user } = useAuthStore();
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
  const isLeader = (user as any)?.roles?.includes(UserRole.LEADER);
  const userTeam = (user as any)?.team ?? null;

  const [channels,     setChannels]     = useState<Channel[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [platFilter,   setPlatFilter]   = useState('all');
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Channel | null>(null);
  const [form,         setForm]         = useState<ChannelFormData>(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: Channel[] = await res.json();
      const teamFiltered = userTeam ? data.filter(c => c.team_traffic === userTeam) : data;
      setChannels(teamFiltered);
    } catch { toast.error('Không thể tải danh sách kênh'); }
    finally { setLoading(false); }
  }, [apiUrl, token, userTeam]);

  useEffect(() => { fetchChannels(); }, [fetchChannels]);

  const filtered = channels.filter(c => {
    const okPlat   = platFilter === 'all' || c.platform?.toLowerCase() === platFilter;
    const q        = search.toLowerCase();
    const okSearch = !q || c.name.toLowerCase().includes(q)
      || c.channel_id?.toLowerCase().includes(q)
      || c.owner?.toLowerCase().includes(q);
    return okPlat && okSearch;
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      owner: (user as any)?.name ?? (user as any)?.username ?? '',
      email: (user as any)?.email ?? '',
    });
    setShowModal(true);
  };
  const openEdit   = (ch: Channel) => {
    setEditTarget(ch);
    setForm({ name: ch.name, platform: ch.platform ?? 'facebook', channel_id: ch.channel_id ?? '',
      link_channel: ch.link_channel ?? '', status: ch.status ?? 'active',
      owner: ch.owner ?? '', email: ch.email ?? '' });
    setShowModal(true);
  };
  const closeModal = () => { if (saving) return; setShowModal(false); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Tên kênh không được để trống'); return; }
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const res = await fetch(
        isEdit ? `${apiUrl}/channels/${editTarget!.id}` : `${apiUrl}/channels`,
        { method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form) },
      );
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Lưu thất bại'); return; }
      toast.success(isEdit ? 'Đã cập nhật kênh' : 'Đã thêm kênh mới');
      closeModal(); fetchChannels();
    } catch { toast.error('Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiUrl}/channels/${deleteTarget.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Xóa thất bại'); return; }
      toast.success('Đã xóa kênh'); setDeleteTarget(null); fetchChannels();
    } catch { toast.error('Có lỗi xảy ra'); }
    finally { setDeleting(false); }
  };

  // Input class reuse
  const inputCls = "w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all";
  const labelCls = "block text-sm font-bold text-slate-600 mb-2 tracking-wide";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ─── HERO HEADER ─── */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 pt-6 pb-0">

          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Kênh nội bộ</h1>
                <p className="text-base text-slate-400 mt-1">
                  {userTeam
                    ? <span>Team <span className="font-semibold text-slate-600">{userTeam}</span> · {channels.length} kênh</span>
                    : `${channels.length} kênh đang quản lý`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {/* Search */}
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kênh, username, owner…"
                  className="pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white w-72 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isLeader && (
                <button onClick={openCreate}
                  className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap">
                  <Plus className="w-5 h-5" />
                  Thêm kênh
                </button>
              )}
            </div>
          </div>

          {/* Platform filter bar — full width, flush to bottom */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0 no-scrollbar">
            {PLATFORMS.map(p => {
              const count = p.value === 'all' ? channels.length
                : channels.filter(c => c.platform?.toLowerCase() === p.value).length;
              const active = platFilter === p.value;
              return (
                <button key={p.value} onClick={() => setPlatFilter(p.value)}
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold whitespace-nowrap border-b-2 transition-all
                    ${active
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-600'
                      : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'}`}>
                  <p.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : p.iconColor}`} />
                  {p.label}
                  <span className={`text-sm px-2.5 py-0.5 rounded-full font-bold
                    ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="max-w-6xl mx-auto px-8 pt-8">

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white border border-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && channels.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
              <Building2 className="w-12 h-12 text-indigo-300" />
            </div>
            <p className="text-2xl font-bold text-slate-700 mb-2">Chưa có kênh nào</p>
            <p className="text-base text-slate-400 mb-10 text-center max-w-sm">
              {isLeader
                ? 'Thêm kênh mạng xã hội đầu tiên của team để bắt đầu quản lý.'
                : 'Team chưa có kênh nào được thêm vào hệ thống.'}
            </p>
            {isLeader && (
              <button onClick={openCreate}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:-translate-y-0.5">
                <Plus className="w-5 h-5" /> Thêm kênh ngay
              </button>
            )}
          </motion.div>
        )}

        {/* Table */}
        {!loading && channels.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Column headers */}
            <div className={`grid px-7 py-4 border-b border-slate-100 bg-slate-50
              ${isLeader
                ? 'grid-cols-[2fr_1fr_1fr_1fr_88px]'
                : 'grid-cols-[2fr_1fr_1fr_1fr]'} gap-6`}>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tên kênh</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Owner</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trạng thái</span>
              {isLeader && <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</span>}
            </div>

            {/* No results */}
            {filtered.length === 0 ? (
              <div className="py-24 flex flex-col items-center text-slate-400">
                <Search className="w-12 h-12 mb-4 opacity-25" />
                <p className="text-lg font-bold text-slate-500">Không tìm thấy kênh nào</p>
                <p className="text-sm mt-2 text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                {search && (
                  <button onClick={() => setSearch('')}
                    className="mt-5 text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Xóa tìm kiếm
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map((ch, idx) => {
                  const plat = getPlatform(ch.platform);
                  const stat = getStatus(ch.status);
                  return (
                    <motion.div key={ch.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`grid px-7 py-5 items-center hover:bg-slate-50/80 transition-colors group
                        ${isLeader
                          ? 'grid-cols-[2fr_1fr_1fr_1fr_88px]'
                          : 'grid-cols-[2fr_1fr_1fr_1fr]'} gap-6`}>

                      {/* Name + ID */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl ${plat.pillBg} flex items-center justify-center flex-shrink-0`}>
                          <plat.icon className={`w-6 h-6 ${plat.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-bold text-slate-800 truncate">{ch.name}</p>
                            {ch.link_channel && (
                              <a href={ch.link_channel} target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-indigo-500">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          {ch.channel_id && (
                            <p className="text-sm text-slate-400 mt-0.5 truncate">@{ch.channel_id}</p>
                          )}
                        </div>
                      </div>

                      {/* Platform badge */}
                      <div>
                        <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold ${plat.pillBg} ${plat.pillText}`}>
                          <plat.icon className="w-4 h-4" />
                          {plat.value !== 'all' ? plat.label : ch.platform ?? '—'}
                        </span>
                      </div>

                      {/* Owner */}
                      <div>
                        {ch.owner
                          ? <span className="text-base font-medium text-slate-600">{ch.owner}</span>
                          : <span className="text-base text-slate-300">—</span>}
                      </div>

                      {/* Status badge */}
                      <div>
                        <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold ${stat.bg} ${stat.text}`}>
                          <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
                          {stat.label}
                        </span>
                      </div>

                      {/* Actions */}
                      {isLeader && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(ch)}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Sửa kênh">
                            <Pencil className="w-4.5 h-4.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(ch)}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            title="Xóa kênh">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Table footer */}
            <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <p className="text-sm text-slate-400 font-medium">
                {filtered.length < channels.length
                  ? <>Đang lọc <span className="font-bold text-slate-600">{filtered.length}</span> / {channels.length} kênh</>
                  : <>{channels.length} kênh · Team <span className="font-semibold text-slate-600">{userTeam ?? 'tất cả'}</span></>
                }
              </p>
              {(search || platFilter !== 'all') && (
                <button onClick={() => { setSearch(''); setPlatFilter('all'); }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 4 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">

              {/* Modal header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                    {editTarget ? <Pencil className="w-5 h-5 text-white" /> : <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{editTarget ? 'Sửa kênh' : 'Thêm kênh mới'}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {editTarget ? editTarget.name : 'Kênh sẽ tự động gán vào team của bạn'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal}
                  className="w-9 h-9 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-8 overflow-y-auto space-y-5">
                <div>
                  <label className={labelCls}>Tên kênh <span className="text-red-400 font-normal">*</span></label>
                  <input autoFocus value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Ví dụ: Fanpage VCB chính thức"
                    className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Platform</label>
                    <div className="relative">
                      <select value={form.platform}
                        onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                        className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                        {PLATFORMS.filter(p => p.value !== 'all').map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Trạng thái</label>
                    <div className="relative">
                      <select value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className={`${inputCls} appearance-none pr-10 cursor-pointer`}>
                        {Object.entries(STATUS_MAP).map(([v, s]) => (
                          <option key={v} value={v}>{s.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Channel ID / Username</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input value={form.channel_id}
                      onChange={e => setForm(f => ({ ...f, channel_id: e.target.value }))}
                      placeholder="Ví dụ: vtv24"
                      className={`${inputCls} pl-11`} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Link kênh</label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input value={form.link_channel}
                      onChange={e => setForm(f => ({ ...f, link_channel: e.target.value }))}
                      placeholder="https://..."
                      className={`${inputCls} pl-11`} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Owner</label>
                    <input value={form.owner}
                      onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                      placeholder="Tên người phụ trách"
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@company.com"
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-8 pb-8 pt-2 flex gap-4">
                <button onClick={closeModal} disabled={saving}
                  className="flex-1 py-4 border-2 border-slate-200 text-slate-600 text-base font-bold rounded-2xl hover:bg-slate-50 transition-colors">
                  Hủy
                </button>
                <button onClick={handleSave} disabled={saving || !form.name.trim()}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-2xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-40 flex items-center justify-center gap-2.5">
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {saving ? 'Đang lưu...' : editTarget ? 'Lưu thay đổi' : 'Thêm kênh'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE MODAL ─── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleting && setDeleteTarget(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-9 text-center">
              <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Xóa kênh này?</h3>
              <p className="text-base text-slate-500 mb-1">
                Bạn sắp xóa kênh <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>.
              </p>
              <p className="text-sm text-slate-400 mb-9">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-4 border-2 border-slate-200 text-slate-600 text-base font-bold rounded-2xl hover:bg-slate-50 transition-colors">
                  Hủy
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-[2] py-4 bg-red-500 hover:bg-red-600 text-white text-base font-bold rounded-2xl transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {deleting ? 'Đang xóa...' : 'Xóa kênh'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}