/**
 * Kênh vừa import / đang chờ Apify: chưa có bất kỳ chỉ số nào.
 */
export function channelAwaitingStats(ch: {
  total_followers?: number | null;
  total_likes?: number | bigint | null;
  total_views?: number | bigint | null;
  total_videos?: number | null;
}): boolean {
  const f = ch.total_followers ?? 0;
  const l = Number(ch.total_likes ?? 0);
  const v = Number(ch.total_views ?? 0);
  const n = Number(ch.total_videos ?? 0);
  return f === 0 && l === 0 && v === 0 && n === 0;
}

/**
 * Poll API cho đến khi mọi kênh đã có ít nhất một chỉ số, hoặc hết thời gian.
 */
export async function pollTrackedChannelsUntilStats<T>(
  loadChannels: () => Promise<T[]>,
  options?: { maxMs?: number; intervalMs?: number },
): Promise<T[]> {
  const maxMs = options?.maxMs ?? 180000;
  const intervalMs = options?.intervalMs ?? 3000;
  const deadline = Date.now() + maxMs;
  let list = await loadChannels();
  while (
    list.length > 0 &&
    list.some((c) => channelAwaitingStats(c as Parameters<typeof channelAwaitingStats>[0])) &&
    Date.now() < deadline
  ) {
    await new Promise((r) => setTimeout(r, intervalMs));
    list = await loadChannels();
  }
  return list;
}
