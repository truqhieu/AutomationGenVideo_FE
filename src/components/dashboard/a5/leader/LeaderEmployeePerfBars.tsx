import { Users } from "lucide-react";
import { LEADER_PERF_BARS } from "./leader-demo-data";

const BG = ["bg-a1", "bg-a2", "bg-a3", "bg-a4", "bg-a5"] as const;

export function LeaderEmployeePerfBars() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-base font-bold">
        <Users className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        Hiệu suất nhân viên
      </div>
      <div className="space-y-2.5">
        {LEADER_PERF_BARS.map((v) => {
          const t = v.a.reduce((s, x) => s + x, 0);
          const pcts = v.a.map((x) => (t ? Math.round((x / t) * 100) : 0));
          return (
            <div key={v.i} className="flex items-center gap-2 text-sm">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: v.c }}
              >
                {v.i}
              </div>
              <span className="w-20 truncate font-semibold">{v.n}</span>
              <div className="flex h-6 min-w-0 flex-1 overflow-hidden rounded">
                {pcts.map((pct, idx) => (
                  <div
                    key={idx}
                    className={`flex min-w-0 items-center justify-center text-[10px] font-bold leading-none text-white sm:text-xs ${BG[idx]}`}
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 12 ? `A${idx + 1}` : ""}
                  </div>
                ))}
              </div>
              <span
                className={`w-10 text-right font-bold ${v.p < 65 ? "text-red-500" : ""}`}
              >
                {v.p}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-a1" />
          A1
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-a2" />
          A2
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-a3" />
          A3
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-a4" />
          A4
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-a5" />
          A5
        </span>
      </div>
    </div>
  );
}
