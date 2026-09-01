export default function EventoMaterialesLoading() {
  return (
    <main className="mx-auto w-full max-w-[1400px] animate-pulse px-4 py-10">
      <div className="h-4 w-56 rounded bg-muted" />
      <div className="mt-3 h-8 w-64 rounded bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
      </div>
      <div className="mt-6 h-12 w-48 rounded-lg bg-muted" />
      <div className="mt-6 h-64 rounded-xl bg-muted" />
    </main>
  );
}
