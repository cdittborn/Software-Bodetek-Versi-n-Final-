import Link from "next/link";
import type { ListaFaltantesInforme } from "@/lib/informe-seguro/faltantes";
import { trabajoHref } from "@/lib/trabajos";

type AlertaFaltantesInformeProps = {
  faltantes: ListaFaltantesInforme;
  categoriaId: string;
  subtipoId: string;
};

function Lista({
  titulo,
  items,
  categoriaId,
  subtipoId,
}: {
  titulo: string;
  items: ListaFaltantesInforme["sinEjecutor"];
  categoriaId: string;
  subtipoId: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-auto text-sm">
        {items.map((item) => (
          <li key={`${item.trabajoId}:${item.tipo}`}>
            <Link
              href={trabajoHref(categoriaId, subtipoId, item.trabajoId)}
              className="underline decoration-red-300 underline-offset-2"
            >
              {item.recinto} · {item.codigo} · {item.tipoLabel}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AlertaFaltantesInforme({
  faltantes,
  categoriaId,
  subtipoId,
}: AlertaFaltantesInformeProps) {
  if (faltantes.total === 0) return null;
  const partes = [
    faltantes.sinEjecutor.length > 0
      ? `${faltantes.sinEjecutor.length} subproyecto${faltantes.sinEjecutor.length === 1 ? "" : "s"} sin ejecutor definido`
      : null,
    faltantes.sinHoras.length > 0
      ? `${faltantes.sinHoras.length} subproyecto${faltantes.sinHoras.length === 1 ? "" : "s"} de Maestros Bodetek sin horas`
      : null,
  ].filter(Boolean);

  return (
    <section className="rounded-xl border border-[#c8102e] bg-red-50 px-4 py-4 text-[#a4131f]">
      <p className="text-base font-semibold">{partes.join(" · ")}</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <Lista
          titulo="Sin ejecutor definido"
          items={faltantes.sinEjecutor}
          categoriaId={categoriaId}
          subtipoId={subtipoId}
        />
        <Lista
          titulo="Maestros Bodetek sin horas"
          items={faltantes.sinHoras}
          categoriaId={categoriaId}
          subtipoId={subtipoId}
        />
      </div>
    </section>
  );
}
