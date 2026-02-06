'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Upload, Loader2, Film, Download, Trash2, Music, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import Button from '@/components/ui/button';

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';

const REQUIRED_FILES_COUNT = 10;

const FOLDER_LABELS = [
  'Phần 1: Video sản phẩm',
  'Phần 2: Video HuyK',
  'Phần 3: Video chế tác + video chế tác',
  'Phần 4: Video HuyK + chế tác',
  'Phần 5: Video chế tác + HuyK',
  'Phần 6: Video sản phẩm hoàn thiện',
  'Phần 7: Video Outro HuyK (Giữ audio gốc)',
];

// Map folder index to human readable labels for UI
const FOLDER_UI_LABELS: { [key: number]: string } = {
  0: 'Phần 1',
  1: 'Phần 2',
  2: 'Phần 3 (trên)',
  3: 'Phần 3 (dưới)',
  4: 'Phần 4 (trên)',
  5: 'Phần 4 (dưới)',
  6: 'Phần 5 (trên)',
  7: 'Phần 5 (dưới)',
  8: 'Phần 6',
  9: 'Phần 7 (Outro)',
};

const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '9:16 (dọc)', width: 720, height: 1280 },
  { label: '1:1 (vuông)', width: 1080, height: 1080 },
  { label: '16:9 (ngang)', width: 1280, height: 720 },
];

