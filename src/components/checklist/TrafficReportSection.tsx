import React, { useRef, useState } from 'react';
import { Activity, ImagePlus, X, CheckCircle, Loader2 } from 'lucide-react';

export const TRAFFIC_PLATFORMS = [
    { id: 'fb', label: 'Traffic FB' },
    { id: 'ig', label: 'Traffic IG' },
    { id: 'tiktok', label: 'Traffic Tiktok' },
    { id: 'yt', label: 'Traffic YT' },
    { id: 'thread', label: 'Traffic Thread' },
    { id: 'lemon8', label: 'Traffic Lemon 8' },
    { id: 'zalo', label: 'Traffic Zalo' },
    { id: 'twitter', label: 'Traffic Twitter' },
];

export interface TrafficData {
    fb: string;
    ig: string;
    tiktok: string;
    yt: string;
    thread: string;
    lemon8: string;
    zalo: string;
    twitter: string;
}

export const initialTrafficData = (): TrafficData => ({
    fb: '',
    ig: '',
    tiktok: '',
    yt: '',
    thread: '',
    lemon8: '',
    zalo: '',
    twitter: '',
});

export const initialTrafficChannels = (): TrafficData => ({
    fb: '',
    ig: '',
    tiktok: '',
    yt: '',
    thread: '',
    lemon8: '',
    zalo: '',
    twitter: '',
});

interface TrafficReportSectionProps {
    values: TrafficData;
    channels: TrafficData;
    availableChannels?: any[];
    onChange: (platformId: keyof TrafficData, value: string) => void;
    onChannelChange: (platformId: keyof TrafficData, value: string) => void;
    onPlatformEvidenceChange?: (platformEvidences: Record<string, string[]>) => void;
    readOnly?: boolean;
    initialEvidences?: Record<string, { url: string; name: string; token: string }[]>;
}

interface TrafficEntry {
    id: string;
    value: string;
    channel: string;
}

