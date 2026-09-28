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
import {
  alertasDocumentos,
  agregarIndicadores,
  etiquetaCortaFachada,
  FILTRO_DASHBOARD_VACIO,
  formatM2Cl,
  superficieDashboard,
  TIPO_INTERVENCION_FACHADA_LABEL,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
} from "@/lib/fachadas/indicadores";
import {
  conteosEstado,
  filasTablaFachadas,
  filtrarFachadasPorRecinto,
  listadoAIndicadores,
  quienEjecuto,
  trabajosRealizados,
  ultimasIntervenciones,
} from "@/lib/fachadas/dashboard";
import {
  COLOR_CELDA_ESTADO,
  COLOR_TIPO,
  formatDiaMesCorto,
  formatMesCortoCl,
  formatMillonesClp,
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
  recintos,
  proveedores,
}: {
  categoriaId: string;
  subtipoId: string;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  portadas: PortadaIntervencion[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
}) {
  const anio = new Date().getFullYear();
  const [filtro, setFiltro] = useState<FiltroDashboardFachadas>({
    ...FILTRO_DASHBOARD_VACIO,
    fechaDesde: `${anio}-01-01`,
    fechaHasta: hoyIsoChile(),
  });
  const [tab, setTab] = useState<"todos" | "maestros_bodetek" | "proveedor_externo">(
    "todos",
  );
  const [q, setQ] = useState("");

  const filtroEfectivo: FiltroDashboardFachadas = {
    ...filtro,
    ejecutadoPor: tab === "todos" ? filtro.ejecutadoPor : tab,
  };

  const fachadasFil = useMemo(
    () => filtrarFachadasPorRecinto(fachadas, filtroEfectivo.recintoId),
    [fachadas, filtroEfectivo.recintoId],
  );
  const intsFil = useMemo(
    () =>
      intervenciones.filter((i) => {
        if (filtroEfectivo.recintoId && i.recintoId !== filtroEfectivo.recintoId) {
          return false;
        }
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
    () => conteosEstado(fachadasFil, intervenciones),
    [fachadasFil, intervenciones],
  );
  const trabajos = useMemo(() => trabajosRealizados(intsFil), [intsFil]);
  const quien = useMemo(() => quienEjecuto(intsFil), [intsFil]);
  const alertas = useMemo(() => alertasDocumentos(intsFil), [intsFil]);
  const ultimas = useMemo(() => ultimasIntervenciones(intsFil, 3), [intsFil]);
  const filas = useMemo(
    () => filasTablaFachadas(fachadasFil, intervenciones),
    [fachadasFil, intervenciones],
  );
  const filasVis = filas.filter((f) => {
    if (!q.trim()) return true;
    const n = q.trim().toLowerCase();
    return (
      f.etiqueta.toLowerCase().includes(n) ||
      f.recinto.toLowerCase().includes(n)
    );
  });

  const portadaPorInt = useMemo(() => {
    return new Map(portadas.map((p) => [p.intervencionId, p]));
  }, [portadas]);

  const costoM2 =
    superficie.m2Intervenidos > 0 && dash.costos.totalNeto > 0
      ? Math.round(dash.costos.totalNeto / superficie.m2Intervenidos)
      : null;
  const pctMat =
    dash.costos.totalNeto > 0
      ? Math.round((dash.costos.materialesNeto / dash.costos.totalNeto) * 100)
      : null;

  return (
    <SeccionErrorBoundary titulo="No se pudo mostrar el dashboard de Fachadas.">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg bg-[#eceae7] p-1">
            {(
              [
                ["todos", "Todos"],
                ["maestros_bodetek", "Maestros Bodetek"],
                ["proveedor_externo", "Proveedor externo"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "h-8 rounded-md px-3 text-sm font-medium",
                  tab === id ? "bg-white shadow-sm" : "text-muted-foreground",
                )}
              >
                {label}
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
                    {y === anio ? `Ene – ${mesHoy()} ${y}` : String(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtro.recintoId ?? TODOS}
              onValueChange={(v) =>
                setFiltro((f) => ({ ...f, recintoId: v === TODOS ? null : v }))
              }
            >
              <SelectTrigger className="h-9 w-[9rem] rounded-lg">
                <SelectValue placeholder="Recinto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {recintos.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.codigo}
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
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            <p className="fd-kpi-value">
              {formatM2Cl(superficie.m2Intervenidos)}
              <span className="text-base font-medium text-muted-foreground">
                {" "}
                de {formatM2Cl(superficie.m2Totales)} m²
              </span>
            </p>
            <p className="fd-hint mt-2">
              {superficie.pctIntervenidos != null
                ? `${formatM2Cl(superficie.pctIntervenidos)}% intervenido · `
                : ""}
              quedan {formatM2Cl(superficie.m2Restantes)} m²
            </p>
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
          <article className="fd-kpi">
            <p className="fd-kpi-label">Materiales · neto</p>
            <p className="fd-kpi-value">
              {formatMillonesClp(dash.costos.materialesNeto)}
            </p>
            <p className="fd-hint mt-2">
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
              {formatMontoClp(
                Math.round(quien.maestrosNeto / Math.max(1, superficie.m2Intervenidos)),
              )}
              {" · "}
              Externos{" "}
              {formatMontoClp(
                Math.round(quien.externosNeto / Math.max(1, superficie.m2Intervenidos)),
              )}
            </p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
          <section className="fd-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Estado de las {estados.total} fachadas
              </h2>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {ESTADOS_CALCULADOS_FACHADA.map((e) => (
                  <span key={e} className="inline-flex items-center gap-1">
                    <span
                      className={cn("inline-block size-2 rounded-sm", COLOR_CELDA_ESTADO[e])}
                    />
                    {labelEstadoCalculadoFachada(e)} · {estados[e]}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
              {fachadasFil.map((f) => {
                const estado = filas.find((x) => x.id === f.id)?.estado ?? "requiere_trabajo";
                const code =
                  etiquetaCortaFachada(f.recintoCodigo, f.letra).replace("·", "-") ||
                  f.nombre;
                return (
                  <Link
                    key={f.id}
                    href={fachadaHref(categoriaId, subtipoId, f.id)}
                    className={cn("fd-celda", COLOR_CELDA_ESTADO[estado])}
                  >
                    <span>{code}</span>
                    <span className="font-normal opacity-90">
                      {labelEstadoCalculadoFachada(estado)}
                    </span>
                  </Link>
                );
              })}
            </div>
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
            {alertas.cotizacionesAprobadasSinFactura.length > 0 ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#9b1b2e]">
                {alertas.cotizacionesAprobadasSinFactura.length} intervención
                {alertas.cotizacionesAprobadasSinFactura.length === 1 ? "" : "es"}{" "}
                con cotización y sin factura
              </p>
            ) : null}
          </section>
        </div>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Antes y después · últimas intervenciones</h2>
          </div>
          {ultimas.length === 0 ? (
            <p className="fd-hint">Aún no hay intervenciones para comparar.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {ultimas.map((u) => {
                const f = fachadas.find((x) => x.id === u.fachadaId);
                const p = portadaPorInt.get(u.id);
                const nombreProv = proveedores.find((x) => x.id === u.proveedorId)
                  ?.nombre_empresa;
                return (
                  <li key={u.id}>
                    <Link
                      href={fachadaHref(categoriaId, subtipoId, u.fachadaId)}
                      className="block"
                    >
                      <div className="grid grid-cols-2 overflow-hidden rounded-xl">
                        <ParFoto url={p?.antesUrl ?? f?.fotoUrl ?? null} label="Antes" />
                        <ParFoto url={p?.despuesUrl ?? null} label="Después" after />
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {f
                          ? `${f.recintoCodigo ?? f.recintoEtiqueta}${f.letra ? ` · Fachada ${f.letra}` : ""}`
                          : "Fachada"}
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

        <section className="fd-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-sm font-semibold">Todas las fachadas</h2>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar recinto o fachada"
              className="h-9 max-w-xs rounded-lg"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-y">
                  <th className="px-4 py-2 font-medium">Fachada</th>
                  <th className="px-2 py-2 font-medium">Recinto</th>
                  <th className="px-2 py-2 font-medium">m²</th>
                  <th className="px-2 py-2 font-medium">Última intervención</th>
                  <th className="px-2 py-2 font-medium">Trabajos</th>
                  <th className="px-2 py-2 font-medium">Ejecutor</th>
                  <th className="px-2 py-2 font-medium">Documentos</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filasVis.map((f) => {
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
                          href={fachadaHref(categoriaId, subtipoId, f.id)}
                          className="inline-flex items-center gap-2 font-medium hover:underline"
                        >
                          {fach?.fotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fach.fotoUrl}
                              alt=""
                              className="size-8 rounded object-cover"
                            />
                          ) : (
                            <span className="size-8 rounded bg-[#eceae7]" />
                          )}
                          {fach?.recintoCodigo ?? f.recinto}
                          {fach?.letra ? ` · ${fach.letra}` : ""}
                        </Link>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {fach?.recintoEtiqueta ?? f.recinto}
                      </td>
                      <td className="px-2 py-3">{formatM2Cl(f.m2)}</td>
                      <td className="px-2 py-3">
                        {f.estado === "en_ejecucion"
                          ? "En curso"
                          : f.ultimaIso
                            ? formatDiaMesCorto(f.ultimaIso)
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
              </tbody>
            </table>
          </div>
          <p className="fd-hint px-4 py-3">
            Mostrando {filasVis.length} de {filas.length}
            {" · "}L = Limpieza · R = Reparación · P = Pintura · H = Hojalatería
            {" · "}
            {formatMesCortoCl(filtro.fechaDesde)} – {formatMesCortoCl(filtro.fechaHasta)}
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
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : null}
      <span className={after ? "fd-badge-despues" : "fd-badge-antes"}>{label}</span>
    </div>
  );
}

function mesHoy(): string {
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
  return meses[new Date().getMonth()] ?? "";
}
