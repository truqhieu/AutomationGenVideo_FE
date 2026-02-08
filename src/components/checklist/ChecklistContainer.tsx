'use client';

import React, { useState, useCallback } from 'react';
import ChecklistSection, { CHECKLIST_ITEMS } from './ChecklistSection';
import DetailSection, { DETAIL_ITEMS } from './DetailSection';
import { Send } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

const initialChecks = () => Array(CHECKLIST_ITEMS.length).fill(false);
const initialDetails = () => Array(DETAIL_ITEMS.length).fill('');

const ChecklistContainer = () => {
    const [checks, setChecks] = useState<boolean[]>(initialChecks);
    const [details, setDetails] = useState<string[]>(initialDetails);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        return payload;
    }, [checks, details]);

    const handleSubmit = async () => {
        const { user } = useAuthStore.getState();
        if (!user) {
            setMessage({ type: 'error', text: 'Vui lòng đăng nhập để gửi báo cáo.' });
            return;
        }

        setMessage(null);
        setLoading(true);
        try {
            const payload = buildPayload();
            // Thêm thông tin user vào payload
            const fullPayload = {
                ...payload,
                userEmail: user.email,
                userName: user.full_name,
            };

            // Checklist API nằm trên Django (AutomationGenVideo_AI), dùng cùng base với AI/mix-video (start.bat mặc định port 8001)
            const djangoBase = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';
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
                return;
            }
            setMessage({ type: 'success', text: data.message || 'Báo cáo thành công' });
            setChecks(initialChecks());
            setDetails(initialDetails());
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-pink-100/50">
                    <ChecklistSection values={checks} onChange={handleCheckChange} />
                </div>
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-blue-100/50">
                    <DetailSection values={details} onChange={handleDetailChange} />
                </div>
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
                    disabled={loading}
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