const TrafficReportSection: React.FC<TrafficReportSectionProps> = ({ 
    values, 
    channels,
    availableChannels = [],
    onChange, 
    onChannelChange,
    onPlatformEvidenceChange,
    readOnly,
    initialEvidences
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null);
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    
    // Store evidence per platform: { platformId: [{ url, name, token }] }
    const [evidences, setEvidences] = useState<Record<string, { url: string; name: string; token: string }[]>>(initialEvidences || {});
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

    // Internal state to track multiple entries per platform
    // format: { fb: [{ id: 'random', value: '100', channel: 'Kênh A' }] }
    const [entries, setEntries] = useState<Record<string, TrafficEntry[]>>(() => {
        const initial: Record<string, TrafficEntry[]> = {};
        TRAFFIC_PLATFORMS.forEach(p => {
            const val = values[p.id as keyof TrafficData] || '';
            const ch = channels[p.id as keyof TrafficData] || '';
            initial[p.id] = [{ id: Math.random().toString(36).slice(2, 9), value: val, channel: ch }];
        });
        return initial;
    });

    React.useEffect(() => {
        if (initialEvidences) {
            setEvidences(initialEvidences);
        }
    }, [initialEvidences]);

    // Update parent whenever entries change
    const updateParent = (platformId: string, currentEntries: TrafficEntry[]) => {
        // Aggregated total
        const total = currentEntries.reduce((sum, e) => sum + (parseInt(e.value) || 0), 0);
        onChange(platformId as keyof TrafficData, total > 0 ? total.toString() : '');
        
        // Joined channel names
        const joinedChannels = currentEntries
            .map(e => e.channel)
            .filter(c => c !== '')
            .join(', ');
        onChannelChange(platformId as keyof TrafficData, joinedChannels);
    };

    const addRow = (platformId: string) => {
        if (readOnly) return;
        const newEntries = [
            ...(entries[platformId] || []),
            { id: Math.random().toString(36).slice(2, 9), value: '', channel: '' }
        ];
        setEntries(prev => ({ ...prev, [platformId]: newEntries }));
    };

    const removeRow = (platformId: string, entryId: string) => {
        if (readOnly) return;
        const currentPlatformEntries = entries[platformId] || [];
        if (currentPlatformEntries.length <= 1) {
            // Just clear the first one instead of removing
            updateRow(platformId, entryId, { value: '', channel: '' });
            return;
        }
        const newEntries = currentPlatformEntries.filter(e => e.id !== entryId);
        setEntries(prev => ({ ...prev, [platformId]: newEntries }));
        updateParent(platformId, newEntries);
    };

    const updateRow = (platformId: string, entryId: string, data: Partial<TrafficEntry>) => {
        if (readOnly) return;
        const newEntries = (entries[platformId] || []).map(e => 
            e.id === entryId ? { ...e, ...data } : e
        );
        setEntries(prev => ({ ...prev, [platformId]: newEntries }));
        updateParent(platformId, newEntries);
    };
    
    const isPlatformMatch = (platformId: string, channelPlatform: string | null | undefined): boolean => {
        if (!channelPlatform) return false;
        const p = channelPlatform.toLowerCase().trim();
        
        const platformMap: Record<string, string[]> = {
            'fb': ['fb', 'facebook', 'fanpage'],
            'ig': ['ig', 'instagram', 'ins'],
            'tiktok': ['tiktok', 'tt'],
            'yt': ['yt', 'youtube'],
            'thread': ['thread', 'threads'],
            'lemon8': ['lemon8', 'lemon 8'],
            'zalo': ['zalo', 'zalo oa', 'zalo video'],
            'twitter': ['twitter', 'twitter x', 'x']
        };

        const targets = platformMap[platformId] || [platformId.toLowerCase()];
        
        return targets.some(target => {
            if (p === target) return true;
            if (target.length > 3 && p.includes(target)) return true;
            const regex = new RegExp(`\\b${target}\\b`, 'i');
            if (regex.test(p)) return true;
            return false;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !activePlatform) return;

        const platformId = activePlatform;
        setUploadingPlatform(platformId);
        setUploadErrors(prev => ({ ...prev, [platformId]: '' }));

        try {
            const beBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));

            const res = await fetch(`${beBaseUrl}/lark/upload-evidence`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload thất bại');

            const data = await res.json();
            const newEvidences = files.map((f, i) => ({
                url: URL.createObjectURL(f),
                name: f.name,
                token: data.fileTokens[i]
            }));

            const updatedEvidences = {
                ...evidences,
                [platformId]: [...(evidences[platformId] || []), ...newEvidences]
            };
            
            setEvidences(updatedEvidences);
            const platformTokens: Record<string, string[]> = {};
            Object.keys(updatedEvidences).forEach(pid => {
                platformTokens[pid] = updatedEvidences[pid].map(ev => ev.token);
            });
            onPlatformEvidenceChange?.(platformTokens);
            
        } catch (err) {
            setUploadErrors(prev => ({ ...prev, [platformId]: 'Lỗi upload ảnh' }));
        } finally {
            setUploadingPlatform(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (platformId: string, idx: number) => {
        const updatedPlatformEvidences = (evidences[platformId] || []).filter((_, i) => i !== idx);
        const updatedEvidences = { ...evidences, [platformId]: updatedPlatformEvidences };
        setEvidences(updatedEvidences);
        const platformTokens: Record<string, string[]> = {};
        Object.keys(updatedEvidences).forEach(pid => {
            platformTokens[pid] = updatedEvidences[pid].map(ev => ev.token);
        });
        onPlatformEvidenceChange?.(platformTokens);
    };

    const triggerUpload = (platformId: string) => {
        setActivePlatform(platformId);
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                <div className="p-2.5 bg-purple-100/50 rounded-xl">
                    <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-0.5">Báo cáo Traffic</h3>
                    <p className="text-sm text-slate-500 font-medium">Nhập số lượt traffic theo từng kênh bạn quản lý</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TRAFFIC_PLATFORMS.filter(platform => {
                    const hasAccess = availableChannels.some(c => isPlatformMatch(platform.id, c.platform));
                    const hasData = (entries[platform.id] || []).some(e => e.value !== '' || e.channel !== '');
                    return hasAccess || hasData || readOnly;
                }).map((platform) => (
                    <div key={platform.id} className="flex flex-col gap-4 p-5 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:border-purple-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-6 bg-purple-500 rounded-full" />
                                <label className="text-base font-black text-slate-800 uppercase tracking-tight">
                                    {platform.label}
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                {uploadingPlatform === platform.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                ) : !readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => triggerUpload(platform.id)}
                                        className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all active:scale-95"
                                        title="Tải minh chứng"
                                    >
                                        <ImagePlus className="w-5 h-5" />
                                    </button>
                                )}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => addRow(platform.id)}
                                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                    >
                                        <Activity className="w-3.5 h-3.5" /> Thêm kênh
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {(entries[platform.id] || []).map((entry, idx) => (
                                <div key={entry.id} className="relative grid grid-cols-12 gap-3 items-end group/row bg-white/50 p-3 rounded-2xl border border-slate-100">
                                    <div className="col-span-12 sm:col-span-5 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1 flex justify-between">
                                            <span>Số Traffic</span>
                                            {idx > 0 && <span className="text-purple-400">Kênh #{idx + 1}</span>}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Số lượt..."
                                            readOnly={readOnly}
                                            value={entry.value !== '' ? Number(entry.value).toLocaleString('en-US') : ''}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\D/g, '');
                                                updateRow(platform.id, entry.id, { value: rawValue });
                                            }}
                                            className="w-full h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-slate-800 text-base font-black focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="col-span-12 sm:col-span-6 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">Tên kênh</label>
                                        <select
                                            disabled={readOnly}
                                            value={entry.channel}
                                            onChange={(e) => updateRow(platform.id, entry.id, { channel: e.target.value })}
                                            className="w-full h-[46px] px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">-- Chọn kênh --</option>
                                            {availableChannels
                                                ?.filter(c => isPlatformMatch(platform.id, c.platform))
                                                .map((c, cIdx) => (
                                                    <option key={c.id || cIdx} value={c.name}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {!readOnly && (entries[platform.id]?.length > 1) && (
                                        <div className="col-span-12 sm:col-span-1 mb-1">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(platform.id, entry.id)}
                                                className="w-8 h-8 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Xóa dòng này"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Evidence Preview */}
                        <div className="flex flex-wrap gap-2.5 px-1 min-h-[30px]">
                            {(evidences[platform.id] || []).map((img, idx) => (
                                <div key={idx} className="relative group/img w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-all cursor-pointer bg-slate-200" onClick={() => window.open(img.url, '_blank')}>
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeImage(platform.id, idx); }}
                                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(!evidences[platform.id] || evidences[platform.id].length === 0) && (
                                <span className="text-[10px] text-slate-400 italic">Chưa có minh chứng hình ảnh</span>
                            )}
                        </div>

                        {uploadErrors[platform.id] && (
                            <p className="text-xs text-red-500 font-bold px-1 mt-1">{uploadErrors[platform.id]}</p>
                        )}
                    </div>
                ))}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

            {availableChannels.length === 0 && !readOnly && (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <Activity className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">Không tìm thấy kênh nào bạn đang quản lý</p>
                    <p className="text-slate-400 text-sm">Vui lòng kiểm tra lại tài khoản hoặc liên hệ quản trị viên</p>
                </div>
            )}
        </div>
    );
};

export default TrafficReportSection;
