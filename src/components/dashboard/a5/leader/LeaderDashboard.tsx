"use client";

import { useState } from "react";
import { AdminOverviewFiltersProvider } from "../admin/AdminOverviewFiltersContext";
import { LeaderHeader } from "./LeaderHeader";
import { LeaderKpiTab } from "./LeaderKpiTab";
import { LeaderOverviewTab } from "./LeaderOverviewTab";
import { LeaderVideoReview } from "./LeaderVideoReview";

export function LeaderDashboard() {
  const [tab, setTab] = useState(0);

  return (
    <AdminOverviewFiltersProvider>
      <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-none flex-col pb-10 text-sm text-gray-900 antialiased">
        <LeaderHeader tab={tab} onTabChange={setTab} />
        {tab === 0 ? (
          <LeaderOverviewTab />
        ) : tab === 1 ? (
          <LeaderKpiTab />
        ) : (
          <LeaderVideoReview />
        )}
      </div>
    </AdminOverviewFiltersProvider>
  );
}
