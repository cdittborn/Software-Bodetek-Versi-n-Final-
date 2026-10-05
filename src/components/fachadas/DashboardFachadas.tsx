"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipEstadoFachada } from "@/components/fachadas/ChipEstadoFachada";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { HintMdeN } from "@/components/fachadas/HintMdeN";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import { formatSuperficieEnteraCl } from "@/lib/fachadas/formato";
import {
  alertasDocumentos,
  agregarIndicadores,
  esCompletaParaCostos,
  etiquetaChipVencimiento,
  etiquetaMapaFachada,
  FILTRO_DASHBOARD_VACIO,
  materialesNetoPorTipo,
  proximosVencimientos,
  superficieDashboard,
  tieneSuperficieM2,
  TIPO_INTERVENCION_FACHADA_LABEL,
  TIPOS_INTERVENCION_FACHADA,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
} from "@/lib/fachadas/indicadores";
import {
  conteosEstado,
  filasTablaFachadas,
  listadoAIndicadores,
  quienEjecuto,
  trabajosRealizados,
  ultimasIntervenciones,
} from "@/lib/fachadas/dashboard";
import {
  COLOR_CELDA_ESTADO,
  COLOR_TIPO,
  formatDiaMes,
  formatDiaMesCorto,
  formatMesCortoCl,
  formatMillonesClp,
  LABEL_CELDA_ESTADO,
  LETRA_TIPO,
} from "@/lib/fachadas/ui";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import {
  ESTADOS_CALCULADOS_FACHADA,
  labelEstadoCalculadoFachada,
} from "@/lib/fachadas/estado";
import { EJECUTADO_POR_LABEL, formatMontoClp } from "@/lib/trabajos";
import { fachadaHref } from "@/lib/fachadas/rutas";
import { cn } from "@/lib/utils";
import "./fachadas.css";
import type { FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

const TODOS = "todos";

export function DashboardFachadas({
  categoriaId,
  subtipoId,
  fachadas,
  intervenciones,
  portadas,
  proveedores,
  modoDemo = false,
  hoy: hoyProp,
}: {
  categoriaId: string;
  subtipoId: string;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  portadas: PortadaIntervencion[];
  recintos?: RecintoOption[];
  proveedores: ProveedorOption[];
  modoDemo?: boolean;
  hoy?: string;
}) {
  const hoy = hoyProp ?? hoyIsoChile();
  const anio = Number(hoy.slice(0, 4));
  const [filtro, setFiltro] = useState<FiltroDashboardFachadas>({
    ...FILTRO_DASHBOARD_VACIO,
    fechaDesde: `${anio}-01-01`,
    fechaHasta: hoy,
  });
  const [tab, setTab] = useState<"todos" | "maestros_bodetek" | "proveedor_externo">(
    "todos",
  );
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(0);
  const [movilVisibles, setMovilVisibles] = useState(6);

  const filtroEfectivo: FiltroDashboardFachadas = {
    ...filtro,
    ejecutadoPor: tab === "todos" ? filtro.ejecutadoPor : tab,
    recintoId: null,
  };

  const fachadasFil = fachadas;
  const intsFil = useMemo(
    () =>
      intervenciones.filter((i) => {
        if (
          filtroEfectivo.ejecutadoPor !== "todos" &&
          i.ejecutadoPor !== filtroEfectivo.ejecutadoPor
        ) {
          return false;
        }
        if (filtroEfectivo.proveedorId && i.proveedorId !== filtroEfectivo.proveedorId) {
          return false;
        }
        if (!filtroEfectivo.fechaDesde && !filtroEfectivo.fechaHasta) return true;
        const fechas = [i.fechaInicio, i.fechaTermino].filter(Boolean) as string[];
        if (fechas.length === 0) return false;
        return fechas.some(
          (f) =>
            (!filtroEfectivo.fechaDesde || f >= filtroEfectivo.fechaDesde) &&
            (!filtroEfectivo.fechaHasta || f <= filtroEfectivo.fechaHasta),
        );
      }),
    [intervenciones, filtroEfectivo],
  );

  const dash = useMemo(() => agregarIndicadores(intsFil), [intsFil]);
  const superficie = useMemo(
    () =>
      superficieDashboard(
        fachadasFil.map(listadoAIndicadores),
        intsFil,
        filtroEfectivo,
      ),
    [fachadasFil, intsFil, filtroEfectivo],
  );
  const estados = useMemo(
    () => conteosEstado(fachadasFil, intervenciones, hoy),
    [fachadasFil, intervenciones, hoy],
  );
  const trabajos = useMemo(
    () => trabajosRealizados(intsFil.filter(esCompletaParaCostos)),
    [intsFil],
  );
  const quien = useMemo(
    () => quienEjecuto(intsFil.filter(esCompletaParaCostos)),
    [intsFil],
  );
  const alertas = useMemo(() => alertasDocumentos(intsFil), [intsFil]);
  const ultimas = useMemo(() => ultimasIntervenciones(intsFil, 3), [intsFil]);
  const filas = useMemo(
    () => filasTablaFachadas(fachadasFil, intervenciones, hoy),
    [fachadasFil, intervenciones, hoy],
  );
  const filasVis = filas.filter((f) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return f.etiqueta.toLowerCase().includes(n);
  });
  const PAGE_SIZE = 10;
  const paginaSafe =
    Math.max(0, Math.min(pagina, Math.max(0, Math.ceil(filasVis.length / PAGE_SIZE) - 1)));
  const filasPagina = filasVis.slice(
    paginaSafe * PAGE_SIZE,
    paginaSafe * PAGE_SIZE + PAGE_SIZE,
  );
  const vencimientos = useMemo(
    () =>
      proximosVencimientos(
        fachadasFil.map(listadoAIndicadores),
        intervenciones,
        hoy,
      ),
    [fachadasFil, intervenciones, hoy],
  );

  const portadaPorInt = useMemo(() => {
    return new Map(portadas.map((p) => [p.intervencionId, p]));
  }, [portadas]);

  const netoCostoM2 = agregarIndicadores(
    intsFil.filter((i) => {
      const f = fachadasFil.find((x) => x.id === i.fachadaId);
      return tieneSuperficieM2(f?.superficieM2);
    }),
  ).costos.totalNeto;
  const costoM2 =
    superficie.m2Intervenidos > 0 && netoCostoM2 > 0
      ? Math.round(netoCostoM2 / superficie.m2Intervenidos)
      : null;
  const pctMat =
    dash.costos.totalNeto > 0
      ? Math.round((dash.costos.materialesNeto / dash.costos.totalNeto) * 100)
      : null;
  const matTipos = intsFil.reduce(
    (acc, i) => {
      const m = materialesNetoPorTipo(i);
      acc.pintura += m.pintura;
      acc.otros += m.otros;
      return acc;
    },
    { pintura: 0, otros: 0 },
  );
  const hrefFicha = (id: string) =>
    modoDemo ? "/trabajos/fachadas/demo/ficha" : fachadaHref(categoriaId, subtipoId, id);
  const alertasN = new Set(alertas.cotizacionesAprobadasSinFactura.map((a) => a.intervencionId)).size;
  let cotizadoAlert = 0;
  let facturadoAlert = 0;
  for (const i of intsFil) {
    for (const d of i.documentos ?? []) {
      if (d.tipoDocumento === "cotizacion") cotizadoAlert += d.valorNeto;
      if (d.tipoDocumento === "factura" || d.tipoDocumento === "boleta") {
        facturadoAlert += d.valorNeto;
      }
    }
  }

  return (
    <SeccionErrorBoundary titulo="No se pudo mostrar el dashboard de Fachadas.">
      <div className="fd-dash space-y-5">
        <div className="fd-dash-filtros flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-nowrap gap-1 overflow-x-auto rounded-lg bg-[#eceae7] p-1 md:flex-wrap">
            {(
              [
                ["todos", "Todos", "Todos"],
                ["maestros_bodetek", "Maestros Bodetek", "Maestros"],
                ["proveedor_externo", "Proveedor externo", "Externos"],
              ] as const
            ).map(([id, label, corto]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "h-8 shrink-0 rounded-md px-3 text-sm font-medium",
                  tab === id ? "bg-white shadow-sm" : "text-muted-foreground",
                )}
              >
                <span className="md:hidden">{corto}</span>
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filtro.fechaDesde?.slice(0, 4) ?? String(anio)}
              onValueChange={(v) => {
                if (!v) return;
                setFiltro((f) => ({
                  ...f,
                  fechaDesde: `${v}-01-01`,
                  fechaHasta: v === String(anio) ? hoyIsoChile() : `${v}-12-31`,
                }));
              }}
            >
              <SelectTrigger className="h-9 w-[11rem] rounded-lg">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {[anio, anio - 1, anio - 2].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y === anio ? `Ene – ${mesHoy(hoy)} ${y}` : String(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtro.proveedorId ?? TODOS}
              onValueChange={(v) =>
                setFiltro((f) => ({ ...f, proveedorId: v === TODOS ? null : v }))
              }
            >
              <SelectTrigger className="h-9 w-[10rem] rounded-lg">
                <SelectValue placeholder="Proveedor" />
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
            {modoDemo ? <span className="fd-chip-ejemplo">Datos de ejemplo</span> : null}
          </div>
        </div>

        <div className="fd-dash-kpis grid grid-cols-2 gap-3 lg:grid-cols-5">
          <article className="fd-kpi">
            <p className="fd-kpi-label">Fachadas intervenidas</p>
            <p className="fd-kpi-value">
              {estados.intervenidas}{" "}
              <span className="text-base font-medium text-muted-foreground">
                de {estados.total}
              </span>
            </p>
            <div className="fd-progress mt-2">
              <span
                style={{
                  width: `${estados.total ? (estados.intervenidas / estados.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="fd-hint mt-2">
              {estados.al_dia} al día · {estados.en_ejecucion} en ejecución
            </p>
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Superficie</p>
            {superficie.cobertura.m === 0 ? (
              <>
                <p className="fd-kpi-value">
                  <EtiquetaM2 m2={null} />
                </p>
                <HintMdeN
                  className="mt-2"
                  m={superficie.cobertura.m}
                  n={superficie.cobertura.n}
                />
              </>
            ) : (
              <>
                <p className="fd-kpi-value">
                  {formatSuperficieEnteraCl(superficie.m2Intervenidos)}
                  <span className="ml-1 text-[13px] font-semibold text-muted-foreground">
                    m²
                  </span>
                </p>
                <p className="fd-hint mt-0.5">
                  de {formatSuperficieEnteraCl(superficie.m2Totales)} m²
                </p>
                <p className="fd-hint mt-2">
                  {superficie.pctIntervenidos != null
                    ? `${Math.round(superficie.pctIntervenidos)}% intervenido · `
                    : ""}
                  <span className="fd-quedan">
                    quedan {formatSuperficieEnteraCl(superficie.m2Restantes)} m²
                  </span>
                </p>
                {superficie.cobertura.m < superficie.cobertura.n ? (
                  <HintMdeN
                    className="mt-1"
                    m={superficie.cobertura.m}
                    n={superficie.cobertura.n}
                  />
                ) : null}
              </>
            )}
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Costo total · neto</p>
            <p className="fd-kpi-value">{formatMillonesClp(dash.costos.totalNeto)}</p>
            <p className="fd-hint mt-2">
              Mano de obra {formatMillonesClp(dash.costos.cotizacionesNeto)} ·
              Materiales {formatMillonesClp(dash.costos.materialesNeto)} ·
              Hojalatería {formatMillonesClp(dash.costos.hojalateriaNeto)}
            </p>
          </article>
          <article className="fd-kpi max-md:hidden">
            <p className="fd-kpi-label">Materiales · neto</p>
            <p className="fd-kpi-value">
              {formatMillonesClp(dash.costos.materialesNeto)}
            </p>
            <p className="fd-hint mt-2">
              Pintura {formatMillonesClp(matTipos.pintura)} · Otros{" "}
              {formatMillonesClp(matTipos.otros)}
            </p>
            <p className="fd-hint">
              {pctMat != null ? `${pctMat}% del costo total` : "Sin materiales"}
            </p>
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Costo por m² · neto</p>
            <p className="fd-kpi-value">
              {costoM2 != null ? formatMontoClp(costoM2) : "—"}
            </p>
            <p className="fd-hint mt-2">
              Maestros{" "}
              {quien.maestrosCostoM2 != null
                ? formatMontoClp(quien.maestrosCostoM2)
                : "—"}
              {" · "}
              Externos{" "}
              {quien.externosCostoM2 != null
                ? formatMontoClp(quien.externosCostoM2)
                : "—"}
            </p>
            {superficie.cobertura.m < superficie.cobertura.n ? (
              <HintMdeN
                className="mt-1"
                m={superficie.cobertura.m}
                n={superficie.cobertura.n}
              />
            ) : null}
          </article>
        </div>

        <div className="fd-dash-mapa grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
          <section className="fd-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Estado de las {estados.total} fachadas
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS_CALCULADOS_FACHADA.map((e) => (
                  <span key={e} className="fd-legend-pill">
                    <span
                      className={cn("inline-block size-2 rounded-sm", COLOR_CELDA_ESTADO[e])}
                    />
                    {labelEstadoCalculadoFachada(e)} · {estados[e]}
                  </span>
                ))}
              </div>
            </div>
            {fachadasFil.length === 0 ? (
              <div className="grid grid-cols-4 gap-1.5 md:grid-cols-9">
                <p className="col-span-full rounded-lg border border-dashed border-[#e6e3de] px-3 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay fachadas. El mapa se llena cuando creas la primera.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-4 gap-1.5 md:grid-cols-9">
              {fachadasFil.map((f) => {
                const estado = filas.find((x) => x.id === f.id)?.estado ?? "requiere_trabajo";
                const code = etiquetaMapaFachada(f.nombre);
                return (
                  <Link
                    key={f.id}
                    href={hrefFicha(f.id)}
                    title={f.nombre}
                    className={cn("fd-celda", COLOR_CELDA_ESTADO[estado])}
                  >
                    <span className="w-full truncate">{code}</span>
                    <span className="font-normal opacity-90">
                      {LABEL_CELDA_ESTADO[estado]}
                    </span>
                  </Link>
                );
              })}
            </div>
            )}
            <p className="fd-hint mt-3">
              Cada cuadro es una fachada. Haz clic para abrir su ficha con fotos,
              plano y documentos.
            </p>
          </section>

          <section className="fd-card p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Trabajos realizados</h2>
              <span className="fd-hint">Valor neto</span>
            </div>
            <ul className="space-y-2 text-sm">
              {trabajos.map((t) => (
                <li key={t.key} className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("fd-letter", COLOR_TIPO[t.key].letter)}>
                      {LETRA_TIPO[t.key]}
                    </span>
                    <span>
                      {t.key === "hojalateria"
                        ? "Hojalatería"
                        : TIPO_INTERVENCION_FACHADA_LABEL[t.key]}{" "}
                      <span className="text-muted-foreground">
                        {t.fachadasN} fach.
                        {t.key !== "hojalateria" ? ` · ${t.dias} días` : " · piezas"}
                      </span>
                    </span>
                  </span>
                  <span className="font-semibold">{formatMillonesClp(t.neto)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Quién ejecutó
            </p>
            <div className="fd-bar-exec mt-2">
              <span style={{ width: `${quien.pctMaestrosNeto ?? 50}%` }}>
                Maestros {quien.pctMaestrosNeto ?? 0}%
              </span>
              <span style={{ width: `${quien.pctExternosNeto ?? 50}%` }}>
                Externos {quien.pctExternosNeto ?? 0}%
              </span>
            </div>
            <p className="fd-hint mt-2">
              {quien.maestrosFachadas} fachadas · {formatMillonesClp(quien.maestrosNeto)}
              {" · "}
              {quien.externosFachadas} fachadas · {formatMillonesClp(quien.externosNeto)}
            </p>
            {alertasN > 0 ? (
              <p className="fd-alert">
                {alertasN} intervención{alertasN === 1 ? "" : "es"} con
                cotización y sin factura · Cotizado {formatMillonesClp(cotizadoAlert)} vs.
                facturado {formatMillonesClp(facturadoAlert)} (neto)
              </p>
            ) : null}
          </section>
        </div>

        <section className="fd-dash-venc fd-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Próximos vencimientos</h2>
          {vencimientos.length === 0 ? (
            <p className="fd-hint">
              No hay fachadas vencidas ni que venzan en los próximos 60 días.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
                const items = vencimientos.filter((v) => v.tipo === tipo);
                return (
                  <div key={tipo}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                    </p>
                    {items.length === 0 ? (
                      <p className="fd-hint">Sin vencimientos</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((v) => (
                          <li key={`${v.fachadaId}-${v.tipo}`}>
                            <Link
                              href={hrefFicha(v.fachadaId)}
                              className="flex items-baseline justify-between gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-[#faf9f7]"
                            >
                              <span className="truncate font-medium" title={v.nombre}>
                                {v.nombre}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  v.estado === "vencido"
                                    ? "bg-red-100 text-[#c8102e]"
                                    : "bg-amber-100 text-amber-800",
                                )}
                              >
                                {etiquetaChipVencimiento(v)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="fd-dash-antes">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Antes y después · últimas intervenciones</h2>
            {ultimas.length > 0 ? (
              <Link
                href={modoDemo ? "/trabajos/fachadas/demo/reporte" : hrefFicha(ultimas[0].fachadaId)}
                className="text-sm font-medium text-[#e30613] hover:underline"
              >
                Ver todas →
              </Link>
            ) : null}
          </div>
          {ultimas.length === 0 ? (
            <p className="fd-hint rounded-xl border border-dashed border-[#e6e3de] px-3 py-8 text-center">
              Aún no hay intervenciones para comparar.
            </p>
          ) : (
            <ul className="flex gap-3 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible">
              {ultimas.map((u) => {
                const f = fachadas.find((x) => x.id === u.fachadaId);
                const p = portadaPorInt.get(u.id);
                const nombreProv = proveedores.find((x) => x.id === u.proveedorId)
                  ?.nombre_empresa;
                return (
                  <li key={u.id} className="w-[78%] shrink-0 md:w-auto">
                    <Link
                      href={hrefFicha(u.fachadaId)}
                      className="block"
                    >
                      <div className="grid grid-cols-2 overflow-hidden rounded-xl">
                        <ParFoto url={p?.antesUrl ?? null} label="Antes" />
                        <ParFoto url={p?.despuesUrl ?? null} label="Después" after />
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {f?.nombre ?? "Fachada"}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {formatDiaMesCorto(u.fecha)}
                        </span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.tipos.map((t) => (
                          <span
                            key={t}
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px]",
                              COLOR_TIPO[t].chip,
                            )}
                          >
                            {TIPO_INTERVENCION_FACHADA_LABEL[t]}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">
                          {u.ejecutadoPor === "proveedor_externo"
                            ? nombreProv ?? "Proveedor externo"
                            : u.ejecutadoPor
                              ? EJECUTADO_POR_LABEL[u.ejecutadoPor]
                              : "—"}
                        </span>
                        <span className="float-right font-semibold">
                          {formatMontoClp(u.totalNeto)} neto
                        </span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="fd-dash-lista fd-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-sm font-semibold">Todas las fachadas</h2>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagina(0);
                setMovilVisibles(6);
              }}
              placeholder="Buscar fachada"
              className="h-9 max-w-xs rounded-lg"
            />
          </div>
          <ul className="divide-y md:hidden">
            {filasVis.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                No hay fachadas para mostrar.
              </li>
            ) : (
              filasVis.slice(0, movilVisibles).map((f) => {
                const fach = fachadas.find((x) => x.id === f.id);
                return (
                  <li key={f.id}>
                    <Link href={hrefFicha(f.id)} className="flex items-center gap-3 px-4 py-3">
                      {f.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.fotoUrl}
                          alt=""
                          className="size-14 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="size-14 shrink-0 rounded-lg bg-[#eceae7]" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="font-semibold leading-tight">{fach?.nombre ?? f.etiqueta}</span>
                          <ChipEstadoFachada estado={f.estado} />
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          <EtiquetaM2 m2={f.m2} decimales={2} />
                          {f.ultimaIso ? ` · ${formatDiaMes(f.ultimaIso)}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          {filasVis.length > movilVisibles ? (
            <button
              type="button"
              className="w-full border-t py-3 text-sm font-semibold md:hidden"
              onClick={() => setMovilVisibles((n) => n + 6)}
            >
              Cargar más
            </button>
          ) : null}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-y">
                  <th className="px-4 py-2 font-medium">Fachada</th>
                  <th className="px-2 py-2 font-medium">m²</th>
                  <th className="px-2 py-2 font-medium">Última intervención</th>
                  <th className="px-2 py-2 font-medium">Trabajos</th>
                  <th className="px-2 py-2 font-medium">Ejecutor</th>
                  <th className="px-2 py-2 font-medium">Documentos</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filasVis.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No hay fachadas para mostrar.
                    </td>
                  </tr>
                ) : (
                <>
                {filasPagina.map((f) => {
                  const fach = fachadas.find((x) => x.id === f.id);
                  const ultimaInt = intervenciones
                    .filter((i) => i.fachadaId === f.id)
                    .sort((a, b) =>
                      (b.fechaTermino || b.fechaInicio || "").localeCompare(
                        a.fechaTermino || a.fechaInicio || "",
                      ),
                    )[0];
                  const ejecutorLabel =
                    ultimaInt?.ejecutadoPor === "proveedor_externo"
                      ? proveedores.find((p) => p.id === ultimaInt.proveedorId)
                          ?.nombre_empresa ?? "Proveedor externo"
                      : ultimaInt?.ejecutadoPor
                        ? EJECUTADO_POR_LABEL[ultimaInt.ejecutadoPor]
                        : "—";
                  return (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={hrefFicha(f.id)}
                          className="inline-flex items-center gap-2 font-medium hover:underline"
                        >
                          <span className="size-8 rounded bg-[#eceae7]" />
                          {fach?.nombre ?? f.etiqueta}
                        </Link>
                      </td>
                      <td className="px-2 py-3">
                        <EtiquetaM2 m2={f.m2} conUnidad={false} />
                      </td>
                      <td className="px-2 py-3">
                        {f.estado === "en_ejecucion"
                          ? "En curso"
                          : f.estado === "programada" && f.ultimaIso
                            ? `Programada ${formatDiaMes(f.ultimaIso)}`
                            : f.ultimaIso
                              ? labelUltimaTabla(f.ultimaIso, f.estado, hoy)
                              : "—"}
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex gap-0.5">
                          {(
                            [
                              "limpieza",
                              "reparacion",
                              "pintura",
                              "hojalateria",
                            ] as const
                          ).map((t) =>
                            f.tipos.includes(t) ? (
                              <span
                                key={t}
                                className={cn("fd-letter", COLOR_TIPO[t].letter)}
                              >
                                {LETRA_TIPO[t]}
                              </span>
                            ) : null,
                          )}
                          {f.tipos.length === 0 ? "—" : null}
                        </span>
                      </td>
                      <td className="px-2 py-3">{ejecutorLabel}</td>
                      <td className="px-2 py-3 text-muted-foreground">{f.docsLabel}</td>
                      <td className="px-4 py-3">
                        <ChipEstadoFachada estado={f.estado} />
                      </td>
                    </tr>
                  );
                })}
                </>
                )}
              </tbody>
            </table>
          </div>
          <p className="fd-hint hidden flex-wrap items-center justify-between gap-2 px-4 py-3 md:flex">
            <span>
              Mostrando {filasPagina.length} de {filasVis.length}
              {" · "}L = Limpieza · R = Reparación · P = Pintura · H = Hojalatería
            </span>
            {filasVis.length > PAGE_SIZE ? (
              <span className="inline-flex gap-1">
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  disabled={paginaSafe === 0}
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs disabled:opacity-40"
                  disabled={(paginaSafe + 1) * PAGE_SIZE >= filasVis.length}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </button>
              </span>
            ) : null}
          </p>
        </section>
      </div>
    </SeccionErrorBoundary>
  );
}

function ParFoto({
  url,
  label,
  after,
}: {
  url: string | null;
  label: string;
  after?: boolean;
}) {
  return (
    <div className="relative aspect-[4/3] bg-[#eceae7]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : null}
      <span className={after ? "fd-badge-despues" : "fd-badge-antes"}>{label}</span>
    </div>
  );
}

function mesHoy(hoy: string): string {
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const m = Number((hoy || "").slice(5, 7));
  return meses[(Number.isFinite(m) ? m : 1) - 1] ?? "";
}

function labelUltimaTabla(
  iso: string,
  estado: string,
  hoy: string,
): string {
  if (estado === "programada") {
    return `Programada ${formatDiaMes(iso)}`;
  }
  const anio = iso.slice(0, 4);
  const anioHoy = hoy.slice(0, 4);
  if (anio !== anioHoy) {
    const raw = formatMesCortoCl(iso);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return formatDiaMesCorto(iso);
}
