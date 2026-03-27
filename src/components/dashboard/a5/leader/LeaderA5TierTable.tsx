"use client";

import { BarChart3, Circle } from "lucide-react";
import { useMemo } from "react";
import { useAdminOverviewFilters } from "../admin/AdminOverviewFiltersContext";

function TierLabel({ tier, colorClass }: { tier: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold ${colorClass}`}>
      <Circle className="h-2.5 w-2.5 shrink-0 fill-current stroke-none" aria-hidden />
      {tier}
    </span>
  );
}

const BASE_ROWS: {
  tier: string;
  colorClass: string;
  video: number;
  vs: string;
  trafficK: number;
  eff: string;
}[] = [
  { tier: "A1", colorClass: "text-a1", video: 72, vs: "+8", trafficK: 680, eff: "9,444/v" },
  { tier: "A2", colorClass: "text-a2", video: 57, vs: "+5", trafficK: 210, eff: "3,684/v" },
  { tier: "A3", colorClass: "text-a3", video: 37, vs: "-2", trafficK: 125, eff: "3,378/v" },
  { tier: "A4", colorClass: "text-a4", video: 26, vs: "+6", trafficK: 65, eff: "2,500/v" },
  { tier: "A5", colorClass: "text-a5", video: 16, vs: "-1", trafficK: 20, eff: "1,250/v" },
];

function formatTrafficK(k: number) {
  if (k >= 1000) return `${(k / 1000).toFixed(2)}M`;
  return `${Math.round(k)}K`;
}

export function LeaderA5TierTable() {
  const { growthChartScaleFactor: sf } = useAdminOverviewFilters();

  const rows = useMemo(
    () =>
      BASE_ROWS.map((r) => ({
        ...r,
        videoDisp: Math.max(0, Math.round(r.video * sf)),
        trafficDisp: formatTrafficK(r.trafficK * sf),
      })),
    [sf],
  );

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-base font-bold">
        <BarChart3 className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        Hiệu suất 5A — Team VN
      </div>
      <p className="mb-3 text-xs text-gray-500">
        Video &amp; traffic nhân theo tỉ lệ bộ lọc Team + nền tảng + kênh.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">TẦNG</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">VIDEO</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">VS TRƯỚC</th>
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">TRAFFIC</th>
              <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">HIỆU QUẢ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tier} className="border-b border-gray-50">
                <td className="py-2">
                  <TierLabel tier={r.tier} colorClass={r.colorClass} />
                </td>
                <td className="text-center font-semibold">{r.videoDisp}</td>
                <td
                  className={`text-center ${r.vs.startsWith("-") ? "text-red-500" : "text-emerald-600"}`}
                >
                  {r.vs}
                </td>
                <td>{r.trafficDisp}</td>
                <td className="text-right font-semibold">{r.eff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
