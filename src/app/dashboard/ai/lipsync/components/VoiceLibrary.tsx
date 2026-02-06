'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { VoiceCloneDialog } from './VoiceCloneDialog';

interface VoiceLibraryProps {
    voices: any[];
    onSelectVoice: (voiceId: string) => void;
    onRefresh: () => void;
}

export function VoiceLibrary({ voices, onSelectVoice, onRefresh }: VoiceLibraryProps) {
    const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Thư viện giọng nói</h2>
                    <p className="text-slate-400">Quản lý các giọng đọc hệ thống và giọng đã clone của bạn.</p>
                </div>
                <Button onClick={() => setIsCloneDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Mic className="w-4 h-4 mr-2" /> Clone Giọng Mới
                </Button>
            </div>

            <VoiceCloneDialog
                open={isCloneDialogOpen}
                onOpenChange={setIsCloneDialogOpen}
                onSuccess={onRefresh}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Custom Voices First */}
                {voices.filter(v => v.is_cloned).map((voice) => (
                    <Card key={voice.voice_id} className="bg-slate-900/50 border-slate-800 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                {voice.name}
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">CLONED</span>
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">ID: {voice.voice_id.substring(0, 12)}...</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                                <Mic className="w-4 h-4" />
                                <span>Vietnamese (Auto)</span>
                            </div>
                            <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800" onClick={() => onSelectVoice(voice.voice_id)}>
                                Sử dụng giọng này
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {/* System Voices */}
                {voices.filter(v => !v.is_cloned).map((voice) => (
                    <Card key={voice.id || voice.voice_id} className="bg-slate-900/30 border-slate-800 hover:border-slate-700 transition-all">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                {voice.name}
                            </CardTitle>
                            <CardDescription className="text-slate-400 text-xs">{voice.language} • {voice.gender}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="ghost" size="sm" className="w-full border border-dashed border-slate-700 hover:bg-slate-800" onClick={() => onSelectVoice(voice.id || voice.voice_id)}>
                                Sử dụng
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
