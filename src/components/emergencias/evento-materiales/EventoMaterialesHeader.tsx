import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { eventoDashboardHref, eventoHref } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoMaterialesHeaderProps = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
};

export function EventoMaterialesHeader({
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
}: EventoMaterialesHeaderProps) {
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
          Materiales comprados
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compras del evento, asociadas a uno o más proyectos-filtración
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Link
          href={eventoDashboardHref(categoriaId, subtipoId, eventoId)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 min-h-[44px] justify-center",
          )}
        >
          Dashboard general
        </Link>
        <Link
          href={eventoHref(categoriaId, subtipoId, eventoId)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 min-h-[44px] justify-center",
          )}
        >
          Ver consolidado
        </Link>
      </div>
    </div>
  );
}
