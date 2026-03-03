'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Film, Loader2, Trash2, CheckCircle, Download, Music, Scissors, Database, Zap, Info, RefreshCw, Plus, FolderOpen, X, Package, Eye } from 'lucide-react';
import { VirtualMixSection } from './VirtualMixPlayer';
import { toast } from 'react-hot-toast';

const BE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

// 10 folder types cố định (theo logic mix video) - Mỗi tên phải unique!
const FOLDER_TYPES = [
    'Sản phẩm',
    'HuyK',
    'Chế tác',
    'Sản phẩm HT',
    'Outtrol',
];

const DEFAULT_PATHS: { [key: string]: string } = {
    'Sản phẩm': '\\\\VCB_MEDIA\\MEDIA VCB folder\\Generate Video\\Video Sản Phẩm',
    'HuyK': '\\\\VCB_MEDIA\\MEDIA VCB folder\\Generate Video\\Source HUYK\\Source chế tác sản phẩm',
    'Chế tác': '\\\\VCB_MEDIA\\MEDIA VCB folder\\Generate Video\\Chế tác sản phẩm',
    'Sản phẩm HT': '\\\\VCB_MEDIA\\MEDIA VCB folder\\Generate Video\\Video Sản Phẩm',
    'Outtrol': '\\\\VCB_MEDIA\\MEDIA VCB folder\\SOURCE HUYK\\OUTRO HUYK',
};


interface CacheStats {
    indexed_videos: number;
    cached_clips: number;
    cache_size_gb: number;
    by_folder: { [key: string]: number };
    gpu_available: boolean;
}

interface FolderInput {
    id: string;
    folder_type: string;
    path: string;
}

interface Voice {
    id: number;
    name: string;
    voice_id: string;
    provider: string;
    language: string;
    gender: string;
    is_cloned: boolean;
}

interface SmartMixProps {
    generatedScript?: string;  // Script from content generation step
    contentType?: string;  // A1, A2, A3, A4, A5
    productId?: string;
    productSku?: string;
    productCategory?: string;
}

