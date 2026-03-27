/** Placeholder khi lazy-load recharts — tránh layout shift */
export function ChartBlockSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-gray-100 bg-gray-50 min-h-[280px] ${className ?? ""}`}
      aria-hidden
    />
  );
}
