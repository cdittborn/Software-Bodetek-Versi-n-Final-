"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMontoClp } from "@/lib/trabajos";
import type { PuntoCostoM2 } from "@/lib/fachadas/indicadores";

export function GraficoCostoM2({ puntos }: { puntos: PuntoCostoM2[] }) {
  if (puntos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No hay intervenciones con costo y fecha para graficar costo/m².
      </p>
    );
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={puntos} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="fechaLabel" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => formatMontoClp(v)}
            width={72}
          />
          <Tooltip
            formatter={(value) => [
              formatMontoClp(Number(value ?? 0)),
              "Costo/m²",
            ]}
          />
          <Line
            type="monotone"
            dataKey="costoPorM2"
            stroke="#2563eb"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
