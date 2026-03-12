import React from 'react';
import { Activity } from 'lucide-react';

export const TRAFFIC_PLATFORMS = [
    { id: 'fb', label: 'Traffic FB' },
    { id: 'ig', label: 'Traffic IG' },
    { id: 'tiktok', label: 'Traffic Tiktok' },
    { id: 'yt', label: 'Traffic YT' },
    { id: 'thread', label: 'Traffic Thread' },
    { id: 'lemon8', label: 'Traffic Lemon 8' },
    { id: 'zalo', label: 'Traffic Zalo' },
];

export interface TrafficData {
    fb: string;
    ig: string;
    tiktok: string;
    yt: string;
    thread: string;
    lemon8: string;
    zalo: string;
}

export const initialTrafficData = (): TrafficData => ({
    fb: '',
    ig: '',
    tiktok: '',
    yt: '',
    thread: '',
    lemon8: '',
    zalo: '',
});

interface TrafficReportSectionProps {
    values: TrafficData;
    onChange: (platformId: keyof TrafficData, value: string) => void;
}

const TrafficReportSection: React.FC<TrafficReportSectionProps> = ({ values, onChange }) => {
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
                            value={values[platform.id as keyof TrafficData] ? Number(values[platform.id as keyof TrafficData]).toLocaleString('en-US') : ''}
                            onChange={(e) => onChange(platform.id as keyof TrafficData, e.target.value.replace(/\\D/g, ''))}
                            className="w-full h-[46px] px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-base font-medium focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                        />
                    </div>
                ))}
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center mt-4">
                <span className="font-semibold text-purple-900">Tổng Traffic:</span>
                <span className="text-xl font-black text-purple-700">
                    {Object.values(values).reduce((acc, val) => acc + (parseInt(val) || 0), 0).toLocaleString('vi-VN')}
                </span>
            </div>
        </div>
    );
};

export default TrafficReportSection;
