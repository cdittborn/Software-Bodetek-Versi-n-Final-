"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardFachadas } from "@/components/fachadas/DashboardFachadas";
import { ElegirFachada } from "@/components/fachadas/ElegirFachada";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { textoEncabezadoFachadas } from "@/lib/fachadas/dashboard";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import { crearIntervencion } from "@/lib/fachadas/guardar";
import { intervencionHref, reporteHref } from "@/lib/fachadas/rutas";
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
  modoDemo = false,
  hoy,
  enlaceFachada,
  onRegistrarIntervencion,
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
  modoDemo?: boolean;
  hoy?: string;
  enlaceFachada?: (id: string) => string;
  onRegistrarIntervencion?: (fachadaId: string) => void;
}) {
  const router = useRouter();
  const [elegir, setElegir] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const hoyVista = hoy ?? hoyIsoChile();
  const reporteUrl = modoDemo
    ? "/trabajos/fachadas/demo/reporte"
    : reporteHref(categoriaId, subtipoId);

  async function registrar(fachadaId: string) {
    setElegir(false);
    setErrorRegistro(null);
    if (onRegistrarIntervencion) {
      onRegistrarIntervencion(fachadaId);
      return;
    }
    if (modoDemo) {
      router.push("/trabajos/fachadas/demo/intervencion");
      return;
    }
    try {
      const id = await crearIntervencion(fachadaId);
      router.push(intervencionHref(categoriaId, subtipoId, fachadaId, id));
    } catch (error) {
      setErrorRegistro(error instanceof Error ? error.message : "No se pudo crear la intervención");
    }
  }

  return (
    <div className="fachadas-scope mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 overflow-x-clip px-4 py-8">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="fd-kicker">
            <span className="md:hidden">Trabajos / Imagen</span>
            <span className="hidden md:inline">{subtitulo} · Mantención periódica</span>
          </p>
          <h1 className="fd-title mt-1">
            <span className="md:hidden">Fachadas</span>
            <span className="hidden md:inline">{titulo}</span>
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{textoEncabezadoFachadas(fachadas)}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          <Link
            href={reporteUrl}
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-xl border border-[#e6e3de] bg-white px-4 text-sm font-medium max-md:w-full"
          >
            <span className="md:hidden">Reporte</span>
            <span className="hidden md:inline">Reporte al directorio</span>
          </Link>
          {puedeEditar && !tablasAusentes ? (
            <button
              type="button"
              className="fd-btn-primary hidden h-11 min-h-11 items-center rounded-xl px-4 md:inline-flex"
              onClick={() => setElegir(true)}
            >
              Registrar intervención
            </button>
          ) : null}
        </div>
      </header>
      {errorRegistro ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">{errorRegistro}</p>
      ) : null}

      {tablasAusentes ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El módulo Fachadas aún no está habilitado en la base de datos. Hay que
          aplicar la migración (solo aditiva) antes de crear datos.
        </p>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          {error}
        </p>
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
            modoDemo={modoDemo}
            hoy={hoyVista}
            puedeEditar={puedeEditar && !tablasAusentes}
            onAbrirRegistro={() => setElegir(true)}
            enlaceFachada={enlaceFachada}
          />
        </SeccionErrorBoundary>
      )}

      <ElegirFachada
        open={elegir}
        onOpenChange={setElegir}
        fachadas={fachadas}
        intervenciones={intervenciones}
        hoy={hoyVista}
        onElegir={(fachadaId) => {
          void registrar(fachadaId);
        }}
      />
    </div>
  );
}
