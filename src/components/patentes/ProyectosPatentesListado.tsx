"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioProyectoPatente, type VariantePatente } from "@/components/patentes/FormularioProyectoPatente";
import {
  ESTADO_EMERGENCIA_BADGE,
  ESTADO_TRABAJO_LABEL,
  formatFechaCl,
  isEstadoEmergencia,
  trabajoHref,
  type ProyectoPatenteListado,
  type RecintoOption,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type ProyectosPatentesListadoProps = {
  variante: VariantePatente;
  titulo: string;
  subtitulo: string;
  proyectos: ProyectoPatenteListado[];
  recintos: RecintoOption[];
  categoriaId: string;
  subtipoId: string;
  puedeEditar: boolean;
};

export function ProyectosPatentesListado({
  variante,
  titulo,
  subtitulo,
  proyectos,
  recintos,
  categoriaId,
  subtipoId,
  puedeEditar,
}: ProyectosPatentesListadoProps) {
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
            Nuevo proyecto
          </Button>
        ) : null}
      </div>

      {proyectos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay proyectos todavía
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {proyectos.map((p) => (
            <Link
              key={p.id}
              href={trabajoHref(categoriaId, subtipoId, p.id)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{p.titulo}</p>
                  {p.recinto_codigo ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.recinto_codigo}
                      {p.recinto_nombre ? ` — ${p.recinto_nombre}` : ""}
                    </p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.descripcion ?? "Sin descripción"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    isEstadoEmergencia(p.estado)
                      ? ESTADO_EMERGENCIA_BADGE[p.estado]
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isEstadoEmergencia(p.estado)
                    ? ESTADO_TRABAJO_LABEL[p.estado]
                    : p.estado}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {variante === "recepcion" && p.fecha_termino
                  ? `Entrega: ${formatFechaCl(p.fecha_termino)}`
                  : formatFechaCl(p.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}

      <FormularioProyectoPatente
        open={open}
        onOpenChange={setOpen}
        variante={variante}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        recintos={recintos}
        onSuccess={(id) => {
          if (id) router.push(trabajoHref(categoriaId, subtipoId, id));
          else router.refresh();
        }}
      />
    </div>
  );
}
