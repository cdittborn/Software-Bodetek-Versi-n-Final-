export function PaginaEsqueleto({
  filas = 4,
}: {
  filas?: number;
}) {
  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10"
      aria-busy="true"
      aria-label="Cargando"
    >
      <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      <div className="h-36 animate-pulse rounded-xl bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: filas }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

/** Fallback del menú superior: el layout no debe bloquear loading.tsx. */
export function NavEsqueleto() {
  return (
    <header className="border-b border-border bg-card" aria-busy="true" aria-label="Cargando menú">
      <div className="flex h-[60px] w-full items-center gap-8 px-4">
        <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </header>
  );
}

/** Fallback del sidebar de Trabajos: mismo motivo. */
export function SidebarEsqueleto() {
  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-border bg-card"
      aria-busy="true"
      aria-label="Cargando categorías"
    >
      <div className="border-b border-border px-3 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </aside>
  );
}
