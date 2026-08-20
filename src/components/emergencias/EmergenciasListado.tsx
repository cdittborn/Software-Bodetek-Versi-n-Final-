"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
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
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  eventoDashboardHref,
  formatFechaCl,
  isEstadoLluvias,
  isGravedadLluvias,
  subtipoHref,
  type EmergenciaListado,
  type RecintoOption,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EmergenciasListadoProps = {
  emergencias: EmergenciaListado[];
  recintos: RecintoOption[];
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  puedeEditar: boolean;
};

export function EmergenciasListado({
  emergencias,
  recintos,
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  puedeEditar,
}: EmergenciasListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = subtipoHref(categoriaId, subtipoId);
  const dashboardHref = eventoDashboardHref(categoriaId, subtipoId, eventoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={base} className="hover:underline">
              Lluvias y temporales
            </Link>
            {" / Eventos"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{eventoNombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {emergencias.length} filtración-proyecto
            {emergencias.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href={dashboardHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 w-full justify-center sm:w-auto",
            )}
          >
            Dashboard de avance
          </Link>
          {puedeEditar ? (
            <Button
              type="button"
              className="h-10 w-full sm:w-auto"
              onClick={() => setOpen(true)}
            >
              Filtración-Proyecto
            </Button>
          ) : null}
        </div>
      </div>

      {emergencias.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay proyectos registrados todavía
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {emergencias.map((e) => (
              <li key={e.id}>
                <Link
                  href={`${base}/${e.id}`}
                  className="block rounded-xl border border-border bg-card p-4 active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {e.recinto_codigo ?? "Sin recinto"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {e.recinto_arrendatario?.trim() || "Sin arrendatario"}
                      </p>
                    </div>
                    {e.gravedad && isGravedadLluvias(e.gravedad) ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                          GRAVEDAD_LLUVIAS_BADGE[e.gravedad],
                        )}
                      >
                        {GRAVEDAD_LLUVIAS_LABEL[e.gravedad]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ESTADO_TRABAJO_LABEL[e.estado] ?? e.estado}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatFechaCl(e.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recinto</TableHead>
                  <TableHead>Arrendatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencias.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        href={`${base}/${e.id}`}
                        className="font-medium hover:underline"
                      >
                        {e.recinto_codigo ?? "Sin recinto"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {e.recinto_arrendatario?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          isEstadoLluvias(e.estado)
                            ? ESTADO_LLUVIAS_BADGE[e.estado]
                            : "bg-muted",
                        )}
                      >
                        {ESTADO_TRABAJO_LABEL[e.estado] ?? e.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.gravedad && isGravedadLluvias(e.gravedad) ? (
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                            GRAVEDAD_LLUVIAS_BADGE[e.gravedad],
                          )}
                        >
                          {GRAVEDAD_LLUVIAS_LABEL[e.gravedad]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFechaCl(e.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        recintos={recintos}
        onSuccess={(id) => {
          if (id) router.push(`${base}/${id}`);
          else router.refresh();
        }}
      />
    </div>
  );
}
