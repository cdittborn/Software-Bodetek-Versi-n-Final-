"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { EventoDashboardHeader } from "@/components/emergencias/evento-dashboard/EventoDashboardHeader";
import { EventoDashboardFilaAvance } from "@/components/emergencias/evento-dashboard/EventoDashboardFilaAvance";
import { EventoDashboardSeccionRespaldo } from "@/components/emergencias/evento-dashboard/EventoDashboardSeccionRespaldo";
import { EventoDashboardSeccionAsignacion } from "@/components/emergencias/evento-dashboard/EventoDashboardSeccionAsignacion";
import { EventoDashboardListado } from "@/components/emergencias/evento-dashboard/EventoDashboardListado";
import {
  enriquecerProyectos,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import {
  filtrarPorGravedades,
  filtrarPorTarjetaDashboard,
  ordenarProyectos,
  type FiltroTarjetaDashboard,
} from "@/lib/filtracion/filtrosEvento";
import type { EmergenciaConMedia, GravedadLluvias } from "@/lib/trabajos";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

type EventoDashboardAvanceProps = {
  emergencias: EmergenciaConMedia[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  puedeEditar: boolean;
};

export function EventoDashboardAvance({
  emergencias,
  recintos,
  proveedores,
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  puedeEditar,
}: EventoDashboardAvanceProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [emergenciaEditando, setEmergenciaEditando] =
    useState<EmergenciaConMedia | null>(null);
  const [tarjetaActiva, setTarjetaActiva] =
    useState<FiltroTarjetaDashboard | null>(null);
  const [gravedades, setGravedades] = useState<GravedadLluvias[]>([]);

  const proyectos = useMemo(
    () => ordenarProyectos(enriquecerProyectos(emergencias)),
    [emergencias],
  );

  const filtrados = useMemo(() => {
    let list = filtrarPorTarjetaDashboard(proyectos, tarjetaActiva);
    list = filtrarPorGravedades(list, gravedades);
    return list;
  }, [proyectos, tarjetaActiva, gravedades]);

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

  function toggleTarjeta(id: FiltroTarjetaDashboard) {
    setTarjetaActiva((prev) => (prev === id ? null : id));
  }

  function verTodos() {
    setTarjetaActiva(null);
    setGravedades([]);
  }

  function toggleGravedad(g: GravedadLluvias) {
    setGravedades((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  if (proyectos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EventoDashboardHeader
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          eventoId={eventoId}
          eventoNombre={eventoNombre}
          emergencias={emergencias}
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
    <div className="flex flex-col gap-8">
      <EventoDashboardHeader
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        eventoNombre={eventoNombre}
        emergencias={emergencias}
        puedeEditar={puedeEditar}
        onNueva={abrirCrear}
      />

      <EventoDashboardFilaAvance
        proyectos={proyectos}
        tarjetaActiva={tarjetaActiva}
        onToggleTarjeta={toggleTarjeta}
        onVerTodos={verTodos}
      />

      <EventoDashboardSeccionRespaldo
        proyectos={proyectos}
        tarjetaActiva={tarjetaActiva}
        onToggleTarjeta={toggleTarjeta}
      />

      <EventoDashboardSeccionAsignacion
        proyectos={proyectos}
        tarjetaActiva={tarjetaActiva}
        onToggleTarjeta={toggleTarjeta}
      />

      <EventoDashboardListado
        proyectos={filtrados}
        total={proyectos.length}
        tarjetaActiva={tarjetaActiva}
        gravedades={gravedades}
        onToggleGravedad={toggleGravedad}
        onVerTodos={verTodos}
        onEditar={abrirEditar}
        puedeEditar={puedeEditar}
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
