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

interface TrafficReportSectionProps {
    values: TrafficData;
    onChange: (platformId: keyof TrafficData, value: string) => void;
    onEvidenceTokensChange?: (tokens: string[]) => void;
}

const TrafficReportSection: React.FC<TrafficReportSectionProps> = ({ values, onChange, onEvidenceTokensChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewImages, setPreviewImages] = useState<{ url: string; name: string }[]>([]);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
    const [uploadedTokens, setUploadedTokens] = useState<string[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Preview
        const previews = files.map(f => ({ url: URL.createObjectURL(f), name: f.name }));
        setPreviewImages(prev => [...prev, ...previews]);
        setUploadStatus('uploading');
        setUploadError(null);

        // Upload to Backend
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
            const newTokens = [...uploadedTokens, ...data.fileTokens];
            setUploadedTokens(newTokens);
            onEvidenceTokensChange?.(newTokens);
            setUploadStatus('done');
        } catch (err) {
            setUploadStatus('error');
            setUploadError('Upload ảnh thất bại. Vui lòng thử lại.');
            console.error('Evidence upload error:', err);
        }

        // Reset input so same files can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (idx: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== idx));
        const newTokens = uploadedTokens.filter((_, i) => i !== idx);
        setUploadedTokens(newTokens);
        onEvidenceTokensChange?.(newTokens);
        if (newTokens.length === 0) setUploadStatus('idle');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-purple-100">
                <div className="p-2.5 bg-purple-100/50 rounded-xl">
                    <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-0.5">Báo cáo Traffic</h3>
                    <p className="text-sm text-slate-500 font-medium">Nhập số lượt traffic đạt được trên các nền tảng hôm nay</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {TRAFFIC_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            {platform.label}
                        </label>
                        <input
                            type="text"
                            placeholder="Nhập số..."
                            value={values[platform.id as keyof TrafficData] && !isNaN(Number(values[platform.id as keyof TrafficData])) 
                                ? Number(values[platform.id as keyof TrafficData]).toLocaleString('en-US') 
                                : ''}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                onChange(platform.id as keyof TrafficData, rawValue);
                            }}
                            className="w-full h-[46px] px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-base font-medium focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                        />
                    </div>
                ))}
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center">
                <span className="font-semibold text-purple-900">Tổng Traffic:</span>
                <span className="text-xl font-black text-purple-700">
                    {Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0).toLocaleString('vi-VN')}
                </span>
            </div>

            {/* Evidence Upload */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-purple-500" />
                        Minh chứng <span className="text-red-500">*</span>
                        <span className="font-normal text-slate-400">(upload ảnh screenshot số liệu)</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadStatus === 'uploading'}
                        className="text-xs flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-all disabled:opacity-50"
                    >
                        {uploadStatus === 'uploading' ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...</>
                        ) : (
                            <><ImagePlus className="w-3.5 h-3.5" /> Thêm ảnh</>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Error */}
                {uploadError && (
                    <p className="text-xs text-red-500 font-medium">{uploadError}</p>
                )}

                {/* Preview Grid */}
                {previewImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {previewImages.map((img, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                {uploadStatus === 'done' && idx < uploadedTokens.length && (
                                    <div className="absolute bottom-1 right-1">
                                        <CheckCircle className="w-4 h-4 text-green-500 drop-shadow" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Add more */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-purple-200 flex items-center justify-center text-purple-400 hover:border-purple-400 hover:text-purple-600 transition-all"
                        >
                            <ImagePlus className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {previewImages.length === 0 && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-purple-200 rounded-2xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-purple-400 hover:text-purple-600 transition-all"
                    >
                        <ImagePlus className="w-8 h-8" />
                        <span className="text-sm font-semibold">Nhấn để chọn ảnh minh chứng</span>
                        <span className="text-xs">PNG, JPG, WEBP — tối đa 10MB mỗi file</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TrafficReportSection;
