import { cn } from "@/lib/utils";

type IndicadorAntesDespuesProps = {
  antes: number;
  despues: number;
};

function Badge({
  label,
  count,
  pendiente,
}: {
  label: string;
  count: number;
  pendiente?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold",
        pendiente
          ? "bg-amber-100 text-amber-900"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label} {count}
    </span>
  );
}

export function IndicadorAntesDespues({
  antes,
  despues,
}: IndicadorAntesDespuesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge label="Antes" count={antes} />
      <Badge label="Después" count={despues} pendiente={despues === 0} />
    </div>
  );
}
