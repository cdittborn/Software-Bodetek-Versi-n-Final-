"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioTareaPrivada } from "@/components/tareas-privadas/FormularioTareaPrivada";
import {
  ESTADO_TAREA_PRIVADA_BADGE,
  ESTADO_TAREA_PRIVADA_LABEL,
  PRIORIDAD_TAREA_PRIVADA_BADGE,
  PRIORIDAD_TAREA_PRIVADA_LABEL,
  isEstadoTareaPrivada,
  isPrioridadTareaPrivada,
  trabajoHref,
  type TareaPrivadaListado,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type TareasPrivadasListadoProps = {
  titulo: string;
  subtitulo: string;
  tareas: TareaPrivadaListado[];
  categoriaId: string;
  subtipoId: string;
  puedeEditar: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function TareasPrivadasListado({
  titulo,
  subtitulo,
  tareas,
  categoriaId,
  subtipoId,
  puedeEditar,
}: TareasPrivadasListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        {puedeEditar ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Nueva tarea
          </Button>
        ) : null}
      </div>

      {tareas.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay tareas todavía
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {tareas.map((tarea) => (
            <li key={tarea.id}>
              <Link
                href={trabajoHref(categoriaId, subtipoId, tarea.id)}
                className="block px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium leading-snug">
                    {tarea.titulo || "Sin título"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {isEstadoTareaPrivada(tarea.estado) ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          ESTADO_TAREA_PRIVADA_BADGE[tarea.estado],
                        )}
                      >
                        {ESTADO_TAREA_PRIVADA_LABEL[tarea.estado]}
                      </span>
                    ) : null}
                    {tarea.prioridad &&
                    isPrioridadTareaPrivada(tarea.prioridad) ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          PRIORIDAD_TAREA_PRIVADA_BADGE[tarea.prioridad],
                        )}
                      >
                        {PRIORIDAD_TAREA_PRIVADA_LABEL[tarea.prioridad]}
                      </span>
                    ) : null}
                  </div>
                </div>
                {tarea.descripcion ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {tarea.descripcion}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(tarea.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FormularioTareaPrivada
        open={open}
        onOpenChange={setOpen}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        onSuccess={(id) => {
          router.refresh();
          if (id) {
            router.push(trabajoHref(categoriaId, subtipoId, id));
          }
        }}
      />
    </div>
  );
}
