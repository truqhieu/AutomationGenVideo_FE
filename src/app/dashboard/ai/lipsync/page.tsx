'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Select } from '@/components/ui/simple-select';
import Input from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Video, Download, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [text, setText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [voiceId, setVoiceId] = useState('c6fb81520dcd42e0a02be231046a8639');
  const [avatarId, setAvatarId] = useState('4a4cbf45415048f79c6c7968e353a359'); // Default to user's private avatar
  const [avatarStyle, setAvatarStyle] = useState('normal');

  // List of Featured Avatars
  const AVATARS = [
    {
      id: '4a4cbf45415048f79c6c7968e353a359',
      name: 'HuyKa (Video Avatar)',
      type: 'Instant',
      desc: 'Avatar video có cử chỉ tay'
    },
    {
      id: 'Angela_natural_standing_ar_3',
      name: 'Angela (Expressive)',
      type: 'Standard',
      desc: 'Có cử chỉ tay tự nhiên'
    },
    {
      id: 'Tyler_casual_sitting_sofa_front',
      name: 'Tyler (Casual Sofa)',
      type: 'Standard',
      desc: 'Ngồi ghế sofa, cử chỉ thoại'
    },
    {
      id: 'Anna_public_20240108',
      name: 'Anna (White T-shirt)',
      type: 'Standard',
      desc: 'Phù hợp bản tin, review'
    },
    {
      id: 'joshua_casual_standing_front',
      name: 'Joshua (Casual Standing)',
      type: 'Standard',
      desc: 'MC Nam đứng, có cử chỉ tay'
    }
  ];

  const [loading, setLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [error, setError] = useState('');

  // AI Script Generation State
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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
        console.error('AI Gen Error:', data);
        alert(`Lỗi AI: ${data.error || 'Không thể tạo kịch bản'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối đến server AI");
    } finally {
      setIsGeneratingScript(false);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          avatar_id: avatarId,
          avatar_style: avatarStyle,
          aspect_ratio: aspectRatio,
          quality: 'medium', // Downgraded to medium to fix subscription error
          title: `Lipsync Video - ${new Date().toISOString()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoStatus(data.data);
        // Start polling for status
        pollVideoStatus(data.data.video_id);
      } else {
        setError(data.error || 'Không thể tạo video');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };


  // ... inside return ...

  {/* Avatar Selection */ }
  <div className="space-y-2">
    <Label htmlFor="avatar">Người mẫu (Avatar)</Label>
    <Select
      value={avatarId}
      onChange={(e) => setAvatarId(e.target.value)}
      id="avatar"
    >
      {AVATARS.map((av) => (
        <option key={av.id} value={av.id}>
          {av.name} - {av.desc}
        </option>
      ))}
    </Select>
  </div>

  const pollVideoStatus = async (videoId: string) => {
    const interval = setInterval(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${baseUrl}/heygen-video/status/${videoId}`);
        const data = await response.json();

        if (data.success) {
          setVideoStatus(data.data);

          // Stop polling if completed or failed
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 5000); // Poll every 5 seconds
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Lipsync Generator</h1>
        <p className="text-gray-600">
          Tạo video với avatar Huyk nhép môi theo nội dung text của bạn
        </p>
      </div>

      <div className="grid gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo Video Mới</CardTitle>
            <CardDescription>
              Nhập nội dung text hoặc sử dụng AI để viết kịch bản tự động
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Input Header with AI Button */}
            <div className="flex items-center justify-between">
              <Label htmlFor="text">Nội dung Text</Label>
              <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Magic Script
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tạo kịch bản bằng AI</DialogTitle>
                    <DialogDescription>
                      Nhập chủ đề và phong cách, AI sẽ viết kịch bản thay bạn.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Chủ đề / Sản phẩm</Label>
                      <Input
                        id="topic"
                        placeholder="Ví dụ: Giới thiệu nhẫn kim cương..."
                        value={aiTopic}
                        onChange={(e: any) => setAiTopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tone">Phong cách</Label>
                      <Select
                        id="tone"
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value)}
                      >
                        <option value="professional">Chuyên nghiệp (Trang trọng)</option>
                        <option value="casual">Thân thiện (Vui vẻ)</option>
                        <option value="sale">Bán hàng (Sale/Promo)</option>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleGenerateScript}
                      disabled={isGeneratingScript || !aiTopic.trim()}
                      className="w-full sm:w-auto"
                    >
                      {isGeneratingScript ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang viết...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Tạo kịch bản
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Textarea
                id="text"
                placeholder="Xin chào! Tôi là đại diện thương hiệu Viễn Chí Bảo..."
                value={text}
                onChange={(e: any) => setText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-gray-500 text-right">
                {text.length} ký tự
              </p>
            </div>

            {/* Avatar Style Selection */}
            <div className="space-y-2">
              <Label htmlFor="style">Kiểu hiển thị (Avatar Style)</Label>
              <Select
                value={avatarStyle}
                onChange={(e) => setAvatarStyle(e.target.value)}
                id="style"
              >
                <option value="normal">Bình thường (Normal)</option>
                <option value="closeUp">Cận cảnh (Close Up)</option>
                <option value="full">Toàn thân (Full Body)</option>
                <option value="circle">Hình tròn (Circle View)</option>
                <option value="voiceOnly">Chỉ giọng nói (Voice Only)</option>
              </Select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice">Giọng nói</Label>
              <Select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                id="voice"
              >
                <option value="c6fb81520dcd42e0a02be231046a8639">Nam Minh (Việt Nam - Nam)</option>
                <option value="4286c03d11f44af093e379fc7e2cafa6">Châu (Việt Nam - Nữ)</option>
                <option value="9a247a37f3c04e6aa934171998b9659c">Hoài (Việt Nam - Nữ)</option>
                <option value="en-US-female-1">English - Female</option>
                <option value="en-US-male-1">English - Male</option>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label htmlFor="aspect">Tỷ lệ khung hình</Label>
              <Select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                id="aspect"
              >
                <option value="16:9">16:9 (YouTube, Facebook)</option>
                <option value="9:16">9:16 (TikTok, Reels)</option>
                <option value="1:1">1:1 (Instagram Feed)</option>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Tạo Video
                </>
              )}
            </Button>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Video Status */}
        {videoStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(videoStatus.status)}
                Trạng thái Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Video ID</p>
                  <p className="font-mono text-sm">{videoStatus.video_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <p className={`font-semibold ${getStatusColor(videoStatus.status)}`}>
                    {videoStatus.status.toUpperCase()}
                  </p>
                </div>
              </div>

              {videoStatus.progress !== undefined && videoStatus.progress !== null ? (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tiến độ</span>
                    <span>{videoStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${videoStatus.progress}%` }}
                    />
                  </div>
                </div>
              ) : videoStatus.status === 'processing' && (
                <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Đang xử lý trên máy chủ HeyGen (Có thể mất 2-5 phút)...</span>
                </div>
              )}

              {videoStatus.status === 'completed' && videoStatus.video_url && (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div>
                    <Label>Video Preview</Label>
                    <video
                      src={videoStatus.video_url}
                      controls
                      className="w-full rounded-lg mt-2"
                    />
                  </div>

                  {/* Download Button */}
                  <Button
                    onClick={() => window.open(videoStatus.video_url, '_blank')}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Tải xuống Video
                  </Button>

                  {/* Video Info */}
                  {videoStatus.duration && (
                    <p className="text-sm text-gray-500">
                      Thời lượng: {videoStatus.duration.toFixed(1)} giây
                    </p>
                  )}
                </div>
              )}

              {videoStatus.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {typeof videoStatus.error === 'string'
                      ? videoStatus.error
                      : (videoStatus.error as any).message || JSON.stringify(videoStatus.error)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
