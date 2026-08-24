import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { eventoDashboardHref } from "@/lib/trabajos";
import { formatHace } from "@/lib/filtracion/filtrosEvento";
import { cn } from "@/lib/utils";

type EventoFiltracionHeaderProps = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  totalProyectos: number;
  ultimaActividad: string | null;
  puedeEditar: boolean;
  onNueva: () => void;
};

export function EventoFiltracionHeader({
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  totalProyectos,
  ultimaActividad,
  puedeEditar,
  onNueva,
}: EventoFiltracionHeaderProps) {
  const dashboardHref = eventoDashboardHref(categoriaId, subtipoId, eventoId);
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
          {" / Eventos"}
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">{eventoNombre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalProyectos} filtración-proyecto
          {totalProyectos === 1 ? "" : "s"}
          {hace ? ` · actualizado ${hace}` : ""}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link
          href={dashboardHref}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 min-h-[44px] justify-center",
          )}
        >
          Dashboard de avance
        </Link>
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
