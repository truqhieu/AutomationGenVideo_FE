import type { LucideIcon } from "lucide-react";
import { Facebook, Instagram, MoreHorizontal, Music2, Smartphone, TrendingDown, TrendingUp, Youtube } from "lucide-react";
import { SectionHeading } from "../shared/SectionHeading";

function PlatformName({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-gray-600" aria-hidden />
      {children}
    </span>
  );
}

export function AdminPlatformTable() {
  return (
    <div className="mb-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <SectionHeading icon={Smartphone} className="mb-3">
        Hiệu suất theo Nền tảng
      </SectionHeading>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">NỀN TẢNG</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">VIDEO</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">TRAFFIC</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">%</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">VS TRƯỚC</th>
              <th className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">TOP 5A</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-2.5 font-semibold">
                <PlatformName icon={Facebook}>Facebook</PlatformName>
              </td>
              <td className="text-center">210</td>
              <td className="text-center font-semibold">520K</td>
              <td className="text-center">28%</td>
              <td className="text-center text-emerald-600">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  15%
                </span>
              </td>
              <td className="text-center">
                <span className="font-semibold text-a1">A1</span> (45%)
              </td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2.5 font-semibold">
                <PlatformName icon={Music2}>TikTok</PlatformName>
              </td>
              <td className="text-center">285</td>
              <td className="text-center font-semibold">680K</td>
              <td className="text-center">37%</td>
              <td className="text-center text-emerald-600">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  32%
                </span>
              </td>
              <td className="text-center">
                <span className="font-semibold text-a1">A1</span> (52%)
              </td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2.5 font-semibold">
                <PlatformName icon={Instagram}>Instagram</PlatformName>
              </td>
              <td className="text-center">145</td>
              <td className="text-center font-semibold">320K</td>
              <td className="text-center">17%</td>
              <td className="text-center text-emerald-600">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  8%
                </span>
              </td>
              <td className="text-center">
                <span className="font-semibold text-a2">A2</span> (38%)
              </td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2.5 font-semibold">
                <PlatformName icon={Youtube}>YouTube</PlatformName>
              </td>
              <td className="text-center">75</td>
              <td className="text-center font-semibold">230K</td>
              <td className="text-center">12%</td>
              <td className="text-center text-emerald-600">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  5%
                </span>
              </td>
              <td className="text-center">
                <span className="font-semibold text-a2">A2</span> (42%)
              </td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2.5 text-gray-400">
                <span className="inline-flex items-center gap-2 font-semibold text-gray-500">
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                  Khác
                </span>
              </td>
              <td className="text-center">40</td>
              <td className="text-center">100K</td>
              <td className="text-center">6%</td>
              <td className="text-center text-red-500">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  3%
                </span>
              </td>
              <td className="text-center">
                <span className="text-a1">A1</span>
              </td>
            </tr>
            <tr className="bg-blue-50 font-bold">
              <td className="py-2.5">TỔNG</td>
              <td className="text-center">755</td>
              <td className="text-center">1.85M</td>
              <td className="text-center">100%</td>
              <td className="text-center text-emerald-600">
                <span className="inline-flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  22%
                </span>
              </td>
              <td className="text-center" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
