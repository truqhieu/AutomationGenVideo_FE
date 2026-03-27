"use client";

import dynamic from "next/dynamic";
import { DashboardFilters } from "../shared/DashboardFilters";
import { ChartBlockSkeleton } from "@/components/dashboard/shared/ChartBlockSkeleton";
import { Funnel5A } from "../shared/Funnel5A";
import { KpiTripleCards } from "../shared/KpiTripleCards";
import { PLATFORM_OPTIONS } from "./admin-platform-channel-data";
import { TEAM_REGION_OPTIONS } from "./admin-team-perf-data";
import { useAdminOverviewFilters } from "./AdminOverviewFiltersContext";

const AdminDonut5A = dynamic(
  () => import("./AdminDonut5A").then((m) => m.AdminDonut5A),
  { ssr: false, loading: () => <ChartBlockSkeleton className="min-h-[300px]" /> },
);

const AdminGrowthBars5AMonthly = dynamic(
  () => import("./AdminGrowthBars5AMonthly").then((m) => m.AdminGrowthBars5AMonthly),
  { ssr: false, loading: () => <ChartBlockSkeleton className="min-h-[360px]" /> },
);
import { AdminPlatformTable } from "./AdminPlatformTable";
import { AdminTeamTable } from "./AdminTeamTable";

export function AdminOverviewTab() {
  const f = useAdminOverviewFilters();

  return (
    <div>
      <DashboardFilters
        accent="indigo"
        showDateRange
        adminTeamRegion={{
          teamRegionId: f.teamRegionId,
          onTeamRegionIdChange: f.setTeamRegionId,
          options: TEAM_REGION_OPTIONS,
        }}
        adminPlatformChannel={{
          platformId: f.platformId,
          onPlatformIdChange: f.setPlatformId,
          channelKey: f.channelKey,
          onChannelKeyChange: f.setChannelKey,
          platformOptions: PLATFORM_OPTIONS,
          channelOptions: f.channelSelectOptions,
        }}
      />
      <KpiTripleCards
        trafficLabel={f.kpiTrafficLabel}
        trafficVsPrevPct={f.kpiVsPrevPct}
        revenueLabel={f.kpiRevenueLabel}
        revenueVsPrevPct={f.kpiVsPrevPct}
        videoTotal={f.totalVideoFiltered}
        newVideosEst={f.kpiNewVideosEst}
      />
      <Funnel5A variant="admin" stepValues={f.funnelViewLabels} />
      <AdminTeamTable />
      <AdminPlatformTable />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <AdminDonut5A slices={f.donutSlices} centerTotal={f.totalVideoFiltered} />
        <AdminGrowthBars5AMonthly
          scaleFactor={f.growthChartScaleFactor}
          filterSummary={f.growthFilterSummary}
        />
      </div>
    </div>
  );
}
