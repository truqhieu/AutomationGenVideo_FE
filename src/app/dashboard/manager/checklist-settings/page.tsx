'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface DaySchedule {
    start: string;
    end: string;
    enabled: boolean;
}

interface ReportSettings {
    schedule: {
        [key: string]: DaySchedule;
    };
    one_report_per_day: boolean;
    timezone: string;
    updated_at?: string | null;
    updated_by?: string;
}

const DAYS = [
    { key: 'monday', label: 'Thứ 2' },
    { key: 'tuesday', label: 'Thứ 3' },
    { key: 'wednesday', label: 'Thứ 4' },
    { key: 'thursday', label: 'Thứ 5' },
    { key: 'friday', label: 'Thứ 6' },
    { key: 'saturday', label: 'Thứ 7' },
    { key: 'sunday', label: 'Chủ nhật' },
];

export default function ChecklistSettingsPage() {
    const { user } = useAuthStore();
    const [settings, setSettings] = useState<ReportSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load settings
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/checklist/settings/');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Không thể tải cấu hình' });
        } finally {
            setLoading(false);
        }
    };

    const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            schedule: {
                ...settings.schedule,
                [day]: {
                    ...settings.schedule[day],
                    [field]: value,
                },
            },
        });
    };

    const handleToggleDay = (day: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            schedule: {
                ...settings.schedule,
                [day]: {
                    ...settings.schedule[day],
                    enabled: !settings.schedule[day].enabled,
                },
            },
        });
    };

    const handleSave = async () => {
        if (!settings || !user) return;
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8001/api/checklist/settings/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    updated_by: user.email,
                }),
            });

            if (!response.ok) throw new Error('Failed to save settings');

            const data = await response.json();
            setMessage({ type: 'success', text: data.message || 'Lưu cấu hình thành công' });

            // Reload settings
            await fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Không thể lưu cấu hình' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Đang tải...</div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-red-500">Không thể tải cấu hình</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">⚙️ Cấu Hình Báo Cáo Checklist</h1>
                    <p className="text-gray-300">Quản lý khung giờ cho phép báo cáo của nhân viên</p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                : 'bg-red-500/20 border border-red-500/50 text-red-300'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* One Report Per Day Toggle */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">📅 Giới hạn 1 lần/ngày</h3>
                                <p className="text-sm text-gray-300">Mỗi nhân viên chỉ được báo cáo 1 lần mỗi ngày</p>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={settings.one_report_per_day}
                                    onChange={(e) =>
                                        setSettings({ ...settings, one_report_per_day: e.target.checked })
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-600 peer-checked:bg-green-500 rounded-full peer transition-all duration-300"></div>
                                <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full peer-checked:translate-x-6 transition-transform duration-300"></div>
                            </div>
                        </label>
                    </div>

                    {/* Schedule for each day */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white mb-4">🕐 Khung Giờ Cho Phép Báo Cáo</h3>

                        {DAYS.map(({ key, label }) => {
                            const daySchedule = settings.schedule[key];
                            if (!daySchedule) return null;

                            return (
                                <div
                                    key={key}
                                    className={`p-5 rounded-xl border transition-all duration-200 ${daySchedule.enabled
                                            ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30'
                                            : 'bg-gray-800/30 border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Toggle */}
                                        <button
                                            onClick={() => handleToggleDay(key)}
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${daySchedule.enabled
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                                }`}
                                        >
                                            {daySchedule.enabled ? '✓' : '✗'}
                                        </button>

                                        {/* Day label */}
                                        <div className="flex-shrink-0 w-28">
                                            <span className={`text-lg font-medium ${daySchedule.enabled ? 'text-white' : 'text-gray-500'}`}>
                                                {label}
                                            </span>
                                        </div>

                                        {/* Time inputs */}
                                        {daySchedule.enabled && (
                                            <div className="flex items-center gap-3 flex-1">
                                                <input
                                                    type="time"
                                                    value={daySchedule.start}
                                                    onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                                                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                                />
                                                <span className="text-gray-400">→</span>
                                                <input
                                                    type="time"
                                                    value={daySchedule.end}
                                                    onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                                                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        )}

                                        {!daySchedule.enabled && (
                                            <span className="text-gray-500 italic">Tắt báo cáo</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="text-sm text-gray-400">
                            {settings.updated_by && (
                                <p>Cập nhật lần cuối: {settings.updated_by}</p>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? '🔄 Đang lưu...' : '💾 Lưu Cấu Hình'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
