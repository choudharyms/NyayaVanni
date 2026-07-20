export default function LawyerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-4xl border bg-white p-6 dark:bg-slate-900">
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex-1">
            <div className="mb-2 h-5 w-40 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="mt-6 h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
  );
}
