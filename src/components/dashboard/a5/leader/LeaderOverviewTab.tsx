import { DashboardFilters } from "../shared/DashboardFilters";
import { Funnel5A } from "../shared/Funnel5A";
import { KpiTripleCards } from "../shared/KpiTripleCards";
import { LeaderA5TierTable } from "./LeaderA5TierTable";
import { LeaderDonutTeam } from "./LeaderDonutTeam";
import { LeaderEmployeePerfBars } from "./LeaderEmployeePerfBars";
import { LeaderHeatmap } from "./LeaderHeatmap";
import { LeaderMemberTable } from "./LeaderMemberTable";

export function LeaderOverviewTab() {
  return (
    <div>
      <DashboardFilters accent="amber" showDateRange />
      <KpiTripleCards />
      <Funnel5A variant="leader" />
      <LeaderMemberTable />
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaderDonutTeam />
        <LeaderA5TierTable />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaderHeatmap />
        <LeaderEmployeePerfBars />
      </div>
    </div>
  );
}
