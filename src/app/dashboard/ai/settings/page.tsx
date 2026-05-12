"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    Search, ChevronRight, AlertTriangle, Cloud, 
    CheckCircle2, RefreshCw, XCircle, TrendingUp,
    Plus, AlertCircle, Loader2, X
} from 'lucide-react';
import { apiClient } from "@/lib/api-client";

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877f2]">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#e1306c]">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
);

// Removed MOCK_DATA

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook / Instagram', description: 'Kết nối Fanpage và tài khoản Instagram Business', color: 'bg-blue-600', textColor: 'text-white', icon: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )},
  { key: 'tiktok', label: 'TikTok', description: 'Kết nối kênh TikTok để lấy insights và video data', color: 'bg-black', textColor: 'text-white', icon: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1-.43z"/></svg>
  )},
];

export default function ConnectionSettingsPage() {
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [oauthToast, setOauthToast] = useState<{type: 'success'|'error'; message: string} | null>(null);

    useEffect(() => {
        const oauthStatus = searchParams.get('oauth');
        const platform = searchParams.get('platform');
        const count = searchParams.get('count');
        const message = searchParams.get('message');
        if (oauthStatus === 'success') {
            setOauthToast({ type: 'success', message: `✅ Kết nối ${platform} thành công! Đã thêm ${count} kênh.` });
            setTimeout(() => setOauthToast(null), 5000);
        } else if (oauthStatus === 'error') {
            setOauthToast({ type: 'error', message: `❌ Lỗi kết nối ${platform}: ${message}` });
            setTimeout(() => setOauthToast(null), 8000);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const { data } = await apiClient.get('/business-connections');
                if (data && Array.isArray(data)) {
                    setConnections(data);
                }
            } catch (error) {
                console.error("Error fetching connections:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConnections();
    }, [oauthToast]);

    return (
        <div className="min-h-screen bg-white text-gray-800 p-6 font-sans">
            
            {/* OAuth Toast Notification */}
            {oauthToast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
                    oauthToast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    <span>{oauthToast.message}</span>
                    <button onClick={() => setOauthToast(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Platform Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Chọn nền tảng kết nối</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-5">Bạn sẽ được chuyển sang trang đăng nhập của nền tảng tương ứng để cấp quyền truy cập.</p>
                        <div className="grid gap-3">
                            {PLATFORMS.map(p => (
                                <a
                                    key={p.key}
                                    href={`${BACKEND_URL}/oauth/${p.key}`}
                                    className={`flex items-center gap-4 p-4 rounded-lg ${p.color} cursor-pointer hover:opacity-90 transition-opacity`}
                                >
                                    <div className="shrink-0">{p.icon}</div>
                                    <div>
                                        <div className={`font-semibold ${p.textColor}`}>{p.label}</div>
                                        <div className={`text-xs opacity-80 ${p.textColor}`}>{p.description}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Hệ thống sẽ không lưu mật khẩu của bạn. Chỉ có quyền đọc dữ liệu được cấp.
                        </p>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center text-sm mb-4">
                <span className="text-gray-500">Quản lý Hệ thống</span>
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                <span className="text-blue-600 font-medium">Cấu hình kết nối</span>
            </div>

            {/* Alert Banner */}
            {connections.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-md p-3 mb-6 flex items-start gap-2 text-sm text-orange-800">
                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p>
                        <span className="font-bold">Có {connections.filter(c => !c.is_active || c.sync_status === 'Chưa đồng bộ').length} kênh</span> đang tạm dừng đồng bộ do mất quyền truy cập, dữ liệu trong báo cáo có thể chưa được cập nhật. Vui lòng cấp lại quyền để tiếp tục đồng bộ!
                    </p>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-5 gap-0 border border-gray-200 rounded-lg bg-white overflow-hidden mb-6 shadow-sm">
                
                <div className="p-4 border-r border-gray-200">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1 text-xs font-semibold">
                        <Cloud className="w-4 h-4" />
                        Kênh đã kết nối
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{connections.length}</div>
                </div>

                <div className="p-4 border-r border-gray-200">
                    <div className="flex items-center gap-1.5 text-green-600 mb-1 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Đồng bộ thành công
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{connections.filter(c => c.sync_status === 'Thành công').length}</div>
                </div>

                <div className="p-4 border-r border-gray-200 bg-[#fffdf0]">
                    <div className="flex items-center gap-1.5 text-yellow-600 mb-1 text-xs font-semibold">
                        <RefreshCw className="w-4 h-4" />
                        Đang đồng bộ
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{connections.filter(c => c.sync_status === 'Đang đồng bộ').length}</div>
                </div>

                <div className="p-4 border-r border-gray-200">
                    <div className="flex items-center gap-1.5 text-red-500 mb-1 text-xs font-semibold">
                        <XCircle className="w-4 h-4" />
                        Đồng bộ thất bại
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{connections.filter(c => c.sync_status === 'Thất bại').length}</div>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1 text-xs font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        Tỉ lệ kéo thành công
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                            {connections.length > 0 
                                ? Math.round((connections.filter(c => c.sync_status === 'Thành công').length / connections.length) * 100)
                                : 0}%
                        </span>
                        <span className="text-xs text-gray-500">/ 30 ngày qua</span>
                    </div>
                </div>

            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-1.5 w-64 border border-gray-300 rounded-md text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500">
                        <option>Loại kết nối: Tất cả</option>
                    </select>
                    <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500">
                        <option>Trạng thái: Tất cả</option>
                    </select>
                    <select className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500">
                        <option>Nền tảng: Tất cả</option>
                    </select>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                        <Plus className="w-4 h-4" />
                        Thêm kết nối
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-medium">Kênh</th>
                            <th className="px-4 py-3 font-medium">Nền tảng</th>
                            <th className="px-4 py-3 font-medium">Loại kết nối</th>
                            <th className="px-4 py-3 font-medium text-center">Trạng thái đồng bộ</th>
                            <th className="px-4 py-3 font-medium">Lần cuối đồng bộ</th>
                            <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
                            <th className="px-4 py-3 font-medium">Người tạo</th>
                            <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                    Đang tải dữ liệu kết nối...
                                </td>
                            </tr>
                        ) : connections.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                    Không có dữ liệu kênh kết nối.
                                </td>
                            </tr>
                        ) : connections.filter(c => c.channel_name.toLowerCase().includes(searchQuery.toLowerCase())).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors bg-white">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Toggle Switch */}
                                        <div className={`w-8 h-4 rounded-full relative cursor-pointer ${row.is_active ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${row.is_active ? 'left-4.5 translate-x-[14px]' : 'left-0.5'}`}></div>
                                        </div>
                                        
                                        {/* Avatar */}
                                        {row.avatar_url && row.avatar_url.startsWith('http') ? (
                                            <img src={row.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-medium text-xs">
                                                {row.avatar_url || row.channel_name.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div>
                                            <div className="font-semibold text-gray-900 text-[13px]">{row.channel_name}</div>
                                            <div className="text-[11px] text-gray-400">ID: {row.platform_id}</div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 font-medium text-gray-800 text-[13px]">
                                        {row.platform === 'Instagram' && <InstagramIcon />}
                                        {row.platform === 'Facebook' && <FacebookIcon />}
                                        {row.platform === 'TikTok' && <TikTokIcon />}
                                        {row.platform}
                                    </div>
                                </td>
                                
                                <td className="px-4 py-3">
                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200/60">
                                        {row.connection_type}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200/80 rounded-full text-xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                        {row.sync_status}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-3 text-[13px]">{row.last_sync_at ? new Date(row.last_sync_at).toLocaleDateString() : 'Chưa đồng bộ'}</td>
                                
                                <td className="px-4 py-3 text-[13px]">{new Date(row.updated_at).toLocaleDateString()}</td>
                                
                                <td className="px-4 py-3 text-[13px] text-gray-600">{row.creator_email}</td>
                                
                                <td className="px-4 py-3 text-right">
                                    <button className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-md text-xs font-medium transition-colors">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Cấp lại quyền
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex justify-end mt-4">
               {/* This can be expanded later if needed */}
            </div>

        </div>
    );
}
