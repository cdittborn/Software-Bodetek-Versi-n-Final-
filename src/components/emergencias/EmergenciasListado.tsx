"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import {
  ESTADO_EMERGENCIA_BADGE,
  ESTADO_TRABAJO_LABEL,
  isEstadoEmergencia,
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
  puedeEditar: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function badgeClass(estado: string) {
  if (isEstadoEmergencia(estado)) return ESTADO_EMERGENCIA_BADGE[estado];
  return "bg-muted text-muted-foreground";
}

export function EmergenciasListado({
  emergencias,
  recintos,
  categoriaId,
  subtipoId,
  puedeEditar,
}: EmergenciasListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = subtipoHref(categoriaId, subtipoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lluvias y temporales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Techumbres y canales — bodegas afectadas
          </p>
        </div>
        {puedeEditar ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Filtración-Proyecto
          </Button>
        ) : null}
      </div>

      {emergencias.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay proyectos registrados todavía
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {emergencias.map((e) => (
            <Link
              key={e.id}
              href={`${base}/${e.id}`}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {e.recinto_codigo ?? "Sin recinto"}
                    {e.recinto_nombre ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        — {e.recinto_nombre}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {e.descripcion ?? "Sin descripción"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    badgeClass(e.estado),
                  )}
                >
                  {isEstadoEmergencia(e.estado)
                    ? ESTADO_TRABAJO_LABEL[e.estado]
                    : e.estado}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDate(e.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        recintos={recintos}
        onSuccess={(id) => {
          if (id) router.push(`${base}/${id}`);
          else router.refresh();
        }}
      />
    </div>
  );
}
