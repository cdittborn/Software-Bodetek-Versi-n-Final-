"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListaFachadasAgrupada } from "@/components/fachadas/ListaFachadasAgrupada";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { HintMdeN } from "@/components/fachadas/HintMdeN";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import { PlanoFachadas, type FichaPlano, type VariantePlano } from "@/components/fachadas/plano/PlanoFachadas";
import { FACHADAS_PLANO } from "@/components/fachadas/plano/geometria";
import { formatSuperficieEnteraCl } from "@/lib/fachadas/formato";
import {
  alertasDocumentos,
  agregarIndicadores,
  esCompletaParaCostos,
  etiquetaChipVencimiento,
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
  agruparFachadasPorUnidad,
  conteosEstado,
  listadoAIndicadores,
  quienEjecuto,
  trabajosRealizados,
  ultimasIntervenciones,
} from "@/lib/fachadas/dashboard";
import { estadoAFecha, estadoPlano } from "@/lib/fachadas/estado-a-fecha";
import {
  COLOR_TIPO,
  formatDiaMesCorto,
  formatMillonesClp,
  LETRA_TIPO,
} from "@/lib/fachadas/ui";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import {
  ESTADOS_PLANO,
  estiloEstado,
  type EstadoPlano,
} from "@/lib/fachadas/plano";
import {
  etiquetaInicioTemporada,
  fechaHastaTemporada,
  inicioTemporada,
  opcionesTemporada,
} from "@/lib/fachadas/temporada";
import { EJECUTADO_POR_LABEL, formatMontoClp } from "@/lib/trabajos";
import { fachadaHref } from "@/lib/fachadas/rutas";
import { cn } from "@/lib/utils";
import "./fachadas.css";
import type { FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

const TODOS = "todos";
const ALTO_CONTROL = { height: 44, minHeight: 44 };

export function DashboardFachadas({
  categoriaId,
  subtipoId,
  fachadas,
  intervenciones,
  portadas,
  proveedores,
  modoDemo = false,
  hoy: hoyProp,
  puedeEditar = false,
  onAbrirRegistro,
  enlaceFachada,
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
  puedeEditar?: boolean;
  onAbrirRegistro?: () => void;
  enlaceFachada?: (id: string) => string;
}) {
  const router = useRouter();
  const hoy = hoyProp ?? hoyIsoChile();
  const temporadaActual = inicioTemporada(hoy);
  const [filtro, setFiltro] = useState<FiltroDashboardFachadas>({
    fechaDesde: temporadaActual,
    fechaHasta: fechaHastaTemporada(temporadaActual, hoy),
    ejecutadoPor: "todos",
    proveedorId: null,
    recintoId: null,
    tipo: "todos",
  });
  const [tab, setTab] = useState<"todos" | "maestros_bodetek" | "proveedor_externo">("todos");
  const [vistaAntes, setVistaAntes] = useState(false);
  const [filtroLeyenda, setFiltroLeyenda] = useState<EstadoPlano | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  const [variante, setVariante] = useState<VariantePlano>("movil");
  const [tarjetaSvg, setTarjetaSvg] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const aplicar = () => setVariante(media.matches ? "completo" : "movil");
    aplicar();
    media.addEventListener("change", aplicar);
    return () => media.removeEventListener("change", aplicar);
  }, []);

  const inicio = filtro.fechaDesde ?? temporadaActual;
  const etiquetaInicio = etiquetaInicioTemporada(inicio);

  const intsTab = useMemo(
    () =>
      intervenciones.filter((intervencion) => {
        if (tab !== "todos" && intervencion.ejecutadoPor !== tab) return false;
        if (filtro.proveedorId && intervencion.proveedorId !== filtro.proveedorId) return false;
        return true;
      }),
    [intervenciones, tab, filtro.proveedorId],
  );
  const intsFil = useMemo(
    () =>
      intsTab.filter((intervencion) => {
        if (!filtro.fechaDesde && !filtro.fechaHasta) return true;
        const fechas = [intervencion.fechaInicio, intervencion.fechaTermino].filter(Boolean) as string[];
        if (fechas.length === 0) return false;
        return fechas.some(
          (fecha) =>
            (!filtro.fechaDesde || fecha >= filtro.fechaDesde) &&
            (!filtro.fechaHasta || fecha <= filtro.fechaHasta),
        );
      }),
    [intsTab, filtro.fechaDesde, filtro.fechaHasta],
  );

  const dash = useMemo(() => agregarIndicadores(intsFil), [intsFil]);
  const superficie = useMemo(
    () =>
      superficieDashboard(
        fachadas.map(listadoAIndicadores),
        intsFil,
        { ...filtro, ejecutadoPor: tab === "todos" ? "todos" : tab, recintoId: null },
      ),
    [fachadas, intsFil, filtro, tab],
  );
  const estados = useMemo(() => conteosEstado(fachadas, intsTab, hoy), [fachadas, intsTab, hoy]);
  const trabajos = useMemo(
    () => trabajosRealizados(intsFil.filter(esCompletaParaCostos)),
    [intsFil],
  );
  const quien = useMemo(() => quienEjecuto(intsFil.filter(esCompletaParaCostos)), [intsFil]);
  const alertas = useMemo(() => alertasDocumentos(intsFil), [intsFil]);
  const ultimas = useMemo(() => ultimasIntervenciones(intsFil, 3), [intsFil]);
  const vencimientos = useMemo(
    () => proximosVencimientos(fachadas.map(listadoAIndicadores), intervenciones, hoy),
    [fachadas, intervenciones, hoy],
  );
  const haciaPorSvgId = useMemo(() => {
    const out: Record<string, string> = {};
    for (const fachada of FACHADAS_PLANO) out[fachada.id] = fachada.hacia;
    return out;
  }, []);
  const grupos = useMemo(
    () =>
      agruparFachadasPorUnidad(fachadas, intervenciones, {
        hoy,
        comoAntes: vistaAntes,
        inicio,
        haciaPorSvgId,
      }),
    [fachadas, intervenciones, hoy, vistaAntes, inicio, haciaPorSvgId],
  );
  const estadosPlano = useMemo(() => {
    const out: Record<string, EstadoPlano> = {};
    for (const fachada of fachadas) {
      if (!fachada.svgId) continue;
      out[fachada.svgId] = vistaAntes
        ? estadoAFecha(fachada, intervenciones, inicio)
        : estadoPlano(fachada, intervenciones, hoy);
    }
    return out;
  }, [fachadas, intervenciones, vistaAntes, inicio, hoy]);
  const conteoLeyenda = useMemo(() => {
    const out: Record<EstadoPlano, number> = {
      requiere_trabajo: 0,
      programada: 0,
      en_ejecucion: 0,
      al_dia: 0,
      sin_evaluar: 0,
    };
    for (const fachada of fachadas) {
      const estado = vistaAntes
        ? estadoAFecha(fachada, intervenciones, inicio)
        : estadoPlano(fachada, intervenciones, hoy);
      out[estado] += 1;
    }
    return out;
  }, [fachadas, intervenciones, vistaAntes, inicio, hoy]);
  const fichas = useMemo(() => {
    const out: Record<string, FichaPlano> = {};
    for (const grupo of grupos) {
      for (const fila of grupo.filas) {
        const fachada = fachadas.find((item) => item.id === fila.id);
        if (!fachada?.svgId) continue;
        out[fachada.svgId] = {
          superficieM2: fila.m2,
          ultimaIntervencion: fila.ultimaIso ? formatDiaMesCorto(fila.ultimaIso) : null,
        };
      }
    }
    return out;
  }, [grupos, fachadas]);

  const portadaPorInt = useMemo(() => new Map(portadas.map((portada) => [portada.intervencionId, portada])), [portadas]);
  const netoCostoM2 = agregarIndicadores(
    intsFil.filter((intervencion) => {
      const fachada = fachadas.find((item) => item.id === intervencion.fachadaId);
      return tieneSuperficieM2(fachada?.superficieM2);
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
    (acc, intervencion) => {
      const materiales = materialesNetoPorTipo(intervencion);
      acc.pintura += materiales.pintura;
      acc.otros += materiales.otros;
      return acc;
    },
    { pintura: 0, otros: 0 },
  );
  const hrefDe = (id: string) =>
    enlaceFachada
      ? enlaceFachada(id)
      : modoDemo
        ? "/trabajos/fachadas/demo/ficha"
        : fachadaHref(categoriaId, subtipoId, id);
  const alertasN = new Set(alertas.cotizacionesAprobadasSinFactura.map((alerta) => alerta.intervencionId)).size;
  let cotizadoAlert = 0;
  let facturadoAlert = 0;
  for (const intervencion of intsFil) {
    for (const documento of intervencion.documentos ?? []) {
      if (documento.tipoDocumento === "cotizacion") cotizadoAlert += documento.valorNeto;
      if (documento.tipoDocumento === "factura" || documento.tipoDocumento === "boleta") {
        facturadoAlert += documento.valorNeto;
      }
    }
  }
  const geometriaTarjeta = tarjetaSvg ? FACHADAS_PLANO.find((item) => item.id === tarjetaSvg) : null;
  const fachadaTarjeta = geometriaTarjeta
    ? fachadas.find((item) => item.svgId === geometriaTarjeta.id)
    : null;
  const filaTarjeta = fachadaTarjeta
    ? grupos.flatMap((grupo) => grupo.filas).find((fila) => fila.id === fachadaTarjeta.id)
    : null;

  return (
    <SeccionErrorBoundary titulo="No se pudo mostrar el dashboard de Fachadas.">
      <div className="fd-dash min-w-0 space-y-5">
        <div
          className="fd-dash-filtros flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"
          data-seccion="tabs"
        >
          <div role="tablist" aria-label="Ejecutor" className="grid grid-cols-3 gap-1 rounded-lg bg-[#eceae7] p-1 md:flex">
            {(
              [
                ["todos", "Todos", "Todos"],
                ["maestros_bodetek", "Maestros Bodetek", "Maestros"],
                ["proveedor_externo", "Proveedor externo", "Externos"],
              ] as const
            ).map(([id, etiqueta, corto]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "min-h-11 rounded-md px-2 text-sm font-medium",
                  tab === id ? "bg-white shadow-sm" : "text-muted-foreground",
                )}
                style={ALTO_CONTROL}
              >
                <span className="md:hidden">{corto}</span>
                <span className="hidden md:inline">{etiqueta}</span>
              </button>
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 md:flex">
            <Select
              value={inicio}
              onValueChange={(valor) => {
                if (!valor) return;
                setFiltro((actual) => ({
                  ...actual,
                  fechaDesde: valor,
                  fechaHasta: fechaHastaTemporada(valor, hoy),
                }));
              }}
            >
              <SelectTrigger className="w-full rounded-lg md:w-[14rem]" style={ALTO_CONTROL}>
                <SelectValue placeholder="Temporada" />
              </SelectTrigger>
              <SelectContent>
                {opcionesTemporada(hoy).map((opcion) => (
                  <SelectItem key={opcion.inicio} value={opcion.inicio}>
                    {opcion.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtro.proveedorId ?? TODOS}
              onValueChange={(valor) =>
                setFiltro((actual) => ({ ...actual, proveedorId: valor === TODOS ? null : valor }))
              }
            >
              <SelectTrigger className="w-full rounded-lg md:w-[10rem]" style={ALTO_CONTROL}>
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {proveedores.map((proveedor) => (
                  <SelectItem key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre_empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modoDemo ? <span className="fd-chip-ejemplo col-span-2 max-md:hidden">Datos de ejemplo</span> : null}
          </div>
        </div>

        <div className="fd-dash-kpis grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-5" data-seccion="kpis">
          <article className="fd-kpi col-span-2 lg:col-span-1">
            <p className="fd-kpi-label">Fachadas intervenidas</p>
            <p className="fd-kpi-value">
              {estados.intervenidas}{" "}
              <span className="text-base font-medium text-muted-foreground">de {estados.total}</span>
            </p>
            <div className="fd-progress mt-2">
              <span
                style={{
                  width: `${estados.total ? (estados.intervenidas / estados.total) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="fd-hint mt-2">
              {estados.al_dia} al día · {estados.en_ejecucion} en obra
            </p>
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Superficie</p>
            {superficie.cobertura.m === 0 ? (
              <>
                <p className="fd-kpi-value">
                  <EtiquetaM2 m2={null} />
                </p>
                <HintMdeN className="mt-2" m={superficie.cobertura.m} n={superficie.cobertura.n} />
              </>
            ) : (
              <>
                <p className="fd-kpi-value">
                  {formatSuperficieEnteraCl(superficie.m2Intervenidos)}
                  <span className="ml-1 text-[13px] font-semibold text-muted-foreground">m²</span>
                </p>
                <p className="fd-hint mt-0.5">de {formatSuperficieEnteraCl(superficie.m2Totales)} m²</p>
                <p className="fd-hint mt-2">
                  {superficie.pctIntervenidos != null
                    ? `${Math.round(superficie.pctIntervenidos)}% intervenido · `
                    : ""}
                  <span className="fd-quedan">quedan {formatSuperficieEnteraCl(superficie.m2Restantes)} m²</span>
                </p>
                {superficie.cobertura.m < superficie.cobertura.n ? (
                  <HintMdeN className="mt-1" m={superficie.cobertura.m} n={superficie.cobertura.n} />
                ) : null}
              </>
            )}
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Costo total · neto</p>
            <p className="fd-kpi-value">{formatMillonesClp(dash.costos.totalNeto)}</p>
            <p className="fd-hint mt-2">
              Mano de obra {formatMillonesClp(dash.costos.cotizacionesNeto)} · Materiales{" "}
              {formatMillonesClp(dash.costos.materialesNeto)} · Hojalatería{" "}
              {formatMillonesClp(dash.costos.hojalateriaNeto)}
            </p>
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Materiales · neto</p>
            <p className="fd-kpi-value">{formatMillonesClp(dash.costos.materialesNeto)}</p>
            <p className="fd-hint mt-2">
              Pintura {formatMillonesClp(matTipos.pintura)} · Otros {formatMillonesClp(matTipos.otros)}
            </p>
            <p className="fd-hint">{pctMat != null ? `${pctMat}% del costo total` : "Sin materiales"}</p>
          </article>
          <article className="fd-kpi">
            <p className="fd-kpi-label">Costo por m² · neto</p>
            <p className="fd-kpi-value">{costoM2 != null ? formatMontoClp(costoM2) : "—"}</p>
            <p className="fd-hint mt-2">
              Maestros {quien.maestrosCostoM2 != null ? formatMontoClp(quien.maestrosCostoM2) : "—"}
              {" · "}
              Externos {quien.externosCostoM2 != null ? formatMontoClp(quien.externosCostoM2) : "—"}
            </p>
            {superficie.cobertura.m < superficie.cobertura.n ? (
              <HintMdeN className="mt-1" m={superficie.cobertura.m} n={superficie.cobertura.n} />
            ) : null}
          </article>
        </div>

        <section className="fd-dash-plano fd-card relative min-w-0 p-4" data-seccion="plano">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={vistaAntes}
              className={cn(
                "min-h-11 rounded-lg border px-2 text-sm font-medium",
                vistaAntes ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white",
              )}
              onClick={() => setVistaAntes(true)}
            >
              <span className="md:hidden">Como antes · {etiquetaInicio}</span>
              <span className="hidden md:inline">Ver como antes · {etiquetaInicio}</span>
            </button>
            <button
              type="button"
              aria-pressed={!vistaAntes}
              className={cn(
                "min-h-11 rounded-lg border px-2 text-sm font-medium",
                !vistaAntes ? "border-neutral-900 bg-neutral-900 text-white" : "bg-white",
              )}
              onClick={() => setVistaAntes(false)}
            >
              <span className="md:hidden">Hoy</span>
              <span className="hidden md:inline">Ver hoy</span>
            </button>
          </div>
          <div data-leyenda-scroll className="mb-3 flex max-w-full gap-2 overflow-x-auto">
            {ESTADOS_PLANO.map((estado) => {
              const estilo = estiloEstado(estado);
              return (
                <button
                  key={estado}
                  type="button"
                  aria-pressed={filtroLeyenda === estado}
                  onClick={() => setFiltroLeyenda((actual) => (actual === estado ? null : estado))}
                  className={cn(
                    "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm",
                    filtroLeyenda === estado ? "border-neutral-900" : "border-transparent bg-[#f6f7f8]",
                  )}
                >
                  <Trazo estado={estado} />
                  <span style={{ color: estilo.badgeTexto }}>
                    {estilo.etiqueta} · {conteoLeyenda[estado]}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center rounded-full border px-3 text-sm font-medium"
              onClick={() => setFiltroLeyenda(null)}
            >
              Mostrar todas
            </button>
          </div>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              data-ampliar
              aria-pressed={ampliado}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white"
              onClick={() => setAmpliado((actual) => !actual)}
            >
              {ampliado ? "Reducir" : "Ampliar"}
            </button>
          </div>
          <PlanoFachadas
            modo={vistaAntes ? "antes" : "hoy"}
            variante={variante}
            ampliado={ampliado}
            estados={estadosPlano}
            filtro={filtroLeyenda}
            fichas={fichas}
            onPick={(svgId) => {
              if (variante === "completo") setTarjetaSvg(svgId);
            }}
            onAbrirFicha={(svgId) => {
              const fachada = fachadas.find((item) => item.svgId === svgId);
              if (fachada) router.push(hrefDe(fachada.id));
            }}
          />
          <p className="fd-hint mt-3">
            Toca un muro para ver su detalle. Usa «Ampliar» o pellizca para acercar.
          </p>
          {variante === "completo" && geometriaTarjeta && filaTarjeta ? (
            <TarjetaFachada
              nombre={geometriaTarjeta.nombre}
              ubicacion={geometriaTarjeta.ubicacion}
              hacia={geometriaTarjeta.hacia}
              estado={filaTarjeta.estado}
              m2={filaTarjeta.m2}
              ultima={filaTarjeta.ultimaIso}
              href={hrefDe(filaTarjeta.id)}
              onCerrar={() => setTarjetaSvg(null)}
            />
          ) : null}
        </section>

        <ListaFachadasAgrupada grupos={grupos} hrefFachada={hrefDe} />

        <section className="fd-dash-venc fd-card min-w-0 p-4" data-seccion="vencimientos">
          <h2 className="mb-3 text-sm font-semibold">Próximos vencimientos</h2>
          {vencimientos.length === 0 ? (
            <p className="fd-hint">No hay fachadas vencidas ni que venzan en los próximos 60 días.</p>
          ) : (
            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
                const items = vencimientos.filter((vencimiento) => vencimiento.tipo === tipo);
                return (
                  <div key={tipo} className="min-w-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                    </p>
                    {items.length === 0 ? (
                      <p className="fd-hint">Sin vencimientos</p>
                    ) : (
                      <ul className="space-y-1">
                        {items.slice(0, 3).map((vencimiento) => (
                          <li key={`${vencimiento.fachadaId}-${vencimiento.tipo}`}>
                            <VencimientoLink vencimiento={vencimiento} href={hrefDe(vencimiento.fachadaId)} />
                          </li>
                        ))}
                        {items.slice(3).map((vencimiento) => (
                          <li key={`${vencimiento.fachadaId}-${vencimiento.tipo}-rest`} className="hidden md:block">
                            <VencimientoLink vencimiento={vencimiento} href={hrefDe(vencimiento.fachadaId)} />
                          </li>
                        ))}
                        {items.length > 3 ? (
                          <li className="fd-hint px-1 md:hidden">y {items.length - 3} más</li>
                        ) : null}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="fd-dash-trabajos fd-card min-w-0 p-4" data-seccion="trabajos">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Trabajos realizados</h2>
            <span className="fd-hint">Valor neto</span>
          </div>
          <ul className="space-y-2 text-sm">
            {trabajos.map((trabajo) => (
              <li key={trabajo.key} className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span className={cn("fd-letter", COLOR_TIPO[trabajo.key].letter)}>{LETRA_TIPO[trabajo.key]}</span>
                  <span className="min-w-0">
                    {trabajo.key === "hojalateria" ? "Hojalatería" : TIPO_INTERVENCION_FACHADA_LABEL[trabajo.key]}{" "}
                    <span className="text-muted-foreground">
                      {trabajo.fachadasN} fach.
                      {trabajo.key !== "hojalateria" ? ` · ${trabajo.dias} días` : " · piezas"}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold">{formatMillonesClp(trabajo.neto)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quién ejecutó</p>
          <div className="fd-bar-exec mt-2">
            <span style={{ width: `${quien.pctMaestrosNeto ?? 50}%` }}>Maestros {quien.pctMaestrosNeto ?? 0}%</span>
            <span style={{ width: `${quien.pctExternosNeto ?? 50}%` }}>Externos {quien.pctExternosNeto ?? 0}%</span>
          </div>
          <p className="fd-hint mt-2">
            {quien.maestrosFachadas} fachadas · {formatMillonesClp(quien.maestrosNeto)}
            {" · "}
            {quien.externosFachadas} fachadas · {formatMillonesClp(quien.externosNeto)}
          </p>
          {alertasN > 0 ? (
            <p className="fd-alert">
              {alertasN} intervención{alertasN === 1 ? "" : "es"} con cotización y sin factura · Cotizado{" "}
              {formatMillonesClp(cotizadoAlert)} vs. facturado {formatMillonesClp(facturadoAlert)} (neto)
            </p>
          ) : null}
        </section>

        <section className="fd-dash-antes min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Antes y después · últimas intervenciones</h2>
            {ultimas.length > 0 ? (
              <Link
                href={modoDemo ? "/trabajos/fachadas/demo/reporte" : hrefDe(ultimas[0].fachadaId)}
                className="inline-flex min-h-11 items-center text-sm font-medium text-[#e30613]"
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
            <ul className="grid min-w-0 gap-3 md:grid-cols-3">
              {ultimas.map((ultima) => {
                const fachada = fachadas.find((item) => item.id === ultima.fachadaId);
                const portada = portadaPorInt.get(ultima.id);
                const nombreProv = proveedores.find((item) => item.id === ultima.proveedorId)?.nombre_empresa;
                return (
                  <li key={ultima.id} className="min-w-0">
                    <Link href={hrefDe(ultima.fachadaId)} className="block min-h-11">
                      <div className="grid grid-cols-2 overflow-hidden rounded-xl">
                        <ParFoto url={portada?.antesUrl ?? null} label="Antes" />
                        <ParFoto url={portada?.despuesUrl ?? null} label="Después" after />
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {fachada?.nombre ?? "Fachada"}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {formatDiaMesCorto(ultima.fecha)}
                        </span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ultima.tipos.map((tipo) => (
                          <span key={tipo} className={cn("rounded-full border px-2 py-0.5 text-[11px]", COLOR_TIPO[tipo].chip)}>
                            {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">
                          {ultima.ejecutadoPor === "proveedor_externo"
                            ? nombreProv ?? "Proveedor externo"
                            : ultima.ejecutadoPor
                              ? EJECUTADO_POR_LABEL[ultima.ejecutadoPor]
                              : "—"}
                        </span>
                        <span className="float-right font-semibold">{formatMontoClp(ultima.totalNeto)} neto</span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {puedeEditar && onAbrirRegistro ? (
          <button type="button" className="fd-btn-primary fd-dash-registrar" data-registrar onClick={onAbrirRegistro}>
            Registrar intervención
          </button>
        ) : null}
      </div>
    </SeccionErrorBoundary>
  );
}

function Trazo({ estado }: { estado: EstadoPlano }) {
  const estilo = estiloEstado(estado);
  return (
    <svg width={28} height={10} aria-hidden="true">
      <line
        x1={1}
        y1={5}
        x2={27}
        y2={5}
        stroke={estilo.color}
        strokeWidth={3}
        strokeDasharray={estilo.dashLeyenda ?? undefined}
        strokeLinecap={estilo.linecap}
      />
    </svg>
  );
}

function TarjetaFachada({
  nombre,
  ubicacion,
  hacia,
  estado,
  m2,
  ultima,
  href,
  onCerrar,
}: {
  nombre: string;
  ubicacion: "interior" | "exterior";
  hacia: string;
  estado: EstadoPlano;
  m2: number | null;
  ultima: string | null;
  href: string;
  onCerrar: () => void;
}) {
  const estilo = estiloEstado(estado);
  return (
    <div className="absolute top-16 right-4 z-20 w-72 max-w-[calc(100%-2rem)] rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/10">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-snug">{nombre}</p>
        <button
          type="button"
          aria-label="Cerrar tarjeta"
          className="inline-flex shrink-0 items-center justify-center rounded-md border"
          style={ALTO_CONTROL}
          onClick={onCerrar}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
      <span
        className="mt-2 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-semibold"
        style={{ background: estilo.badgeBg, color: estilo.badgeTexto }}
      >
        <Trazo estado={estado} />
        {estilo.etiqueta}
      </span>
      <p className="mt-2 text-sm">
        <EtiquetaM2 m2={m2} />
      </p>
      <p className="text-sm text-muted-foreground">
        {ultima ? `Última intervención: ${formatDiaMesCorto(ultima)}` : "Sin intervenciones"}
      </p>
      <p className="text-sm">
        {ubicacion === "exterior" ? "Exterior" : "Interior"} · hacia {hacia}
      </p>
      <Link href={href} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#e30613]">
        Abrir ficha completa
      </Link>
    </div>
  );
}

function VencimientoLink({
  vencimiento,
  href,
}: {
  vencimiento: {
    nombre: string;
    estado: "vencido" | "vence_pronto";
    diasHasta: number | null;
    proximaFecha: string | null;
  };
  href: string;
}) {
  const naranjo = vencimiento.estado !== "vencido" && vencimiento.diasHasta != null && vencimiento.diasHasta <= 30;
  const rojo = vencimiento.estado === "vencido";
  return (
    <Link href={href} className="flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-md px-1">
      <span className="min-w-0 truncate font-medium" title={vencimiento.nombre}>
        {vencimiento.nombre}
      </span>
      <span
        className={cn(
          "max-w-[11rem] shrink rounded-full px-2 py-1 text-center text-[11px] font-medium leading-tight",
          rojo ? "bg-[#FEECEB] text-[#B42318]" : naranjo ? "bg-[#FFF3E0] text-[#8A4B00]" : "bg-amber-100 text-amber-800",
        )}
      >
        {etiquetaChipVencimiento(vencimiento)}
      </span>
    </Link>
  );
}

function ParFoto({ url, label, after }: { url: string | null; label: string; after?: boolean }) {
  return (
    <div className="relative aspect-[4/3] bg-[#eceae7]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : null}
      <span className={after ? "fd-badge-despues" : "fd-badge-antes"}>{label}</span>
    </div>
  );
}
