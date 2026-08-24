import { cn } from "@/lib/utils";
import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";

type IndicadorPlanosProps = {
  tieneAgua: boolean;
  tieneReparacion: boolean;
};

function Item({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className={cn(
          "font-medium",
          ok ? "text-emerald-700" : "text-[#a4131f]",
        )}
      >
        {label}
      </span>
      {ok ? (
        <span className="text-emerald-600">✓</span>
      ) : (
        <EtiquetaFaltaBadge className="px-1 py-0 text-[9px]" />
      )}
    </span>
  );
}

export function IndicadorPlanos({
  tieneAgua,
  tieneReparacion,
}: IndicadorPlanosProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <Item label="Agua" ok={tieneAgua} />
      <Item label="Rep." ok={tieneReparacion} />
    </div>
  );
}
