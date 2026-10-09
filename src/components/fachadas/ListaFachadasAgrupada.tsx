"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { ChipEstadoFachada } from "@/components/fachadas/ChipEstadoFachada";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import { Input } from "@/components/ui/input";
import type { GrupoUnidadFachadas } from "@/lib/fachadas/dashboard";
import { formatDiaMesCorto } from "@/lib/fachadas/ui";
import { formatMontoClp } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

const GRUPOS_INICIALES = 6;

export function ListaFachadasAgrupada({
  grupos,
  hrefFachada,
}: {
  grupos: GrupoUnidadFachadas[];
  hrefFachada: (id: string) => string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [segmento, setSegmento] = useState<"todas" | "exterior" | "interior">("todas");
  const [expandida, setExpandida] = useState(false);

  const conteos = useMemo(() => {
    let exteriores = 0;
    let interiores = 0;
    let total = 0;
    for (const grupo of grupos) {
      for (const fila of grupo.filas) {
        total += 1;
        if (fila.ubicacion === "exterior") exteriores += 1;
        if (fila.ubicacion === "interior") interiores += 1;
      }
    }
    return { total, exteriores, interiores };
  }, [grupos]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return grupos
      .map((grupo) => ({
        ...grupo,
        filas: grupo.filas.filter((fila) => {
          if (segmento === "exterior" && fila.ubicacion !== "exterior") return false;
          if (segmento === "interior" && fila.ubicacion !== "interior") return false;
          if (!texto) return true;
          return [fila.nombre, fila.unidadLabel, fila.hacia ?? "", fila.sitio ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(texto);
        }),
      }))
      .filter((grupo) => grupo.filas.length > 0);
  }, [grupos, busqueda, segmento]);

  const totalVisible = visibles.reduce((total, grupo) => total + grupo.filas.length, 0);
  const gruposMovil = expandida ? visibles : visibles.slice(0, GRUPOS_INICIALES);
  const ocultos = totalVisible - gruposMovil.reduce((total, grupo) => total + grupo.filas.length, 0);

  return (
    <section className="fd-dash-lista fd-card min-w-0 overflow-hidden" data-seccion="lista">
      <div className="flex flex-col gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold">Todas las fachadas</h2>
        <Input
          value={busqueda}
          onChange={(evento) => {
            setBusqueda(evento.target.value);
            setExpandida(false);
          }}
          placeholder="Buscar fachada"
          aria-label="Buscar fachada"
          className="w-full rounded-lg md:max-w-xs"
          style={{ height: 44, minHeight: 44, fontSize: 16 }}
        />
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#eceae7] p-1">
          {(
            [
              ["todas", "Todas", conteos.total],
              ["exterior", "Exteriores", conteos.exteriores],
              ["interior", "Interiores", conteos.interiores],
            ] as const
          ).map(([id, etiqueta, cantidad]) => (
            <button
              key={id}
              type="button"
              aria-pressed={segmento === id}
              onClick={() => {
                setSegmento(id);
                setExpandida(false);
              }}
              className={cn(
                "min-h-11 rounded-md px-1 text-sm font-medium",
                segmento === id ? "bg-white shadow-sm" : "text-muted-foreground",
              )}
            >
              {etiqueta} · {cantidad}
            </button>
          ))}
        </div>
      </div>

      <div data-tarjetas-fachadas className="md:hidden">
        {visibles.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No hay fachadas para mostrar.
          </p>
        ) : (
          gruposMovil.map((grupo) => (
            <article key={grupo.unidadLabel} className="border-t">
              <header className="px-4 py-2">
                <p className="text-sm font-semibold">{grupo.unidadLabel}</p>
                {grupo.sitio ? <p className="text-xs text-muted-foreground">{grupo.sitio}</p> : null}
              </header>
              <ul>
                {grupo.filas.map((fila) => (
                  <li key={fila.id}>
                    <Link
                      href={hrefFachada(fila.id)}
                      data-fila-fachada={fila.id}
                      className="flex min-h-11 items-center gap-2 border-t px-4 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{fila.nombre}</span>
                          <BadgeUbicacion ubicacion={fila.ubicacion} />
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {fila.hacia ? `Hacia ${fila.hacia}` : "Hacia —"}
                            {" · "}
                            <EtiquetaM2 m2={fila.m2} />
                          </span>
                          <ChipEstadoFachada estado={fila.estado} />
                        </span>
                      </span>
                      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
        {ocultos > 0 ? (
          <button
            type="button"
            className="min-h-11 w-full border-t text-sm font-semibold"
            onClick={() => setExpandida(true)}
          >
            Ver las {totalVisible} fachadas
          </button>
        ) : null}
      </div>

      <div data-tabla-fachadas className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr className="border-y">
              <th className="px-4 py-2 font-medium">Local/unidad</th>
              <th className="px-2 py-2 font-medium">Fachada</th>
              <th className="px-2 py-2 font-medium">Tipo</th>
              <th className="px-2 py-2 font-medium">Hacia</th>
              <th className="px-2 py-2 font-medium">m²</th>
              <th className="px-2 py-2 font-medium">Estado</th>
              <th className="px-2 py-2 font-medium">Última intervención</th>
              <th className="px-4 py-2 font-medium">Costo neto</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No hay fachadas para mostrar.
                </td>
              </tr>
            ) : (
              visibles.flatMap((grupo) =>
                grupo.filas.map((fila, indice) => (
                  <tr key={fila.id} className="border-b last:border-0">
                    {indice === 0 ? (
                      <td className="px-4 py-3 align-top" rowSpan={grupo.filas.length}>
                        <span className="block font-medium">{grupo.unidadLabel}</span>
                        {grupo.sitio ? (
                          <span className="block text-xs text-muted-foreground">{grupo.sitio}</span>
                        ) : null}
                      </td>
                    ) : null}
                    <td className="px-2 py-3">
                      <Link href={hrefFachada(fila.id)} className="font-medium hover:underline">
                        {fila.nombre}
                      </Link>
                    </td>
                    <td className="px-2 py-3">
                      <BadgeUbicacion ubicacion={fila.ubicacion} />
                    </td>
                    <td className="px-2 py-3">{fila.hacia ?? "—"}</td>
                    <td className="px-2 py-3">
                      <EtiquetaM2 m2={fila.m2} conUnidad={false} />
                    </td>
                    <td className="px-2 py-3">
                      <ChipEstadoFachada estado={fila.estado} />
                    </td>
                    <td className="px-2 py-3">{formatDiaMesCorto(fila.ultimaIso)}</td>
                    <td className="px-4 py-3">
                      {fila.costoNeto == null ? "—" : formatMontoClp(fila.costoNeto)}
                    </td>
                  </tr>
                )),
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BadgeUbicacion({ ubicacion }: { ubicacion: "interior" | "exterior" | null }) {
  const exterior = ubicacion === "exterior";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        exterior ? "bg-neutral-900 text-white" : "border border-neutral-900 bg-white text-neutral-900",
      )}
    >
      {exterior ? "Exterior" : "Interior"}
    </span>
  );
}
