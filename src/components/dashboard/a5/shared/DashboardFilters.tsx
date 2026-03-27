"use client";

import { CalendarDays, CalendarRange, Filter } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { PlatformId } from "../admin/admin-platform-channel-data";
import type { AdminTeamRegionId } from "../admin/admin-team-perf-data";

type Accent = "indigo" | "amber";

/** Lọc team khu vực (tab Tổng quan admin) */
export interface AdminTeamRegionFilters {
  teamRegionId: AdminTeamRegionId | "all";
  onTeamRegionIdChange: (v: AdminTeamRegionId | "all") => void;
  options: { id: AdminTeamRegionId | "all"; label: string }[];
}

/** Lọc nền tảng + kênh chi tiết (tab Tổng quan admin) */
export interface AdminPlatformChannelFilters {
  platformId: PlatformId | "all";
  onPlatformIdChange: (v: PlatformId | "all") => void;
  channelKey: string | "all";
  onChannelKeyChange: (v: string | "all") => void;
  platformOptions: { id: PlatformId | "all"; label: string }[];
  channelOptions: { value: string; label: string }[];
}

export interface DashboardDateRange {
  from: string;
  to: string;
}

export interface DashboardMonthPicker {
  value: string;
  onChange: (month: string) => void;
}

interface DashboardFiltersProps {
  accent?: Accent;
  className?: string;
  /** Hiển thị lọc từ ngày — đến ngày (ví dụ tab tổng quan) */
  showDateRange?: boolean;
  /** Giá trị ban đầu `YYYY-MM-DD` */
  defaultDateFrom?: string;
  defaultDateTo?: string;
  onDateRangeChange?: (range: DashboardDateRange) => void;
  /** Tab KPI admin: chọn tháng `YYYY-MM` */
  monthPicker?: DashboardMonthPicker;
  adminTeamRegion?: AdminTeamRegionFilters;
  adminPlatformChannel?: AdminPlatformChannelFilters;
  /**
   * Khi không truyền `adminPlatformChannel`: `true` = hiện dropdown mock (Leader);
   * `false` = ẩn hẳn lọc nền tảng/kênh (ví dụ tab KPI admin).
   */
  showPlatformChannelFallback?: boolean;
}

const focusRing: Record<Accent, string> = {
  indigo: "focus:border-indigo-400",
  amber: "focus:border-amber-400",
};

const inputBase =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none";

export function DashboardFilters({
  accent = "indigo",
  className,
  showDateRange = false,
  defaultDateFrom = "2026-03-01",
  defaultDateTo = "2026-03-23",
  onDateRangeChange,
  monthPicker,
  adminTeamRegion,
  adminPlatformChannel,
  showPlatformChannelFallback = true,
}: DashboardFiltersProps) {
  const fr = focusRing[accent];
  const [from, setFrom] = useState(defaultDateFrom);
  const [to, setTo] = useState(defaultDateTo);

  const emitRange = useCallback(
    (nextFrom: string, nextTo: string) => {
      onDateRangeChange?.({ from: nextFrom, to: nextTo });
    },
    [onDateRangeChange],
  );

  const onFromChange = (v: string) => {
    setFrom(v);
    const end = v > to ? v : to;
    if (v > to) setTo(v);
    emitRange(v, end);
  };

  const onToChange = (v: string) => {
    const start = v < from ? v : from;
    if (v < from) setFrom(v);
    setTo(v);
    emitRange(start, v);
  };

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-3", className)}>
      <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        Lọc:
      </span>
      {adminTeamRegion ? (
        <select
          value={adminTeamRegion.teamRegionId}
          onChange={(e) =>
            adminTeamRegion.onTeamRegionIdChange(e.target.value as AdminTeamRegionId | "all")
          }
          className={cn("cursor-pointer", inputBase, fr)}
          aria-label="Lọc team"
        >
          {adminTeamRegion.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <select className={cn("cursor-pointer", inputBase, fr)}>
          <option>Tất cả Team</option>
          <option>Nội dung VN</option>
          <option>Toàn cầu</option>
        </select>
      )}
      {adminPlatformChannel ? (
        <>
          <select
            value={adminPlatformChannel.platformId}
            onChange={(e) =>
              adminPlatformChannel.onPlatformIdChange(e.target.value as PlatformId | "all")
            }
            className={cn("cursor-pointer", inputBase, fr)}
            aria-label="Lọc nền tảng"
          >
            {adminPlatformChannel.platformOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={adminPlatformChannel.channelKey}
            onChange={(e) =>
              adminPlatformChannel.onChannelKeyChange(
                e.target.value === "all" ? "all" : e.target.value,
              )
            }
            className={cn("cursor-pointer", inputBase, fr)}
            aria-label="Lọc kênh trong nền tảng"
          >
            {adminPlatformChannel.channelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      ) : showPlatformChannelFallback ? (
        <select className={cn("cursor-pointer", inputBase, fr)}>
          <option>Tất cả nền tảng</option>
          <option>Facebook</option>
          <option>TikTok</option>
          <option>Instagram</option>
          <option>YouTube</option>
          <option>Khác (Zalo, Twitter...)</option>
        </select>
      ) : null}

      {monthPicker ? (
        <>
          <span
            className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 sm:block"
            aria-hidden
          />
          <label className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              Tháng
            </span>
            <input
              type="month"
              value={monthPicker.value}
              onChange={(e) => monthPicker.onChange(e.target.value)}
              className={cn(inputBase, fr)}
            />
          </label>
        </>
      ) : null}

      {showDateRange ? (
        <>
          <span
            className="mx-1 hidden h-6 w-px shrink-0 bg-gray-200 sm:block"
            aria-hidden
          />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <CalendarRange className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              Thời gian
            </span>
            <label className="flex items-center gap-1.5">
              <span className="whitespace-nowrap text-xs text-gray-500 sm:text-sm">Từ</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => onFromChange(e.target.value)}
                className={cn(inputBase, fr)}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="whitespace-nowrap text-xs text-gray-500 sm:text-sm">Đến</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => onToChange(e.target.value)}
                className={cn(inputBase, fr)}
              />
            </label>
          </div>
        </>
      ) : null}
    </div>
  );
}
