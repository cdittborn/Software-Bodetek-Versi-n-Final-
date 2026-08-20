"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AccionesSeguimiento } from "@/components/patentes/AccionesSeguimiento";
import { FormularioProyectoPatente } from "@/components/patentes/FormularioProyectoPatente";
import { PresupuestoYPagos } from "@/components/patentes/PresupuestoYPagos";
import {
  ESTADO_EMERGENCIA_BADGE,
  ESTADO_TRABAJO_LABEL,
  formatFechaCl,
  isEstadoEmergencia,
  subtipoHref,
  type ProyectoPatenteListado,
  type RecintoOption,
  type TrabajoAccion,
  type TrabajoPago,
  type TrabajoPresupuestoItem,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type DetalleRecepcionObrasProps = {
  proyecto: ProyectoPatenteListado;
  recintos: RecintoOption[];
  acciones: TrabajoAccion[];
  presupuesto: TrabajoPresupuestoItem[];
  pagos: TrabajoPago[];
  puedeEditar: boolean;
};

export function DetalleRecepcionObras({
  proyecto,
  recintos,
  acciones,
  presupuesto,
  pagos,
  puedeEditar,
}: DetalleRecepcionObrasProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const back = subtipoHref(proyecto.categoria_id, proyecto.subtipo_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={back} className="hover:underline">
              Proyecto recepción de obras
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{proyecto.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrega del proyecto: {formatFechaCl(proyecto.fecha_termino)}
          </p>
          <span
            className={cn(
              "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
              isEstadoEmergencia(proyecto.estado)
                ? ESTADO_EMERGENCIA_BADGE[proyecto.estado]
                : "bg-muted",
            )}
          >
            {isEstadoEmergencia(proyecto.estado)
              ? ESTADO_TRABAJO_LABEL[proyecto.estado]
              : proyecto.estado}
          </span>
        </div>
        {puedeEditar ? (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Editar
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Descripción general</h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {proyecto.descripcion || "—"}
        </p>
      </div>

      <AccionesSeguimiento
        trabajoId={proyecto.id}
        acciones={acciones}
        puedeEditar={puedeEditar}
        conFecha
      />

      <PresupuestoYPagos
        trabajoId={proyecto.id}
        items={presupuesto}
        pagos={pagos}
        puedeEditar={puedeEditar}
      />

      <FormularioProyectoPatente
        open={open}
        onOpenChange={setOpen}
        variante="recepcion"
        categoriaId={proyecto.categoria_id}
        subtipoId={proyecto.subtipo_id}
        recintos={recintos}
        proyecto={proyecto}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
