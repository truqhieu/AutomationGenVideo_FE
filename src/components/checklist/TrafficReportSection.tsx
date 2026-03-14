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
    const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null);
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    
    // Store evidence per platform: { platformId: [{ url, name, token }] }
    const [evidences, setEvidences] = useState<Record<string, { url: string; name: string; token: string }[]>>({});
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

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
            
            // Flatten all tokens to notify parent
            const allTokens = Object.values(updatedEvidences).flat().map(e => e.token);
            onEvidenceTokensChange?.(allTokens);
            
        } catch (err) {
            setUploadErrors(prev => ({ ...prev, [platformId]: 'Lỗi upload ảnh' }));
            console.error('Evidence upload error:', err);
        } finally {
            setUploadingPlatform(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (platformId: string, idx: number) => {
        const updatedPlatformEvidences = (evidences[platformId] || []).filter((_, i) => i !== idx);
        const updatedEvidences = {
            ...evidences,
            [platformId]: updatedPlatformEvidences
        };
        
        setEvidences(updatedEvidences);
        
        // Flatten all tokens to notify parent
        const allTokens = Object.values(updatedEvidences).flat().map(e => e.token);
        onEvidenceTokensChange?.(allTokens);
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
                    <p className="text-sm text-slate-500 font-medium">Nhập số lượt traffic và tải ảnh minh chứng tương ứng</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {TRAFFIC_PLATFORMS.map((platform) => (
                    <div key={platform.id} className="group flex flex-col gap-3 p-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-purple-200 hover:bg-white transition-all duration-300">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                                {platform.label}
                            </label>
                            {uploadingPlatform === platform.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => triggerUpload(platform.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                    title="Thêm ảnh minh chứng"
                                >
                                    <ImagePlus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="relative">
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
                                className="w-full h-[52px] px-5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-lg font-black focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none placeholder:text-slate-300"
                            />
                        </div>

                        {/* Platform specific Evidence Preview */}
                        <div className="min-h-[40px] flex flex-wrap gap-2 px-1">
                            {(evidences[platform.id] || []).map((img, idx) => (
                                <div key={idx} className="relative group/img w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm animate-in zoom-in duration-200">
                                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(platform.id, idx)}
                                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {(!evidences[platform.id] || evidences[platform.id].length === 0) && !uploadingPlatform && (
                                <div className="text-[10px] text-slate-400 italic flex items-center gap-1">
                                    <ImagePlus className="w-3 h-3 opacity-50" />
                                    Chưa có minh chứng
                                </div>
                            )}
                        </div>

                        {uploadErrors[platform.id] && (
                            <p className="text-[10px] text-red-500 font-medium px-1">{uploadErrors[platform.id]}</p>
                        )}
                    </div>
                ))}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />


        </div>
    );
};

export default TrafficReportSection;
