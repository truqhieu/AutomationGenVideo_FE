'use client';

import React, { useState } from 'react';
import {
    Search,
    Calendar,
    Hash,
    Film,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Facebook,
    Instagram,
    Music2,
    ExternalLink,
    Heart,
    Eye,
    MessageCircle,
    Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'react-hot-toast';

const PLATFORMS = [
    { id: 'tiktok', label: 'TikTok', icon: Music2, color: 'text-pink-500' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-purple-500' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
];

export default function CheckVideoPage() {
    const { user } = useAuthStore();
    const [hashtag, setHashtag] = useState('');
    const [username, setUsername] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [platform, setPlatform] = useState('tiktok');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleCheck = async () => {
        if (!hashtag) {
            toast.error('Vui lòng nhập hashtag');
            return;
        }

        setLoading(true);
        try {
            const cleanHashtag = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
            const aiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';

            const response = await fetch(`${aiUrl}/api/hashtags/check/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hashtag: cleanHashtag,
                    username: username.replace('@', '').trim(),
                    platform: platform.toUpperCase(),
                    date: date
                }),
            });

            const data = await response.json();
            if (data.success) {
                setResults(data);
                toast.success(`Tìm thấy ${data.count} video`);
            } else {
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Check failed:', error);
            toast.error('Không thể kết nối đến máy chủ AI');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6 space-y-8">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <Film className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kiểm tra Video</h1>
                        <p className="text-sm text-slate-500 font-medium">Xác thực số lượng video đăng tải theo Hashtag và Ngày</p>
                    </div>
                </div>
            </header>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* Hashtag Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Hashtag</label>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="nhập hashtag (vd: vcb)"
                                    value={hashtag}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtag(e.target.value)}
                                    className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                />
                            </div>
                        </div>

                        {/* Channel Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Kênh / Username</label>
                            <div className="relative group">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="@username"
                                    value={username}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                    className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Ngày đăng tải</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                                    className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold"
                                />
                            </div>
                        </div>

                        {/* Platform Select (Visual Buttons) */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase ml-1">Nền tảng</label>
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl h-12">
                                {PLATFORMS.map((p) => {
                                    const Icon = p.icon;
                                    const active = platform === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlatform(p.id)}
                                            className={`flex-1 flex items-center justify-center rounded-lg transition-all ${active
                                                ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${active ? p.color : ''}`} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-end">
                            <Button
                                onClick={handleCheck}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Search className="w-5 h-5 mr-2" />
                                )}
                                Kiểm tra ngay
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {results && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-400 uppercase">Kết quả tìm kiếm</span>
                                <h2 className="text-xl font-black text-slate-900 group flex items-center gap-2">
                                    <span>#{results.hashtag}</span>
                                    {results.username && (
                                        <span className="text-blue-500 text-sm font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                            @{results.username}
                                        </span>
                                    )}
                                </h2>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-400 uppercase">Ngày</span>
                                <span className="font-bold text-slate-700">{results.date}</span>
                            </div>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl flex items-center gap-3 border border-blue-100 shadow-sm">
                            <span className="text-xs font-black uppercase">Tổng cộng:</span>
                            <span className="text-3xl font-black">{results.count}</span>
                            <span className="text-xs font-bold">video</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {results.results.map((video: any, idx: number) => (
                            <Card key={idx} className="border-none shadow-lg shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                                <CardContent className="p-0">
                                    <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
                                        <img
                                            src={video.thumbnail_url || `https://via.placeholder.com/300x533?text=${encodeURIComponent(video.author_username)}`}
                                            alt={video.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        {/* External Link */}
                                        <a
                                            href={video.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>

                                        {/* Bottom Stats Overlay */}
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <p className="text-xs font-medium line-clamp-2 mb-2">{video.title || 'No caption'}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">@{video.author_username}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                                                        <span className="text-[10px] font-bold">{video.likes_count?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3 text-blue-400" />
                                                        <span className="text-[10px] font-bold">{video.views_count?.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {results.count === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <AlertCircle className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Không tìm thấy video nào</h3>
                            <p className="text-slate-500 font-medium mt-1">Vui lòng kiểm tra lại hashtag hoặc ngày đăng tải</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
