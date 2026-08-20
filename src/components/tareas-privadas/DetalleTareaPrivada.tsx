"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdjuntosUploader } from "@/components/patentes/AdjuntosUploader";
import { FormularioTareaPrivada } from "@/components/tareas-privadas/FormularioTareaPrivada";
import {
  subtipoHref,
  type TareaPrivadaListado,
  type TrabajoMediaItem,
} from "@/lib/trabajos";

type DetalleTareaPrivadaProps = {
  tarea: TareaPrivadaListado;
  adjuntos: TrabajoMediaItem[];
  puedeEditar: boolean;
};

export function DetalleTareaPrivada({
  tarea,
  adjuntos,
  puedeEditar,
}: DetalleTareaPrivadaProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={subtipoHref(tarea.categoria_id, tarea.subtipo_id)}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Volver al listado
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {tarea.titulo}
          </h1>
        </div>
        {puedeEditar ? (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Editar descripción
          </Button>
        ) : null}
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Descripción</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
          {tarea.descripcion?.trim() || "Sin descripción"}
        </p>
      </section>

      <AdjuntosUploader
        trabajoId={tarea.id}
        tipo="adjunto"
        titulo="Archivos"
        descripcion="Fotos, PDFs u otros documentos de la tarea"
        items={adjuntos}
        puedeEditar={puedeEditar}
      />

      <FormularioTareaPrivada
        open={open}
        onOpenChange={setOpen}
        categoriaId={tarea.categoria_id}
        subtipoId={tarea.subtipo_id}
        tarea={tarea}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
