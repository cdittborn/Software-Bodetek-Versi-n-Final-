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
} from "@/components/ui/select";
import { ListaFachadasAgrupada } from "@/components/fachadas/ListaFachadasAgrupada";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import { PlanoFachadas, type FichaPlano, type VariantePlano } from "@/components/fachadas/plano/PlanoFachadas";
import { FACHADAS_PLANO } from "@/components/fachadas/plano/geometria";
import { formatSuperficieEnteraCl } from "@/lib/fachadas/formato";
import {
  agregarIndicadores,
  esCompletaParaCostos,
  proximosVencimientos,
  superficieDashboard,
  tieneSuperficieM2,
  TIPO_INTERVENCION_FACHADA_LABEL,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
  type TipoIntervencionFachada,
  type VencimientoDashboard,
} from "@/lib/fachadas/indicadores";
import {
  agruparFachadasPorUnidad,
  conteosEstado,
  listadoAIndicadores,
  quienEjecuto,
  trabajosRealizados,
} from "@/lib/fachadas/dashboard";
import { estadoAFecha, estadoPlano } from "@/lib/fachadas/estado-a-fecha";
import { formatDiaMesCorto, formatMillonesClp, LETRA_TIPO } from "@/lib/fachadas/ui";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import { ESTADOS_PLANO, estiloEstado, type EstadoPlano } from "@/lib/fachadas/plano";
import {
  etiquetaDiaMesInicio,
  fechaHastaTemporada,
  inicioTemporada,
  opcionesTemporada,
} from "@/lib/fachadas/temporada";
import { formatMontoClp } from "@/lib/trabajos";
import { fachadaHref } from "@/lib/fachadas/rutas";
import { cn } from "@/lib/utils";
import "./fachadas.css";
import type { FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

const COLOR_LETRA: Record<TipoIntervencionFachada | "hojalateria", string> = {
  limpieza: "#0E7490",
  reparacion: "#B45309",
  pintura: "#7C3AED",
  hojalateria: "#475569",
};

export function DashboardFachadas({
  categoriaId,
  subtipoId,
  fachadas,
  intervenciones,
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
  const diaMesInicio = etiquetaDiaMesInicio(inicio);
  const opciones = opcionesTemporada(hoy);
  const etiquetaTemporadaVisible =
    opciones.find((opcion) => opcion.inicio === inicio)?.etiqueta ?? opciones[0]?.etiqueta ?? "";

  const intsTab = useMemo(
    () =>
      intervenciones.filter((intervencion) => {
        if (tab !== "todos" && intervencion.ejecutadoPor !== tab) return false;
        return true;
      }),
    [intervenciones, tab],
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
  const vencimientos = useMemo(
    () => proximosVencimientos(fachadas.map(listadoAIndicadores), intervenciones, hoy).slice(0, 5),
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
      : 0;
  const coberturaIncompleta = superficie.cobertura.n > 0 && superficie.cobertura.m < superficie.cobertura.n;
  const hrefDe = (id: string) =>
    enlaceFachada
      ? enlaceFachada(id)
      : modoDemo
        ? "/trabajos/fachadas/demo/ficha"
        : fachadaHref(categoriaId, subtipoId, id);
  const geometriaTarjeta = tarjetaSvg ? FACHADAS_PLANO.find((item) => item.id === tarjetaSvg) : null;
  const fachadaTarjeta = geometriaTarjeta
    ? fachadas.find((item) => item.svgId === geometriaTarjeta.id)
    : null;
  const filaTarjeta = fachadaTarjeta
    ? grupos.flatMap((grupo) => grupo.filas).find((fila) => fila.id === fachadaTarjeta.id)
    : null;
  const maxTrabajo = Math.max(...trabajos.map((trabajo) => trabajo.neto), 0);
  const pctMaestros = quien.pctMaestrosNeto ?? 0;
  const pctExternos = quien.pctExternosNeto ?? 0;
  const tabLabel =
    tab === "maestros_bodetek" ? "Maestros Bodetek" : tab === "proveedor_externo" ? "Proveedor externo" : "Todos";
  const intervenidasPlano = conteoLeyenda.al_dia + conteoLeyenda.en_ejecucion;
  const modoNota = vistaAntes
    ? `Inicio de temporada · ${diaMesInicio} ${inicio.slice(0, 4)} — ${
        conteoLeyenda.al_dia === 0
          ? "ninguna fachada al día"
          : `${conteoLeyenda.al_dia} fachada${conteoLeyenda.al_dia === 1 ? "" : "s"} al día`
      }`
    : `Hoy · ${fechaLegible(hoy)} — ${intervenidasPlano} fachadas intervenidas desde julio`;
  const anchoAlDia = estados.total ? (estados.al_dia / estados.total) * 100 : 0;
  const anchoEnObra = estados.total ? (estados.en_ejecucion / estados.total) * 100 : 0;

  return (
    <SeccionErrorBoundary titulo="No se pudo mostrar el dashboard de Fachadas.">
      <div className="fd-dash min-w-0">
        <div
          className="fd-dash-filtros flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"
          data-seccion="tabs"
        >
          <div
            role="tablist"
            aria-label="Ejecutor"
            className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-[#E9EBEE] p-1 md:inline-flex md:rounded-[10px]"
          >
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
                  "fd-tab-ejecutor rounded-[9px] px-2 text-[13px] font-semibold md:rounded-[7px] md:px-3.5",
                  tab === id ? "bg-white text-[#0A0A0A] shadow-sm" : "bg-transparent text-[#4B5563]",
                )}
              >
                <span className="md:hidden">{corto}</span>
                <span className="hidden md:inline">{etiqueta}</span>
              </button>
            ))}
          </div>
          <label className="flex min-w-0 items-center gap-2.5 text-[13px] text-[#4B5563]" htmlFor="temporada-fachadas">
            Temporada
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
              <SelectTrigger id="temporada-fachadas" className="fd-temporada-trigger min-w-0 flex-1 md:w-[15.5rem] md:flex-none">
                <span className="truncate font-medium text-[#0A0A0A]">{etiquetaTemporadaVisible}</span>
              </SelectTrigger>
              <SelectContent>
                {opciones.map((opcion) => (
                  <SelectItem key={opcion.inicio} value={opcion.inicio}>
                    {opcion.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {modoDemo ? <span className="fd-chip-ejemplo max-md:hidden">Datos de ejemplo</span> : null}
        </div>

        <section
          aria-label="Indicadores"
          className="fd-dash-kpis grid min-w-0 grid-cols-2 gap-2.5 md:flex md:flex-wrap md:gap-3"
          data-seccion="kpis"
        >
          <article className="fd-kpi fd-kpi-ancho col-span-2 md:min-w-[260px] md:flex-[1.4]">
            <div className="flex items-baseline justify-between gap-2 md:block">
              <p className="fd-kpi-label">Fachadas intervenidas</p>
              <p className="text-xs text-[#4B5563] md:hidden">
                {estados.al_dia} al día · {estados.en_ejecucion} en obra
              </p>
            </div>
            <p className="fd-kpi-value mt-1">
              {estados.intervenidas}
              <span className="ml-1.5 font-sans text-base font-medium text-[#6B7280]">de {estados.total}</span>
            </p>
            <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-[#EEF0F2]">
              <div style={{ width: `${anchoAlDia}%`, background: "#166534" }} />
              <div style={{ width: `${anchoEnObra}%`, background: "#2563EB" }} />
            </div>
            <p className="mt-2 hidden text-xs text-[#4B5563] md:block">
              {estados.al_dia} al día · {estados.en_ejecucion} en obra
            </p>
          </article>
          <article className="fd-kpi md:min-w-[180px] md:flex-1">
            <p className="fd-kpi-label">
              <span className="md:hidden">Superficie</span>
              <span className="hidden md:inline">Superficie intervenida</span>
            </p>
            <p className="fd-kpi-value mt-1">
              {superficie.cobertura.m === 0 ? (
                <EtiquetaM2 m2={null} />
              ) : (
                <>
                  {formatSuperficieEnteraCl(superficie.m2Intervenidos)}
                  <span className="ml-1 font-sans text-base font-medium text-[#6B7280]">m²</span>
                </>
              )}
            </p>
            <p className="mt-1.5 hidden text-xs text-[#4B5563] md:block">
              de {formatSuperficieEnteraCl(superficie.m2Totales)} m²
            </p>
            {coberturaIncompleta ? (
              <p className="mt-1 text-xs text-[#4B5563]">
                calculado sobre {superficie.cobertura.m} de {superficie.cobertura.n}
              </p>
            ) : null}
          </article>
          <article className="fd-kpi md:min-w-[180px] md:flex-1">
            <p className="fd-kpi-label">
              <span className="md:hidden">Costo neto</span>
              <span className="hidden md:inline">Costo total neto</span>
            </p>
            <p className="fd-kpi-value mt-1">{formatMillonesClp(dash.costos.totalNeto)}</p>
            <p className="mt-1.5 hidden text-xs text-[#4B5563] md:block">
              Mano de obra {formatMillonesClp(dash.costos.cotizacionesNeto)}
            </p>
          </article>
          <article className="fd-kpi md:min-w-[180px] md:flex-1">
            <p className="fd-kpi-label">Materiales</p>
            <p className="fd-kpi-value mt-1">{formatMillonesClp(dash.costos.materialesNeto)}</p>
            <p className="mt-1.5 hidden text-xs text-[#4B5563] md:block">{pctMat}% del costo total</p>
          </article>
          <article className="fd-kpi md:min-w-[180px] md:flex-1">
            <p className="fd-kpi-label">Costo por m²</p>
            <p className="fd-kpi-value mt-1">{costoM2 != null ? formatMontoClp(costoM2) : "—"}</p>
            <p className="mt-1.5 hidden text-xs text-[#4B5563] md:block">neto, MO + materiales</p>
            {coberturaIncompleta ? (
              <p className="mt-1 hidden text-xs text-[#4B5563] md:block">
                calculado sobre {superficie.cobertura.m} de {superficie.cobertura.n}
              </p>
            ) : null}
          </article>
        </section>

        <section
          className="fd-dash-plano relative min-w-0 rounded-2xl border border-[#E5E7EB] bg-white p-3.5 md:p-5"
          data-seccion="plano"
          aria-label="Estado de las fachadas"
        >
          <div className="mb-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold md:text-[18px]">Estado de las fachadas</h2>
                <p className="mt-0.5 hidden text-[13px] text-[#4B5563] md:block">{modoNota}</p>
              </div>
              <button
                type="button"
                data-ampliar
                aria-pressed={ampliado}
                className="fd-ampliar inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-[#D1D5DB] bg-white px-3 text-[13px] font-semibold md:hidden"
                onClick={() => setAmpliado((actual) => !actual)}
              >
                {ampliado ? "Reducir" : "Ampliar"}
              </button>
              <div
                role="group"
                aria-label="Momento del plano"
                className="hidden items-center gap-0.5 rounded-[10px] bg-[#0A0A0A] p-1 md:inline-flex"
              >
                <button
                  type="button"
                  aria-pressed={vistaAntes}
                  className="fd-toggle-plano rounded-[7px] px-3.5 text-[13px] font-semibold"
                  style={estiloToggle(vistaAntes)}
                  onClick={() => setVistaAntes(true)}
                >
                  Ver como antes · {diaMesInicio}
                </button>
                <button
                  type="button"
                  aria-pressed={!vistaAntes}
                  className="fd-toggle-plano rounded-[7px] px-3.5 text-[13px] font-semibold"
                  style={estiloToggle(!vistaAntes)}
                  onClick={() => setVistaAntes(false)}
                >
                  Ver hoy
                </button>
              </div>
            </div>
            <div role="group" aria-label="Momento del plano" className="grid grid-cols-2 gap-0.5 rounded-[10px] bg-[#0A0A0A] p-1 md:hidden">
              <button
                type="button"
                aria-pressed={vistaAntes}
                className="fd-toggle-plano rounded-[7px] px-2 text-sm font-semibold"
                style={estiloToggle(vistaAntes)}
                onClick={() => setVistaAntes(true)}
              >
                Como antes · {diaMesInicio}
              </button>
              <button
                type="button"
                aria-pressed={!vistaAntes}
                className="fd-toggle-plano rounded-[7px] px-2 text-sm font-semibold"
                style={estiloToggle(!vistaAntes)}
                onClick={() => setVistaAntes(false)}
              >
                Hoy
              </button>
            </div>
          </div>

          <div
            data-leyenda-scroll
            role="group"
            aria-label="Filtrar por estado"
            className="mb-3 flex max-w-full min-w-0 gap-2 overflow-x-auto md:flex-wrap md:overflow-visible"
          >
            {ESTADOS_PLANO.map((estado) => {
              const estilo = estiloEstado(estado);
              const activo = filtroLeyenda === estado;
              return (
                <button
                  key={estado}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltroLeyenda((actual) => (actual === estado ? null : estado))}
                  className="fd-leyenda-chip inline-flex shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] whitespace-nowrap"
                  style={{
                    borderColor: activo ? "#0A0A0A" : "#E5E7EB",
                    background: activo ? "#F3F4F6" : "#FFFFFF",
                    opacity: filtroLeyenda && !activo ? 0.55 : 1,
                  }}
                >
                  <Trazo estado={estado} />
                  <span className="font-medium">{estilo.etiqueta}</span>
                  <span className="font-mono font-semibold">{conteoLeyenda[estado]}</span>
                </button>
              );
            })}
            {filtroLeyenda ? (
              <button
                type="button"
                className="fd-leyenda-chip inline-flex shrink-0 items-center px-3 text-[13px] text-[#4B5563] underline"
                onClick={() => setFiltroLeyenda(null)}
              >
                Mostrar todas
              </button>
            ) : null}
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
          <p className="mt-3 text-xs text-[#6B7280] md:hidden">
            Toca un muro para ver su detalle. Usa «Ampliar» o pellizca para acercar.
          </p>
          <p className="mt-3 hidden text-xs text-[#6B7280] md:block">
            Pasa el cursor sobre un muro para ver el detalle; haz clic para abrir su ficha. Las formas de línea
            distinguen el estado sin depender del color.
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

        <div className="fd-dash-lateral">
          <section
            className="fd-dash-trabajos rounded-2xl border border-[#E5E7EB] bg-white p-3.5 md:p-5"
            data-seccion="trabajos"
            aria-label="Trabajos realizados"
          >
            <div className="mb-3.5 flex items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-bold md:text-base">Trabajos realizados</h2>
              <span className="hidden text-xs text-[#6B7280] md:inline">{tabLabel}</span>
            </div>
            <ul className="flex flex-col gap-3">
              {trabajos.map((trabajo) => (
                <li key={trabajo.key} className="flex items-center gap-3">
                  <span
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-bold text-white md:size-[30px] md:rounded-lg"
                    style={{ background: COLOR_LETRA[trabajo.key] }}
                  >
                    {LETRA_TIPO[trabajo.key]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="font-semibold">
                        {etiquetaTrabajo(trabajo.key)}{" "}
                        <span className="font-normal text-[#6B7280]">· {trabajo.fachadasN}</span>
                      </span>
                      <span className="shrink-0 font-mono font-semibold">{formatMillonesClp(trabajo.neto)}</span>
                    </span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#EEF0F2]">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${maxTrabajo > 0 ? Math.round((trabajo.neto / maxTrabajo) * 100) : 0}%`,
                          background: COLOR_LETRA[trabajo.key],
                        }}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 md:hidden">
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                <div style={{ width: `${pctMaestros}%`, background: "#0A0A0A" }} />
                <div style={{ width: `${pctExternos}%`, background: "#9CA3AF" }} />
              </div>
              <p className="mt-2 flex justify-between text-[13px]">
                <span>
                  <strong>{pctMaestros}%</strong> Maestros Bodetek
                </span>
                <span>
                  <strong>{pctExternos}%</strong> Externos
                </span>
              </p>
            </div>
          </section>

          <section
            className="fd-dash-quien hidden flex-col gap-3.5 rounded-2xl border border-[#E5E7EB] bg-white p-5 md:flex"
            aria-label="Quién ejecutó"
          >
            <h2 className="text-base font-bold">Quién ejecutó</h2>
            <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
              <div style={{ width: `${pctMaestros}%`, background: "#0A0A0A" }} />
              <div style={{ width: `${pctExternos}%`, background: "#9CA3AF" }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <QuienColumna
                color="#0A0A0A"
                etiqueta="Maestros Bodetek"
                pct={pctMaestros}
                monto={quien.maestrosNeto}
                fachadas={quien.maestrosFachadas}
              />
              <QuienColumna
                color="#9CA3AF"
                etiqueta="Proveedor externo"
                pct={pctExternos}
                monto={quien.externosNeto}
                fachadas={quien.externosFachadas}
              />
            </div>
          </section>

          <section
            className="fd-dash-venc rounded-2xl border border-[#E5E7EB] bg-white p-3.5 md:p-5"
            data-seccion="vencimientos"
            aria-label="Próximos vencimientos"
          >
            <h2 className="mb-2 text-[17px] font-bold md:text-base">Próximos vencimientos</h2>
            {vencimientos.length === 0 ? (
              <p className="text-[13px] text-[#6B7280]">No hay fachadas vencidas ni que venzan en los próximos 60 días.</p>
            ) : (
              <ul>
                {vencimientos.map((vencimiento, indice) => (
                  <li key={`${vencimiento.fachadaId}-${vencimiento.tipo}`} className={indice >= 3 ? "hidden md:block" : undefined}>
                    <VencimientoLink vencimiento={vencimiento} href={hrefDe(vencimiento.fachadaId)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {puedeEditar && onAbrirRegistro ? (
          <button type="button" className="fd-btn-primary fd-dash-registrar" data-registrar onClick={onAbrirRegistro}>
            Registrar intervención
          </button>
        ) : null}
      </div>
    </SeccionErrorBoundary>
  );
}

function estiloToggle(activo: boolean): { background: string; color: string } {
  return activo ? { background: "#FFFFFF", color: "#0A0A0A" } : { background: "transparent", color: "#D1D5DB" };
}

function fechaLegible(iso: string): string {
  return formatDiaMesCorto(iso).replace(/^0/, "");
}

function partesFecha(iso: string | null): { dia: string; mes: string } {
  if (!iso || iso.length < 10) return { dia: "—", mes: "—" };
  const mes = Number(iso.slice(5, 7));
  return { dia: String(Number(iso.slice(8, 10))), mes: MESES[mes - 1] ?? "—" };
}

function etiquetaTrabajo(key: TipoIntervencionFachada | "hojalateria"): string {
  if (key === "hojalateria") return "Hojalatería";
  return TIPO_INTERVENCION_FACHADA_LABEL[key];
}

function textoPlazo(vencimiento: VencimientoDashboard): string {
  if (vencimiento.estado === "vencido") {
    if (vencimiento.diasHasta == null) return "Vencido";
    const dias = Math.abs(vencimiento.diasHasta);
    if (dias === 0) return "Vencido hoy";
    return `hace ${dias} día${dias === 1 ? "" : "s"}`;
  }
  if (vencimiento.diasHasta != null && vencimiento.diasHasta <= 30) {
    return vencimiento.diasHasta === 1 ? "en 1 día" : `en ${vencimiento.diasHasta} días`;
  }
  return vencimiento.proximaFecha ? fechaLegible(vencimiento.proximaFecha) : "—";
}

function tonoVencimiento(vencimiento: VencimientoDashboard): { bg: string; fg: string } {
  if (vencimiento.estado === "vencido") return { bg: "#FEECEB", fg: "#B42318" };
  if (vencimiento.diasHasta != null && vencimiento.diasHasta <= 30) return { bg: "#FFF3E0", fg: "#8A4B00" };
  return { bg: "#F3F4F6", fg: "#374151" };
}

function Trazo({ estado }: { estado: EstadoPlano }) {
  const estilo = estiloEstado(estado);
  return (
    <svg width={22} height={8} aria-hidden="true">
      <line
        x1={2}
        y1={4}
        x2={20}
        y2={4}
        stroke={estilo.color}
        strokeWidth={4}
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
    <aside
      aria-label="Fachada seleccionada"
      className="absolute top-32 right-5 z-20 hidden w-80 flex-col gap-3 rounded-[14px] border border-[#E5E7EB] bg-white p-[18px] shadow-[0_12px_32px_rgba(15,23,42,0.16)] md:flex"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-base leading-snug font-bold">{nombre}</p>
        <button
          type="button"
          aria-label="Cerrar"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6]"
          onClick={onCerrar}
        >
          <XIcon aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <span
        className="inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-[13px] font-semibold"
        style={{ background: estilo.badgeBg, color: estilo.badgeTexto }}
      >
        <Trazo estado={estado} />
        {estilo.etiqueta}
      </span>
      <div className="grid grid-cols-2 gap-2.5 text-[13px]">
        <div>
          <div className="text-[#6B7280]">Superficie</div>
          <div className="font-semibold">
            <EtiquetaM2 m2={m2} />
          </div>
        </div>
        <div>
          <div className="text-[#6B7280]">Última intervención</div>
          <div className="font-semibold">{ultima ? fechaLegible(ultima) : "—"}</div>
        </div>
      </div>
      <p className="text-[13px] text-[#374151]">
        {ubicacion === "exterior" ? "Exterior" : "Interior"}
        {hacia ? ` · hacia ${hacia}` : ""}
      </p>
      <Link
        href={href}
        className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#0A0A0A] text-sm font-semibold text-white"
      >
        Abrir ficha completa
      </Link>
    </aside>
  );
}

function QuienColumna({
  color,
  etiqueta,
  pct,
  monto,
  fachadas,
}: {
  color: string;
  etiqueta: string;
  pct: number;
  monto: number;
  fachadas: number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-[#4B5563]">
        <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
        {etiqueta}
      </span>
      <span className="text-lg font-bold">
        {pct}% · {formatMillonesClp(monto)}
      </span>
      <span className="text-[#6B7280]">
        {fachadas} fachada{fachadas === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function VencimientoLink({ vencimiento, href }: { vencimiento: VencimientoDashboard; href: string }) {
  const tono = tonoVencimiento(vencimiento);
  const fecha = partesFecha(vencimiento.proximaFecha);
  const plazo = textoPlazo(vencimiento);
  const tipo =
    vencimiento.tipo === "limpieza" || vencimiento.tipo === "reparacion" || vencimiento.tipo === "pintura"
      ? TIPO_INTERVENCION_FACHADA_LABEL[vencimiento.tipo]
      : vencimiento.tipo;
  return (
    <Link href={href} className="flex min-h-11 items-center gap-3 border-t border-[#F0F1F3] py-2.5">
      <span className="w-[46px] shrink-0 rounded-lg py-1 text-center" style={{ background: tono.bg, color: tono.fg }}>
        <span className="block text-base leading-none font-bold">{fecha.dia}</span>
        <span className="block text-[11px] tracking-wide uppercase">{fecha.mes}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold md:text-[13px]">{vencimiento.nombre}</span>
        <span className="block truncate text-xs text-[#4B5563] md:text-xs">
          <span className="md:hidden">
            {tipo} · {plazo}
          </span>
          <span className="hidden md:inline">{tipo}</span>
        </span>
      </span>
      <span className="hidden shrink-0 text-xs font-semibold whitespace-nowrap md:inline" style={{ color: tono.fg }}>
        {plazo}
      </span>
    </Link>
  );
}
