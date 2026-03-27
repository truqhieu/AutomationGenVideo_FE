import dynamic from "next/dynamic";

const PageClient = dynamic(() => import("./PageClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  ),
});

export default function Page() {
  return <PageClient />;
}
