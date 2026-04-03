import { ListTodo, Search, Activity, Sparkles } from "lucide-react";

export default function TasksLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6 animate-pulse">
      {/* Hero Skeleton (EDS) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-200 p-6 lg:p-8 h-36">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/40 blur-3xl" />
        
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/50 p-3">
              <ListTodo size={26} className="text-slate-300" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-white/40" />
              <div className="h-6 w-48 rounded bg-white/60" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full bg-white/40" />
            <div className="h-8 w-24 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* Stats Skeleton */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-slate-200" />
          <div className="h-3 w-32 rounded bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-sm h-28 hidden-webkit-scrollbar">
              <div className="flex justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-8 w-12 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters Skeleton */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-slate-200" />
          <Sparkles size={14} className="text-slate-300" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/60 p-4 lg:p-5 shadow-sm h-20">
            <div className="h-10 w-full rounded-xl bg-slate-200" />
        </div>
      </section>

      {/* Task List Skeleton */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-5 w-1.5 rounded-full bg-slate-200" />
          <Activity size={14} className="text-slate-300" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/60 bg-white/60 shadow-sm h-40" />
          ))}
        </div>
      </section>
    </div>
  );
}
