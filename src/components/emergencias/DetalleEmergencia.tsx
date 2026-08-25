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
  EtiquetaFaltaBadge,
} from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import { IndicadorEntrega } from "@/components/emergencias/evento-consolidado/ui/IndicadorEntrega";
import { parseProblemas, TIPOS_PROBLEMA, TIPO_PROBLEMA_LABEL } from "@/lib/filtracion/problemas";
import { esEntregaAtrasada } from "@/lib/filtracion/completitud";
import {
  emptyEmergenciaMedia,
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
import type { ProveedorOption } from "@/lib/proveedores";
import { cn } from "@/lib/utils";

type DetalleEmergenciaProps = {
  emergencia: EmergenciaListado;
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  mediaAntes: TrabajoMediaItem[];
  mediaDespues: TrabajoMediaItem[];
  planoAgua: TrabajoMediaItem[];
  planoReparacion: TrabajoMediaItem[];
  cotizaciones: TrabajoMediaItem[];
  puedeEditar: boolean;
};

export function DetalleEmergencia({
  emergencia,
  recintos,
  proveedores,
  mediaAntes,
  mediaDespues,
  planoAgua,
  planoReparacion,
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

  const atrasada = esEntregaAtrasada(
    emergencia.fecha_entrega_estimada,
    emergencia.fecha_termino,
  );
  const problemas = parseProblemas(
    emergencia.problemas,
    emergencia.descripcion,
    emergencia.plan_accion,
  );
  const activos = TIPOS_PROBLEMA.filter((t) => problemas[t].activo);

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
        {activos.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-medium">Tipo de problema</h2>
            <EtiquetaFaltaBadge />
          </div>
        ) : (
          activos.map((tipo) => (
            <div
              key={tipo}
              className="rounded-xl border border-border bg-card p-4 sm:col-span-2"
            >
              <h2 className="mb-2 text-sm font-medium">
                {TIPO_PROBLEMA_LABEL[tipo]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Problema</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {problemas[tipo].descripcion.trim() || (
                      <EtiquetaFaltaBadge />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {problemas[tipo].plan.trim() || <EtiquetaFaltaBadge />}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
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
            Fecha de entrega estimada / real
          </h2>
          <IndicadorEntrega
            fechaEstimada={emergencia.fecha_entrega_estimada}
            fechaReal={emergencia.fecha_termino}
            atrasada={atrasada}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Ejecutado por</h2>
          <p className="text-sm">
            {emergencia.ejecutado_por ? (
              (EJECUTADO_POR_LABEL[
                emergencia.ejecutado_por as EjecutadoPor
              ] ?? emergencia.ejecutado_por)
            ) : (
              <EtiquetaFaltaBadge />
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Proveedor</h2>
          <p className="text-sm">
            {emergencia.proveedor_nombre ||
            emergencia.proveedor_texto_legado ? (
              emergencia.proveedor_nombre ||
              `Legado: ${emergencia.proveedor_texto_legado}`
            ) : (
              <EtiquetaFaltaBadge />
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-medium">Valor de reparación</h2>
          <p className="text-sm">
            {emergencia.valor_reparacion != null ? (
              formatMontoClp(emergencia.valor_reparacion)
            ) : (
              <EtiquetaFaltaBadge />
            )}
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
        tipo="plano_agua"
        titulo="Plano — dónde cayó el agua"
        items={planoAgua}
        puedeEditar={puedeEditar}
        accept="image/*,.pdf"
        etiquetaBoton="Subir plano"
      />

      <AdjuntosUploader
        trabajoId={emergencia.id}
        tipo="plano_reparacion"
        titulo="Plano — dónde hay que reparar"
        items={planoReparacion}
        puedeEditar={puedeEditar}
        accept="image/*,.pdf"
        etiquetaBoton="Subir plano"
      />

      <AdjuntosUploader
        trabajoId={emergencia.id}
        tipo="cotizacion"
        titulo="Cotizaciones"
        descripcion="Adjunta cotizaciones del plan de acción e indica el proveedor."
        items={cotizaciones}
        puedeEditar={puedeEditar}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        etiquetaBoton="Subir fotos y videos"
        proveedores={proveedores}
        pedirProveedor
      />

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={emergencia.categoria_id}
        subtipoId={emergencia.subtipo_id}
        eventoId={emergencia.evento_id ?? undefined}
        recintos={recintos}
        proveedores={proveedores}
        emergencia={emergencia}
        media={{
          ...emptyEmergenciaMedia(),
          antes: mediaAntes,
          despues: mediaDespues,
          plano_agua: planoAgua,
          plano_reparacion: planoReparacion,
          cotizacion: cotizaciones,
        }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
