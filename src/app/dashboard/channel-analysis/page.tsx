'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
  syncFromLarkAssignment,
  syncFromLarkAssignmentIfStale,
  clearLarkSyncCooldown,
} from '@/lib/sync-lark-tracked-channels';
import { BarChart3, Facebook, Instagram, Music2, RefreshCcw, Wand2, Plus, X, Link as LinkIcon, Loader2, Trash2, Eye, EyeOff, RotateCcw, DownloadCloud } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type PlatformKey = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
type PlatformFilter = PlatformKey | 'ALL';

type TrackedChannel = {
  id: string;
  platform: PlatformKey;
  username: string;
  display_name?: string;
  avatar_url?: string;
  posts_count?: number | null;
  total_videos?: number | null;
  last_synced_at?: string | null;
  created_at?: string | null;
};

type Row = {
  id: string;
  name: string;
  url: string;
  platform: PlatformKey;
  countLabel: string;
  maxAvailable: number;
  status: 'not_analyzed' | 'scheduled' | 'completed';
  timeLabel: string;
  username: string;
};

function platformIcon(p: PlatformKey) {
  if (p === 'FACEBOOK') return <Facebook className="w-4 h-4 text-blue-600" />;
  if (p === 'INSTAGRAM') return <Instagram className="w-4 h-4 text-pink-600" />;
  return <Music2 className="w-4 h-4 text-black" />;
}

function buildChannelUrl(platform: PlatformKey, username: string) {
  const u = (username || '').replace(/^@/, '').trim();
  if (!u) return '';
  if (platform === 'FACEBOOK') return `https://www.facebook.com/${encodeURIComponent(u)}`;
  if (platform === 'INSTAGRAM') return `https://www.instagram.com/${encodeURIComponent(u)}/`;
  return `https://www.tiktok.com/@${encodeURIComponent(u)}`;
}

function getAnalysisKey(platform: PlatformKey, username: string) {
  const u = (username || '').replace(/^@/, '').trim();
  return `channel_analysis_${platform.toLowerCase()}_${u}`;
}

const HIDDEN_KEY = 'channel_analysis_hidden_channels_v1';
function getHiddenId(platform: PlatformKey, username: string) {
  const u = (username || '').replace(/^@/, '').trim().toLowerCase();
  return `${platform}:${u}`;
}

