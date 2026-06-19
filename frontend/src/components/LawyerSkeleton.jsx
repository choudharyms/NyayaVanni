export default function LawyerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-4xl border p-6 bg-white dark:bg-slate-900">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex-1">
            <div className="w-40 h-5 mb-2 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-28 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="w-full h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-3/4 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="w-1/2 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="w-full h-12 mt-6 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </div>
  );
}
