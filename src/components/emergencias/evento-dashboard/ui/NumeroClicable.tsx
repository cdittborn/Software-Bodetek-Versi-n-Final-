import { cn } from "@/lib/utils";

type NumeroClicableProps = {
  n: number;
  onClick: () => void;
  alerta?: boolean;
  ariaLabel: string;
  grande?: boolean;
  className?: string;
  /** Si se pasa, se muestra esto en vez del número (p. ej. un monto CLP). */
  etiqueta?: string;
};

export function NumeroClicable({
  n,
  onClick,
  alerta = false,
  ariaLabel,
  grande = false,
  className,
  etiqueta,
}: NumeroClicableProps) {
  const enRojo = alerta && n > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-1.5 font-semibold tabular-nums underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-[#c8102e] focus-visible:outline-none",
        grande
          ? "text-[40px] leading-none md:text-[52px]"
          : "text-base md:text-lg",
        enRojo ? "text-[#c8102e]" : "text-inherit",
        alerta && n === 0 ? "text-zinc-400" : null,
        className,
      )}
    >
      {etiqueta ?? n}
    </button>
  );
}
