import { BarChart3, Circle } from "lucide-react";

function TierLabel({ tier, colorClass }: { tier: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold ${colorClass}`}>
      <Circle className="h-2.5 w-2.5 shrink-0 fill-current stroke-none" aria-hidden />
      {tier}
    </span>
  );
}

export function LeaderA5TierTable() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-base font-bold">
        <BarChart3 className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        Hiệu suất 5A — Team VN
      </div>
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
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <TierLabel tier="A1" colorClass="text-a1" />
              </td>
              <td className="text-center font-semibold">72</td>
              <td className="text-center text-emerald-600">+8</td>
              <td>680K</td>
              <td className="text-right font-semibold">9,444/v</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <TierLabel tier="A2" colorClass="text-a2" />
              </td>
              <td className="text-center font-semibold">57</td>
              <td className="text-center text-emerald-600">+5</td>
              <td>210K</td>
              <td className="text-right font-semibold">3,684/v</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <TierLabel tier="A3" colorClass="text-a3" />
              </td>
              <td className="text-center font-semibold">37</td>
              <td className="text-center text-red-500">-2</td>
              <td>125K</td>
              <td className="text-right font-semibold">3,378/v</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <TierLabel tier="A4" colorClass="text-a4" />
              </td>
              <td className="text-center font-semibold">26</td>
              <td className="text-center text-emerald-600">+6</td>
              <td>65K</td>
              <td className="text-right font-semibold">2,500/v</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <TierLabel tier="A5" colorClass="text-a5" />
              </td>
              <td className="text-center font-semibold">16</td>
              <td className="text-center text-red-500">-1</td>
              <td>20K</td>
              <td className="text-right font-semibold">1,250/v</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
