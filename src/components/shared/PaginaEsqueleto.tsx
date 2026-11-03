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

/** Fallback del menú lateral: el layout no debe bloquear loading.tsx. */
export function MenuEsqueleto() {
  return (
    <aside
      className="flex flex-col border-line bg-menu max-[759px]:border-b min-[760px]:sticky min-[760px]:top-0 min-[760px]:h-svh min-[760px]:w-[260px] min-[760px]:shrink-0 min-[760px]:border-r"
      aria-busy="true"
      aria-label="Cargando menú"
    >
      <div className="flex h-14 items-center gap-2.5 bg-white px-4 min-[760px]:bg-transparent">
        <span aria-hidden className="size-7 shrink-0 rounded-[7px] bg-[#c8102e]" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="hidden space-y-2 px-3 py-2 min-[760px]:block">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-7 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </aside>
  );
}
