type HintMdeNProps = {
  m: number;
  n: number;
  etiqueta?: string;
  className?: string;
};

export function HintMdeN({ m, n, etiqueta, className }: HintMdeNProps) {
  const incompleto = n > 0 && m < n;
  return (
    <p
      className={`text-xs ${
        incompleto ? "font-medium text-red-600" : "text-muted-foreground"
      } ${className ?? ""}`}
    >
      {etiqueta ? `${etiqueta}: ` : null}
      calculado sobre {m} de {n}
    </p>
  );
}
