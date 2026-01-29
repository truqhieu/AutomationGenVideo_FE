'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, Film, AlertTriangle, CheckCircle, X, FileVideo, Loader2, ChevronDown } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Channel {
  id: string;
  platform: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  total_followers?: number;
}

interface DuplicateResult {
  isDuplicate: boolean;
  matchedVideo?: {
    id: string;
    title: string;
    createdAt: string;
    platforms: string[];
  };
  similarity: number;
  confidence: string;
  needsReview: boolean;
}

const PLATFORMS = [
  { id: 'TIKTOK', name: 'TikTok', icon: '🎵', color: 'from-pink-600 to-purple-600' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: '📷', color: 'from-purple-600 to-pink-600' },
  { id: 'FACEBOOK', name: 'Facebook', icon: '👥', color: 'from-blue-600 to-blue-500' },
  { id: 'DOUYIN', name: 'Douyin', icon: '🎶', color: 'from-red-600 to-pink-600' },
  { id: 'XIAOHONGSHU', name: 'Xiaohongshu', icon: '📕', color: 'from-red-600 to-orange-600' },
];

export default function VideoFilterPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<DuplicateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch channels when platform is selected
  useEffect(() => {
    if (selectedPlatform) {
      fetchChannels(selectedPlatform);
    } else {
      setChannels([]);
      setSelectedChannel('');
    }
  }, [selectedPlatform]);

  const fetchChannels = async (platform: string) => {
    setLoadingChannels(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/tracked-channels/my-channels?platform=${platform}`;
      
      console.log('🔍 [fetchChannels] Starting request...');
      console.log('  Platform:', platform);
      console.log('  API URL:', apiUrl);
      console.log('  Full URL:', url);
      console.log('  Token exists:', !!token);
      console.log('  Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [fetchChannels] Response received');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  OK:', response.ok);

      const data = await response.json();
      console.log('📦 [fetchChannels] Response data:', data);

      if (!response.ok) {
        console.error('❌ [fetchChannels] Request failed:', data);
        throw new Error(data.message || 'Failed to fetch channels');
      }

      console.log('✅ [fetchChannels] Success! Channels count:', data.channels?.length || 0);
      setChannels(data.channels || []);
    } catch (err: any) {
      console.error('💥 [fetchChannels] Error caught:', err);
      console.error('  Error message:', err.message);
      console.error('  Error stack:', err.stack);
      setError(err.message || 'Failed to load channels');
      setChannels([]);
    } finally {
      setLoadingChannels(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile || !selectedChannel) {
      setError('Please select a platform, channel, and upload a video');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('channelId', selectedChannel);

      console.log('📤 [handleUpload] Starting upload...');
      console.log('  File name:', selectedFile.name);
      console.log('  File size:', (selectedFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('  Channel ID:', selectedChannel);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${apiUrl}/videos/upload`;
      
      console.log('  API URL:', apiUrl);
      console.log('  Full URL:', url);
      console.log('  Token exists:', !!token);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('📡 [handleUpload] Response received');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);

      const data = await response.json();
      console.log('📦 [handleUpload] Response data:', data);

      if (!response.ok) {
        console.error('❌ [handleUpload] Upload failed:', data);
        throw new Error(data.message || 'Upload failed');
      }

      if (data.success) {
        console.log('✅ [handleUpload] Upload successful!');
        setResult({
          isDuplicate: false,
          similarity: 0,
          confidence: 'high',
          needsReview: false,
        });
      } else if (data.duplicate) {
        console.log('⚠️ [handleUpload] Duplicate detected:', data.duplicate);
        setResult(data.duplicate);
      }

      // Reset form after successful upload
      setTimeout(() => {
        if (data.success) {
          setSelectedFile(null);
          setUploadProgress(0);
        }
      }, 3000);

    } catch (err: any) {
      console.error('💥 [handleUpload] Error caught:', err);
      console.error('  Error message:', err.message);
      setError(err.message || 'Failed to upload video');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
  };

  const selectedPlatformData = PLATFORMS.find(p => p.id === selectedPlatform);
  const selectedChannelData = channels.find(c => c.id === selectedChannel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Film className="w-10 h-10 text-blue-500" />
            Lọc Video - Kiểm Tra Trùng Lặp
          </h1>
          <p className="text-slate-400 text-lg">
            Chọn platform và channel, sau đó upload video để kiểm tra trùng lặp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Step 1: Select Platform */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="text-white font-semibold text-lg">Chọn Platform</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      setSelectedChannel('');
                      setResult(null);
                      setError(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedPlatform === platform.id
                        ? `border-blue-500 bg-gradient-to-br ${platform.color} bg-opacity-10`
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{platform.icon}</div>
                    <p className={`font-medium ${
                      selectedPlatform === platform.id ? 'text-white' : 'text-slate-400'
                    }`}>
                      {platform.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Channel */}
            <div className={`bg-slate-800/50 rounded-2xl p-6 border border-slate-700 transition-all duration-300 ${
              !selectedPlatform ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="text-white font-semibold text-lg">Chọn Channel</h3>
              </div>

              {loadingChannels ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="ml-2 text-slate-400">Đang tải channels...</span>
                </div>
              ) : channels.length === 0 && selectedPlatform ? (
                <div className="text-center py-8 text-slate-400">
                  <p>Không có channel nào cho platform này</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setSelectedChannel(channel.id);
                        setResult(null);
                        setError(null);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                        selectedChannel === channel.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                      }`}
                    >
                      {channel.avatar_url ? (
                        <img
                          src={channel.avatar_url}
                          alt={channel.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                          {channel.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${
                          selectedChannel === channel.id ? 'text-white' : 'text-slate-300'
                        }`}>
                          {channel.display_name || channel.username}
                        </p>
                        <p className="text-slate-500 text-sm">@{channel.username}</p>
                        {channel.total_followers !== undefined && (
                          <p className="text-slate-400 text-xs mt-1">
                            {channel.total_followers.toLocaleString()} followers
                          </p>
                        )}
                      </div>
                      {selectedChannel === channel.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Upload Video */}
            <div className={`transition-all duration-300 ${
              !selectedChannel ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-white font-semibold text-lg">Upload Video</h3>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : selectedFile
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-slate-700 bg-slate-900/50 hover:border-blue-500 hover:bg-slate-800'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3">
                    {selectedFile ? (
                      <>
                        <FileVideo className="w-12 h-12 text-green-500" />
                        <div>
                          <p className="text-white font-semibold">{selectedFile.name}</p>
                          <p className="text-slate-400 text-sm">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Xóa file
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-slate-500" />
                        <div>
                          <p className="text-white font-semibold mb-1">
                            {isDragActive ? 'Thả video vào đây...' : 'Kéo thả video hoặc click để chọn'}
                          </p>
                          <p className="text-slate-400 text-sm">
                            MP4, MOV, AVI, MKV, WEBM
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Kiểm tra trùng lặp
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {uploading && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mt-4">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Đang xử lý video...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Selected Info Summary */}
            {(selectedPlatformData || selectedChannelData) && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-white font-semibold text-lg mb-4">Thông tin đã chọn</h3>
                <div className="space-y-3">
                  {selectedPlatformData && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedPlatformData.icon}</span>
                      <div>
                        <p className="text-slate-400 text-xs">Platform</p>
                        <p className="text-white font-medium">{selectedPlatformData.name}</p>
                      </div>
                    </div>
                  )}
                  {selectedChannelData && (
                    <div className="flex items-center gap-3">
                      {selectedChannelData.avatar_url ? (
                        <img
                          src={selectedChannelData.avatar_url}
                          alt={selectedChannelData.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                          {selectedChannelData.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-slate-400 text-xs">Channel</p>
                        <p className="text-white font-medium">
                          {selectedChannelData.display_name || selectedChannelData.username}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-red-500 font-semibold text-lg mb-1">Lỗi</h3>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div
                className={`rounded-2xl p-6 border ${
                  result.isDuplicate
                    ? 'bg-yellow-500/10 border-yellow-500/50'
                    : 'bg-green-500/10 border-green-500/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {result.isDuplicate ? (
                    <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-xl mb-2 ${
                        result.isDuplicate ? 'text-yellow-500' : 'text-green-500'
                      }`}
                    >
                      {result.isDuplicate ? 'Phát hiện trùng lặp!' : 'Video độc nhất!'}
                    </h3>

                    {result.isDuplicate && result.matchedVideo && (
                      <div className="space-y-3 mt-4">
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <p className="text-slate-400 text-sm mb-2">Video trùng lặp:</p>
                          <p className="text-white font-semibold">{result.matchedVideo.title}</p>
                          <p className="text-slate-400 text-sm mt-1">
                            Ngày tạo: {new Date(result.matchedVideo.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {result.matchedVideo.platforms.map((platform) => (
                              <span
                                key={platform}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Độ tương đồng</p>
                            <p className="text-white font-bold text-lg">
                              {(result.similarity * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Độ tin cậy</p>
                            <p className="text-white font-bold text-lg capitalize">
                              {result.confidence}
                            </p>
                          </div>
                        </div>

                        {result.needsReview && (
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                            <p className="text-orange-400 text-sm">
                              ⚠️ Video này cần được Manager xem xét
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!result.isDuplicate && (
                      <p className="text-slate-300">
                        Video của bạn là duy nhất và đã được upload thành công vào hệ thống.
                      </p>
                    )}

                    <button
                      onClick={resetForm}
                      className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Upload video khác →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-2xl p-12 text-center">
                <Film className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">
                  Kết quả kiểm tra trùng lặp sẽ hiển thị ở đây
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
