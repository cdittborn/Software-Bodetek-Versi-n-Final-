"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatHace, fechaMasRecienteEvento } from "@/lib/filtracion/filtrosEvento";
import { enriquecerProyectos } from "@/lib/filtracion/completitud";
import type { EmergenciaConMedia } from "@/lib/trabajos";
import { EventoPantallasNav } from "@/components/emergencias/EventoPantallasNav";
import { useMemo } from "react";

type EventoDashboardHeaderProps = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  emergencias: EmergenciaConMedia[];
  puedeEditar: boolean;
  onNueva: () => void;
};

export function EventoDashboardHeader({
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  emergencias,
  puedeEditar,
  onNueva,
}: EventoDashboardHeaderProps) {
  const total = emergencias.length;

  const ultimaActividad = useMemo(() => {
    const proyectos = enriquecerProyectos(emergencias);
    return fechaMasRecienteEvento(proyectos);
  }, [emergencias]);

  const hace = formatHace(ultimaActividad);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link
            href={`/trabajos/c/${categoriaId}/s/${subtipoId}`}
            className="hover:underline"
          >
            Lluvias y temporales
          </Link>
          {" / "}
          {eventoNombre}
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight max-md:text-xl">
          Dashboard general
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} filtración-proyecto{total === 1 ? "" : "s"}
          {hace ? ` · actualizado ${hace}` : ""}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <EventoPantallasNav
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          eventoId={eventoId}
        />
        {puedeEditar ? (
          <Button
            type="button"
            className="h-11 min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a4131f]"
            onClick={onNueva}
          >
            Nueva filtración-proyecto
          </Button>
        ) : null}
      </div>
    </div>
  );
}
