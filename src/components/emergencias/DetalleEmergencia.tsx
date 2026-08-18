"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { EvidenciaUploader } from "@/components/emergencias/EvidenciaUploader";
import {
  ESTADO_EMERGENCIA_BADGE,
  ESTADO_TRABAJO_LABEL,
  isEstadoEmergencia,
  type EmergenciaListado,
  type RecintoOption,
  type TrabajoMediaItem,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type DetalleEmergenciaProps = {
  emergencia: EmergenciaListado;
  recintos: RecintoOption[];
  mediaAntes: TrabajoMediaItem[];
  mediaDespues: TrabajoMediaItem[];
  puedeEditar: boolean;
};

export function DetalleEmergencia({
  emergencia,
  recintos,
  mediaAntes,
  mediaDespues,
  puedeEditar,
}: DetalleEmergenciaProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Lluvias y temporales</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {emergencia.recinto_codigo ?? emergencia.titulo}
            {emergencia.recinto_nombre ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                — {emergencia.recinto_nombre}
              </span>
            ) : null}
          </h1>
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
              isEstadoEmergencia(emergencia.estado)
                ? ESTADO_EMERGENCIA_BADGE[emergencia.estado]
                : "bg-muted",
            )}
          >
            {isEstadoEmergencia(emergencia.estado)
              ? ESTADO_TRABAJO_LABEL[emergencia.estado]
              : emergencia.estado}
          </span>
        </div>
        {puedeEditar ? (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Editar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Problema</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {emergencia.descripcion || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Plan de acción</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {emergencia.plan_accion || "—"}
          </p>
        </div>
      </div>

      <EvidenciaUploader
        trabajoId={emergencia.id}
        momento="antes"
        titulo="Situación actual (antes)"
        items={mediaAntes}
        puedeEditar={puedeEditar}
      />
      <EvidenciaUploader
        trabajoId={emergencia.id}
        momento="despues"
        titulo="Reparación (después)"
        items={mediaDespues}
        puedeEditar={puedeEditar}
      />

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={emergencia.categoria_id}
        subtipoId={emergencia.subtipo_id}
        recintos={recintos}
        emergencia={emergencia}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
