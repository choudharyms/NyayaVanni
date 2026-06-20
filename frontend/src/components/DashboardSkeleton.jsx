export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 animate-pulse bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="w-64 h-10 mb-6 rounded-lg bg-slate-200 dark:bg-slate-800"></div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="h-40 mt-6 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>

        <div className="grid gap-6 mt-6 md:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
    </div>
  );
}
