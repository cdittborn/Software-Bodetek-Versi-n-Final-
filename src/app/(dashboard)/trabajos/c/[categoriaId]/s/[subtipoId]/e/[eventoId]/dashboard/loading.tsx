export default function EventoDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-[1400px] animate-pulse px-4 py-10">
      <div className="h-4 w-56 rounded bg-muted" />
      <div className="mt-3 h-8 w-64 rounded bg-muted" />
      <div className="mt-2 h-4 w-48 rounded bg-muted" />
      <div className="mt-8 grid gap-3 md:grid-cols-[1.1fr_1fr_1fr_1fr]">
        <div className="h-44 rounded-xl bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
        <div className="h-44 rounded-xl bg-muted" />
      </div>
      <div className="mt-8 h-6 w-40 rounded bg-muted" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
      </div>
      <div className="mt-8 h-6 w-48 rounded bg-muted" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
        <div className="h-36 rounded-xl bg-muted" />
      </div>
      <div className="mt-8 h-64 rounded-xl bg-muted" />
    </main>
  );
}
