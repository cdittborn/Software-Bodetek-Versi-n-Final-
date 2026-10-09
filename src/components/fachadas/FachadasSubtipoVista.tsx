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

  const campana = `Campaña de limpieza, reparación, pintura y hojalatería · ${textoEncabezadoFachadas(fachadas)}`;

  return (
    <div className="fachadas-scope mx-auto flex w-full min-w-0 max-w-[1360px] flex-col gap-5 overflow-x-clip px-4 py-4 md:px-8 md:py-7">
      <header className="flex min-w-0 items-center justify-between gap-3 md:items-end">
        <div className="min-w-0">
          <p className="text-xs text-[#4B5563] md:hidden">Trabajos / {subtitulo}</p>
          <nav aria-label="Ruta" className="mb-1.5 hidden items-center gap-2 text-[13px] text-[#6B7280] md:flex">
            <Link href="/trabajos" className="text-[#6B7280] no-underline">
              Trabajos
            </Link>
            <span aria-hidden="true">/</span>
            <span>{subtitulo}</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-[#0A0A0A]">Fachadas</span>
          </nav>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-[30px] md:font-bold md:tracking-[-0.02em]">
            {titulo}
          </h1>
          <p className="mt-1.5 hidden text-[15px] text-[#4B5563] md:block">{campana}</p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link
            href={reporteUrl}
            className="inline-flex h-11 min-h-11 items-center justify-center rounded-[10px] border border-[#D1D5DB] bg-white px-3.5 text-sm font-semibold md:h-[42px] md:px-4"
          >
            <span className="md:hidden">Reporte</span>
            <span className="hidden md:inline">Reporte al directorio</span>
          </Link>
          {puedeEditar && !tablasAusentes ? (
            <button
              type="button"
              className="fd-btn-primary hidden h-[42px] items-center rounded-[10px] px-[18px] md:inline-flex"
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
