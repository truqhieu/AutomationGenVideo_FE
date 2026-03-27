import dynamic from "next/dynamic";

const AdminDashboardPageClient = dynamic(
  () => import("./AdminDashboardPageClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    ),
  },
);

export default function AdminDashboardPage() {
  return <AdminDashboardPageClient />;
}
