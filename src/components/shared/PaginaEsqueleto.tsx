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
