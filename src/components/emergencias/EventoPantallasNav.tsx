import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  eventoDashboardHref,
  eventoHref,
  eventoMaterialesHref,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoPantallasNavProps = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
};

const linkClass = cn(
  buttonVariants({ variant: "outline" }),
  "h-11 min-h-[44px] justify-center",
);

/** Dashboard general · Consolidado · Materiales comprados — las 3 cabeceras. */
export function EventoPantallasNav({
  categoriaId,
  subtipoId,
  eventoId,
}: EventoPantallasNavProps) {
  return (
    <>
      <Link
        href={eventoDashboardHref(categoriaId, subtipoId, eventoId)}
        className={linkClass}
      >
        Dashboard general
      </Link>
      <Link href={eventoHref(categoriaId, subtipoId, eventoId)} className={linkClass}>
        Ver consolidado
      </Link>
      <Link
        href={eventoMaterialesHref(categoriaId, subtipoId, eventoId)}
        className={linkClass}
      >
        Materiales comprados
      </Link>
    </>
  );
}
