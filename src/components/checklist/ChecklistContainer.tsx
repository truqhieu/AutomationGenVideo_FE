'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ChecklistSection, { CHECKLIST_ITEMS } from './ChecklistSection';
import DetailSection, { DETAIL_ITEMS } from './DetailSection';
import LeaderEvaluationSection, { LEADER_QUESTIONS } from './LeaderEvaluationSection';
import TrafficReportSection, { TrafficData, initialTrafficData, initialTrafficChannels } from './TrafficReportSection';
import { Send, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';

const initialChecks = () => Array(CHECKLIST_ITEMS.length).fill(false);
const initialDetails = () => Array(DETAIL_ITEMS.length).fill('');
const initialLeaderAnswers = () => Array(LEADER_QUESTIONS.length).fill('');

const ChecklistContainer = ({ 
    mode, 
    showOnlyTraffic = false, 
    showOnlyWork = false 
}: { 
    mode?: 'member' | 'leader',
    showOnlyTraffic?: boolean,
    showOnlyWork?: boolean
}) => {
    const { user } = useAuthStore();
    const [checks, setChecks] = useState<boolean[]>(initialChecks);
    const [details, setDetails] = useState<string[]>(initialDetails);
    const [leaderAnswers, setLeaderAnswers] = useState<string[]>(initialLeaderAnswers);
    const [traffic, setTraffic] = useState<TrafficData>(initialTrafficData());
    const [trafficChannels, setTrafficChannels] = useState<TrafficData>(initialTrafficChannels());
    const [platformEvidences, setPlatformEvidences] = useState<Record<string, string[]>>({});
    const [trafficDate, setTrafficDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [submitCount, setSubmitCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [larkRole, setLarkRole] = useState<string | null>(null);
    const [status, setStatus] = useState<{ is_open: boolean; message: string }>({ is_open: true, message: '' });
    const [availableChannels, setAvailableChannels] = useState<any[]>([]);

    // Fetch Lark Permission Role on mount
    useEffect(() => {
        const fetchLarkRole = async () => {
            if (!user?.email) return;

            try {
                const apiBase = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3000/api';
                const base = apiBase.replace(/\/$/, '');
                // Nếu apiBase đã chứa /api thì không cộng thêm /api nữa
                const url = base.endsWith('/api')
                    ? `${base}/lark/user-permission?email=${encodeURIComponent(user.email)}`
                    : `${base}/api/lark/user-permission?email=${encodeURIComponent(user.email)}`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.role) {
                        setLarkRole(data.role); // e.g., 'Leader', 'Admin'
                    }
                }
            } catch (err) {
                console.error('Failed to fetch Lark role:', err);
            }
        };

        fetchLarkRole();
    }, [user?.email]);

    // Fetch reporting status
    useEffect(() => {
        const fetchStatus = async () => {
            if (!user?.email) return;

            try {
                const djangoBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
                const base = djangoBase.replace(/\/$/, '');
                const url = `${base}/api/checklist/status/?email=${encodeURIComponent(user.email)}`;

                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            } catch (err) {
                console.error('Failed to fetch reporting status:', err);
            }
        };

        fetchStatus();
        // Refresh status every 5 minutes
        const interval = setInterval(fetchStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user?.email]);

    // Fetch user channels
    useEffect(() => {
        const fetchChannels = async () => {
            if (!user?.full_name) return;
            try {
                const beBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                const url = new URL(`${beBaseUrl}/lark/channel`, window.location.origin);
                url.searchParams.append('owner', user.full_name);
                if (user.team) url.searchParams.append('team', user.team);
                
                const res = await fetch(url.toString());
                if (res.ok) {
                    const data = await res.json();
                    setAvailableChannels(data);
                }
            } catch (err) {
                console.error('Failed to fetch channels:', err);
            }
        };
        fetchChannels();
    }, [user?.full_name, user?.team]);

    const roles = user?.roles || [];
    const isAdmin = roles.includes(UserRole.ADMIN) || roles.includes(UserRole.MANAGER) || larkRole?.toLowerCase() === 'admin';
    const isLeader = roles.includes(UserRole.LEADER) || larkRole?.toLowerCase() === 'leader';
    const isStaff = roles.includes(UserRole.EDITOR) || roles.includes(UserRole.CONTENT);

    const showForm12 = mode ? mode === 'member' : (isAdmin || isStaff);
    const showForm3 = mode ? mode === 'leader' : (isAdmin || isLeader);

    const handleCheckChange = useCallback((index: number, checked: boolean) => {
        setChecks((prev) => {
            const next = [...prev];
            next[index] = checked;
            return next;
        });
    }, []);

    const handleDetailChange = useCallback((index: number, value: string) => {
        setDetails((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleLeaderAnswerChange = useCallback((index: number, value: string) => {
        setLeaderAnswers((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const handleTrafficChange = useCallback((platformId: keyof TrafficData, value: string) => {
        setTraffic((prev) => ({ ...prev, [platformId]: value }));
    }, []);

    const handleChannelChange = useCallback((platformId: keyof TrafficData, value: string) => {
        setTrafficChannels((prev) => ({ ...prev, [platformId]: value }));
    }, []);

    const buildPayload = useCallback((): Record<string, boolean | string> => {
        const payload: Record<string, boolean | string> = {
            isLate: false,
        };
        CHECKLIST_ITEMS.forEach((label, i) => {
            payload[label] = checks[i] ?? false;
        });
        DETAIL_ITEMS.forEach((item, i) => {
            payload[item.question] = (details[i] ?? '').trim() || '';
        });

        // Add Leader answers only if user is authorized as leader
        if (showForm3) {
            LEADER_QUESTIONS.forEach((item, i) => {
                payload[item.question] = (leaderAnswers[i] ?? '').trim() || '';
            });
        }

        return payload;
    }, [checks, details, leaderAnswers, showForm3]);

    const handleSubmit = async () => {
        if (!user) {
            setMessage({ type: 'error', text: 'Vui lòng đăng nhập để gửi báo cáo.' });
            return;
        }

        // Validate Traffic
        if ((showForm12 || showForm3) && !showOnlyWork) {
            // Validate Date for Traffic Report
            if (showOnlyTraffic && !trafficDate) {
                setMessage({ type: 'error', text: 'Vui lòng chọn ngày báo cáo' });
                return;
            }

            const hasTrafficData = Object.values(traffic).some(val => val !== '');
            if (!hasTrafficData) {
                setMessage({ type: 'error', text: 'Vui lòng nhập số liệu báo cáo Traffic tối thiểu 1 nền tảng (nếu không có hãy nhập số 0).' });
                return;
            }

            // Validate Evidence for each platform with traffic > 0
            const platforms = [
                { id: 'fb', label: 'FB' },
                { id: 'ig', label: 'IG' },
                { id: 'tiktok', label: 'Tiktok' },
                { id: 'yt', label: 'YT' },
                { id: 'thread', label: 'Thread' },
                { id: 'lemon8', label: 'Lemon 8' },
                { id: 'zalo', label: 'Zalo' },
                { id: 'twitter', label: 'Twitter' },
            ];

            for (const p of platforms) {
                const val = traffic[p.id as keyof TrafficData];
                if (val && Number(val) > 0) {
                    const evs = platformEvidences[p.id] || [];
                    if (evs.length === 0) {
                        setMessage({ type: 'error', text: `Vui lòng tải ảnh minh chứng cho Traffic ${p.label}` });
                        return;
                    }
                }
            }
        }

        // Validate Form Chi Tiết (Member)
        if (showForm12 && !showOnlyTraffic) {
            // Kiểm tra các item xem có bị bỏ trống hay bấm "Có" mà không nhập nội dung
            const hasEmptyDetails = details.some(d => d.trim() === '');
            if (hasEmptyDetails) {
                setMessage({ type: 'error', text: 'Vui lòng điền đủ báo cáo' });
                return;
            }
        }

        // Validate Form Đánh Giá (Leader)
        if (showForm3 && !showOnlyTraffic) {
            const hasEmptyLeader = leaderAnswers.some(l => l.trim() === '');
            if (hasEmptyLeader) {
                setMessage({ type: 'error', text: 'Vui lòng điền đủ báo cáo' });
                return;
            }
        }

        setMessage(null);
        setLoading(true);
        try {
            if (!showOnlyTraffic) {
                const payload = buildPayload();
                // Thêm thông tin user vào payload
                const fullPayload = {
                    ...payload,
                    userEmail: user.email,
                    userName: user.full_name,
                };

                // Checklist API nằm trên Django (AutomationGenVideo_AI), dùng AI_SERVICE_URL (mặc định port 8001)
                const djangoBase = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
                const base = djangoBase.replace(/\/$/, '');
                const url = `${base}/api/checklist/submit/`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(fullPayload),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const errMsg = typeof data.error === 'string' ? data.error : 'Gửi báo cáo thất bại.';
                    const detail = typeof data.detail === 'string' ? data.detail : '';
                    const hint = typeof data.hint === 'string' ? data.hint : '';
                    const parts = [errMsg];
                    if (detail) parts.push(`Chi tiết: ${detail}`);
                    if (hint) parts.push(hint);
                    setMessage({ type: 'error', text: parts.join(' ') });
                    setLoading(false);
                    return;
                }
                setMessage({ type: 'success', text: data.message || 'Báo cáo thành công' });
                setChecks(initialChecks());
                setDetails(initialDetails());
                setLeaderAnswers(initialLeaderAnswers());
            }

            // Gửi báo cáo traffic tới AutomationGenVideo_BE nếu có nhập dữ liệu traffic
            const hasTrafficData = Object.values(traffic).some(val => val !== '');
            if (hasTrafficData && !showOnlyWork) {
                const beBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                const trafficRes = await fetch(`${beBaseUrl}/lark/traffic-report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        name: user.full_name,
                        roles: user.roles,
                        traffic: traffic,
                        channels: trafficChannels,
                        platformEvidences: platformEvidences,
                        reportDate: trafficDate, // Send custom date
                    })
                });
                
                if (showOnlyTraffic) {
                    if (trafficRes.ok) {
                        setMessage({ type: 'success', text: 'Báo cáo Traffic thành công' });
                    } else {
                        const errData = await trafficRes.json().catch(() => ({}));
                        setMessage({ type: 'error', text: errData.message || 'Gửi báo cáo traffic thất bại' });
                        setLoading(false);
                        return;
                    }
                }
                
                setTraffic(initialTrafficData());
                setTrafficChannels(initialTrafficChannels());
                setPlatformEvidences({});
                setSubmitCount(prev => prev + 1);
            } else {
                 if (!showOnlyWork) setMessage({ type: 'success', text: 'Báo cáo thành công' });
                 setSubmitCount(prev => prev + 1);
            }

        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            const isNetwork = err.message?.includes('fetch') || err.name === 'TypeError';
            setMessage({
                type: 'error',
                text: isNetwork
                    ? 'Không kết nối được backend. Kiểm tra Django đã chạy (ví dụ http://localhost:8000) và CORS.'
                    : (err.message || 'Lỗi kết nối. Kiểm tra backend và CORS.'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
            {status.message && !status.is_open && !showOnlyTraffic && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in slide-in-from-top duration-500">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                    <p className="text-sm font-semibold">{status.message}</p>
                </div>
            )}

            {showOnlyTraffic && (
                <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 animate-in slide-in-from-top duration-500 ${
                    (new Date().getHours() >= 17 && new Date().getHours() < 18) || isAdmin
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold uppercase tracking-tight">
                        {(new Date().getHours() >= 17 && new Date().getHours() < 18) || isAdmin
                            ? 'Đang trong khung giờ báo cáo Traffic (17:00 - 18:00)'
                            : 'Ngoài khung giờ báo cáo Traffic (Quy định: 17:00 - 18:00 hàng ngày)'}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Always show Checklist Section for both Member and Leader - Hide if only traffic */}
                {(showForm12 || showForm3) && !showOnlyTraffic && (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100/50">
                        <ChecklistSection values={checks} onChange={handleCheckChange} />
                    </div>
                )}


                {/* Show Detail Section for Member/Staff - Hide if only traffic */}
                {showForm12 && !showOnlyTraffic && (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-100/50">
                        <DetailSection values={details} onChange={handleDetailChange} />
                    </div>
                )}

                {/* Leader Section - Show for Leader mode - Hide if only traffic */}
                {showForm3 && !showOnlyTraffic && (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-100/50">
                        <LeaderEvaluationSection values={leaderAnswers} onChange={handleLeaderAnswerChange} />
                    </div>
                )}
                
                {/* Traffic Section - Show for both Member and Leader if needed - Hide if only work */}
                {(showForm12 || showForm3) && !showOnlyWork && (
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-purple-100/50 lg:col-span-2">
                        <TrafficReportSection 
                            key={submitCount}
                            values={traffic} 
                            channels={trafficChannels}
                            availableChannels={availableChannels}
                            onChange={handleTrafficChange}
                            onChannelChange={handleChannelChange}
                            onPlatformEvidenceChange={(evMap) => setPlatformEvidences(evMap)}
                        />
                    </div>
                )}
            </div>

            {message && (
                <p className={`text-center text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message.text}
                </p>
            )}

            <div className="flex justify-center pt-8 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                        loading || 
                        (!status.is_open && !showOnlyTraffic) ||
                        (showOnlyTraffic && !isAdmin && (new Date().getHours() < 17 || new Date().getHours() >= 18))
                    }
                    className="flex items-center gap-2 bg-[#dbeafe] text-blue-600 px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-blue-200 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    {loading ? 'Đang gửi...' : 'GỬI BÁO CÁO'}
                </button>
            </div>
        </div>
    );
};

export default ChecklistContainer;
