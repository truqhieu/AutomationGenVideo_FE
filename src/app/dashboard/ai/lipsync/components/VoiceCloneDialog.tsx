'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface VoiceCloneDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function VoiceCloneDialog({ open, onOpenChange, onSuccess }: VoiceCloneDialogProps) {
    const [videoUrl, setVideoUrl] = useState('');
    const [voiceName, setVoiceName] = useState('');
    const [isCloning, setIsCloning] = useState(false);

    const handleCloneVoice = async () => {
        if (!videoUrl || !voiceName) return;
        setIsCloning(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${baseUrl}/heygen-video/clone-voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_url: videoUrl, voice_name: voiceName })
            });
            const data = await response.json();
            if (data.success) {
                alert("Clone voice thành công!");
                setVideoUrl('');
                setVoiceName('');
                onOpenChange(false);
                onSuccess();
            } else {
                alert(`Lỗi: ${data.error}`);
            }
        } catch (e) {
            alert("Lỗi kết nối server");
        } finally {
            setIsCloning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle>Clone Voice từ Video</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Nhập link video (TikTok, Reels) có giọng nói của người bạn muốn clone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Tên giọng (VD: KOC A)</Label>
                        <Input
                            value={voiceName}
                            onChange={e => setVoiceName(e.target.value)}
                            className="bg-slate-950 border-slate-700"
                            placeholder="Nhập tên giọng..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Link Video (TikTok/FB/Youtube)</Label>
                        <Input
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            placeholder="https://..."
                            className="bg-slate-950 border-slate-700"
                        />
                    </div>
                </div>
                <Button onClick={handleCloneVoice} disabled={isCloning} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isCloning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {isCloning ? 'Đang xử lý...' : 'Bắt đầu Clone'}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
