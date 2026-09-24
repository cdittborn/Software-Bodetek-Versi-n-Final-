"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HintMdeN } from "@/components/fachadas/HintMdeN";
import { GraficoCostoM2 } from "@/components/fachadas/GraficoCostoM2";
import {
  agregarIndicadores,
  EJECUTADO_POR_FACHADA,
  FILTRO_DASHBOARD_VACIO,
  filtrarIntervenciones,
  formatM2Cl,
  puntosCostoPorM2,
  TIPOS_INTERVENCION_FACHADA,
  TIPO_INTERVENCION_FACHADA_LABEL,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
} from "@/lib/fachadas/indicadores";
import { EJECUTADO_POR_LABEL, formatFechaCl, formatMontoClp } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

const TODOS = "todos";

export function DashboardFachadas({
  intervenciones,
  proveedores,
}: {
  intervenciones: IntervencionIndicadores[];
  proveedores: ProveedorOption[];
}) {
  const [filtro, setFiltro] = useState<FiltroDashboardFachadas>(FILTRO_DASHBOARD_VACIO);

  const filtradas = useMemo(
    () => filtrarIntervenciones(intervenciones, filtro),
    [intervenciones, filtro],
  );
  const dash = useMemo(() => agregarIndicadores(filtradas), [filtradas]);
  const puntos = useMemo(
    () => puntosCostoPorM2(filtradas, formatFechaCl),
    [filtradas],
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <Label>Desde</Label>
          <Input
            type="date"
            value={filtro.fechaDesde ?? ""}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, fechaDesde: e.target.value || null }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Hasta</Label>
          <Input
            type="date"
            value={filtro.fechaHasta ?? ""}
            onChange={(e) =>
              setFiltro((f) => ({ ...f, fechaHasta: e.target.value || null }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>Ejecutor</Label>
          <Select
            value={filtro.ejecutadoPor}
            onValueChange={(v) =>
              setFiltro((f) => ({
                ...f,
                ejecutadoPor:
                  v === "maestros_bodetek" || v === "proveedor_externo"
                    ? v
                    : "todos",
              }))
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {EJECUTADO_POR_FACHADA.map((e) => (
                <SelectItem key={e} value={e}>
                  {EJECUTADO_POR_LABEL[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Proveedor</Label>
          <Select
            value={filtro.proveedorId ?? TODOS}
            onValueChange={(v) =>
              setFiltro((f) => ({ ...f, proveedorId: v === TODOS ? null : v }))
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre_empresa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
          <Label>Tipo</Label>
          <Select
            value={filtro.tipo}
            onValueChange={(v) =>
              setFiltro((f) => ({
                ...f,
                tipo:
                  v === "limpieza" || v === "reparacion" || v === "pintura"
                    ? v
                    : "todos",
              }))
            }
          >
            <SelectTrigger className="h-10 w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {TIPOS_INTERVENCION_FACHADA.map((t) => (
                <SelectItem key={t} value={t}>
                  {TIPO_INTERVENCION_FACHADA_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tarjeta
          titulo="m² intervenidos"
          valor={`${formatM2Cl(dash.dias.m2)} m²`}
          cobertura={dash.dias.cobertura}
        />
        <Tarjeta
          titulo="Días de trabajo"
          valor={String(dash.dias.total)}
          detalle={TIPOS_INTERVENCION_FACHADA.map(
            (t) => `${TIPO_INTERVENCION_FACHADA_LABEL[t]}: ${dash.dias.porTipo[t]}`,
          ).join(" · ")}
          cobertura={dash.dias.cobertura}
        />
        <Tarjeta
          titulo="Días / m²"
          valor={dash.dias.diasPorM2 == null ? "—" : String(dash.dias.diasPorM2)}
          cobertura={dash.dias.cobertura}
        />
        <Tarjeta
          titulo="Costo total"
          valor={formatMontoClp(dash.costos.totalBruto)}
          detalle={`Cotiz. ${formatMontoClp(dash.costos.cotizacionesBruto)} · Hoja. ${formatMontoClp(dash.costos.hojalateriaBruto)} · Mat. ${formatMontoClp(dash.costos.materialesBruto)}`}
          cobertura={dash.costos.cobertura}
        />
        <Tarjeta
          titulo="Costo / m²"
          valor={
            dash.dias.m2 > 0 && dash.costos.totalBruto > 0
              ? formatMontoClp(Math.round(dash.costos.totalBruto / dash.dias.m2))
              : "—"
          }
          cobertura={dash.costos.cobertura}
        />
        <Tarjeta
          titulo="Cotizaciones con factura"
          valor={`${dash.costos.facturas.m} / ${dash.costos.facturas.n}`}
          cobertura={dash.costos.facturas}
          alerta={
            dash.costos.facturas.n > 0 &&
            dash.costos.facturas.m < dash.costos.facturas.n
          }
        />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Costo/m² por intervención</h2>
        <GraficoCostoM2 puntos={puntos} />
      </div>
    </section>
  );
}

function Tarjeta({
  titulo,
  valor,
  detalle,
  cobertura,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  cobertura: { m: number; n: number };
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${alerta ? "border-red-300" : ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      <p className={`mt-1 text-xl font-semibold ${alerta ? "text-red-600" : ""}`}>
        {valor}
      </p>
      {detalle ? (
        <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
      ) : null}
      <HintMdeN m={cobertura.m} n={cobertura.n} className="mt-2" />
    </div>
  );
}
