"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { EventoFiltracionCardLista } from "@/components/emergencias/evento-consolidado/EventoFiltracionCardLista";
import { EventoFiltracionFiltros } from "@/components/emergencias/evento-consolidado/EventoFiltracionFiltros";
import { EventoFiltracionHeader } from "@/components/emergencias/evento-consolidado/EventoFiltracionHeader";
import { EventoFiltracionPie } from "@/components/emergencias/evento-consolidado/EventoFiltracionPie";
import { EventoFiltracionResumen } from "@/components/emergencias/evento-consolidado/EventoFiltracionResumen";
import { EventoFiltracionTabla } from "@/components/emergencias/evento-consolidado/EventoFiltracionTabla";
import {
  calcularAgregadoEvento,
  enriquecerProyectos,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import {
  contarKpis,
  fechaMasRecienteEvento,
  filtrarProyectos,
  ordenarProyectos,
  sumaMontos,
  type KpiFiltro,
} from "@/lib/filtracion/filtrosEvento";
import type {
  EmergenciaConMedia,
  EstadoLluvias,
  GravedadLluvias,
  RecintoOption,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

type EventoFiltracionConsolidadoProps = {
  emergencias: EmergenciaConMedia[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  puedeEditar: boolean;
};

export function EventoFiltracionConsolidado({
  emergencias,
  recintos,
  proveedores,
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  puedeEditar,
}: EventoFiltracionConsolidadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emergenciaEditando, setEmergenciaEditando] =
    useState<EmergenciaConMedia | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [kpiActivo, setKpiActivo] = useState<KpiFiltro | null>(null);
  const [gravedades, setGravedades] = useState<GravedadLluvias[]>([]);
  const [estados, setEstados] = useState<EstadoLluvias[]>([]);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const proyectos = useMemo(
    () => ordenarProyectos(enriquecerProyectos(emergencias)),
    [emergencias],
  );

  const agregado = useMemo(
    () => calcularAgregadoEvento(proyectos),
    [proyectos],
  );

  const kpis = useMemo(() => contarKpis(proyectos), [proyectos]);

  const ultimaActividad = useMemo(
    () => fechaMasRecienteEvento(proyectos),
    [proyectos],
  );

  const filtrados = useMemo(
    () =>
      filtrarProyectos(proyectos, {
        busqueda,
        kpiActivo,
        gravedades,
        estados,
      }),
    [proyectos, busqueda, kpiActivo, gravedades, estados],
  );

  const montos = useMemo(() => sumaMontos(proyectos), [proyectos]);

  function abrirCrear() {
    setEmergenciaEditando(null);
    setOpen(true);
  }

  function abrirEditar(p: ProyectoFiltracionEnriquecido) {
    setEmergenciaEditando(p);
    setOpen(true);
  }

  function cerrarFormulario(next: boolean) {
    setOpen(next);
    if (!next) setEmergenciaEditando(null);
  }

  function toggleKpi(kpi: KpiFiltro) {
    setKpiActivo((prev) => (prev === kpi ? null : kpi));
  }

  function toggleGravedad(g: GravedadLluvias) {
    setGravedades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  function toggleEstado(e: EstadoLluvias) {
    setEstados((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }

  function toggleExpand(id: string) {
    setExpandidoId((prev) => (prev === id ? null : id));
  }

  if (proyectos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EventoFiltracionHeader
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          eventoId={eventoId}
          eventoNombre={eventoNombre}
          totalProyectos={0}
          ultimaActividad={null}
          puedeEditar={puedeEditar}
          onNueva={abrirCrear}
        />
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Este evento aún no tiene filtración-proyectos.
          </p>
          {puedeEditar ? (
            <Button
              type="button"
              className="mt-4 min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a4131f]"
              onClick={abrirCrear}
            >
              Crear la primera filtración-proyecto
            </Button>
          ) : null}
        </div>
        <FormularioEmergencia
          open={open}
          onOpenChange={cerrarFormulario}
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          eventoId={eventoId}
          recintos={recintos}
          proveedores={proveedores}
          emergencia={null}
          onSuccess={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <EventoFiltracionHeader
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        eventoNombre={eventoNombre}
        totalProyectos={proyectos.length}
        ultimaActividad={ultimaActividad}
        puedeEditar={puedeEditar}
        onNueva={abrirCrear}
      />

      <EventoFiltracionResumen
        agregado={agregado}
        kpis={kpis}
        kpiActivo={kpiActivo}
        onToggleKpi={toggleKpi}
      />

      <EventoFiltracionFiltros
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        gravedades={gravedades}
        estados={estados}
        onToggleGravedad={toggleGravedad}
        onToggleEstado={toggleEstado}
        visibles={filtrados.length}
        total={proyectos.length}
      />

      <EventoFiltracionTabla
        proyectos={filtrados}
        expandidoId={expandidoId}
        onToggleExpand={toggleExpand}
        onEditar={abrirEditar}
        puedeEditar={puedeEditar}
      />

      <EventoFiltracionCardLista
        proyectos={filtrados}
        expandidoId={expandidoId}
        onToggleExpand={toggleExpand}
        onEditar={abrirEditar}
        puedeEditar={puedeEditar}
      />

      <EventoFiltracionPie
        totalProyectos={proyectos.length}
        valorEvento={montos.valorEvento}
        cotizaciones={montos.cotizaciones}
      />

      <FormularioEmergencia
        open={open}
        onOpenChange={cerrarFormulario}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        recintos={recintos}
        proveedores={proveedores}
        emergencia={emergenciaEditando}
        media={emergenciaEditando?.media}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
