import { DashboardFilters } from "../shared/DashboardFilters";
import { Funnel5A } from "../shared/Funnel5A";
import { GrowthChart5A } from "../shared/GrowthChart5A";
import { KpiTripleCards } from "../shared/KpiTripleCards";
import { AdminDonut5A } from "./AdminDonut5A";
import { AdminPlatformTable } from "./AdminPlatformTable";
import { AdminTeamTable } from "./AdminTeamTable";

export function AdminOverviewTab() {
  return (
    <div>
      <DashboardFilters accent="indigo" showDateRange />
      <KpiTripleCards />
      <Funnel5A variant="admin" />
      <AdminTeamTable />
      <AdminPlatformTable />
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminDonut5A />
        <GrowthChart5A accent="admin" title="Tăng trưởng 5A theo tháng" />
      </div>
    </div>
  );
}
