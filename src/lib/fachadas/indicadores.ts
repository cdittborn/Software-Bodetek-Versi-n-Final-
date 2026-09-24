/** Medidas, completitud e indicadores de Fachadas. Siempre usan el snapshot. */

export const TIPOS_INTERVENCION_FACHADA = [
  "limpieza",
  "reparacion",
  "pintura",
] as const;

export type TipoIntervencionFachada =
  (typeof TIPOS_INTERVENCION_FACHADA)[number];

export const TIPO_INTERVENCION_FACHADA_LABEL: Record<
  TipoIntervencionFachada,
  string
> = {
  limpieza: "Limpieza",
  reparacion: "Reparación",
  pintura: "Pintura",
};

export const RUBROS_PROVEEDOR = [
  "limpieza",
  "reparacion",
  "pintura",
  "hojalateria",
  "materiales",
  "andamios",
  "albanileria",
  "otro",
] as const;

export type RubroProveedor = (typeof RUBROS_PROVEEDOR)[number];

export const RUBRO_PROVEEDOR_LABEL: Record<RubroProveedor, string> = {
  limpieza: "Limpieza",
  reparacion: "Reparación",
  pintura: "Pintura",
  hojalateria: "Hojalatería",
  materiales: "Materiales",
  andamios: "Andamios",
  albanileria: "Albañilería",
  otro: "Otro",
};

export const FILTRO_RUBRO_TODOS = "todos" as const;

export type FiltroRubro = RubroProveedor | typeof FILTRO_RUBRO_TODOS;

export const EJECUTADO_POR_FACHADA = [
  "maestros_bodetek",
  "proveedor_externo",
] as const;

export type EjecutadoPorFachada = (typeof EJECUTADO_POR_FACHADA)[number];

export type EstadoMedidasForm = {
  altoM: number | null;
  anchoM: number | null;
  superficieM2: number | null;
  superficieManual: boolean;
};

export type TipoIntervencionDias = {
  tipo: TipoIntervencionFachada;
  dias: number;
};

export type CotizacionFachada = {
  valorNeto: number | null;
  valorIva?: number | null;
  valorBruto: number | null;
  cotizacionKey: string | null;
  facturaKey: string | null;
  tipos: TipoIntervencionFachada[];
};

export type SnapshotMedidas = {
  altoMSnapshot: number | null;
  anchoMSnapshot: number | null;
  superficieM2Snapshot: number | null;
};

export type HojalateriaFachada = {
  proveedorId: string | null;
  valorNeto: number | null;
  valorBruto: number | null;
};

export type MaterialFachada = {
  valorNeto: number | null;
  valorBruto: number | null;
};

export type FiltroDashboardFachadas = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  ejecutadoPor: EjecutadoPorFachada | "todos";
  proveedorId: string | null;
  tipo: TipoIntervencionFachada | "todos";
};

export const FILTRO_DASHBOARD_VACIO: FiltroDashboardFachadas = {
  fechaDesde: null,
  fechaHasta: null,
  ejecutadoPor: "todos",
  proveedorId: null,
  tipo: "todos",
};

export type IntervencionIndicadores = {
  id: string;
  fachadaId: string;
  recintoId?: string | null;
  proveedorId?: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  fechaInicio: string | null;
  fechaTermino: string | null;
  altoMSnapshot: number | null;
  anchoMSnapshot: number | null;
  superficieM2Snapshot: number | null;
  /** Medida viva de la ficha. Los indicadores la ignoran. */
  altoMActual?: number | null;
  anchoMActual?: number | null;
  superficieM2Actual?: number | null;
  tipos: TipoIntervencionDias[];
  cotizaciones: CotizacionFachada[];
  hojalaterias: HojalateriaFachada[];
  materiales: MaterialFachada[];
};

export type CoberturaIndicador = {
  m: number;
  n: number;
};

export type DiasPorTipo = Record<TipoIntervencionFachada, number>;

export type IndicadoresDias = {
  porTipo: DiasPorTipo;
  total: number;
  m2: number;
  diasPorM2: number | null;
  cobertura: CoberturaIndicador;
};

