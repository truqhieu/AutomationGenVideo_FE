import { BarChart3, Globe, MapPin } from "lucide-react";
import { SectionHeading } from "../shared/SectionHeading";

export function AdminTeamTable() {
  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <SectionHeading icon={BarChart3} className="mb-3">
        Hiệu suất theo Team
      </SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">TEAM</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">SỐ NGƯỜI</th>
              <th className="pb-2 text-center text-xs font-bold text-a1">A1</th>
              <th className="pb-2 text-center text-xs font-bold text-a2">A2</th>
              <th className="pb-2 text-center text-xs font-bold text-a3">A3</th>
              <th className="pb-2 text-center text-xs font-bold text-a4">A4</th>
              <th className="pb-2 text-center text-xs font-bold text-a5">A5</th>
              <th className="pb-2 text-center text-xs font-bold text-gray-700">TỔNG</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">TRAFFIC</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">TIẾN ĐỘ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-3 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  Nội dung VN
                </span>
              </td>
              <td className="text-center">5</td>
              <td className="text-center font-semibold text-a1">72</td>
              <td className="text-center">57</td>
              <td className="text-center">37</td>
              <td className="text-center">26</td>
              <td className="text-center">16</td>
              <td className="text-center font-bold">208</td>
              <td className="text-center">1.1M</td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[75%] rounded-full bg-blue-500" />
                  </div>
                  75%
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-3 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  Toàn cầu
                </span>
              </td>
              <td className="text-center">3</td>
              <td className="text-center font-semibold text-a1">37</td>
              <td className="text-center">30</td>
              <td className="text-center">20</td>
              <td className="text-center">14</td>
              <td className="text-center">8</td>
              <td className="text-center font-bold">109</td>
              <td className="text-center">750K</td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[70%] rounded-full bg-amber-400" />
                  </div>
                  70%
                </div>
              </td>
            </tr>
            <tr className="bg-blue-50 font-bold">
              <td className="py-2.5">TỔNG</td>
              <td className="text-center">8</td>
              <td className="text-center text-a1">109</td>
              <td className="text-center text-a2">87</td>
              <td className="text-center text-a3">57</td>
              <td className="text-center text-a4">40</td>
              <td className="text-center text-a5">24</td>
              <td className="text-center">317</td>
              <td className="text-center">1.85M</td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[73%] rounded-full bg-emerald-500" />
                  </div>
                  73%
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
