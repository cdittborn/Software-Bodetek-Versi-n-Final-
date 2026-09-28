"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { PuntoCostoM2 } from "@/lib/fachadas/indicadores";
import { logErrorFachadas } from "@/lib/fachadas/log";

type InnerProps = { puntos: PuntoCostoM2[] };

export function GraficoCostoM2({ puntos }: InnerProps) {
  const [Inner, setInner] = useState<ComponentType<InnerProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./GraficoCostoM2Inner")
      .then((mod) => {
        if (!cancelled) setInner(() => mod.GraficoCostoM2Inner);
      })
      .catch((err) => {
        logErrorFachadas("cargar gráfico costo/m²", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (puntos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No hay intervenciones con costo y fecha para graficar costo/m².
      </p>
    );
  }

  if (!Inner) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Cargando gráfico…
      </p>
    );
  }

  return <Inner puntos={puntos} />;
}
