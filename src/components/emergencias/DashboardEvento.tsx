"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  GRAVEDADES_LLUVIAS,
  eventoHref,
  isEstadoLluvias,
  isGravedadLluvias,
  subtipoHref,
  trabajoHref,
  type EmergenciaListado,
  type EstadoLluvias,
  type GravedadLluvias,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

export type DashboardEventoStats = {
  total: number;
  porEstado: Record<EstadoLluvias, number>;
  conPlanAccion: number;
  conCotizacion: number;
  porGravedad: Record<GravedadLluvias, number>;
  criticos: EmergenciaListado[];
};

type DashboardEventoProps = {
  eventoNombre: string;
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  stats: DashboardEventoStats;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function DashboardEvento({
  eventoNombre,
  categoriaId,
  subtipoId,
  eventoId,
  stats,
}: DashboardEventoProps) {
  const eventoBase = eventoHref(categoriaId, subtipoId, eventoId);
  const listadoBase = subtipoHref(categoriaId, subtipoId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={listadoBase} className="hover:underline">
            Lluvias y temporales
          </Link>
          {" / "}
          <Link href={eventoBase} className="hover:underline">
            {eventoNombre}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard de avance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{eventoNombre}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total proyectos" value={stats.total} />
        <StatCard label="Con plan de acción" value={stats.conPlanAccion} />
        <StatCard label="Con cotización" value={stats.conCotizacion} />
        <StatCard
          label="Críticos"
          value={stats.porGravedad.critico}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Por estado</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ESTADOS_LLUVIAS.map((estado) => (
            <li
              key={estado}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  ESTADO_LLUVIAS_BADGE[estado],
                )}
              >
                {ESTADO_TRABAJO_LABEL[estado]}
              </span>
              <span className="text-sm font-semibold">
                {stats.porEstado[estado]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Por gravedad</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {GRAVEDADES_LLUVIAS.map((g) => (
            <li
              key={g}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  GRAVEDAD_LLUVIAS_BADGE[g],
                )}
              >
                {GRAVEDAD_LLUVIAS_LABEL[g]}
              </span>
              <span className="text-sm font-semibold">
                {stats.porGravedad[g]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Proyectos críticos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo gravedad crítica, con su estado actual.
        </p>

        {stats.criticos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No hay proyectos críticos
          </p>
        ) : (
          <>
            <ul className="mt-4 flex flex-col gap-2 md:hidden">
              {stats.criticos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={trabajoHref(categoriaId, subtipoId, p.id)}
                    className="block rounded-lg border border-border p-3"
                  >
                      <p className="font-medium">
                      {p.recinto_codigo ?? p.titulo}
                    </p>
                    {p.recinto_arrendatario?.trim() ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {p.recinto_arrendatario}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isEstadoLluvias(p.estado)
                        ? ESTADO_TRABAJO_LABEL[p.estado]
                        : p.estado}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recinto</TableHead>
                    <TableHead>Arrendatario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Gravedad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.criticos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={trabajoHref(categoriaId, subtipoId, p.id)}
                          className="font-medium hover:underline"
                        >
                          {p.recinto_codigo ?? p.titulo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.recinto_arrendatario?.trim() || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            isEstadoLluvias(p.estado)
                              ? ESTADO_LLUVIAS_BADGE[p.estado]
                              : "bg-muted",
                          )}
                        >
                          {ESTADO_TRABAJO_LABEL[p.estado] ?? p.estado}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.gravedad && isGravedadLluvias(p.gravedad) ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              GRAVEDAD_LLUVIAS_BADGE[p.gravedad],
                            )}
                          >
                            {GRAVEDAD_LLUVIAS_LABEL[p.gravedad]}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
