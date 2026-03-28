"use client";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm overflow-hidden">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="h-8 w-48 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="h-3 w-full bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm">
      <div className="space-y-4">
        <div className="h-3 w-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="h-10 w-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="h-3 w-16 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export function SkeletonTaskItem() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-5 shadow-sm space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        </div>
        <div className="h-20 w-24 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export function SkeletonActivityCard() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-4 w-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                <div className="h-2 w-1/2 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
