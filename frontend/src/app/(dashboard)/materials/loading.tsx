export default function LoadingMaterialsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-2xl border border-blue-200/40 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-2xl shadow-blue-900/30">
        <div className="h-4 w-40 animate-pulse rounded bg-white/25" />
        <div className="mt-4 h-8 w-72 animate-pulse rounded bg-white/30" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-white/20" />
        <div className="mt-2 h-4 w-2/3 max-w-lg animate-pulse rounded bg-white/20" />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm"
          >
            <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-8 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