function getStoredMaxPosts(platform: PlatformKey, username: string): number | null {
  try {
    const raw = localStorage.getItem(getAnalysisKey(platform, username));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const n = parseInt(parsed?.maxPosts, 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(Math.max(n, 10), 200);
  } catch (_) {}
  return null;
}

function formatTimeLabel(ts?: number | null, fallbackIso?: string | null) {
  if (ts && ts > 0) {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }
  if (fallbackIso) {
    const d = new Date(fallbackIso);
    if (!Number.isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }
  }
  return '-';
}

export default function ChannelAnalysisHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [channels, setChannels] = useState<TrackedChannel[]>([]);
  const [storageTick, setStorageTick] = useState(0); // trigger rerender when localStorage updates
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('ALL');

  // Insights Popup (Facebook)
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsRow, setInsightsRow] = useState<Row | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [insightsMaxPosts, setInsightsMaxPosts] = useState<number>(30);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [channelMetrics, setChannelMetrics] = useState<any>(null);
  const [viralShowAll, setViralShowAll] = useState(false);

  // Max posts chooser (before running analysis)
  const [showMaxPostsModal, setShowMaxPostsModal] = useState(false);
  const [pendingRow, setPendingRow] = useState<Row | null>(null);
  const [pendingMode, setPendingMode] = useState<'open' | 'rerun'>('open');

  const safeInt = useCallback((v: any) => {
    const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const buildMaxPostsOptions = useCallback((maxAvailable: number) => {
    // Backend limits (to keep requests reasonable)
    const HARD_MAX = 200;
    const HARD_MIN = 10;
    const maxSelectable = Math.min(Math.max(safeInt(maxAvailable), HARD_MIN), HARD_MAX);

    if (maxSelectable <= 30) return [maxSelectable];

    const q1 = Math.max(HARD_MIN, Math.round(maxSelectable * 0.25));
    const q2 = Math.max(HARD_MIN, Math.round(maxSelectable * 0.5));
    const q3 = Math.max(HARD_MIN, Math.round(maxSelectable * 0.75));
    const list = [q1, q2, q3, maxSelectable].map((n) => Math.min(Math.max(n, HARD_MIN), maxSelectable));

    if (maxSelectable >= 80) list.unshift(30);

    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [safeInt]);

  // Create Report Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('FACEBOOK');
  const [sourceMode, setSourceMode] = useState<'existing' | 'new'>('existing');
  const [existingUsername, setExistingUsername] = useState('');
  const [newInput, setNewInput] = useState('');
  const [maxPosts, setMaxPosts] = useState<number>(30);
  const [runMode, setRunMode] = useState<'now' | 'schedule'>('now');
  const [scheduleAt, setScheduleAt] = useState(''); // yyyy-MM-ddTHH:mm
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [larkSyncing, setLarkSyncing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const platforms: PlatformKey[] = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK'];
      const res = await Promise.all(
        platforms.map((p) => apiClient.get(`/tracked-channels?platform=${p}`))
      );
      const merged: TrackedChannel[] = res.flatMap((r: any) => r?.data || []);
      setChannels(merged);
    } catch (e: any) {
      setError((e?.message || 'Không thể tải danh sách kênh').toString());
    } finally {
      setLoading(false);
    }
  }, []);

  // Load hidden set once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHiddenIds(new Set(arr.map((x) => String(x))));
      }
    } catch (_) {}
  }, []);

  const persistHidden = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(Array.from(next)));
    } catch (_) {}
    setHiddenIds(new Set(next));
    setStorageTick((x) => x + 1);
  }, []);

  const softHide = useCallback((row: Row) => {
    const id = getHiddenId(row.platform, row.username);
    const next = new Set(hiddenIds);
    next.add(id);
    persistHidden(next);
  }, [hiddenIds, persistHidden]);

  const restoreHidden = useCallback((row: Row) => {
    const id = getHiddenId(row.platform, row.username);
    const next = new Set(hiddenIds);
    next.delete(id);
    persistHidden(next);
  }, [hiddenIds, persistHidden]);

  const hasRealInsights = useCallback((i: Record<string, string>) => {
    if (!i || Object.keys(i).length === 0) return false;
    const vals = Object.values(i);
    const isPlaceholder = (v?: string) => {
      const s = (v || '').trim();
      if (!s) return true;
      return s.startsWith('Chưa đủ dữ liệu');
    };
    return vals.some((v) => !isPlaceholder(v));
  }, []);

  const renderInsightContent = useCallback((raw: string) => {
    const text = (raw || '').toString().trim();
    if (!text) return <span className="text-slate-500">Chưa đủ dữ liệu.</span>;

    // Prefer explicit bullet lines first
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const bulletLine = (l: string) => /^(-|•|\u2022)\s+/.test(l) || /^\d+[.)]\s+/.test(l);
    const bulletLines = lines.filter(bulletLine);

    const toItem = (l: string) =>
      l
        .replace(/^(-|•|\u2022)\s+/, '')
        .replace(/^\d+[.)]\s+/, '')
        .trim();

    // If Gemini already returned bullet lines -> render list
    if (bulletLines.length >= 2) {
      const items = lines.map((l) => (bulletLine(l) ? toItem(l) : l)).filter(Boolean);
      return (
        <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base leading-7 text-slate-700">
          {items.map((it, idx) => (
            <li key={`${idx}-${it.slice(0, 12)}`}>{it}</li>
          ))}
        </ul>
      );
    }

    // Fallback: split by common separators if it looks like multiple points
    const parts = text
      .split(/(?:\s*;\s*|\s*\.\s+(?=[A-ZÀ-Ỹ0-9])|\s*\n\s*)/g)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 3) {
      return (
        <ul className="list-disc pl-5 space-y-2 text-[15px] md:text-base leading-7 text-slate-700">
          {parts.map((p, idx) => (
            <li key={`${idx}-${p.slice(0, 12)}`}>{p}</li>
          ))}
        </ul>
      );
    }

    // Otherwise keep as paragraph
    return <div className="text-[15px] md:text-base leading-7 text-slate-700 whitespace-pre-wrap">{text}</div>;
  }, []);

  const openFacebookInsightsPopup = useCallback((row: Row) => {
    setInsightsRow(row);
    setInsights({});
    setInsightsError('');
    setChannelMetrics(null);
    setMetricsError('');
    setViralShowAll(false);
    // Try to reuse last maxPosts choice (from "Tạo Báo Cáo") if any
    try {
      const raw = sessionStorage.getItem('channel_analysis_autorun');
      if (raw) {
        const parsed = JSON.parse(raw);
        const p = (parsed?.platform || '').toString().toLowerCase();
        const u = (parsed?.username || '').toString().replace(/^@/, '').trim().toLowerCase();
        const cur = (row.username || '').toString().replace(/^@/, '').trim().toLowerCase();
        if (p === 'facebook' && u && cur && u === cur) {
          const n = parseInt(parsed?.maxPosts, 10);
          if (!Number.isNaN(n) && n > 0) setInsightsMaxPosts(Math.min(Math.max(n, 10), 200));
        }
      }
    } catch (_) {}

    // Prefer stored maxPosts per channel (so popup + table stay consistent)
    const stored = getStoredMaxPosts(row.platform, row.username);
    if (stored) setInsightsMaxPosts(stored);

    // Ensure we persist the chosen maxPosts for table display
    try {
      const key = getAnalysisKey(row.platform, row.username);
      const existing = localStorage.getItem(key);
      const prev = existing ? JSON.parse(existing) : {};
      localStorage.setItem(key, JSON.stringify({ ...prev, maxPosts: stored || prev?.maxPosts || insightsMaxPosts || 30 }));
    } catch (_) {}
    setStorageTick((x) => x + 1);
    setShowInsightsModal(true);
  }, []);

  const runGenericInsights = useCallback(async (targetRow: Row, maxPosts: number, forceRefresh = false) => {
    if (!targetRow) return;
    const username = (targetRow.username || '').replace(/^@/, '').trim();
    if (!username) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/ai/channel/insights`;

    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetRow.platform.toLowerCase(),
          username,
          max_posts: maxPosts,
          language: 'vi',
          force_refresh: forceRefresh,
        }),
      });
      let json: any = {};
      try {
        if (res.headers.get('content-type')?.includes('json')) json = await res.json();
      } catch (_) {}
      if (!res.ok) {
        const msg = (json.error || json.message || '').toString() || `Lỗi ${res.status}`;
        throw new Error(msg);
      }
      if (json.success === false && json.error) throw new Error(json.error);
      const data = (json.insights || {}) as Record<string, string>;
      setInsights(data);

      try {
        localStorage.setItem(
          getAnalysisKey(targetRow.platform, username),
          JSON.stringify({ status: 'completed', analyzedAt: Date.now(), maxPosts }),
        );
      } catch (_) {}
      setStorageTick((x) => x + 1);
      await fetchAll();
    } catch (e: any) {
      setInsightsError((e?.message || 'Không thể tải phân tích kênh').toString());
    } finally {
      setInsightsLoading(false);
    }
  }, [fetchAll]);

  const runGenericMetrics = useCallback(async (targetRow: Row, maxPosts: number, forceRefresh = false) => {
    if (!targetRow) return;
    const username = (targetRow.username || '').replace(/^@/, '').trim();
    if (!username) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/ai/channel/metrics`;

    setMetricsLoading(true);
    setMetricsError('');
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: targetRow.platform.toLowerCase(),
          username,
          max_posts: Math.max(30, maxPosts),
          force_refresh: forceRefresh,
        }),
      });
      let json: any = {};
      try {
        if (res.headers.get('content-type')?.includes('json')) json = await res.json();
      } catch (_) {}
      if (!res.ok) {
        const msg = (json.error || json.message || '').toString() || `Lỗi ${res.status}`;
        throw new Error(msg);
      }
      if (json.success === false && json.error) throw new Error(json.error);
      setChannelMetrics(json.metrics || null);
    } catch (e: any) {
      setMetricsError((e?.message || 'Không thể tải thống kê kênh').toString());
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const openMaxPostsChooser = useCallback((row: Row, mode: 'open' | 'rerun') => {
    setPendingRow(row);
    setPendingMode(mode);
    const stored = getStoredMaxPosts(row.platform, row.username);
    if (stored) {
      setInsightsMaxPosts(stored);
    } else {
      const opts = buildMaxPostsOptions(row.maxAvailable || 0);
      setInsightsMaxPosts(opts.includes(30) ? 30 : opts[0] || 30);
    }
    setShowMaxPostsModal(true);
  }, [buildMaxPostsOptions]);

  const runFacebookInsights = useCallback(async (targetRow: Row, maxPosts: number, forceRefresh = false) => {
    if (!targetRow) return;
    const username = (targetRow.username || '').replace(/^@/, '').trim();
    if (!username) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/ai/facebook/insights`;
    const url = `https://www.facebook.com/${encodeURIComponent(username)}`;

    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, max_posts: maxPosts, language: 'vi', force_refresh: forceRefresh }),
      });
      let json: any = {};
      try {
        if (res.headers.get('content-type')?.includes('json')) json = await res.json();
      } catch (_) {}
      if (!res.ok) {
        const msg = (json.error || json.message || '').toString();
        const friendly =
          res.status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota')
            ? 'Gemini API hết quota. Vui lòng thử lại sau 1–2 phút.'
            : msg || `Lỗi ${res.status}`;
        throw new Error(friendly);
      }
      if (json.success === false && json.error) throw new Error(json.error);
      const data = (json.insights || {}) as Record<string, string>;
      setInsights(data);

      // Mark analyzed in localStorage (table status)
      try {
        localStorage.setItem(
          getAnalysisKey('FACEBOOK', username),
          JSON.stringify({ status: 'completed', analyzedAt: Date.now(), maxPosts })
        );
      } catch (_) {}
      setStorageTick((x) => x + 1);
      // Refresh table to reflect status/time
      await fetchAll();
    } catch (e: any) {
      setInsightsError((e?.message || 'Không thể tải phân tích kênh').toString());
    } finally {
      setInsightsLoading(false);
    }
  }, [fetchAll]);

  const runFacebookMetrics = useCallback(async (targetRow: Row, maxPosts: number, forceRefresh = false) => {
    if (!targetRow) return;
    const username = (targetRow.username || '').replace(/^@/, '').trim();
    if (!username) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const apiUrl = `${baseUrl.replace(/\/$/, '')}/ai/facebook/channel-metrics`;
    const url = `https://www.facebook.com/${encodeURIComponent(username)}`;

    setMetricsLoading(true);
    setMetricsError('');
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, max_posts: Math.max(30, maxPosts), force_refresh: forceRefresh }),
      });
      let json: any = {};
      try {
        if (res.headers.get('content-type')?.includes('json')) json = await res.json();
      } catch (_) {}
      if (!res.ok) {
        const msg = (json.error || json.message || '').toString() || `Lỗi ${res.status}`;
        throw new Error(msg);
      }
      if (json.success === false && json.error) throw new Error(json.error);
      setChannelMetrics(json.metrics || null);
    } catch (e: any) {
      setMetricsError((e?.message || 'Không thể tải thống kê kênh').toString());
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Xóa Auto-run useEffect, để fetch cache / refresh rõ ràng
  const onView = useCallback((row: Row) => {
    openFacebookInsightsPopup(row);
    
    // get actual stored or default maxPosts to pass locally
    let max = 30;
    try {
      const stored = getStoredMaxPosts(row.platform, row.username);
      if (stored) max = stored;
    } catch (_) {}
    
    setTimeout(() => {
      if (row.platform === 'FACEBOOK') {
        void Promise.all([runFacebookInsights(row, max, false), runFacebookMetrics(row, max, false)]);
      } else {
        void Promise.all([runGenericInsights(row, max, false), runGenericMetrics(row, max, false)]);
      }
    }, 0);
  }, [openFacebookInsightsPopup, runFacebookInsights, runFacebookMetrics, runGenericInsights, runGenericMetrics]);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const r = await syncFromLarkAssignmentIfStale();
        if (alive && r && r.imported > 0) {
          toast.success(`Đã thêm ${r.imported} kênh được phân công (HR/Lark)`, { duration: 4500 });
        }
      } catch {
        /* vẫn tải danh sách */
      }
      if (!alive) return;
      await fetchAll();
    };
    init();
    return () => {
      alive = false;
    };
  }, [fetchAll]);

  const handleSyncLarkChannels = async () => {
    setLarkSyncing(true);
    try {
      clearLarkSyncCooldown();
      const r = await syncFromLarkAssignment();
      await fetchAll();
      if (r.imported > 0) {
        toast.success(`Đã đồng bộ ${r.imported} kênh từ HR/Lark`, { duration: 5000 });
      } else if ((r.skipped_no_identity ?? 0) > 0 && r.imported === 0) {
        toast(
          `Chưa thêm kênh mới. ${r.skipped_no_identity} dòng thiếu link/ID hợp lệ trên Lark — kiểm tra bảng Channel.`,
          { duration: 6000, icon: 'ℹ️' },
        );
      } else if ((r.skipped_no_user ?? 0) > 0 && r.imported === 0) {
        toast('Chưa có dòng Channel nào khớp email/tên bạn trên Lark.', { duration: 5000 });
      } else {
        toast.success('Danh sách kênh đã cập nhật.', { duration: 3000 });
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Không đồng bộ được. Thử lại sau.');
    } finally {
      setLarkSyncing(false);
    }
  };

  const channelsByPlatform = useMemo(() => {
    const m: Record<PlatformKey, TrackedChannel[]> = { FACEBOOK: [], INSTAGRAM: [], TIKTOK: [] };
    for (const ch of channels || []) {
      if (ch?.platform && m[ch.platform as PlatformKey]) m[ch.platform as PlatformKey].push(ch);
    }
    // sort by most recently synced first
    (Object.keys(m) as PlatformKey[]).forEach((p) => {
      m[p] = (m[p] || []).sort((a, b) => {
        const ta = new Date(a.last_synced_at || a.created_at || 0).getTime();
        const tb = new Date(b.last_synced_at || b.created_at || 0).getTime();
        return tb - ta;
      });
    });
    return m;
  }, [channels]);

  const channelsByPlatformVisible = useMemo(() => {
    const m: Record<PlatformKey, TrackedChannel[]> = { FACEBOOK: [], INSTAGRAM: [], TIKTOK: [] };
    (Object.keys(channelsByPlatform) as PlatformKey[]).forEach((p) => {
      m[p] = (channelsByPlatform[p] || []).filter((ch) => !hiddenIds.has(getHiddenId(ch.platform, ch.username)));
    });
    return m;
  }, [channelsByPlatform, hiddenIds, storageTick]);

  const extractUsername = (platform: PlatformKey, input: string): string => {
    let clean = (input || '').trim();
    if (!clean) return '';
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    clean = clean.replace(/^@/, '');
    try {
      if (platform === 'FACEBOOK' && (clean.includes('facebook.com') || clean.includes('fb.com'))) {
        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        if (url.pathname.includes('profile.php')) {
          const id = url.searchParams.get('id');
          if (id) return id;
        }
        if (url.pathname.includes('/groups/')) {
          const parts = url.pathname.split('/groups/');
          if (parts[1]) return parts[1].split('/')[0];
        }
        const parts = url.pathname.split('/').filter((p) => p);
        if (parts[0]) return parts[0];
      }
      if (platform === 'INSTAGRAM' && clean.includes('instagram.com')) {
        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        const parts = url.pathname.split('/').filter((p) => p && p !== 'p' && p !== 'reel');
        if (parts[0]) return parts[0];
      }
      if (platform === 'TIKTOK' && clean.includes('tiktok.com')) {
        const url = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
        const parts = url.pathname.split('/').filter((p) => p);
        const at = parts.find((p) => p.startsWith('@'));
        if (at) return at.replace('@', '');
      }
    } catch (_) {}
    return clean.replace('@', '');
  };

  const createOrGo = async () => {
    setCreateError('');
    const platform = selectedPlatform;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    setCreating(true);
    try {
      let username = '';

      if (sourceMode === 'existing') {
        username = extractUsername(platform, existingUsername);
        if (!username) throw new Error('Vui lòng chọn kênh có sẵn.');
      } else {
        username = extractUsername(platform, newInput);
        if (!username) throw new Error('Vui lòng nhập link/username hợp lệ.');

        // 1) Quét nhanh profile từ backend (AI) để có payload chuẩn
        const scanRes = await fetch(`${baseUrl.replace(/\/$/, '')}/ai/user-videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: platform.toLowerCase(),
            username,
            max_results: platform === 'FACEBOOK' ? 3 : platform === 'INSTAGRAM' ? 0 : 1,
          }),
        });
        const scanJson = await scanRes.json();
        if (!scanRes.ok) throw new Error(scanJson?.error || `Không thể quét kênh (${scanRes.status})`);

        const p = scanJson?.profile || {};
        const payload: any = {
          platform,
          username: (p.username || username || '').toString().replace(/^@/, ''),
          display_name: p.display_name || p.displayName || p.name || username,
          avatar_url: p.avatar_url || p.avatar || p.avatarUrl || '',
          total_followers: p.follower_count ?? p.followers ?? p.followers_count ?? null,
          total_likes: p.total_likes ?? p.likes ?? 0,
          total_views: p.total_views ?? p.views ?? 0,
          total_videos: p.total_videos ?? p.videos ?? 0,
          posts_count: p.posts_count ?? p.total_posts ?? null,
          engagement_rate: p.engagement_rate ?? 0,
        };

        // 2) Lưu vào tracked-channels (BE) -> channels pages sẽ thấy kênh mới
        await apiClient.post('/tracked-channels', payload);
        await fetchAll();
      }

      // If schedule -> save and do NOT navigate now
      if (runMode === 'schedule') {
        const dt = scheduleAt ? new Date(scheduleAt) : null;
        if (!dt || Number.isNaN(dt.getTime())) throw new Error('Vui lòng chọn ngày/giờ hợp lệ để lên lịch.');
        const scheduledTs = dt.getTime();
        if (scheduledTs < Date.now() + 60 * 1000) throw new Error('Thời gian lên lịch phải lớn hơn hiện tại ít nhất 1 phút.');
        try {
          localStorage.setItem(
            getAnalysisKey(platform, username),
            JSON.stringify({ status: 'scheduled', scheduledAt: scheduledTs, maxPosts, createdAt: Date.now() })
          );
        } catch (_) {}
        await fetchAll();
        setShowCreateModal(false);
        setNewInput('');
        setExistingUsername('');
        setScheduleAt('');
        setRunMode('now');
        return;
      }

      // mark autorun intent + go analytics now
      try {
        sessionStorage.setItem('analytics_from_channels', '1');
        sessionStorage.setItem(
          'channel_analysis_autorun',
          JSON.stringify({ platform, username, maxPosts, ts: Date.now() })
        );
      } catch (_) {}

      // Persist maxPosts per channel for table display (and popup defaults)
      try {
        const key = getAnalysisKey(platform, username);
        const existing = localStorage.getItem(key);
        const prev = existing ? JSON.parse(existing) : {};
        localStorage.setItem(key, JSON.stringify({ ...prev, status: prev?.status || 'not_analyzed', maxPosts }));
      } catch (_) {}
      setStorageTick((x) => x + 1);

      setShowCreateModal(false);
      setNewInput('');
      setExistingUsername('');
      setScheduleAt('');
      setRunMode('now');

      const u = encodeURIComponent(username.replace(/^@/, '').trim());
      if (platform === 'FACEBOOK') {
        // Do NOT navigate. Open popup on this page.
        setInsightsMaxPosts(maxPosts);
        openMaxPostsChooser({
          id: `${Date.now()}`,
          name: username,
          url: buildChannelUrl('FACEBOOK', username),
          platform: 'FACEBOOK',
          countLabel: `${maxPosts} bài`,
          maxAvailable: 0,
          status: 'not_analyzed',
          timeLabel: '-',
          username,
        }, 'open');
      }
      else if (platform === 'INSTAGRAM') {
        setInsightsMaxPosts(maxPosts);
        openMaxPostsChooser({
          id: `${Date.now()}`,
          name: username,
          url: buildChannelUrl('INSTAGRAM', username),
          platform: 'INSTAGRAM',
          countLabel: `${maxPosts} bài`,
          maxAvailable: 0,
          status: 'not_analyzed',
          timeLabel: '-',
          username,
        }, 'open');
      } else {
        setInsightsMaxPosts(maxPosts);
        openMaxPostsChooser({
          id: `${Date.now()}`,
          name: username,
          url: buildChannelUrl('TIKTOK', username),
          platform: 'TIKTOK',
          countLabel: `${maxPosts} bài`,
          maxAvailable: 0,
          status: 'not_analyzed',
          timeLabel: '-',
          username,
        }, 'open');
      }
    } catch (e: any) {
      setCreateError((e?.message || 'Không thể tạo báo cáo').toString());
    } finally {
      setCreating(false);
    }
  };

  const rows = useMemo<Row[]>(() => {
    const mapped = (channels || []).map((ch) => {
      const name = (ch.display_name || ch.username || '').trim() || '(No name)';
      const url = buildChannelUrl(ch.platform, ch.username);

      // Count label: prefer the "maxPosts" chosen in report (localStorage), fallback to scanned counts
      const storedMaxPosts = getStoredMaxPosts(ch.platform, ch.username);
      const availableCount =
        (typeof ch.posts_count === 'number' && ch.posts_count !== null ? ch.posts_count : null) ??
        (typeof ch.total_videos === 'number' && ch.total_videos !== null ? ch.total_videos : null) ??
        0;
      const countForLabel = storedMaxPosts ?? availableCount ?? 0;
      const countLabel = `${countForLabel} bài`;

      // Analysis status from localStorage
      let analyzedAt: number | null = null;
      let scheduledAtMs: number | null = null;
      let status: Row['status'] = 'not_analyzed';
      try {
        const raw = localStorage.getItem(getAnalysisKey(ch.platform, ch.username));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.status === 'completed') {
            status = 'completed';
            analyzedAt = parsed?.analyzedAt || null;
          }
          if (parsed?.status === 'scheduled') {
            status = 'scheduled';
            scheduledAtMs = parsed?.scheduledAt || null;
          }
        }
      } catch (_) {}

      // Fallback time: last_synced_at / created_at
      const timeLabel =
        status === 'scheduled'
          ? formatTimeLabel(scheduledAtMs, null)
          : formatTimeLabel(analyzedAt, ch.last_synced_at || ch.created_at || null);

      return {
        id: ch.id,
        name,
        url,
        platform: ch.platform,
        countLabel,
        maxAvailable: availableCount || 0,
        status,
        timeLabel,
        username: ch.username,
      };
    });
    const visible = showHidden
      ? mapped
      : mapped.filter((r) => !hiddenIds.has(getHiddenId(r.platform, r.username)));

    if (platformFilter === 'ALL') return visible;
    return visible.filter((r) => r.platform === platformFilter);
  }, [channels, storageTick, showHidden, hiddenIds, platformFilter]);

  const onAnalyze = (row: Row) => {
    const u = (row.username || '').replace(/^@/, '').trim();
    if (!u) return;

    // Mark "clicked" as analyzed placeholder (actual completed is set by analytics pages; FB already does)
    try {
      const key = getAnalysisKey(row.platform, row.username);
      const existing = localStorage.getItem(key);
      if (!existing) {
        localStorage.setItem(key, JSON.stringify({ status: 'not_analyzed', analyzedAt: null }));
      }
    } catch (_) {}

    // Avoid auto-analyze loops where applicable
    try { sessionStorage.setItem('analytics_from_channels', '1'); } catch (_) {}

    // All platforms: open popup flow (no navigation)
    // Nếu status là completed -> rerun. Ngược lại -> open
    openMaxPostsChooser(row, row.status === 'completed' ? 'rerun' : 'open');
  };

  const confirmMaxPostsAndRun = useCallback(() => {
    const row = pendingRow;
    if (!row) return;

    // Persist maxPosts choice for table + future default
    try {
      const key = getAnalysisKey(row.platform, row.username);
      const existing = localStorage.getItem(key);
      const prev = existing ? JSON.parse(existing) : {};
      localStorage.setItem(key, JSON.stringify({ ...prev, maxPosts: insightsMaxPosts }));
    } catch (_) {}
    setStorageTick((x) => x + 1);

    setShowMaxPostsModal(false);

    // All platforms: open popup + run analysis (no navigation)
    openFacebookInsightsPopup(row);

    // Defer network calls so UI updates instantly (smooth click)
    setTimeout(() => {
      const isRerun = pendingMode === 'rerun';
      if (row.platform === 'FACEBOOK') {
        void Promise.all([runFacebookInsights(row, insightsMaxPosts, isRerun), runFacebookMetrics(row, insightsMaxPosts, isRerun)]);
      } else {
        void Promise.all([runGenericInsights(row, insightsMaxPosts, isRerun), runGenericMetrics(row, insightsMaxPosts, isRerun)]);
      }
    }, 0);
  }, [insightsMaxPosts, openFacebookInsightsPopup, pendingMode, pendingRow, runFacebookInsights, runFacebookMetrics, runGenericInsights, runGenericMetrics]);

  const badge = (status: Row['status']) => {
    if (status === 'completed') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">Hoàn thành</span>;
    }
    if (status === 'scheduled') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Đã lên lịch</span>;
    }
    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">Chưa phân tích</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Phân tích kênh</h2>
          <p className="text-sm text-slate-500">Tổng hợp kênh theo dõi: Facebook, Instagram, TikTok</p>
        </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setPlatformFilter('FACEBOOK')}
              className={`px-4 py-2.5 rounded-2xl text-base font-black transition shadow-sm ${
                platformFilter === 'FACEBOOK'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Lọc Facebook"
            >
              <span className="inline-flex items-center gap-2">
                <Facebook className={`w-5 h-5 ${platformFilter === 'FACEBOOK' ? 'text-white' : 'text-blue-600'}`} />
                Facebook
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('INSTAGRAM')}
              className={`px-4 py-2.5 rounded-2xl text-base font-black transition shadow-sm ${
                platformFilter === 'INSTAGRAM'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Lọc Instagram"
            >
              <span className="inline-flex items-center gap-2">
                <Instagram className={`w-5 h-5 ${platformFilter === 'INSTAGRAM' ? 'text-white' : 'text-pink-600'}`} />
                Instagram
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('TIKTOK')}
              className={`px-4 py-2.5 rounded-2xl text-base font-black transition shadow-sm ${
                platformFilter === 'TIKTOK'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Lọc TikTok"
            >
              <span className="inline-flex items-center gap-2">
                <Music2 className={`w-5 h-5 ${platformFilter === 'TIKTOK' ? 'text-white' : 'text-black'}`} />
                TikTok
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('ALL')}
              className={`px-4 py-2.5 rounded-2xl text-base font-black transition shadow-sm ${
                platformFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
              title="Tất cả nền tảng"
            >
              Tất cả
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
          >
            {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showHidden ? 'Ẩn kênh đã ẩn' : `Kênh đã ẩn (${hiddenIds.size})`}
          </button>
          <button
            type="button"
            disabled={larkSyncing}
            onClick={handleSyncLarkChannels}
            title="Lấy kênh được phân công trên Lark (bảng Channel) — không cần nhập tay"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm hover:bg-emerald-100 transition disabled:opacity-60"
          >
            {larkSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
            Đồng bộ kênh HR
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setCreateError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Tạo Báo Cáo
          </button>
        </div>
      </div>

      {/* Mobile filter */}
      <div className="md:hidden">
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setPlatformFilter('FACEBOOK')}
            className={`px-3 py-2.5 rounded-2xl text-base font-black border transition shadow-sm ${
              platformFilter === 'FACEBOOK'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            FB
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('INSTAGRAM')}
            className={`px-3 py-2.5 rounded-2xl text-base font-black border transition shadow-sm ${
              platformFilter === 'INSTAGRAM'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            IG
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('TIKTOK')}
            className={`px-3 py-2.5 rounded-2xl text-base font-black border transition shadow-sm ${
              platformFilter === 'TIKTOK'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            TikTok
          </button>
          <button
            type="button"
            onClick={() => setPlatformFilter('ALL')}
            className={`px-3 py-2.5 rounded-2xl text-base font-black border transition shadow-sm ${
              platformFilter === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-slate-500 text-sm">Đang tải...</div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 text-sm">{error}</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-slate-600">
                  <th className="text-left px-6 py-4 font-black">Tên báo cáo</th>
                  <th className="text-left px-6 py-4 font-black">URL</th>
                  <th className="text-left px-6 py-4 font-black">Nền tảng</th>
                  <th className="text-left px-6 py-4 font-black">Số lượng</th>
                  <th className="text-left px-6 py-4 font-black">Trạng thái</th>
                  <th className="text-left px-6 py-4 font-black">Thời gian</th>
                  <th className="text-right px-6 py-4 font-black"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                    <td className="px-6 py-4">
                      {r.url ? (
                        <a className="text-blue-600 hover:underline line-clamp-1 max-w-[420px] inline-block" href={r.url} target="_blank">
                          {r.url}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2">
                        {platformIcon(r.platform)}
                        <span className="font-semibold text-slate-700">{r.platform}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{r.countLabel}</td>
                    <td className="px-6 py-4">{badge(r.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{r.timeLabel}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {hiddenIds.has(getHiddenId(r.platform, r.username)) ? (
                          <button
                            type="button"
                            onClick={() => restoreHidden(r)}
                            className="inline-flex items-center justify-center w-10 h-9 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            title="Khôi phục kênh"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => softHide(r)}
                            className="inline-flex items-center justify-center w-10 h-9 rounded-xl font-bold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                            title="Ẩn kênh khỏi danh sách"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === 'completed' && (
                          <button
                            onClick={() => onView(r)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all"
                            title="Xem lại lịch sử phân tích"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </button>
                        )}
                        <button
                          onClick={() => onAnalyze(r)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                            r.status === 'completed' || r.status === 'scheduled'
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {r.status === 'completed' ? <RefreshCcw className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                          {r.status === 'completed' ? 'Phân tích lại' : r.status === 'scheduled' ? 'Mở phân tích' : 'Phân tích'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      Chưa có kênh nào phù hợp bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !creating && setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Plus className="w-5 h-5" />
                  </div>
                  Tạo Báo Cáo
                </h2>
              </div>
              <button
                onClick={() => !creating && setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-5">
              {/* Platform */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Chọn nền tảng</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => {
                    const p = e.target.value as PlatformKey;
                    setSelectedPlatform(p);
                    setExistingUsername('');
                    setNewInput('');
                    setSourceMode('existing');
                  }}
                  className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                >
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>

              {/* Source mode */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Nguồn kênh</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceMode('existing')}
                    className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition ${
                      sourceMode === 'existing'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Chọn kênh có sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceMode('new')}
                    className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition ${
                      sourceMode === 'new'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Add kênh mới
                  </button>
                </div>
              </div>

              {sourceMode === 'existing' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Chọn kênh</label>
                  <select
                    value={existingUsername}
                    onChange={(e) => setExistingUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                  >
                    <option value="">-- Chọn kênh --</option>
                    {(channelsByPlatformVisible[selectedPlatform] || []).map((ch) => (
                      <option key={ch.id} value={ch.username}>
                        {ch.display_name || ch.username}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Nếu chưa có kênh, chọn “Add kênh mới”.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    {selectedPlatform === 'FACEBOOK' ? 'Page URL' : 'Username / URL'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <input
                      value={newInput}
                      onChange={(e) => setNewInput(e.target.value)}
                      placeholder={selectedPlatform === 'FACEBOOK' ? 'https://www.facebook.com/...' : 'Ví dụ: @username hoặc link'}
                      className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Max posts */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Số lượng</label>
                <select
                  value={maxPosts}
                  onChange={(e) => setMaxPosts(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                >
                  <option value={30}>30 bài gần nhất</option>
                  <option value={50}>50 bài gần nhất</option>
                  <option value={80}>80 bài gần nhất</option>
                </select>
              </div>

              {/* Run time */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Thời điểm thực hiện</label>
                <select
                  value={runMode}
                  onChange={(e) => setRunMode(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-semibold"
                >
                  <option value="now">Chạy ngay</option>
                  <option value="schedule">Lên lịch</option>
                </select>
                {runMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="mt-3 w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  />
                )}
              </div>

              {createError && (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => !creating && setShowCreateModal(false)}
                  disabled={creating}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 border border-slate-200"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={createOrGo}
                  disabled={creating}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Insights Popup */}
      {showInsightsModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !(insightsLoading || metricsLoading) && setShowInsightsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[88vh]"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-black text-slate-900 truncate">Channel Analytics</h2>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {(insightsRow?.name || insightsRow?.username || '').toString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={insightsMaxPosts}
                  onChange={(e) => setInsightsMaxPosts(parseInt(e.target.value, 10))}
                  disabled={insightsLoading}
                  className="px-3 py-2 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-semibold text-sm"
                >
                  <option value={30}>30 bài</option>
                  <option value={50}>50 bài</option>
                  <option value={80}>80 bài</option>
                </select>
                <button
                  onClick={() => insightsRow && openMaxPostsChooser(insightsRow, 'rerun')}
                  disabled={insightsLoading || metricsLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {(insightsLoading || metricsLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {(insightsLoading || metricsLoading) ? 'Đang phân tích...' : (hasRealInsights(insights) || channelMetrics) ? 'Phân tích lại' : 'Phân tích'}
                </button>
                <button
                  onClick={() => !(insightsLoading || metricsLoading) && setShowInsightsModal(false)}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Metrics block */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">Top 10 viral & biểu đồ</p>
                    <p className="text-xs text-slate-500 mt-1">Tính từ các bài đã quét (Apify)</p>
                  </div>
                  {metricsLoading ? <span className="text-xs text-slate-500">Đang tải...</span> : null}
                </div>

                {metricsLoading ? (
                  <div className="flex items-center justify-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mr-3" />
                    <p className="text-slate-500 text-sm font-medium">Đang tải Top viral & biểu đồ...</p>
                  </div>
                ) : metricsError ? (
                  <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    {metricsError}
                  </div>
                ) : !channelMetrics ? (
                  <div className="text-sm text-slate-500">Chưa có thống kê. Bấm “Phân tích” để tải.</div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-2">Tương tác trung bình theo ngày</p>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={channelMetrics?.charts?.avg_engagement_by_day || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Area type="monotone" dataKey="avgLikes" stroke="#4f46e5" fill="#c7d2fe" name="Like TB" />
                              <Area type="monotone" dataKey="avgComments" stroke="#059669" fill="#bbf7d0" name="Comment TB" />
                              <Area type="monotone" dataKey="avgShares" stroke="#f59e0b" fill="#fde68a" name="Share TB" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-2">Tần suất đăng bài</p>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={channelMetrics?.charts?.posting_frequency || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                              <Tooltip />
                              <Area type="monotone" dataKey="count" stroke="#0ea5e9" fill="#bae6fd" name="Bài/ngày" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-2">Top URL viral</p>
                      <div className="space-y-2">
                        {(channelMetrics?.top_viral_posts || [])
                          .slice(0, viralShowAll ? 10 : 5)
                          .map((p: any, idx: number) => (
                          <div key={p?.id || p?.url || idx} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700">#{idx + 1}</p>
                              <a href={p?.url} target="_blank" className="text-sm text-blue-600 hover:underline break-all line-clamp-2">
                                {p?.url}
                              </a>
                              {p?.text ? <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.text}</p> : null}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-slate-600">Like: {p?.likes || 0}</p>
                              <p className="text-xs text-slate-600">Cmt: {p?.comments || 0}</p>
                              <p className="text-xs text-slate-600">Share: {p?.shares || 0}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {(channelMetrics?.top_viral_posts || []).length > 5 && (
                        <div className="pt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setViralShowAll((v) => !v)}
                            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            {viralShowAll ? 'Thu gọn' : 'Xem thêm'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Insights block */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">AI phân tích kênh</p>
                    <p className="text-xs text-slate-500 mt-1">Gemini (structured JSON)</p>
                  </div>
                  {insightsLoading ? <span className="text-xs text-slate-500">Đang chạy...</span> : null}
                </div>

                {insightsError ? (
                  <div className="py-4 px-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
                    <p className="font-bold">Không thể phân tích</p>
                    <p className="mt-2">{insightsError}</p>
                  </div>
                ) : insightsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Đang phân tích kênh bằng AI (Gemini)...</p>
                  </div>
                ) : !hasRealInsights(insights) ? (
                  <div className="text-sm text-slate-500">Chưa có insights. Bấm “Phân tích” để tạo.</div>
                ) : (
                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {[
                      'Định vị Thương hiệu',
                      'Giọng nói Thương hiệu',
                      'Khách hàng Mục tiêu',
                      'Tuyến Nội dung',
                      'Công thức Nội dung',
                      'Phân tích Reel',
                      'Chiến lược Quảng cáo',
                      'Phễu Marketing',
                      'Tương tác & Bình luận',
                      'Tóm tắt Chiến lược',
                      'Điểm mạnh',
                      'Điểm yếu & Cơ hội',
                      'Đề xuất hành động',
                    ].map((title) => {
                      const content = ((insights as any)?.[title] || '').toString().trim();
                      return (
                        <details key={title} className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
                            <span className="font-black text-slate-900 text-base md:text-lg">{title}</span>
                            <span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
                          </summary>
                          <div className="px-5 pb-5">
                            {renderInsightContent(content)}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Max posts chooser */}
      {showMaxPostsModal && pendingRow && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => !(insightsLoading || metricsLoading) && setShowMaxPostsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 truncate">Chọn số lượng bài để phân tích</h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {(pendingRow.name || pendingRow.username || '').toString()}
                </p>
              </div>
              <button
                onClick={() => !(insightsLoading || metricsLoading) && setShowMaxPostsModal(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-7 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Số lượng</label>
                <select
                  value={insightsMaxPosts}
                  onChange={(e) => setInsightsMaxPosts(parseInt(e.target.value, 10))}
                  disabled={insightsLoading || metricsLoading}
                  className="w-full px-4 py-3 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-semibold"
                >
                  {buildMaxPostsOptions(pendingRow.maxAvailable || 0).map((n) => (
                    <option key={n} value={n}>
                      {n} bài gần nhất{(pendingRow.maxAvailable || 0) > 0 && n === Math.min(Math.max(pendingRow.maxAvailable || 0, 10), 200) ? ' (tối đa)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Áp dụng cho cả AI insights và metrics. Kênh có {(pendingRow.maxAvailable || 0).toLocaleString()} bài/video; hệ thống phân tích tối đa 200 bài/lần.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => !(insightsLoading || metricsLoading) && setShowMaxPostsModal(false)}
                  disabled={insightsLoading || metricsLoading}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 border border-slate-200"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={confirmMaxPostsAndRun}
                  disabled={insightsLoading || metricsLoading}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-60"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

