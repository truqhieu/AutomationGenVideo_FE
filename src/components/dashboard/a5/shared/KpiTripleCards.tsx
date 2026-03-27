import { CircleDollarSign, Eye, TrendingUp, Video } from "lucide-react";

export function KpiTripleCards() {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
          <Eye className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          Tổng Traffic
        </div>
        <div className="mt-1 text-4xl font-extrabold leading-tight">1.85M</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
          +22% vs tháng trước
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
          <CircleDollarSign className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          Tổng Doanh Thu
        </div>
        <div className="mt-1 text-4xl font-extrabold leading-tight">2.8 Tỷ</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
          +18% vs tháng trước
        </div>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
          <Video className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          Tổng Video
        </div>
        <div className="mt-1 text-4xl font-extrabold leading-tight">755</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-emerald-600">
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
          141 video mới
        </div>
      </div>
    </div>
  );
}
