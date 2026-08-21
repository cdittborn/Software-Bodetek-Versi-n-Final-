"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { EvidenciaUploader } from "@/components/emergencias/EvidenciaUploader";
import { AdjuntosUploader } from "@/components/patentes/AdjuntosUploader";
import {
  EJECUTADO_POR_LABEL,
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  formatFechaCl,
  formatMontoClp,
  isEstadoLluvias,
  isGravedadLluvias,
  subtipoHref,
  type EmergenciaListado,
  type EstadoLluvias,
  type EjecutadoPor,
  type RecintoOption,
  type TrabajoMediaItem,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type DetalleEmergenciaProps = {
  emergencia: EmergenciaListado;
  recintos: RecintoOption[];
  mediaAntes: TrabajoMediaItem[];
  mediaDespues: TrabajoMediaItem[];
  planosFiltraciones: TrabajoMediaItem[];
  cotizaciones: TrabajoMediaItem[];
  puedeEditar: boolean;
};

export function DetalleEmergencia({
  emergencia,
  recintos,
  mediaAntes,
  mediaDespues,
  planosFiltraciones,
  cotizaciones,
  puedeEditar,
}: DetalleEmergenciaProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [estadoBusy, setEstadoBusy] = useState(false);
  const [estadoError, setEstadoError] = useState<string | null>(null);
  const back = emergencia.evento_id
    ? `${subtipoHref(emergencia.categoria_id, emergencia.subtipo_id)}/e/${emergencia.evento_id}`
    : subtipoHref(emergencia.categoria_id, emergencia.subtipo_id);

  async function cambiarEstado(estado: EstadoLluvias) {
    setEstadoBusy(true);
    setEstadoError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("trabajos")
      .update({ estado, updated_at: new Date().toISOString() })
      .eq("id", emergencia.id);
    setEstadoBusy(false);
    if (error) {
      setEstadoError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            <Link href={back} className="hover:underline">
              Lluvias y temporales
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {emergencia.recinto_codigo ?? emergencia.titulo}
          </h1>
          {emergencia.recinto_arrendatario?.trim() ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {emergencia.recinto_arrendatario}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                isEstadoLluvias(emergencia.estado)
                  ? ESTADO_LLUVIAS_BADGE[emergencia.estado]
                  : "bg-muted",
              )}
            >
              {ESTADO_TRABAJO_LABEL[emergencia.estado] ?? emergencia.estado}
            </span>
            {emergencia.gravedad && isGravedadLluvias(emergencia.gravedad) ? (
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  GRAVEDAD_LLUVIAS_BADGE[emergencia.gravedad],
                )}
              >
                {GRAVEDAD_LLUVIAS_LABEL[emergencia.gravedad]}
              </span>
            ) : null}
          </div>
        </div>
        {puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => setOpen(true)}
          >
            Editar
          </Button>
        ) : null}
      </div>

      {puedeEditar ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <Label className="mb-2 block">Cambiar estado</Label>
          <Select
            value={
              isEstadoLluvias(emergencia.estado)
                ? emergencia.estado
                : "sin_asignar"
            }
            onValueChange={(v) => {
              if (!v || !isEstadoLluvias(v)) return;
              void cambiarEstado(v);
            }}
            disabled={estadoBusy}
          >
            <SelectTrigger className="h-10 w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_LLUVIAS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_TRABAJO_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {estadoError ? (
            <p className="mt-2 text-sm text-destructive">{estadoError}</p>
          ) : null}
        </div>
      ) : null}

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Fecha de creación</h2>
          <p className="text-sm text-muted-foreground">
            {formatFechaCl(emergencia.created_at)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">
            Fecha de entrega estimada
          </h2>
          <p className="text-sm text-muted-foreground">
            {emergencia.fecha_entrega_estimada
              ? formatFechaCl(emergencia.fecha_entrega_estimada)
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Ejecutado por</h2>
          <p className="text-sm text-muted-foreground">
            {emergencia.ejecutado_por
              ? (EJECUTADO_POR_LABEL[
                  emergencia.ejecutado_por as EjecutadoPor
                ] ?? emergencia.ejecutado_por)
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Proveedor</h2>
          <p className="text-sm text-muted-foreground">
            {emergencia.proveedor || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Valor de reparación</h2>
          <p className="text-sm text-muted-foreground">
            {emergencia.valor_reparacion != null
              ? formatMontoClp(emergencia.valor_reparacion)
              : "—"}
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

      <AdjuntosUploader
        trabajoId={emergencia.id}
        tipo="plano_filtraciones"
        titulo="Plano con marcas de filtraciones"
        descripcion="Planos marcados con filtraciones y problemas detectados."
        items={planosFiltraciones}
        puedeEditar={puedeEditar}
        accept="image/*,.pdf"
        etiquetaBoton="Subir fotos y videos"
      />

      <AdjuntosUploader
        trabajoId={emergencia.id}
        tipo="cotizacion"
        titulo="Cotizaciones"
        descripcion="Adjunta cotizaciones del plan de acción."
        items={cotizaciones}
        puedeEditar={puedeEditar}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        etiquetaBoton="Subir fotos y videos"
      />

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={emergencia.categoria_id}
        subtipoId={emergencia.subtipo_id}
        eventoId={emergencia.evento_id ?? undefined}
        recintos={recintos}
        emergencia={emergencia}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
