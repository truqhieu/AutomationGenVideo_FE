import dynamic from "next/dynamic";

const LeaderDashboardPageClient = dynamic(
  () => import("./LeaderDashboardPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    ),
  },
);

export default function LeaderDashboardPage() {
  return <LeaderDashboardPageClient />;
}
