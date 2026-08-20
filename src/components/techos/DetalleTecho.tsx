"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdjuntosUploader } from "@/components/patentes/AdjuntosUploader";
import { FormularioTecho } from "@/components/techos/FormularioTecho";
import { TareasTecho } from "@/components/techos/TareasTecho";
import {
  formatFechaCl,
  subtipoHref,
  type TechoListado,
  type TrabajoAccion,
  type TrabajoMediaItem,
} from "@/lib/trabajos";

type DetalleTechoProps = {
  techo: TechoListado;
  evidencia: TrabajoMediaItem[];
  cotizacion: TrabajoMediaItem[];
  tareas: TrabajoAccion[];
  puedeEditar: boolean;
};

export function DetalleTecho({
  techo,
  evidencia,
  cotizacion,
  tareas,
  puedeEditar,
}: DetalleTechoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const back = subtipoHref(techo.categoria_id, techo.subtipo_id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={back} className="hover:underline">
              Revisiones y mantenciones periódicas
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{techo.titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Última revisión: {formatFechaCl(techo.fecha_ultima_revision)} · Próxima:{" "}
            {formatFechaCl(techo.proxima_mantencion)}
            {techo.periodicidad_dias
              ? ` · cada ${techo.periodicidad_dias} días`
              : ""}
          </p>
        </div>
        {puedeEditar ? (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Editar / registrar revisión
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Materiales</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {techo.materiales || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Estado del techo y materiales</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {techo.descripcion || "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Plan de acción</h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {techo.plan_accion || "—"}
        </p>
      </div>

      <AdjuntosUploader
        trabajoId={techo.id}
        tipo="adjunto"
        titulo="Fotos y videos"
        descripcion="Evidencia general del techo (no se separa en antes/después)."
        items={evidencia}
        puedeEditar={puedeEditar}
        accept="image/*,video/*"
        etiquetaBoton="Subir fotos y videos"
      />

      <AdjuntosUploader
        trabajoId={techo.id}
        tipo="cotizacion"
        titulo="Cotización"
        descripcion="Una sola cotización para todo el plan de acción. Si subes otra, reemplaza la anterior."
        items={cotizacion}
        puedeEditar={puedeEditar}
        maxArchivos={1}
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        etiquetaBoton={cotizacion.length ? "Reemplazar cotización" : "Adjuntar cotización"}
      />

      <TareasTecho
        trabajoId={techo.id}
        tareas={tareas}
        puedeEditar={puedeEditar}
      />

      <FormularioTecho
        open={open}
        onOpenChange={setOpen}
        categoriaId={techo.categoria_id}
        subtipoId={techo.subtipo_id}
        techo={techo}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
