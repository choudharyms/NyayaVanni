export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-800"></div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="mt-6 h-40 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
    </div>
  );
}
