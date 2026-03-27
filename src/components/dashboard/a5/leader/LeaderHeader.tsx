"use client";

import { cn } from "@/lib/utils";

interface LeaderHeaderProps {
  tab: number;
  onTabChange: (i: number) => void;
}

export function LeaderHeader({ tab, onTabChange }: LeaderHeaderProps) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white">
          L
        </div>
        <div>
          <div className="text-lg font-bold">LUXE Jewelry Studio</div>
          <div className="text-xs text-gray-500">LEADER · TEAM NỘI DUNG VN</div>
        </div>
      </div>
      <nav className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onTabChange(0)}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-medium",
            tab === 0
              ? "bg-amber-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-50",
          )}
        >
          Tổng quan
        </button>
        <button
          type="button"
          onClick={() => onTabChange(1)}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-medium",
            tab === 1
              ? "bg-amber-500 text-white shadow"
              : "text-gray-500 hover:bg-gray-50",
          )}
        >
          KPI & Mục tiêu
        </button>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs">
          01/03 – 23/03/2026
        </span>
        <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          Leader
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          TB
        </div>
      </div>
    </header>
  );
}
