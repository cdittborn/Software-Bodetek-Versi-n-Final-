import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TarjetaFiltroBaseProps = {
  activo: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
};

export function TarjetaFiltroBase({
  activo,
  onClick,
  className,
  children,
}: TarjetaFiltroBaseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[44px] w-full rounded-xl border p-4 text-left transition-colors",
        activo
          ? "border-[#c8102e] bg-[#fdeced] ring-1 ring-[#c8102e]/30"
          : "border-border bg-card hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </button>
  );
}
