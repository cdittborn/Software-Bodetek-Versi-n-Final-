"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AccionesSeguimiento } from "@/components/patentes/AccionesSeguimiento";
import { AdjuntosUploader } from "@/components/patentes/AdjuntosUploader";
import { FormularioProyectoPatente } from "@/components/patentes/FormularioProyectoPatente";
import {
  ESTADO_EMERGENCIA_BADGE,
  ESTADO_TRABAJO_LABEL,
  isEstadoEmergencia,
  subtipoHref,
  type ProyectoPatenteListado,
  type RecintoOption,
  type TrabajoAccion,
  type TrabajoMediaItem,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type DetallePatenteClienteProps = {
  proyecto: ProyectoPatenteListado;
  recintos: RecintoOption[];
  adjuntos: TrabajoMediaItem[];
  provisoria: TrabajoMediaItem[];
  acciones: TrabajoAccion[];
  puedeEditar: boolean;
};

export function DetallePatenteCliente({
  proyecto,
  recintos,
  adjuntos,
  provisoria,
  acciones,
  puedeEditar,
}: DetallePatenteClienteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const back = subtipoHref(proyecto.categoria_id, proyecto.subtipo_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={back} className="hover:underline">
              Clientes con patentes en proceso
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{proyecto.titulo}</h1>
          {proyecto.recinto_codigo ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {proyecto.recinto_codigo}
              {proyecto.recinto_nombre ? ` — ${proyecto.recinto_nombre}` : ""}
            </p>
          ) : null}
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
        <h2 className="mb-2 text-sm font-medium">Comentario general</h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {proyecto.descripcion || "—"}
        </p>
      </div>

      <AdjuntosUploader
        trabajoId={proyecto.id}
        tipo="patente_provisoria"
        titulo="Patente provisoria"
        descripcion="Adjúntala aquí por separado: es el documento clave del expediente."
        items={provisoria}
        puedeEditar={puedeEditar}
      />

      <AdjuntosUploader
        trabajoId={proyecto.id}
        tipo="adjunto"
        titulo="Documentos y fotos"
        descripcion="Observaciones, planos de la DOM, patentes, patentes antiguas y demás respaldos."
        items={adjuntos}
        puedeEditar={puedeEditar}
      />

      <AccionesSeguimiento
        trabajoId={proyecto.id}
        acciones={acciones}
        puedeEditar={puedeEditar}
        conFecha
      />

      <FormularioProyectoPatente
        open={open}
        onOpenChange={setOpen}
        variante="clientes"
        categoriaId={proyecto.categoria_id}
        subtipoId={proyecto.subtipo_id}
        recintos={recintos}
        proyecto={proyecto}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
