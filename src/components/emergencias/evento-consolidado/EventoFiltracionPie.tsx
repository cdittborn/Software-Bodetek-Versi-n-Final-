import { formatMontoClp } from "@/lib/trabajos";

type EventoFiltracionPieProps = {
  totalProyectos: number;
  valorEvento: number;
  cotizaciones: number;
};

export function EventoFiltracionPie({
  totalProyectos,
  valorEvento,
  cotizaciones,
}: EventoFiltracionPieProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
      <p className="font-medium">
        {totalProyectos} filtración-proyecto
        {totalProyectos === 1 ? "" : "s"}
      </p>
      <div className="flex flex-col gap-1 text-muted-foreground md:items-end">
        <p>Valor de este evento: {formatMontoClp(valorEvento)}</p>
        <p>Cotizaciones asociadas: {formatMontoClp(cotizaciones)}</p>
      </div>
    </div>
  );
}