export default function SmartMixVideo({ generatedScript, contentType, productId, productSku, productCategory }: SmartMixProps) {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [numOutputs, setNumOutputs] = useState(5);
    const [useGpu, setUseGpu] = useState<'auto' | 'true' | 'false'>('auto');
    const [useA4Formula, setUseA4Formula] = useState(false);
    const [mixLoading, setMixLoading] = useState(false);
    const [mixProgress, setMixProgress] = useState(0);
    const [mixMessage, setMixMessage] = useState('');
    const [mixError, setMixError] = useState('');
    const [mixResult, setMixResult] = useState<any>(null);

    const [forcedProductVideoId, setForcedProductVideoId] = useState<number | null>(null);
    const [forcedProductVideoPath, setForcedProductVideoPath] = useState<string | null>(null);

    // Voice & Audio generation
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
    const [loadingVoices, setLoadingVoices] = useState(false);
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Fallback: Get product category from localStorage if not provided via props
    const [actualProductCategory, setActualProductCategory] = useState<string | undefined>(productCategory);

    useEffect(() => {
        // Priority: productCategory prop > localStorage
        if (productCategory) {
            console.log('📦 Using product category from props:', productCategory);
            setActualProductCategory(productCategory);
        } else {
            // Try to get from localStorage
            const selectedProduct = localStorage.getItem('selectedProduct');
            if (selectedProduct) {
                try {
                    const product = JSON.parse(selectedProduct);
                    if (product.category) {
                        console.log('📦 Using product category from localStorage:', product.category);
                        setActualProductCategory(product.category);
                    }
                } catch (e) {
                    console.error('Failed to parse selectedProduct from localStorage', e);
                }
            }
        }
    }, [productCategory]);
    const [showIndexPanel, setShowIndexPanel] = useState(false);

    // Indexing state - Pre-fill 10 folder types + custom folders
    const [folderInputs, setFolderInputs] = useState<FolderInput[]>(
        FOLDER_TYPES.map((type, idx) => ({
            id: `folder-${idx}`,
            folder_type: type,
            path: DEFAULT_PATHS[type] || ''
        }))
    );
    const [customFolders, setCustomFolders] = useState<FolderInput[]>([]);
    const [isIndexing, setIsIndexing] = useState(false);
    const [isClearingIndex, setIsClearingIndex] = useState(false);
    const [indexingProgress, setIndexingProgress] = useState('');
    const [videosPerFolder, setVideosPerFolder] = useState(1000);


    const audioInputRef = useRef<HTMLInputElement>(null);
    const hasAutoIndexedRef = useRef(false);

    // Load cache stats and voices on mount
    useEffect(() => {
        loadCacheStats();
        loadVoices();
    }, []);

    // AUTO-SCAN IF EMPTY INDEX
    useEffect(() => {
        if (cacheStats && cacheStats.indexed_videos === 0 && !isIndexing && !hasAutoIndexedRef.current) {
            hasAutoIndexedRef.current = true;
            console.log('Index trống! Tự động chạy Auto-Scan Default Folders (1 lần)...');
            const folders: { [key: string]: string } = {};

            // Chỉ index HuyK (chung). Sản phẩm/Sản phẩm HT/Chế tác → index theo SKU qua index-manufacturing-folder
            const huykPath = DEFAULT_PATHS['HuyK'];
            if (huykPath) folders['HuyK'] = huykPath;

            // Call indexing API
            const runAutoIndex = async () => {
                setIsIndexing(true);
                setIndexingProgress('⏳ Auto-indexing HuyK (Sản phẩm/Chế tác sẽ index theo SKU)...');
                try {
                    // 1. Index default folders (HuyK, Chế tác...)
                    // Call AI service directly for indexing
                    const response = await fetch(`${AI_SERVICE_URL}/api/videos/index-folders/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            folders,
                            sku: productSku,
                            category: actualProductCategory,
                            videos_per_folder: 50 // Fast scan
                        })
                    });

                    if (response.ok) {
                        setIndexingProgress('⏳ Đang tìm folder Outro...');

                        // 2. Trigger smart Outro indexing
                        const outroResponse = await fetch(`${AI_SERVICE_URL}/api/videos/index-outro/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });

                        if (!outroResponse.ok) {
                            console.warn('⚠️ Could not index Outro folder');
                        }

                        toast.success('✅ Đã chuẩn bị xong dữ liệu nền!');
                        loadCacheStats();
                    }
                } catch (e) {
                    console.error('Auto-index failed', e);
                } finally {
                    setIsIndexing(false);
                }
            };

            runAutoIndex();
        }
    }, [cacheStats]);

    // Show reminder to enable A4 when content type is A4
    useEffect(() => {
        if (contentType === 'A4' && !useA4Formula) {
            toast('💡 Nhắc nhở: Hãy bật "Công thức A4" bên dưới để mix theo cấu trúc 7 slots!', {
                duration: 5000,
                icon: '⚠️'
            });
        }
    }, [contentType]);

    const pollCleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (productSku) {
            // Khi vào Mix Video: luôn quét indexed để lưu 1 lần nữa
            triggerAutoIndexManufacturing(actualProductCategory || '', productSku);
            checkProductVideo(productSku);
        }
        return () => {
            pollCleanupRef.current?.();
        };
    }, [productSku, actualProductCategory]);

    const triggerAutoIndexManufacturing = async (category: string, sku: string) => {
        try {
            console.log(`🛠️ [Go to Mix Video] Quét indexed cho SKU: ${sku}...`);
            const res = await fetch(`${AI_SERVICE_URL}/api/videos/index-manufacturing-folder/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: category,
                    sku: sku
                })
            });
            if (res.ok) toast.success('Đang quét video Sản phẩm...');

            // Poll loadCacheStats để cập nhật số liệu (indexing UNC + ffprobe mất thời gian)
            pollCleanupRef.current?.();
            const delays = [1500, 3000, 6000, 10000, 15000, 20000];
            const timeouts: NodeJS.Timeout[] = [];
            delays.forEach((ms) => {
                timeouts.push(setTimeout(loadCacheStats, ms));
            });
            pollCleanupRef.current = () => timeouts.forEach((t) => clearTimeout(t));
        } catch (e) {
            console.error("Auto-index triggering failed:", e);
            toast.error('Không thể quét folder Sản phẩm. Vui lòng thử lại.');
        }
    };

    const checkProductVideo = async (sku: string) => {
        try {
            const res = await fetch(`${AI_SERVICE_URL}/api/products/find-video/?sku=${encodeURIComponent(sku)}`);
            const data = await res.json();
            if (data.success) {
                setForcedProductVideoId(data.video_id);
                setForcedProductVideoPath(data.video_path);
                toast.success(`✅ Đã tìm thấy video cho SKU: ${sku}`, { duration: 5000 });
            }
        } catch (e) {
            console.error('Error finding product video:', e);
        }
    };

    const loadVoices = async () => {
        setLoadingVoices(true);
        try {
            const response = await fetch(`${AI_SERVICE_URL}/api/videos/voices/`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.voices) {
                    setVoices(data.voices);
                    if (data.voices.length > 0 && !selectedVoiceId) {
                        setSelectedVoiceId(data.voices[0].voice_id);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load voices:', error);
        } finally {
            setLoadingVoices(false);
        }
    };

    const [audioElapsed, setAudioElapsed] = useState<number>(0);
    const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleGenerateAudio = async () => {
        if (!generatedScript || !selectedVoiceId) {
            toast.error('❌ Cần có script và voice để generate audio!');
            return;
        }

        setGeneratingAudio(true);
        setAudioElapsed(0);

        // Start elapsed timer
        const startTime = Date.now();
        audioTimerRef.current = setInterval(() => {
            setAudioElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        try {
            const response = await fetch(`${AI_SERVICE_URL}/api/videos/generate-audio/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script: generatedScript,
                    voice_id: selectedVoiceId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate audio');
            }

            const data = await response.json();
            if (data.success && data.audio_url) {
                setGeneratedAudioUrl(data.audio_url);

                // Download and convert to File object
                const audioRes = await fetch(data.audio_url);
                const blob = await audioRes.blob();
                setAudioFile(new File([blob], 'generated_audio.mp3', { type: 'audio/mpeg' }));

                if (data.cached) {
                    toast.success(`⚡ Cache HIT! Audio trả về tức thì (${data.elapsed}s)`, { duration: 3000 });
                } else {
                    const chunkInfo = data.chunks > 1 ? ` (${data.chunks} chunks song song)` : '';
                    toast.success(`✅ Đã tạo audio trong ${data.elapsed}s${chunkInfo} — voice: ${data.voice_name}`);
                }
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGeneratingAudio(false);
            if (audioTimerRef.current) {
                clearInterval(audioTimerRef.current);
                audioTimerRef.current = null;
            }
        }
    };

    const loadCacheStats = async () => {
        setLoadingStats(true);
        try {
            const response = await fetch(`${BE_API_URL}/ai/cache-stats`);
            if (response.ok) {
                const data = await response.json();
                setCacheStats(data);
            }
        } catch (error) {
            console.error('Failed to load cache stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleClearIndex = async () => {
        if (!confirm('⚠️ Bạn có chắc muốn XOÁ TOÀN BỘ index? Cần phải index lại từ đầu sau khi xoá!')) return;
        setIsClearingIndex(true);
        try {
            const response = await fetch(`${AI_SERVICE_URL}/api/videos/clear-index/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clear_clips: true })
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`🗑️ ${data.message}`, { duration: 4000 });
                setCacheStats(null);
                await loadCacheStats();
                setShowIndexPanel(true); // Mở panel index để re-index ngay
            } else {
                toast.error(`❌ ${data.error || 'Clear index thất bại'}`);
            }
        } catch (error: any) {
            toast.error(`❌ Không thể clear index: ${error.message}`);
        } finally {
            setIsClearingIndex(false);
        }
    };

    // Folder input handlers - Chỉ cho phép update path (folder_type đã fix sẵn)
    const updateFolderPath = (id: string, path: string) => {
        setFolderInputs(folderInputs.map(f =>
            f.id === id ? { ...f, path } : f
        ));
    };

    // Custom folder handlers
    const addCustomFolder = () => {
        setCustomFolders([...customFolders, {
            id: `custom-${Date.now()}`,
            folder_type: '',
            path: ''
        }]);
    };

    const removeCustomFolder = (id: string) => {
        setCustomFolders(customFolders.filter(f => f.id !== id));
    };

    const updateCustomFolder = (id: string, field: 'folder_type' | 'path', value: string) => {
        setCustomFolders(customFolders.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const handleStartIndexing = async () => {
        // Combine default + custom folders
        const allFolders = [...folderInputs, ...customFolders];

        // Validate - Chỉ cần ít nhất 5 folders có đủ type và path
        const validFolders = allFolders.filter(f => f.folder_type.trim() && f.path.trim());
        if (validFolders.length < 5) {
            toast.error('Vui lòng nhập ít nhất 5 folders để có thể mix video!');
            return;
        }

        // Check duplicates
        const types = validFolders.map(f => f.folder_type);
        const uniqueTypes = new Set(types);
        if (types.length !== uniqueTypes.size) {
            // Find duplicates
            const duplicates = types.filter((item, index) => types.indexOf(item) !== index);
            toast.error(`⚠️ Tên folder bị trùng: "${duplicates[0]}". Mỗi tên phải unique!`);
            return;
        }

        setIsIndexing(true);
        setIndexingProgress('Đang bắt đầu indexing...');

        try {
            // Convert to object format
            const folders: { [key: string]: string } = {};
            validFolders.forEach(f => {
                folders[f.folder_type] = f.path;
            });

            const response = await fetch(`${BE_API_URL}/ai/index-folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folders,
                    videos_per_folder: videosPerFolder
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Indexing failed');
            }

            const data = await response.json();

            setIndexingProgress(`✅ Hoàn tất! Index ${data.total_indexed || 0} videos`);
            toast.success(`🎉 Index thành công ${data.total_indexed || 0} videos!`);

            // Reload stats
            setTimeout(() => {
                loadCacheStats();
                setShowIndexPanel(false);
            }, 2000);

        } catch (error: any) {
            setIndexingProgress(`❌ Lỗi: ${error.message}`);
            toast.error(error.message);
        } finally {
            setIsIndexing(false);
        }
    };

    const handleMix = async () => {
        if (!audioFile) {
            toast.error('❌ Vui lòng upload file nhạc');
            return;
        }

        if (!cacheStats || cacheStats.indexed_videos === 0) {
            toast.error('❌ Chưa index videos! Vui lòng chạy indexing trước.');
            setShowIndexPanel(true);
            return;
        }

        setMixLoading(true);
        setMixProgress(0);
        setMixMessage('');
        setMixError('');
        setMixResult(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('num_outputs', numOutputs.toString());
            formData.append('width', '540');
            formData.append('height', '960');
            formData.append('use_gpu', useGpu);
            formData.append('use_a4_formula', useA4Formula.toString());

            if (forcedProductVideoId) {
                formData.append('forced_product_video_id', forcedProductVideoId.toString());
            }

            if (actualProductCategory) {
                formData.append('product_category', actualProductCategory);
            }

            if (productId) {
                formData.append('product_id', productId);
            }

            if (productSku) {
                formData.append('product_sku', productSku);
            }

            // Debug logging
            console.log('🎯 Smart Mix Config:', {
                num_outputs: numOutputs,
                use_a4_formula: useA4Formula,
                audio: audioFile.name,
                product_category: actualProductCategory,
                product_id: productId,
                product_sku: productSku
            });

            // Call smart-mix endpoint
            const response = await fetch(`${AI_SERVICE_URL}/api/videos/smart-mix/`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Smart mix failed');
            }

            const data = await response.json();
            const progressId = data.progress_id;

            if (useA4Formula) {
                toast.success('🎯 Mix theo công thức A4 V2 (7 slots, flexible duration)...');
            } else {
                toast.success('⚡ Smart mix bắt đầu (5-13 giây)...');
            }

            // Poll progress
            await pollMixProgress(progressId);

        } catch (error: any) {
            setMixError(error.message || 'Lỗi khi mix video');
            toast.error(error.message);
        } finally {
            setMixLoading(false);
        }
    };

    const pollMixProgress = async (progressId: string) => {
        return new Promise<void>((resolve) => {
            const poll = async () => {
                try {
                    const response = await fetch(`${AI_SERVICE_URL}/api/videos/smart-mix/status/${progressId}/`);

                    if (response.status === 404) {
                        throw new Error('404 Not Found');
                    }

                    const data = await response.json();

                    setMixProgress(data.percent || 0);
                    setMixMessage(data.message || '');

                    if (data.status === 'completed' && data.output_urls) {
                        setMixResult(data);
                        toast.success('🎉 Mix hoàn tất!');
                        resolve();
                        return;
                    }

                    if (data.status === 'error') {
                        setMixError(data.error || 'Lỗi không xác định');
                        toast.error(`❌ ${data.error}`);
                        resolve();
                        return;
                    }

                    setTimeout(poll, 1000); // Poll every 1s
                } catch (error: any) {
                    if (error.message.includes('404')) {
                        console.warn('⚠️ Polling stopped because progress ID not found (likely server restart)');
                        setMixError('Server không tìm thấy progress ID (Vui lòng thử lại)');
                        toast.error('❌ Mất kết nối tiến trình');
                        resolve();
                        return;
                    }

                    // Retry for network errors
                    setTimeout(poll, 2000);
                }
            };
            poll();
        });
    };

    const isReady = cacheStats && cacheStats.indexed_videos > 0;
    const needsIndexing = !cacheStats || cacheStats.indexed_videos === 0;

    return (
        <div className="space-y-6">
            {/* Indexing Status Overlay */}
            {isIndexing && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                    <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Đang thiết lập hệ thống...</h3>
                    <p className="text-gray-300 text-lg mb-4">{indexingProgress}</p>
                    <div className="w-full max-w-md bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-pulse w-full"></div>
                    </div>
                </div>
            )}

            {/* Header with Performance Badge */}
            <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-2xl border border-green-500/20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                        <Zap className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-white">⚡ Smart Mix Video</h2>
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                                20-30x FASTER
                            </span>
                        </div>
                        <p className="text-gray-400">
                            Mix trong <strong className="text-green-400">5-13 giây</strong> (thay vì 2-3 phút) với pre-processing + lazy loading + GPU acceleration
                        </p>
                    </div>
                </div>
            </div>

            {/* Forced Product Video Banner */}
            {forcedProductVideoId && (
                <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Package className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                Đã chọn sản phẩm theo SKU
                                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">{productSku}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Video từ sản phẩm này sẽ được ưu tiên sử dụng trong slot "Sản phẩm".
                            </p>
                            {forcedProductVideoPath && (
                                <p className="text-[10px] text-gray-500 mt-1 truncate font-mono opacity-50">
                                    {forcedProductVideoPath}
                                </p>
                            )}
                        </div>
                        <CheckCircle className="w-5 h-5 text-purple-400" />
                    </div>
                </div>
            )}

            {/* Cache Stats */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        Cache Status
                    </h3>
                    <button
                        onClick={loadCacheStats}
                        disabled={loadingStats}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingStats ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loadingStats && (
                    <div className="flex items-center gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading stats...
                    </div>
                )}

                {!loadingStats && cacheStats && (
                    <>
                        <div className="flex items-start gap-4">
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-[#0a0a0a] p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Indexed Videos</p>
                                    <p className="text-2xl font-bold text-white">{cacheStats.indexed_videos}</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Cached Clips</p>
                                    <p className="text-2xl font-bold text-green-400">{cacheStats.cached_clips}</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Cache Size</p>
                                    <p className="text-2xl font-bold text-purple-400">{cacheStats.cache_size_gb.toFixed(2)} GB</p>
                                </div>
                                <div className="bg-[#0a0a0a] p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">GPU</p>
                                    <p className="text-2xl font-bold">{cacheStats.gpu_available ? '✅' : '⚠️'}</p>
                                </div>
                            </div>

                            {/* Buttons: Manage + Clear */}
                            <div className="flex-shrink-0 flex flex-col gap-2 h-full">
                                <button
                                    onClick={() => setShowIndexPanel(!showIndexPanel)}
                                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all flex items-center gap-2 shadow-lg"
                                >
                                    <Database className="w-5 h-5" />
                                    <div className="text-left">
                                        <p className="text-xs opacity-80">Quản lý</p>
                                        <p className="text-sm">Folders</p>
                                    </div>
                                </button>
                                <button
                                    onClick={handleClearIndex}
                                    disabled={isClearingIndex}
                                    className="px-4 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-red-400 font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Xoá toàn bộ index để re-index lại từ đầu"
                                >
                                    {isClearingIndex
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <Trash2 className="w-5 h-5" />
                                    }
                                    <div className="text-left">
                                        <p className="text-xs opacity-80">Xoá & Reset</p>
                                        <p className="text-sm">Clear Index</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Breakdown by folder */}
                        {cacheStats.by_folder && Object.keys(cacheStats.by_folder).length > 0 && (
                            <div className="mt-4 bg-[#0a0a0a] p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-3 font-semibold">📂 Videos theo loại folder:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {Object.entries(cacheStats.by_folder).map(([type, count]) => (
                                        <div key={type} className="bg-[#141414] px-3 py-2 rounded border border-gray-800">
                                            <p className="text-xs text-gray-500 truncate">{type}</p>
                                            <p className="text-lg font-bold text-white">{count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {needsIndexing && (
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Chưa có videos được index!</p>
                            <p className="text-yellow-300/70 text-xs">Cần index videos trước khi có thể mix.</p>
                        </div>
                        <button
                            onClick={() => setShowIndexPanel(!showIndexPanel)}
                            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                            {showIndexPanel ? '✕ Đóng' : '▶ Bắt đầu Index'}
                        </button>
                    </div>
                )}

                {showIndexPanel && (
                    <div className="mt-4 p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                                    <Database className="w-5 h-5" />
                                    {needsIndexing ? 'Index Videos (Setup lần đầu)' : 'Quản lý & Re-index Folders'}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                    {needsIndexing
                                        ? 'Thiết lập folders và index videos. Chỉ cần làm 1 lần!'
                                        : 'Thêm/sửa folders và re-index để cập nhật videos mới'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowIndexPanel(false)}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {!needsIndexing && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-sm text-green-400">
                                    ✅ <strong>Đã có {cacheStats?.indexed_videos || 0} videos indexed!</strong> Chỉ cần re-index nếu bạn thêm videos mới hoặc thay đổi folders.
                                </p>
                            </div>
                        )}

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-sm text-blue-400">
                                📋 <strong>5 loại folder mặc định</strong> + Thêm folders tùy chỉnh. Tối thiểu <strong>5 folders</strong> để mix.
                            </p>
                        </div>

                        {/* Default Folder Inputs */}
                        <div>
                            <h5 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                Folders mặc định (5)
                            </h5>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {folderInputs.map((folder, idx) => (
                                    <div key={folder.id} className="bg-[#0a0a0a] p-3 rounded-lg border border-gray-800 flex items-center gap-3">
                                        {/* Folder Number */}
                                        <div className="flex-shrink-0 w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                                            <span className="text-xs font-bold text-purple-400">{idx + 1}</span>
                                        </div>

                                        {/* Folder Type (readonly) */}
                                        <div className="flex-shrink-0 w-40">
                                            <div className="px-3 py-2 bg-[#141414] border border-gray-800 rounded-lg">
                                                <p className="text-sm text-white font-medium truncate">{folder.folder_type}</p>
                                            </div>
                                        </div>

                                        {/* Path Input */}
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder={`Đường dẫn cho "${folder.folder_type}" (bỏ trống nếu không có)`}
                                                value={folder.path}
                                                onChange={(e) => updateFolderPath(folder.id, e.target.value)}
                                                disabled={isIndexing}
                                                className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono"
                                            />
                                        </div>

                                        {/* Status */}
                                        {folder.path.trim() ? (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                        ) : (
                                            <div className="w-5 h-5 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Folders Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Folders tùy chỉnh ({customFolders.length})
                                </h5>
                                <button
                                    onClick={addCustomFolder}
                                    disabled={isIndexing}
                                    className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Thêm folder
                                </button>
                            </div>

                            {customFolders.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-800 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-500">Chưa có folder tùy chỉnh. Click "Thêm folder" để thêm.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {customFolders.map((folder, idx) => (
                                        <div key={folder.id} className="bg-[#0a0a0a] p-3 rounded-lg border border-purple-500/20 flex items-center gap-3">
                                            {/* Custom Badge */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/40">
                                                <span className="text-xs font-bold text-purple-400">+{idx + 1}</span>
                                            </div>

                                            {/* Folder Type Input */}
                                            <div className="flex-shrink-0 w-40">
                                                <input
                                                    type="text"
                                                    placeholder="Tên loại"
                                                    value={folder.folder_type}
                                                    onChange={(e) => updateCustomFolder(folder.id, 'folder_type', e.target.value)}
                                                    disabled={isIndexing}
                                                    className="w-full px-3 py-2 bg-[#141414] border border-purple-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                                />
                                            </div>

                                            {/* Path Input */}
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Đường dẫn folder"
                                                    value={folder.path}
                                                    onChange={(e) => updateCustomFolder(folder.id, 'path', e.target.value)}
                                                    disabled={isIndexing}
                                                    className="w-full px-3 py-2 bg-[#141414] border border-purple-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50 font-mono"
                                                />
                                            </div>

                                            {/* Status & Delete */}
                                            <div className="flex items-center gap-2">
                                                {folder.folder_type.trim() && folder.path.trim() ? (
                                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 flex-shrink-0" />
                                                )}
                                                <button
                                                    onClick={() => removeCustomFolder(folder.id)}
                                                    disabled={isIndexing}
                                                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Stats */}
                        <div className="bg-[#0a0a0a] p-3 rounded-lg border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Tổng folders đã điền:</span>
                                <span className={`text-lg font-bold ${(folderInputs.filter(f => f.path.trim()).length + customFolders.filter(f => f.folder_type.trim() && f.path.trim()).length) >= 5
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                    }`}>
                                    {folderInputs.filter(f => f.path.trim()).length + customFolders.filter(f => f.folder_type.trim() && f.path.trim()).length}
                                    {(folderInputs.filter(f => f.path.trim()).length + customFolders.filter(f => f.folder_type.trim() && f.path.trim()).length) < 5 && ' (cần tối thiểu 5)'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between p-2 bg-[#141414] rounded">
                                    <span className="text-gray-500">Mặc định:</span>
                                    <span className="text-blue-400 font-bold">{folderInputs.filter(f => f.path.trim()).length}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[#141414] rounded">
                                    <span className="text-gray-500">Tùy chỉnh:</span>
                                    <span className="text-purple-400 font-bold">{customFolders.filter(f => f.folder_type.trim() && f.path.trim()).length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Videos per folder limit */}
                        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Số videos tối đa mỗi folder
                            </label>
                            <input
                                type="number"
                                min={10}
                                max={5000}
                                value={videosPerFolder}
                                onChange={(e) => setVideosPerFolder(parseInt(e.target.value) || 50)}
                                disabled={isIndexing}
                                className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Khuyến nghị: 50-100 videos/folder</p>
                        </div>

                        {/* Progress */}
                        {indexingProgress && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm">
                                {indexingProgress}
                            </div>
                        )}

                        {/* Start Button */}
                        <button
                            onClick={handleStartIndexing}
                            disabled={isIndexing}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                        >
                            {isIndexing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang index... (30-60 phút)
                                </>
                            ) : (
                                <>
                                    <Database className="w-5 h-5" />
                                    {needsIndexing ? 'BẮT ĐẦU INDEXING' : 'RE-INDEX FOLDERS (Cập nhật)'}
                                </>
                            )}
                        </button>

                        <div className={`p-3 rounded-lg border ${needsIndexing ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <p className={`text-xs text-center ${needsIndexing ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {needsIndexing ? (
                                    <>💡 <strong>Lưu ý:</strong> Index 1 lần duy nhất (~30-60 phút). Sau đó mix chỉ mất 5-13 giây!</>
                                ) : (
                                    <>🔄 <strong>Re-indexing:</strong> Chỉ cần chạy lại khi thêm videos mới vào folders hoặc thay đổi folder paths.</>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Số lượng video output
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={20}
                        value={numOutputs}
                        onChange={(e) => setNumOutputs(parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Số video sẽ được tạo ra</p>
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                    <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        GPU Acceleration
                        <Info className="w-4 h-4 text-blue-400" />
                    </label>
                    <select
                        value={useGpu}
                        onChange={(e) => setUseGpu(e.target.value as any)}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500"
                    >
                        <option value="auto">Auto (khuyến nghị)</option>
                        <option value="true">Force GPU (nhanh nhất)</option>
                        <option value="false">Force CPU</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        {cacheStats?.gpu_available ? '✅ GPU available' : '⚠️ No GPU detected'}
                    </p>
                </div>

                <div className={`p-6 rounded-xl border-2 transition-all ${useA4Formula
                    ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-900/20'
                    : 'bg-[#1a1a1a] border-gray-700'
                    }`}>
                    <label className="block text-base font-bold mb-4 flex items-center gap-2">
                        <span className={useA4Formula ? 'text-orange-400' : 'text-gray-400'}>
                            🎯 Công thức A4 V3 (7 Slots)
                        </span>
                        {contentType === 'A4' && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                                Được khuyên dùng cho content A4
                            </span>
                        )}
                    </label>
                    <button
                        onClick={() => {
                            setUseA4Formula(!useA4Formula);
                            if (!useA4Formula) {
                                toast.success('✅ ĐÃ BẬT CÔNG THỨC A4 V3! Video sẽ mix theo 7 slots, không có split layout', { duration: 4000 });
                            } else {
                                toast('○ Đã tắt A4 - sẽ dùng Random mode', { duration: 3000 });
                            }
                        }}
                        className={`w-full px-6 py-4 rounded-xl font-bold transition-all text-base ${useA4Formula
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-900/40 animate-pulse'
                            : 'bg-[#0a0a0a] border-2 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-orange-400 hover:scale-105'
                            }`}
                    >
                        {useA4Formula ? '✅ A4 V3 ENABLED (7 slots, flexible duration)' : '○ CLICK ĐỂ BẬT CÔNG THỨC A4 V3'}
                    </button>
                    <p className="text-sm mt-3 text-center font-medium">
                        {useA4Formula ? (
                            <span className="text-orange-300">
                                ✓ Mix theo 7 slots với flexible duration (không có split layout)
                            </span>
                        ) : (
                            <span className="text-gray-500">
                                Random mode: 7 slots ngẫu nhiên (không theo cấu trúc A4)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Voice Selection & Audio Generation */}
            {generatedScript && (
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-400" />
                        Generate Audio từ Script
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Chọn giọng đọc
                            </label>
                            <select
                                value={selectedVoiceId}
                                onChange={(e) => setSelectedVoiceId(e.target.value)}
                                disabled={loadingVoices || generatingAudio}
                                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                            >
                                {voices.map(voice => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name}
                                        {(voice.gender || voice.language) && ` (${voice.gender || '?'}, ${voice.language || '?'})`}
                                        {voice.is_cloned && ' • Clone'}
                                        {voice.provider === 'minimax' && ' • Minimax'}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {loadingVoices ? 'Loading voices...' : `${voices.length} voices available`}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleGenerateAudio}
                                disabled={!generatedScript || !selectedVoiceId || generatingAudio}
                                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {generatingAudio ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Đang tạo audio... {audioElapsed}s</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        Generate Audio
                                    </>
                                )}
                            </button>
                            {generatingAudio && (
                                <div className="space-y-1">
                                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${Math.min(
                                                    (audioElapsed / (generatedScript && generatedScript.length > 1000 ? 15 : generatedScript && generatedScript.length > 500 ? 10 : 6)) * 100,
                                                    95
                                                )}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-center">
                                        {generatedScript && generatedScript.length > 500
                                            ? `⚡ Script dài → chia ${Math.ceil(generatedScript.length / 500)} chunks song song`
                                            : '📡 Đang gọi HeyGen API...'
                                        }
                                        {' • '}
                                        Ước tính ~{generatedScript && generatedScript.length > 1000 ? '10-15' : generatedScript && generatedScript.length > 500 ? '6-10' : '4-6'}s
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {generatedAudioUrl && (
                        <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            <p className="text-green-400 text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Audio đã được tạo thành công! Sử dụng audio này cho mix.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Audio Upload */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5 text-pink-400" />
                    Upload File Nhạc
                </h3>

                <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setAudioFile(file);
                            toast.success(`✅ Đã chọn: ${file.name}`);
                        }
                    }}
                    className="hidden"
                />

                {!audioFile ? (
                    <button
                        onClick={() => audioInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-pink-500 hover:bg-pink-500/5 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-pink-400"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Click để upload nhạc</span>
                    </button>
                ) : (
                    <div className="bg-pink-500/10 p-4 rounded-xl flex items-center justify-between border border-pink-500/20">
                        <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-pink-400" />
                            <div>
                                <p className="text-white font-medium">{audioFile.name}</p>
                                <p className="text-xs text-gray-400">{(audioFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAudioFile(null)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* A4 Formula Status Banner */}
            {useA4Formula && (
                <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-xl shadow-lg shadow-orange-900/40">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6" />
                            <div>
                                <p className="font-bold text-lg">🎯 Công thức A4 V3 đã được kích hoạt</p>
                                <p className="text-sm text-orange-100">Mix theo 7 slots với flexible duration (không split layout)</p>
                            </div>
                        </div>
                        {contentType === 'A4' && (
                            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                                Auto-enabled
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* A4 Formula Info */}
            {useA4Formula && (
                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-6 rounded-xl border border-orange-500/20">
                    <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
                        <Film className="w-5 h-5" />
                        Công thức A4 V3 (7 Slots, Flexible Duration)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { slot: 1, name: 'Sản phẩm', duration: 'Flexible', color: 'bg-blue-500/20 border-blue-500/30', desc: 'Intro' },
                            { slot: 2, name: 'HuyK', duration: 'Flexible', color: 'bg-green-500/20 border-green-500/30', desc: 'KOC' },
                            { slot: 3, name: 'Chế tác', duration: 'Flexible', color: 'bg-orange-500/20 border-orange-500/30', desc: 'Fullscreen' },
                            { slot: 4, name: 'HuyK', duration: 'Flexible', color: 'bg-green-500/20 border-green-500/30', desc: 'KOC (lặp lại)' },
                            { slot: 5, name: 'Chế tác', duration: 'Flexible', color: 'bg-orange-500/20 border-orange-500/30', desc: 'Fullscreen (lặp lại)' },
                            { slot: 6, name: 'Sản phẩm HT', duration: 'Flexible', color: 'bg-blue-500/20 border-blue-500/30', desc: 'Hoàn thiện' },
                            { slot: 7, name: 'Outro', duration: 'Original', color: 'bg-pink-500/20 border-pink-500/30', desc: 'Audio gốc ✨' },
                        ].map(item => (
                            <div key={item.slot} className={`p-3 rounded-lg border ${item.color}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Slot {item.slot}</span>
                                    <span className="text-xs font-bold text-orange-400">{item.duration}</span>
                                </div>
                                <p className="text-sm text-white font-medium mt-1">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                        ))}
                    </div>


                    <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-xs text-orange-300 font-semibold mb-2">
                            ℹ️ Cấu trúc A4 V3 — Fullscreen, không split
                        </p>
                        <p className="text-xs text-gray-400">
                            • Slot 1–6: Duration = audio_duration / 6 (flexible)<br />
                            • Slot 2 &amp; 4 dùng chung folder HuyK (chọn video khác nhau)<br />
                            • Slot 3 &amp; 5 dùng chung folder Chế tác (chọn video khác nhau)<br />
                            • Slot 7: Duration = video outro gốc (giữ nguyên audio)<br />
                            • Tất cả slots đều là video đơn giản, fullscreen (không split layout)
                        </p>
                    </div>

                    {/* (Removed) Manual product category selector when enabling A4 V2 */}
                </div>
            )}

            {/* ⚡ Virtual Preview (INSTANT - no FFmpeg!) */}
            {audioFile && !needsIndexing && (
                <VirtualMixSection
                    audioFile={audioFile}
                    productId={productId}
                    productSku={productSku}
                    numOutputs={numOutputs}
                    useA4Formula={useA4Formula}
                />
            )}

            {/* Mix Button (Full FFmpeg Render) */}
            <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-green-400" />
                    Tiến hành Mix {useA4Formula && <span className="text-orange-400 text-sm">(A4 Formula)</span>}
                </h3>

                {mixError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {mixError}
                    </div>
                )}

                {!mixLoading && !mixResult && (
                    <button
                        onClick={handleMix}
                        disabled={!audioFile || needsIndexing}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-900/40"
                    >
                        <Zap className="w-5 h-5" />
                        {useA4Formula ? '🎯 BẮT ĐẦU MIX A4 (7 slots)' : '⚡ BẮT ĐẦU SMART MIX (5-13s)'}
                    </button>
                )}

                {mixLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{mixMessage || 'Processing...'}</span>
                            <span className="text-green-400 font-semibold">{mixProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300"
                                style={{ width: `${mixProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                            <Zap className="w-3 h-3 text-green-400" />
                            Smart preprocessing đang hoạt động...
                        </p>
                    </div>
                )}

                {mixResult && (
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">
                                {useA4Formula ? '🎯 Mix A4 thành công!' : '⚡ Smart Mix thành công!'}
                                {mixMessage && ` (${mixMessage})`}
                            </span>
                        </div>

                        {mixResult.output_urls && mixResult.output_urls.length > 0 && (
                            <div className="space-y-2">
                                {mixResult.output_urls.map((url: string, idx: number) => (
                                    <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg hover:bg-[#1a1a1a] transition-colors"
                                    >
                                        <span className="text-sm text-gray-300">Video {idx + 1}</span>
                                        <Download className="w-4 h-4 text-green-400" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Performance Info */}
            <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-4 rounded-xl border border-blue-500/20">
                <p className="text-sm text-blue-300 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <strong>Smart Mix hoạt động thế nào?</strong>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-400 ml-6 list-disc">
                    <li>Lần đầu: Generate clips (10s) → Mix (3s) = <strong className="text-green-400">13s</strong></li>
                    <li>Lần sau: Dùng cached clips → Mix (3s) = <strong className="text-green-400">5s</strong></li>
                    <li>Có GPU: Nhanh gấp 3x so với CPU</li>
                    <li>Cache tự động clean up khi đầy (LRU)</li>
                </ul>
            </div>
        </div>
    );
}
