"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardFachadas } from "@/components/fachadas/DashboardFachadas";
import { FormularioFachada } from "@/components/fachadas/FormularioFachada";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { fachadaHref, reporteHref } from "@/lib/fachadas/rutas";
import type { FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import "./fachadas.css";

export function FachadasSubtipoVista({
  categoriaId,
  subtipoId,
  titulo,
  subtitulo,
  fachadas,
  intervenciones,
  portadas,
  recintos,
  proveedores,
  puedeEditar,
  tablasAusentes,
  error,
}: {
  categoriaId: string;
  subtipoId: string;
  titulo: string;
  subtitulo: string;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  portadas: PortadaIntervencion[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
  tablasAusentes: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const anio = new Date().getFullYear();
  const recintosN = new Set(fachadas.map((f) => f.recintoId).filter(Boolean)).size;

  return (
    <div className="fachadas-scope mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="fd-kicker">
            {subtitulo} · Mantención periódica
          </p>
          <h1 className="fd-title mt-1">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {recintosN} recintos · {fachadas.length} fachadas · Temporada {anio}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={reporteHref(categoriaId, subtipoId)}
            className="inline-flex h-10 min-h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-medium"
          >
            Reporte al directorio
          </Link>
          {puedeEditar && !tablasAusentes ? (
            <Button
              type="button"
              className="fd-btn-primary h-10 min-h-10 rounded-xl px-4"
              onClick={() => setOpen(true)}
            >
              + Nueva fachada
            </Button>
          ) : null}
        </div>
      </header>

      {tablasAusentes ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El módulo Fachadas aún no está habilitado en la base de datos. Hay que
          aplicar la migración (solo aditiva) antes de crear datos.
        </p>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          {error}
        </p>
      ) : fachadas.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay fachadas. Crea la primera para registrar intervenciones,
            fotos, planos y costos.
          </p>
          {puedeEditar ? (
            <Button
              className="fd-btn-primary mt-4 h-10 min-h-10 rounded-xl px-4"
              type="button"
              onClick={() => setOpen(true)}
            >
              + Nueva fachada
            </Button>
          ) : null}
        </div>
      ) : (
        <SeccionErrorBoundary titulo="No se pudo mostrar el dashboard de Fachadas.">
          <DashboardFachadas
            categoriaId={categoriaId}
            subtipoId={subtipoId}
            fachadas={fachadas}
            intervenciones={intervenciones}
            portadas={portadas}
            recintos={recintos}
            proveedores={proveedores}
          />
        </SeccionErrorBoundary>
      )}

      <FormularioFachada
        open={open}
        onOpenChange={setOpen}
        recintos={recintos}
        onSuccess={(id) => {
          router.push(fachadaHref(categoriaId, subtipoId, id));
        }}
      />
    </div>
  );
}
