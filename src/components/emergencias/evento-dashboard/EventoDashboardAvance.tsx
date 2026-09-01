"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { EventoDashboardHeader } from "@/components/emergencias/evento-dashboard/EventoDashboardHeader";
import { DashboardFaltantesVista } from "@/components/emergencias/evento-dashboard/faltantes/DashboardFaltantesVista";
import { DashboardPopup } from "@/components/emergencias/evento-dashboard/faltantes/DashboardPopup";
import {
  enriquecerProyectos,
  type ProyectoFiltracionEnriquecido,
} from "@/lib/filtracion/completitud";
import { ordenarProyectos } from "@/lib/filtracion/filtrosEvento";
import {
  calcularDashboardFaltantes,
  type PopupAbierto,
} from "@/lib/filtracion/dashboardFaltantes";
import type { EmergenciaConMedia } from "@/lib/trabajos";
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
  const [popup, setPopup] = useState<PopupAbierto | null>(null);

  const proyectos = useMemo(
    () => ordenarProyectos(enriquecerProyectos(emergencias)),
    [emergencias],
  );

  const dashboard = useMemo(
    () => calcularDashboardFaltantes(proyectos),
    [proyectos],
  );

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

  const formulario = (
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
  );

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
        {formulario}
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

      <DashboardFaltantesVista data={dashboard} onOpen={setPopup} />

      {popup ? (
        <DashboardPopup
          popup={popup}
          onCerrar={() => setPopup(null)}
          onEditar={abrirEditar}
          puedeEditar={puedeEditar}
        />
      ) : null}

      {formulario}
    </div>
  );
}
