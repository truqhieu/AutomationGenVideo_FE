import { CalendarDays, ClipboardList, TrendingUp } from "lucide-react";
import { GrowthChart5A } from "../shared/GrowthChart5A";
import { LeaderDailyKpiTable } from "./LeaderDailyKpiTable";
import { LeaderGaugeCards } from "./LeaderGaugeCards";

export function LeaderKpiTab() {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-start gap-2 text-base font-bold text-amber-900">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
            <span>
              KPI tháng từ Admin: <span className="text-amber-700">300 video</span> (A1:90 · A2:75 · A3:75 ·
              A4:45 · A5:15)
            </span>
          </div>
          <div className="mt-1 text-sm text-amber-800">
            Chia nhỏ KPI theo ngày cho từng thành viên · 23 ngày làm việc
          </div>
        </div>
        <span className="inline-flex items-center gap-1 self-start rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 sm:self-center">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Còn 8 ngày
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-500">Lọc:</span>
        <select className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-amber-400">
          <option>Tất cả Team</option>
          <option>Nội dung VN</option>
          <option>Toàn cầu</option>
        </select>
      </div>

      <LeaderGaugeCards />
      <LeaderDailyKpiTable />
      <GrowthChart5A
        accent="leader"
        title="Tăng trưởng KPI theo tháng"
        footer={
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500">
            <span>
              Tổng T3: <b className="text-gray-900">317 video</b>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              vs T2:{" "}
              <b className="inline-flex items-center gap-0.5 text-emerald-600">
                <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
                +41 video (+15%)
              </b>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-0.5">
              vs T1:{" "}
              <b className="inline-flex items-center gap-0.5 text-emerald-600">
                <TrendingUp className="h-3 w-3 shrink-0" aria-hidden />
                +89 video (+39%)
              </b>
            </span>
          </div>
        }
      />
    </div>
  );
}
