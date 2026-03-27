import dynamic from "next/dynamic";

const ManagerDashboardPageClient = dynamic(
  () => import("./ManagerDashboardPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Đang tải dashboard...</p>
        </div>
      </div>
    ),
  },
);

export default function ManagerDashboardPage() {
  return <ManagerDashboardPageClient />;
}
