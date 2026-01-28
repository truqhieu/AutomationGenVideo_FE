// Video data from AI backend
export interface Video {
  id: string;
  title: string;
  caption: string;
  cover: string;
  thumbnail: string;
  video_url: string;
  url: string;
  download_url: string;
  created_at: string;
  publishedAt: string;
  likes: number;
  views: number;
  stats: {
    digg_count: number;
    play_count: number;
  };
  channelName: string;
  author: {
    nickname: string;
    avatar: string;
  };
  status: string;
}

// Search request
export interface SearchRequest {
  keyword: string;
  platform?: 'tiktok' | 'douyin' | 'instagram' | 'facebook';
  min_likes?: number;
  min_views?: number;
  sort_by?: 'likes' | 'views';
  search_mode?: 'hashtag' | 'user';
}

// Search response
export interface SearchResponse {
  videos: Video[];
  cursor?: number;
  count: number;
}

// Tracked Channel
export interface TrackedChannel {
  id: number;
  platform: string;
  platform_display?: string;
  channel_id: string;
  username: string;
  display_name: string;
  is_active: boolean;
  check_interval_minutes: number;
  min_likes_threshold: number;
  last_checked_at?: string;
  follower_count: number;
  videos_count: number;
  total_likes: number;
  total_views: number;
  engagement: number;
  engagement_rate: number;
  should_check?: boolean;
  created_at: string;
  updated_at: string;
}

// Music Posts request
export interface MusicPostsRequest {
  music_id: string;
  count?: number;
  cursor?: number;
  min_likes?: number;
  min_views?: number;
}

// Download request
export interface DownloadRequest {
  url: string;
}

// Download response
export interface DownloadResponse {
  download_url: string;
  video_id: string;
}