export default function MixVideoPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<{ [key: number]: File[] }>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []
  });

  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    output_urls?: string[];
    output_filenames?: string[];
    num_outputs?: number;
  } | null>(null);
  const [currentProgressId, setCurrentProgressId] = useState<string | null>(null);

  const [width, setWidth] = useState<number>(720);
  const [height, setHeight] = useState<number>(1280);
  const [numOutputs, setNumOutputs] = useState<number>(10);
  const [isMaxOutputs, setIsMaxOutputs] = useState<boolean>(false);
  const [openFolders, setOpenFolders] = useState<{ [key: number]: boolean }>(
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, i === 0]))
  );

  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const audioInputRef = useRef<HTMLInputElement>(null);
  const folderInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const generateThumbnail = useCallback(async (file: File) => {
    const fileId = `${file.name}-${file.size}`;
    if (thumbnails[fileId]) return;

    const blobUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.src = blobUrl;

    return new Promise<void>((resolve) => {
      const onSeeked = () => {
        try {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w && h) {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
              setThumbnails((prev) => ({ ...prev, [fileId]: dataUrl }));
            }
          }
        } finally {
          URL.revokeObjectURL(blobUrl);
          video.remove();
          resolve();
        }
      };

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', () => {
        URL.revokeObjectURL(blobUrl);
        video.remove();
        resolve();
      });
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = 0.5;
      });
      video.load();
    });
  }, [thumbnails]);

  useEffect(() => {
    // Generate thumbnails for all new files
    Object.values(folderFiles).flat().forEach(file => {
      generateThumbnail(file);
    });
  }, [folderFiles, generateThumbnail]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    }
  };

  const handleFolderFilesChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    const list = Array.from(selected).filter((f) =>
      /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(f.name)
    );
    setFolderFiles((prev) => ({
      ...prev,
      [index]: [...prev[index], ...list]
    }));
    e.target.value = '';
  };

  const removeFileFromFolder = (folderIndex: number, fileIndex: number) => {
    setFolderFiles((prev) => ({
      ...prev,
      [folderIndex]: prev[folderIndex].filter((_, i) => i !== fileIndex)
    }));
  };

  const toggleFolder = (index: number) => {
    setOpenFolders(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleMix = async () => {
    // Validate: Need audio and at least one video in each folder
    if (!audioFile) {
      setError('Vui lòng chọn file âm thanh.');
      return;
    }
    const missingFolders = Object.entries(folderFiles).filter(([_, files]) => files.length === 0);
    if (missingFolders.length > 0) {
      setError(`Vui lòng chọn ít nhất 1 video cho ${missingFolders.map(([i]) => FOLDER_UI_LABELS[Number(i)]).join(', ')}.`);
      return;
    }

    setLoading(true);
    setProgressPercent(0);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      Object.entries(folderFiles).forEach(([index, files]) => {
        files.forEach(file => {
          formData.append(`folder_${index}`, file);
        });
      });
      formData.append('width', String(width));
      formData.append('height', String(height));
      formData.append('num_outputs', isMaxOutputs ? '9999' : String(numOutputs));

      const response = await fetch(`${AI_API_URL}/api/videos/mix/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Có lỗi khi bắt đầu mix video.');
        return;
      }

      const progressId = data.progress_id;
      if (!progressId) {
        setError('Không nhận được progress_id từ server.');
        return;
      }
      setCurrentProgressId(progressId);

      // Polling
      const poll = async () => {
        try {
          const statusRes = await fetch(`${AI_API_URL}/api/videos/mix/status/${progressId}/`);
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            setError(statusData.error || 'Lỗi khi kiểm tra trạng thái.');
            setLoading(false);
            return;
          }

          if (statusData.percent != null) setProgressPercent(statusData.percent);

          if (statusData.status === 'done') {
            setResult({
              output_urls: statusData.output_urls,
              output_filenames: statusData.output_filenames,
              num_outputs: statusData.num_outputs,
            });
            setLoading(false);
          } else if (statusData.status === 'error' || statusData.status === 'cancelled') {
            if (statusData.status === 'error') {
              setError(statusData.error || 'Có lỗi xảy ra trong quá trình xử lý.');
            } else {
              setError('Quá trình mix đã được huỷ bỏ.');
            }
            setLoading(false);
            setCurrentProgressId(null);
          } else {
            setTimeout(poll, 1000);
          }
        } catch (err) {
          setError('Lỗi kết nối khi kiểm tra trạng thái.');
          setLoading(false);
        }
      };

      poll();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới server.');
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentProgressId) return;
    try {
      await fetch(`${AI_API_URL}/api/videos/mix/cancel/${currentProgressId}/`, {
        method: 'POST',
      });
      setLoading(false);
      setCurrentProgressId(null);
      setError('Quá trình mix đã bị dừng bởi người dùng.');
    } catch (err) {
      console.error('Lỗi khi dừng mix:', err);
    }
  };

  const getDownloadUrl = (urlPath: string) => `${AI_API_URL}/${urlPath.replace(/^\//, '')}`;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white space-y-8 pb-20 px-4 pt-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium uppercase tracking-wider">
            Premium Video Tool
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Mix Video</span>
            <span className="text-white">Advanced</span>
          </h1>
          <p className="text-slate-400 max-w-lg">
            Hệ thống sản xuất video hàng loạt với công thức A4 chuyên nghiệp. Phối trộn thông minh, đảm bảo duy nhất.
          </p>
        </div>
        <div className="flex gap-4">
          {loading && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="px-6 py-6 border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 font-bold rounded-2xl transition-all"
            >
              Dừng lại
            </Button>
          )}
          <Button
            onClick={handleMix}
            disabled={loading}
            className="px-10 py-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Đang xử lý {progressPercent}%
              </>
            ) : (
              <>
                <Scissors className="w-5 h-5 mr-3" />
                Tiến hành mix
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Settings & Audio */}
        <div className="lg:col-span-4 space-y-6">
          {/* Audio Section */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-500" />
              </div>
              Âm thanh phối
            </h2>
            <div
              onClick={() => audioInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
                ${audioFile ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10' : 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 group'}`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioChange}
              />
              {audioFile ? (
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
                    <Music className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{audioFile.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Upload className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Chọn file Audio</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">MP3, WAV, AAC supported</p>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-[#111827] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6">
            <h2 className="font-bold text-lg flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Film className="w-5 h-5 text-blue-500" />
              </div>
              Cấu hình Output
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase px-1">Tỉ lệ khung hình</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => { setWidth(p.width); setHeight(p.height); }}
                      className={`flex-1 min-w-[100px] text-xs font-bold px-3 py-3 rounded-xl border-2 transition-all duration-200 
                        ${width === p.width && height === p.height
                          ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                          : 'bg-slate-800/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số lượng video tạo ra</label>
                  <button
                    onClick={() => setIsMaxOutputs(!isMaxOutputs)}
                    className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all border-2
                      ${isMaxOutputs
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                        : 'bg-slate-800 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                  >
                    {isMaxOutputs ? 'SỐ LƯỢNG: MAX' : 'CHẾ ĐỘ MAX'}
                  </button>
                </div>
                {!isMaxOutputs ? (
                  <div className="relative group">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={numOutputs}
                      onChange={(e) => setNumOutputs(Number(e.target.value))}
                      className="w-full bg-[#0b0f19] px-4 py-4 rounded-2xl border-2 border-slate-800 focus:border-blue-500 outline-none text-white font-bold transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 uppercase">Videos</div>
                  </div>
                ) : (
                  <div className="px-4 py-4 bg-orange-500/5 border-2 border-orange-500/20 text-orange-400/80 rounded-2xl text-[11px] font-medium italic leading-relaxed backdrop-blur-sm">
                    "Hệ thống sẽ sản xuất tuyệt đối tất cả các biến thể có thể trộn được từ dữ liệu các thư mục."
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/20 text-red-400 text-sm p-5 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-xs mt-0.5">!</div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-blue-600/10 border-2 border-blue-500/20 p-6 rounded-3xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-500">
              <h3 className="font-extrabold text-blue-400 flex items-center justify-between uppercase text-xs">
                <span className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  KẾT QUẢ XUẤT BẢN
                </span>
                <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">{result.output_urls?.length} FILES</span>
              </h3>
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {result.output_urls?.map((url, idx) => (
                  <a
                    key={idx}
                    href={getDownloadUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-[#0b0f19] border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                        {result.output_filenames?.[idx] || `VIDEO_MIX_OUTPUT_${idx + 1}`}
                      </p>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-500 shrink-0 ml-3 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Folder Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827]/50 p-4 rounded-3xl border border-slate-800 backdrop-blur-sm">
            <h2 className="font-extrabold text-lg flex items-center gap-4 text-white">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <Film className="w-6 h-6 text-slate-400" />
              </div>
              Thư viện dữ liệu
              <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-600 text-[10px] text-white uppercase tracking-widest leading-none">
                {Object.values(folderFiles).flat().length} Total Files
              </span>
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setOpenFolders(Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, true])))}
                className="text-[10px] font-bold text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
              >
                Mở rộng tất cả
              </button>
              <button
                onClick={() => setOpenFolders(Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, false])))}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
              >
                Thu gọn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`bg-[#111827] rounded-[2rem] border transition-all duration-300 overflow-hidden shadow-xl
                ${folderFiles[i].length > 0 ? 'border-blue-500/30' : 'border-slate-800 hover:border-slate-700'}`}>

                <div
                  onClick={() => toggleFolder(i)}
                  className={`px-6 py-5 flex items-center justify-between cursor-pointer group
                    ${folderFiles[i].length > 0 ? 'bg-blue-500/5' : 'hover:bg-slate-800/30'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all
                      ${folderFiles[i].length > 0 ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 text-slate-600 group-hover:text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-black transition-colors ${folderFiles[i].length > 0 ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {FOLDER_UI_LABELS[i]}
                      </p>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter leading-tight">
                        {folderFiles[i].length} VIDEOS
                      </p>
                    </div>
                  </div>
                  {openFolders[i] ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
                </div>

                {openFolders[i] && (
                  <div className="px-6 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-3 gap-2">
                      {folderFiles[i].map((file, idx) => {
                        const fileId = `${file.name}-${file.size}`;
                        return (
                          <div key={idx} className="relative group w-full aspect-video bg-[#0b0f19] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                            {thumbnails[fileId] ? (
                              <img src={thumbnails[fileId]} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Film className="w-5 h-5 text-slate-700 animate-pulse" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => removeFileFromFolder(i, idx)}
                                className="p-2 bg-red-600 text-white rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => folderInputRefs.current[i]?.click()}
                        className="w-full aspect-video border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group/add"
                      >
                        <ImagePlus className="w-6 h-6 text-slate-700 group-hover/add:text-blue-500 transition-colors" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter group-hover/add:text-blue-400">Thêm dữ liệu</span>
                      </button>
                    </div>
                    <input
                      ref={el => { folderInputRefs.current[i] = el; }}
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFolderFilesChange(i, e)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide Footer Section */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-[#111827] to-[#0b0f19] rounded-[3rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-48 -mt-48 transition-all group-hover:bg-blue-600/10 pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white">
                CÔNG THỨC <span className="text-blue-500 italic">MIX A4</span>
              </h3>
              <ul className="space-y-4">
                {FOLDER_LABELS.map((label, i) => (
                  <li key={i} className="flex items-start gap-4 group/item">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-black text-blue-400 shrink-0 mt-0.5 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-sm">
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-slate-400 group-hover/item:text-slate-200 transition-colors">{label}</p>
                  </li>
                ))}
              </ul>
              <div className="pt-6 border-t border-slate-800">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-2 italic leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0"></div>
                  Hệ thống sử dụng trí tuệ nhân tạo để tính toán tổ hợp, đảm bảo video đầu ra có cấu trúc chuyên nghiệp, âm tính nhất quán.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="relative rounded-3xl overflow-hidden border-8 border-[#111827] shadow-[0_0_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.03] transition-transform duration-700">
                <img
                  src="/images/mix-video-formula.png"
                  alt="A4 Professional Formula"
                  className="w-full h-full object-contain bg-white"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 20px;
          border: 2px solid #0b0f19;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
