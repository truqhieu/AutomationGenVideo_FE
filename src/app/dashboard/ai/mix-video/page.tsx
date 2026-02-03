'use client';

import { useState, useRef, useEffect } from 'react';
import { Scissors, Upload, Loader2, Film, Download, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button';

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';

const REQUIRED_FILES = 10;

const PARTS_LABELS = [
  'Video sản phẩm',
  'Video HuyK',
  'Video chế tác + video chế tác',
  'Video HuyK + chế tác',
  'Video chế tác + HuyK',
  'Video sản phẩm hoàn thiện',
  'Video Outro HuyK',
];

const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '9:16 (dọc)', width: 720, height: 1280 },
  { label: '1:1 (vuông)', width: 1080, height: 1080 },
];

export default function MixVideoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    output_url?: string;
    output_filename?: string;
    output_urls?: string[];
    output_filenames?: string[];
    num_outputs?: number;
    max_from_duration?: number;
    segments_part1?: number;
    segments_part2?: number;
  } | null>(null);
  const [width, setWidth] = useState<number>(720);
  const [height, setHeight] = useState<number>(0);
  /** 'natural' = trả tối đa theo điều kiện mix; 'limit' = chỉ lấy đúng số lượng nhập (nếu mix được ít hơn thì trả đủ theo điều kiện) */
  const [outputLimitMode, setOutputLimitMode] = useState<'natural' | 'limit'>('natural');
  const [outputLimitValue, setOutputLimitValue] = useState<number>(10);
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (files.length === 0) {
      setThumbnails([]);
      return;
    }
    const blobUrls: string[] = [];
    setThumbnails(new Array(files.length).fill(null));

    files.forEach((file, index) => {
      const blobUrl = URL.createObjectURL(file);
      blobUrls.push(blobUrl);
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.src = blobUrl;

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
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              setThumbnails((prev) => {
                const next = [...prev];
                next[index] = dataUrl;
                return next;
              });
            }
          }
        } finally {
          URL.revokeObjectURL(blobUrl);
          video.remove();
        }
      };

      video.addEventListener('seeked', onSeeked);
      video.addEventListener('error', () => {
        URL.revokeObjectURL(blobUrl);
        video.remove();
      });
      video.addEventListener('loadedmetadata', () => {
        video.currentTime = Math.min(0.5, video.duration * 0.1);
      });
      video.load();
    });

    return () => {
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    const list = Array.from(selected).filter((f) =>
      /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...list].slice(0, REQUIRED_FILES));
    setError('');
    setResult(null);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleMix = async () => {
    if (files.length < REQUIRED_FILES) {
      setError(`Chọn đúng ${REQUIRED_FILES} video theo thứ tự 7 phần (xem mô tả bên dưới).`);
      return;
    }
    setLoading(true);
    setProgressPercent(0);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      files.slice(0, REQUIRED_FILES).forEach((f) => formData.append('videos', f));
      formData.append('width', String(width));
      formData.append('height', String(height));
      if (outputLimitMode === 'limit' && outputLimitValue > 0) {
        formData.append('num_outputs', String(Math.max(1, Math.min(100, outputLimitValue))));
      }
      const response = await fetch(`${AI_API_URL}/api/videos/mix/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Có lỗi khi ghép video.');
        return;
      }
      const progressId = data.progress_id;
      if (!progressId) {
        setError('Server không trả progress_id.');
        return;
      }
      const pollInterval = 500;
      await new Promise<void>((resolve) => {
        const poll = async () => {
          const statusRes = await fetch(`${AI_API_URL}/api/videos/mix/status/${progressId}/`);
          const statusData = await statusRes.json().catch(() => ({}));
          if (!statusRes.ok) {
            setError(statusData.error || 'Lỗi khi lấy trạng thái.');
            resolve();
            return;
          }
          if (statusData.percent != null) setProgressPercent(statusData.percent);
          if (statusData.status === 'done') {
            setResult({
              output_url: statusData.output_url,
              output_filename: statusData.output_filename,
              output_urls: statusData.output_urls,
              output_filenames: statusData.output_filenames,
              num_outputs: statusData.num_outputs,
              max_from_duration: statusData.max_from_duration,
              segments_part1: statusData.num_segments_per_file?.[0],
              segments_part2: statusData.num_segments_per_file?.[1],
            });
            resolve();
            return;
          }
          if (statusData.status === 'error') {
            setError(statusData.error || 'Lỗi khi ghép video.');
            resolve();
            return;
          }
          setTimeout(poll, pollInterval);
        };
        poll();
      });
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới server.');
    } finally {
      setLoading(false);
      setProgressPercent(0);
    }
  };

  const getDownloadUrl = (urlPath: string) =>
    `${AI_API_URL}/${urlPath.replace(/^\//, '')}`;

  const fileIndexToPart = (index: number) => {
    if (index === 0) return 1;
    if (index === 1) return 2;
    if (index >= 2 && index <= 3) return 3;
    if (index >= 4 && index <= 5) return 4;
    if (index >= 6 && index <= 7) return 5;
    if (index === 8) return 6;
    return 7;
  };

  /** Nhãn hiển thị cho từng vị trí upload: phần nào, và với phần 3/4/5 thì trên hay dưới */
  const fileIndexToPartLabel = (index: number): string => {
    if (index === 0) return 'Phần 1';
    if (index === 1) return 'Phần 2';
    if (index === 2) return 'Phần 3 (trên)';
    if (index === 3) return 'Phần 3 (dưới)';
    if (index === 4) return 'Phần 4 (trên)';
    if (index === 5) return 'Phần 4 (dưới)';
    if (index === 6) return 'Phần 5 (trên)';
    if (index === 7) return 'Phần 5 (dưới)';
    if (index === 8) return 'Phần 6';
    return 'Phần 7';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scissors className="w-7 h-7 text-blue-600" />
          Mix Video
        </h1>
        <p className="text-slate-600 mt-1">
          Mix video tạo thành video A4.
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-start">
        <div className="text-sm text-slate-700 space-y-2 min-w-0 flex-1">
          <p className="font-medium text-slate-800">Công thức mix video A4:</p>
          <ol className="list-decimal list-inside space-y-1">
            {PARTS_LABELS.map((label, i) => (
              <li key={i}>{label}</li>
            ))}
          </ol>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <img
            src="/images/mix-video-formula.png"
            alt="Tiêu chuẩn cấu trúc video edit - Tỷ lệ phân bổ hình ảnh Video A4"
            className="rounded-lg border border-slate-200 max-w-[360px] w-full min-h-[280px] h-auto object-contain object-center"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Film className="w-5 h-5" />
            <span className="font-medium">Chọn video để mix</span>
            <span className="text-slate-500 text-sm">({files.length}/{REQUIRED_FILES})</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".mp4,.mov,.avi,.mkv,.webm,.m4v"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Tỉ lệ khung hình output</p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidth(preset.width);
                    setHeight(preset.height);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    width === preset.width && height === preset.height
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Chiều rộng (px):
                <input
                  type="number"
                  min={2}
                  max={4096}
                  value={width}
                  onChange={(e) => setWidth(Math.max(2, Math.min(4096, Number(e.target.value) || 720)))}
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-slate-800"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                Chiều cao (px, 0 = tự động):
                <input
                  type="number"
                  min={0}
                  max={4096}
                  value={height || ''}
                  onChange={(e) => setHeight(Math.max(0, Math.min(4096, Number(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-slate-800"
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Số video output trả về</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="outputLimit"
                  checked={outputLimitMode === 'natural'}
                  onChange={() => setOutputLimitMode('natural')}
                  className="text-blue-600"
                />
                <span className="text-slate-700">FULL MAX</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="outputLimit"
                  checked={outputLimitMode === 'limit'}
                  onChange={() => setOutputLimitMode('limit')}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Giới hạn:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={outputLimitValue}
                  onChange={(e) => setOutputLimitValue(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                  disabled={outputLimitMode !== 'limit'}
                  className="w-16 px-2 py-1 rounded border border-slate-300 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-slate-500 text-sm">video (1–100)</span>
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Nếu giới hạn lớn hơn số tổ hợp mix có thể tạo thì chỉ trả về đủ theo điều kiện mix.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50"
          >
            <Upload className="w-5 h-5 mr-2" />
            Thêm video từ máy
          </Button>

          {files.length > 0 && (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg text-sm"
                >
                  <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                    {thumbnails[i] ? (
                      <img
                        src={thumbnails[i]!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-500 font-medium">{fileIndexToPartLabel(i)}</p>
                    <p className="truncate text-slate-700 text-xs mt-0.5">{f.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 text-slate-400 hover:text-red-600 shrink-0"
                    aria-label="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button
            onClick={handleMix}
            disabled={loading || files.length !== REQUIRED_FILES}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                Đang ghép video... {progressPercent}%
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Tiến hành mix
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="border-t border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Video đã ghép :
            </p>
            {(result.output_urls && result.output_urls.length > 0 ? result.output_urls : [result.output_url]).filter(Boolean).map((urlPath, idx) => {
              const url = getDownloadUrl(urlPath!);
              const name = (result.output_filenames && result.output_filenames[idx]) || result.output_filename || `mixed_${idx + 1}.mp4`;
              return (
                <div key={idx} className="flex flex-wrap items-center gap-3 mb-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Video {idx + 1}
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {name}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
