/**
 * Gọi BE làm mới follower / likes / views qua Apify (mọi nền tảng).
 */
export async function enrichTrackedChannelApify(
  channelId: string,
): Promise<{ success: boolean; message?: string }> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const res = await fetch(`${apiUrl}/tracked-channels/${channelId}/enrich-apify`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      message: (data as { message?: string }).message || `Lỗi ${res.status}`,
    };
  }
  if ((data as { success?: boolean }).success === false) {
    return {
      success: false,
      message: (data as { message?: string }).message,
    };
  }
  return { success: true };
}
