'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Textarea } from '../../../../components/ui/textarea'; // Keep original path
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, Video, Download, CheckCircle2, XCircle, Sparkles,
  Mic, User, Layout, Smartphone, Monitor, Instagram, Wand2,
  Play, StopCircle, RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define Types
interface VideoStatus {
  video_id: string;
  status: string;
  progress?: number;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string | any;
}

export default function LipsyncPage() {
  // --- State Management ---
  const [text, setText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [voiceId, setVoiceId] = useState('c6fb81520dcd42e0a02be231046a8639');
  const [avatarId, setAvatarId] = useState('4a4cbf45415048f79c6c7968e353a359');
  const [avatarStyle, setAvatarStyle] = useState('normal');

  // Avatars Data
  const AVATARS = [
    { id: '4a4cbf45415048f79c6c7968e353a359', name: 'HuyKa', type: 'Instant', desc: 'Avatar cử chỉ tay', color: 'bg-blue-500' },
    { id: 'Angela_natural_standing_ar_3', name: 'Angela', type: 'Standard', desc: 'Cử chỉ tự nhiên', color: 'bg-rose-500' },
    { id: 'Tyler_casual_sitting_sofa_front', name: 'Tyler', type: 'Standard', desc: 'Ngồi ghế sofa', color: 'bg-amber-500' },
    { id: 'Anna_public_20240108', name: 'Anna', type: 'Standard', desc: 'Bản tin / Review', color: 'bg-emerald-500' },
    { id: 'joshua_casual_standing_front', name: 'Joshua', type: 'Standard', desc: 'MC Nam đứng', color: 'bg-indigo-500' }
  ];

  const VOICES = [
    { id: 'c6fb81520dcd42e0a02be231046a8639', name: 'Nam Minh', region: 'VN - Nam', type: 'neutral' },
    { id: '4286c03d11f44af093e379fc7e2cafa6', name: 'Châu', region: 'VN - Nữ', type: 'sweet' },
    { id: '9a247a37f3c04e6aa934171998b9659c', name: 'Hoài', region: 'VN - Nữ', type: 'professional' },
    { id: 'en-US-female-1', name: 'English Female', region: 'US - Female', type: 'standard' },
    { id: 'en-US-male-1', name: 'English Male', region: 'US - Male', type: 'standard' },
  ];

  const STYLES = [
    { id: 'normal', name: 'Normal', icon: User },
    { id: 'closeUp', name: 'Close Up', icon: User },
    { id: 'full', name: 'Full Body', icon: User },
    { id: 'circle', name: 'Circle', icon: User },
    { id: 'voiceOnly', name: 'Voice Only', icon: Mic },
  ];

  const RATIOS = [
    { id: '16:9', name: 'Horizontal', sub: 'Youtube/FB', icon: Monitor },
    { id: '9:16', name: 'Vertical', sub: 'TikTok/Reels', icon: Smartphone },
    { id: '1:1', name: 'Square', sub: 'Instagram', icon: Instagram },
  ];

  // Logic States
  const [loading, setLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [error, setError] = useState('');

  // AI Script Generation
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // --- Handlers ---
  const handleGenerateScript = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingScript(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/heygen-video/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, tone: aiTone })
      });
      const data = await response.json();
      if (data.success && data.data?.script) {
        setText(data.data.script);
        setIsAiDialogOpen(false);
      } else {
        alert(`Lỗi AI: ${data.error || 'Không thể tạo kịch bản'}`);
      }
    } catch (e) {
      alert("Lỗi kết nối đến server AI");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = (videoId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${baseUrl}/heygen-video/status/${videoId}`);
        const data = await response.json();

        if (data.success) {
          setVideoStatus(data.data);
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 5000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập nội dung text');
      return;
    }
    setLoading(true);
    setError('');
    setVideoStatus(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/heygen-video/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          avatar_id: avatarId,
          avatar_style: avatarStyle,
          aspect_ratio: aspectRatio,
          quality: 'medium',
          title: `Lipsync - ${new Date().toLocaleTimeString()} - ${text.substring(0, 10)}...`,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setVideoStatus(data.data);
        startPolling(data.data.video_id);
      } else {
        setError(data.error || 'Không thể tạo video');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---
  const currentAvatar = AVATARS.find(a => a.id === avatarId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30 pb-20">
      {/* Ambient Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/0 to-slate-950 pointer-events-none" />

      <div className="relative container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center lg:text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" /> AI Video Studio
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Lipsync Generator
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Biến văn bản thành video chuyên nghiệp với Avatar Huyk.
            <span className="text-slate-500 block text-sm mt-1">Tự động cử chỉ, khớp giọng nói và render siêu tốc.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* --- LEFT COLUMN: INPUTS & SETTINGS --- */}
          <div className="lg:col-span-7 space-y-8">

            {/* 1. SCRIPT INPUT */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-200">Nội dung kịch bản</Label>
                  <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="hidden sm:flex h-8 gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-400/50 transition-all">
                        <Wand2 className="h-3.5 w-3.5" />
                        Viết bằng AI
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-slate-100">
                      <DialogHeader>
                        <DialogTitle>AI Script Writer</DialogTitle>
                        <DialogDescription className="text-slate-400">Nhập chủ đề, AI sẽ lo phần còn lại.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Chủ đề</Label>
                          <Input
                            value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="VD: Review đồng hồ..."
                            className="bg-slate-950 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tone giọng</Label>
                          <select
                            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm"
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                          >
                            <option value="professional">Chuyên nghiệp</option>
                            <option value="casual">Vui vẻ</option>
                            <option value="promo">Quảng cáo</option>
                          </select>
                        </div>
                      </div>
                      <Button onClick={handleGenerateScript} disabled={isGeneratingScript} className="w-full bg-purple-600 hover:bg-purple-700">
                        {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isGeneratingScript ? 'Đang viết...' : 'Tạo kịch bản'}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative group">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập nội dung bạn muốn Avatar nói..."
                    className="min-h-[160px] bg-slate-950/50 border-slate-700 focus:border-blue-500 text-lg leading-relaxed p-4 resize-none rounded-xl"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-medium px-2 py-1 bg-slate-900/80 rounded-md">
                    {text.length} ký tự
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. CONFIGURATION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Avatar Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Avatar Model</Label>
                <div className="grid gap-3">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => setAvatarId(av.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${avatarId === av.id
                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/20'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ${av.color}`}>
                        {av.name[0]}
                      </div>
                      <div>
                        <div className={`font-semibold text-sm ${avatarId === av.id ? 'text-blue-400' : 'text-slate-300'}`}>
                          {av.name}
                        </div>
                        <div className="text-xs text-slate-500">{av.desc}</div>
                      </div>
                      {avatarId === av.id && <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Configs */}
              <div className="space-y-6">

                {/* Voice */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Giọng đọc</Label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-no-repeat bg-[right_1.5rem_center]"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                  >
                    {VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.region})</option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Khung hình</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {RATIOS.map((r) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setAspectRatio(r.id)}
                          className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === r.id
                            ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                            : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold">{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Góc quay</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setAvatarStyle(s.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${avatarStyle === s.id
                          ? 'bg-slate-100 text-slate-900 border-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                          }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: PREVIEW & ACTIONS --- */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-8 space-y-6">

              {/* Preview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden aspect-[9/16] sm:aspect-video lg:aspect-[3/4] xl:aspect-[4/5] relative group">

                {/* Content or Placeholder */}
                {videoStatus?.video_url && videoStatus?.status === 'completed' ? (
                  <video
                    src={videoStatus.video_url}
                    controls
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                    {loading ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-6">
                          <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-t-purple-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Đang khởi tạo...</h3>
                        <p className="text-slate-400 text-sm max-w-xs">{videoStatus?.status === 'processing' ? 'Đang render video trên cloud server. Vui lòng chờ 2-5 phút.' : 'Đang gửi yêu cầu...'}</p>
                      </div>
                    ) : (
                      <>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 text-4xl font-bold text-white shadow-2xl ring-4 ring-offset-4 ring-offset-slate-900 ring-${currentAvatar?.color.replace('bg-', '') || 'blue-500'} ${currentAvatar?.color}`}>
                          {currentAvatar?.name[0]}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{currentAvatar?.name}</h3>
                        <p className="text-slate-400 text-sm mb-8 px-4">
                          Sẵn sàng tạo video với giọng <span className="text-blue-400 font-semibold">{VOICES.find(v => v.id === voiceId)?.name}</span>.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Status Overlay (If processing but user navigates away or similar) */}
                {loading && videoStatus?.status && videoStatus.status !== 'completed' && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800">
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                      <span>STATUS: {videoStatus.status.toUpperCase()}</span>
                      <span>{videoStatus.progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${videoStatus.progress || 10}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !text.trim()}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-900/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? 'Đang xử lý...' : (
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5" /> Generate Video
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">Premium</span>
                    </div>
                  )}
                </Button>

                {videoStatus?.status === 'completed' && videoStatus.video_url && (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                    onClick={() => window.open(videoStatus.video_url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" /> Tải Video xuống
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