export type IndicadoresCostos = {
  cotizacionesNeto: number;
  cotizacionesBruto: number;
  hojalateriaNeto: number;
  hojalateriaBruto: number;
  materialesNeto: number;
  materialesBruto: number;
  totalNeto: number;
  totalBruto: number;
  cobertura: CoberturaIndicador;
  /** M de N cotizaciones (de intervenciones completas para costos) con factura. */
  facturas: CoberturaIndicador;
};

export type DashboardFachadas = {
  intervencionesN: number;
  dias: IndicadoresDias;
  costos: IndicadoresCostos;
};

export function redondearM2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function superficieSugerida(
  altoM: number | null,
  anchoM: number | null,
): number | null {
  if (altoM == null || anchoM == null) return null;
  if (!(altoM > 0) || !(anchoM > 0)) return null;
  return redondearM2(altoM * anchoM);
}

export function casiIgualM2(a: number, b: number): boolean {
  return Math.abs(redondearM2(a) - redondearM2(b)) < 0.005;
}

export function formatM2(n: number): string {
  const r = redondearM2(n);
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

export function estadoMedidasVacio(): EstadoMedidasForm {
  return {
    altoM: null,
    anchoM: null,
    superficieM2: null,
    superficieManual: false,
  };
}

function sincronizarSuperficie(estado: EstadoMedidasForm): EstadoMedidasForm {
  if (estado.superficieManual) return estado;
  return {
    ...estado,
    superficieM2: superficieSugerida(estado.altoM, estado.anchoM),
  };
}

export function aplicarCambioAlto(
  estado: EstadoMedidasForm,
  altoM: number | null,
): EstadoMedidasForm {
  return sincronizarSuperficie({ ...estado, altoM });
}

export function aplicarCambioAncho(
  estado: EstadoMedidasForm,
  anchoM: number | null,
): EstadoMedidasForm {
  return sincronizarSuperficie({ ...estado, anchoM });
}

/** El usuario editó m² a mano (vanos, portones, formas irregulares). */
export function aplicarCambioSuperficie(
  estado: EstadoMedidasForm,
  superficieM2: number | null,
): EstadoMedidasForm {
  return { ...estado, superficieM2, superficieManual: true };
}

/** Hint «alto × ancho = X m²» solo cuando difiere de la superficie guardada. */
export function hintSuperficie(
  altoM: number | null,
  anchoM: number | null,
  superficieM2: number | null,
): string | null {
  const sugerida = superficieSugerida(altoM, anchoM);
  if (sugerida == null || superficieM2 == null) return null;
  if (casiIgualM2(sugerida, superficieM2)) return null;
  return `alto × ancho = ${formatM2(sugerida)} m²`;
}

/** Se usa SOLO al crear la intervención. */
export function snapshotDesdeMedidas(
  estado: EstadoMedidasForm,
): SnapshotMedidas {
  return {
    altoMSnapshot: estado.altoM,
    anchoMSnapshot: estado.anchoM,
    superficieM2Snapshot: estado.superficieM2,
  };
}

export function copiarSnapshotAlCrear(
  medidas: EstadoMedidasForm,
): SnapshotMedidas {
  return snapshotDesdeMedidas(medidas);
}

/** Editar la fachada (o la intervención) no toca el snapshot. */
export function conservarSnapshotAlEditar(
  snapshot: SnapshotMedidas,
  _medidasFachada: EstadoMedidasForm,
): SnapshotMedidas {
  return { ...snapshot };
}

/** Acción explícita «Actualizar medidas desde la fachada». */
export function actualizarSnapshotDesdeFachada(
  medidasFachada: EstadoMedidasForm,
): SnapshotMedidas {
  return snapshotDesdeMedidas(medidasFachada);
}

function m2Snapshot(i: IntervencionIndicadores): number {
  return i.superficieM2Snapshot != null && i.superficieM2Snapshot > 0
    ? i.superficieM2Snapshot
    : 0;
}

export function tiposConDias(
  tipos: TipoIntervencionDias[],
): TipoIntervencionDias[] {
  return tipos.filter((t) => Number.isFinite(t.dias) && t.dias > 0);
}

export function esCompletaParaDias(i: IntervencionIndicadores): boolean {
  return m2Snapshot(i) > 0 && tiposConDias(i.tipos).length >= 1;
}

function cotizacionCubreCosto(c: CotizacionFachada): boolean {
  return (c.valorNeto ?? 0) > 0 && Boolean(c.cotizacionKey?.trim());
}

function hojalateriaCubreCosto(h: HojalateriaFachada): boolean {
  return (h.valorNeto ?? 0) > 0 && Boolean(h.proveedorId?.trim());
}

export function esCompletaParaCostos(i: IntervencionIndicadores): boolean {
  if (
    i.ejecutadoPor !== "maestros_bodetek" &&
    i.ejecutadoPor !== "proveedor_externo"
  ) {
    return false;
  }

  if (i.ejecutadoPor === "proveedor_externo") {
    if (!i.cotizaciones.some(cotizacionCubreCosto)) return false;
  }

  if (i.ejecutadoPor === "maestros_bodetek") {
    const conMateriales = i.materiales.length >= 1;
    if (!conMateriales && !i.sinMateriales) return false;
  }

  if (i.requiereHojalateria) {
    if (!i.hojalaterias.some(hojalateriaCubreCosto)) return false;
  }

  return true;
}

function parseFechaUtc(value: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Inclusive. No entra en días/m². */
export function duracionCalendarioDias(
  fechaInicio: string | null,
  fechaTermino: string | null,
): number | null {
  if (!fechaInicio || !fechaTermino) return null;
  const a = parseFechaUtc(fechaInicio);
  const b = parseFechaUtc(fechaTermino);
  if (a == null || b == null || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

export function tiposDeIntervencion(
  i: IntervencionIndicadores,
): TipoIntervencionFachada[] {
  return i.tipos.map((t) => t.tipo);
}

export function tiposCubiertosPorCotizaciones(
  i: IntervencionIndicadores,
): TipoIntervencionFachada[] {
  const seen = new Set<TipoIntervencionFachada>();
  const out: TipoIntervencionFachada[] = [];
  for (const c of i.cotizaciones) {
    for (const tipo of c.tipos) {
      if (seen.has(tipo)) continue;
      seen.add(tipo);
      out.push(tipo);
    }
  }
  return out;
}

export function tiposSinCotizacion(
  i: IntervencionIndicadores,
): TipoIntervencionFachada[] {
  const cubiertos = new Set(tiposCubiertosPorCotizaciones(i));
  return tiposDeIntervencion(i).filter((tipo) => !cubiertos.has(tipo));
}

export function debeAdvertirCambioEjecutor(
  ejecutadoPorActual: EjecutadoPorFachada | null,
  ejecutadoPorNuevo: EjecutadoPorFachada | null,
  cotizacionesN: number,
): boolean {
  return cotizacionesN > 0 && ejecutadoPorActual !== ejecutadoPorNuevo;
}

export function detalleAIndicadores(d: {
  id: string;
  fachadaId: string;
  recintoId?: string | null;
  proveedorId: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  fechaInicio: string | null;
  fechaTermino: string | null;
  altoMSnapshot: number | null;
  anchoMSnapshot: number | null;
  superficieM2Snapshot: number | null;
  tipos: TipoIntervencionDias[];
  cotizaciones: CotizacionFachada[];
  hojalaterias: HojalateriaFachada[];
  materiales: MaterialFachada[];
}): IntervencionIndicadores {
  return {
    id: d.id,
    fachadaId: d.fachadaId,
    recintoId: d.recintoId ?? null,
    proveedorId: d.proveedorId,
    ejecutadoPor: d.ejecutadoPor,
    requiereHojalateria: d.requiereHojalateria,
    sinMateriales: d.sinMateriales,
    fechaInicio: d.fechaInicio,
    fechaTermino: d.fechaTermino,
    altoMSnapshot: d.altoMSnapshot,
    anchoMSnapshot: d.anchoMSnapshot,
    superficieM2Snapshot: d.superficieM2Snapshot,
    tipos: d.tipos,
    cotizaciones: d.cotizaciones,
    hojalaterias: d.hojalaterias,
    materiales: d.materiales,
  };
}

export function proveedorPasaFiltroRubro(
  rubros: readonly string[],
  filtro: FiltroRubro,
): boolean {
  if (filtro === FILTRO_RUBRO_TODOS) return true;
  return rubros.includes(filtro);
}

function cotizacionConFactura(c: CotizacionFachada): boolean {
  return Boolean(c.facturaKey?.trim());
}

function diasPorTipoVacio(): DiasPorTipo {
  return {
    limpieza: 0,
    reparacion: 0,
    pintura: 0,
  };
}

function sumarMonto(
  items: { valorNeto: number | null; valorBruto: number | null }[],
): { neto: number; bruto: number } {
  let neto = 0;
  let bruto = 0;
  for (const item of items) {
    if (item.valorNeto != null && Number.isFinite(item.valorNeto)) {
      neto += item.valorNeto;
    }
    if (item.valorBruto != null && Number.isFinite(item.valorBruto)) {
      bruto += item.valorBruto;
    }
  }
  return { neto, bruto };
}

function m2UnicosPorFachada(items: IntervencionIndicadores[]): number {
  const porFachada = new Map<string, number>();
  for (const i of items) {
    porFachada.set(i.fachadaId, m2Snapshot(i));
  }
  let total = 0;
  for (const m2 of porFachada.values()) total += m2;
  return redondearM2(total);
}

export function agregarIndicadores(
  intervenciones: IntervencionIndicadores[],
): DashboardFachadas {
  const n = intervenciones.length;
  const paraDias = intervenciones.filter(esCompletaParaDias);
  const paraCostos = intervenciones.filter(esCompletaParaCostos);

  const porTipo = diasPorTipoVacio();
  for (const i of paraDias) {
    for (const t of tiposConDias(i.tipos)) {
      porTipo[t.tipo] += t.dias;
    }
  }
  const totalDias = TIPOS_INTERVENCION_FACHADA.reduce(
    (acc, tipo) => acc + porTipo[tipo],
    0,
  );
  const m2 = m2UnicosPorFachada(paraDias);
  const diasPorM2 = m2 > 0 ? redondearM2(totalDias / m2) : null;

  let cotizacionesNeto = 0;
  let cotizacionesBruto = 0;
  let hojalateriaNeto = 0;
  let hojalateriaBruto = 0;
  let materialesNeto = 0;
  let materialesBruto = 0;
  let cotizacionesN = 0;
  let cotizacionesConFactura = 0;

  for (const i of paraCostos) {
    if (i.ejecutadoPor === "proveedor_externo") {
      const c = sumarMonto(i.cotizaciones);
      cotizacionesNeto += c.neto;
      cotizacionesBruto += c.bruto;
      cotizacionesN += i.cotizaciones.length;
      cotizacionesConFactura += i.cotizaciones.filter(cotizacionConFactura).length;
    }
    const h = sumarMonto(i.hojalaterias);
    hojalateriaNeto += h.neto;
    hojalateriaBruto += h.bruto;
    const m = sumarMonto(i.materiales);
    materialesNeto += m.neto;
    materialesBruto += m.bruto;
  }

  return {
    intervencionesN: n,
    dias: {
      porTipo,
      total: totalDias,
      m2,
      diasPorM2,
      cobertura: { m: paraDias.length, n },
    },
    costos: {
      cotizacionesNeto,
      cotizacionesBruto,
      hojalateriaNeto,
      hojalateriaBruto,
      materialesNeto,
      materialesBruto,
      totalNeto: cotizacionesNeto + hojalateriaNeto + materialesNeto,
      totalBruto: cotizacionesBruto + hojalateriaBruto + materialesBruto,
      cobertura: { m: paraCostos.length, n },
      facturas: { m: cotizacionesConFactura, n: cotizacionesN },
    },
  };
}

function fechaEnRango(
  i: IntervencionIndicadores,
  desde: string | null,
  hasta: string | null,
): boolean {
  if (!desde && !hasta) return true;
  const fechas = [i.fechaInicio, i.fechaTermino].filter(
    (f): f is string => Boolean(f),
  );
  if (fechas.length === 0) return false;
  return fechas.some(
    (f) => (!desde || f >= desde) && (!hasta || f <= hasta),
  );
}

export function filtrarIntervenciones(
  items: IntervencionIndicadores[],
  filtro: FiltroDashboardFachadas,
): IntervencionIndicadores[] {
  return items.filter((i) => {
    if (!fechaEnRango(i, filtro.fechaDesde, filtro.fechaHasta)) return false;
    if (
      filtro.ejecutadoPor !== "todos" &&
      i.ejecutadoPor !== filtro.ejecutadoPor
    ) {
      return false;
    }
    if (filtro.proveedorId && i.proveedorId !== filtro.proveedorId) {
      return false;
    }
    if (filtro.tipo !== "todos") {
      const tiene = tiposConDias(i.tipos).some((t) => t.tipo === filtro.tipo);
      if (!tiene) return false;
    }
    return true;
  });
}

export type DesgloseCosto = {
  key: "cotizaciones" | "hojalateria" | "materiales";
  label: string;
  bruto: number;
  pct: number | null;
};

export type IndicadoresIntervencion = {
  completaDias: boolean;
  completaCostos: boolean;
  m2: number;
  dias: DiasPorTipo;
  diasTotal: number;
  diasPorM2: number | null;
  duracionCalendario: number | null;
  desglose: DesgloseCosto[];
  costoTotalBruto: number;
  costoPorM2: number | null;
  facturas: CoberturaIndicador;
  tiposSinCotizacion: TipoIntervencionFachada[];
};

export function indicadoresDeIntervencion(
  i: IntervencionIndicadores,
): IndicadoresIntervencion {
  const dias = diasPorTipoVacio();
  for (const t of tiposConDias(i.tipos)) dias[t.tipo] += t.dias;
  const diasTotal = TIPOS_INTERVENCION_FACHADA.reduce(
    (acc, tipo) => acc + dias[tipo],
    0,
  );
  const m2 = m2Snapshot(i);
  const cotiz =
    i.ejecutadoPor === "proveedor_externo" ? sumarMonto(i.cotizaciones).bruto : 0;
  const hoja = sumarMonto(i.hojalaterias).bruto;
  const mat = sumarMonto(i.materiales).bruto;
  const total = cotiz + hoja + mat;
  const pct = (n: number): number | null =>
    total > 0 ? redondearM2((n / total) * 100) : null;
  const facturasN =
    i.ejecutadoPor === "proveedor_externo" ? i.cotizaciones.length : 0;
  const facturasM =
    i.ejecutadoPor === "proveedor_externo"
      ? i.cotizaciones.filter(cotizacionConFactura).length
      : 0;
  return {
    completaDias: esCompletaParaDias(i),
    completaCostos: esCompletaParaCostos(i),
    m2,
    dias,
    diasTotal,
    diasPorM2: m2 > 0 && diasTotal > 0 ? redondearM2(diasTotal / m2) : null,
    duracionCalendario: duracionCalendarioDias(i.fechaInicio, i.fechaTermino),
    desglose: [
      { key: "cotizaciones", label: "Cotizaciones", bruto: cotiz, pct: pct(cotiz) },
      { key: "hojalateria", label: "Hojalatería", bruto: hoja, pct: pct(hoja) },
      { key: "materiales", label: "Materiales", bruto: mat, pct: pct(mat) },
    ],
    costoTotalBruto: total,
    costoPorM2: m2 > 0 && total > 0 ? redondearM2(total / m2) : null,
    facturas: { m: facturasM, n: facturasN },
    tiposSinCotizacion: tiposSinCotizacion(i),
  };
}

export type PuntoCostoM2 = {
  id: string;
  fecha: string;
  fechaLabel: string;
  costoPorM2: number;
};

export function puntosCostoPorM2(
  items: IntervencionIndicadores[],
  formatFecha: (iso: string) => string,
): PuntoCostoM2[] {
  const out: PuntoCostoM2[] = [];
  for (const i of items) {
    if (!esCompletaParaCostos(i)) continue;
    const fecha = i.fechaInicio || i.fechaTermino;
    if (!fecha) continue;
    const ind = indicadoresDeIntervencion(i);
    if (ind.costoPorM2 == null) continue;
    out.push({
      id: i.id,
      fecha,
      fechaLabel: formatFecha(fecha),
      costoPorM2: ind.costoPorM2,
    });
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function formatM2Cl(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
