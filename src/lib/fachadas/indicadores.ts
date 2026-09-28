/** Medidas, completitud e indicadores de Fachadas. Siempre usan el snapshot. */

import {
  estadoIntervencionDesdeDb,
  type EstadoIntervencionFachada,
  type FrecuenciaRevisionMeses,
  type EstadoCalculadoFachada,
} from "@/lib/fachadas/estado";

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

export const TIPO_INTERVENCION_FACHADA_DESCRIPCION: Record<
  TipoIntervencionFachada,
  string
> = {
  limpieza: "Hidrolavado, retiro de hongos y manchas",
  reparacion: "Grietas, estuco, planchas, sellos",
  pintura: "Pintura de muros, portones y letrero",
};

export const FACHADAS_LETRA_PRESET = [
  { letra: "A", nombre: "Principal (acceso)" },
  { letra: "B", nombre: "Posterior" },
  { letra: "C", nombre: "Lateral" },
] as const;

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
  tipo?: TipoMaterialFachada;
  valorNeto: number | null;
  valorBruto: number | null;
};

export const TIPOS_MATERIAL_FACHADA = ["pintura", "otros"] as const;

export type TipoMaterialFachada = (typeof TIPOS_MATERIAL_FACHADA)[number];

export const TIPO_MATERIAL_FACHADA_LABEL: Record<TipoMaterialFachada, string> = {
  pintura: "Pintura",
  otros: "Otros",
};

export const CATEGORIAS_DOCUMENTO_FACHADA = [
  "mano_de_obra",
  "materiales",
  "hojalateria",
] as const;

export type CategoriaDocumentoFachada =
  (typeof CATEGORIAS_DOCUMENTO_FACHADA)[number];

export const CATEGORIA_DOCUMENTO_FACHADA_LABEL: Record<
  CategoriaDocumentoFachada,
  string
> = {
  mano_de_obra: "Mano de obra",
  materiales: "Materiales",
  hojalateria: "Hojalatería",
};

export type TipoDocumentoFachada = "cotizacion" | "factura" | "boleta";

export const TIPO_DOCUMENTO_FACHADA_LABEL: Record<TipoDocumentoFachada, string> =
  {
    cotizacion: "Cotización",
    factura: "Factura",
    boleta: "Boleta",
  };

export const ESTADOS_COTIZACION_DOC = [
  "pendiente",
  "aprobada",
  "rechazada",
  "no_elegida",
] as const;

export type EstadoCotizacionDoc = (typeof ESTADOS_COTIZACION_DOC)[number];

export const ESTADO_COTIZACION_DOC_LABEL: Record<EstadoCotizacionDoc, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  no_elegida: "No elegida",
};

export const ESTADOS_FACTURA_DOC = ["pendiente", "pagada"] as const;

export type EstadoFacturaDoc = (typeof ESTADOS_FACTURA_DOC)[number];

export const ESTADO_FACTURA_DOC_LABEL: Record<EstadoFacturaDoc, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
};

export const TIPOS_FACTURA_BOLETA = ["factura", "boleta"] as const;

export function estadoDocumentoDefault(
  tipo: TipoDocumentoFachada,
): string {
  return tipo === "cotizacion" ? "pendiente" : "pendiente";
}

export type DocumentoIndicador = {
  tipoDocumento: TipoDocumentoFachada;
  categoria: CategoriaDocumentoFachada;
  valorNeto: number;
  estado: string;
};

export type FiltroDashboardFachadas = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  ejecutadoPor: EjecutadoPorFachada | "todos";
  proveedorId: string | null;
  recintoId: string | null;
  tipo: TipoIntervencionFachada | "todos";
};

export const FILTRO_DASHBOARD_VACIO: FiltroDashboardFachadas = {
  fechaDesde: null,
  fechaHasta: null,
  ejecutadoPor: "todos",
  proveedorId: null,
  recintoId: null,
  tipo: "todos",
};

export type IntervencionIndicadores = {
  id: string;
  fachadaId: string;
  recintoId?: string | null;
  proveedorId?: string | null;
  estado?: EstadoIntervencionFachada;
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
  documentos?: DocumentoIndicador[];
  maestrosAsignados?: string | null;
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
  _fachada: EstadoMedidasForm,
): SnapshotMedidas {
  void _fachada;
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
  documentos?: DocumentoIndicador[];
  estado?: EstadoIntervencionFachada;
}): IntervencionIndicadores {
  return {
    id: d.id,
    fachadaId: d.fachadaId,
    recintoId: d.recintoId ?? null,
    proveedorId: d.proveedorId,
    estado: d.estado ?? "programada",
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
    documentos: d.documentos,
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

export function estadoDeIntervencion(
  i: Pick<IntervencionIndicadores, "estado">,
): EstadoIntervencionFachada {
  return estadoIntervencionDesdeDb(i.estado);
}

function sumNeto(items: { valorNeto: number | null | undefined }[]): number {
  let n = 0;
  for (const item of items) {
    if (item.valorNeto != null && Number.isFinite(item.valorNeto)) {
      n += item.valorNeto;
    }
  }
  return n;
}

export function documentosEfectivos(
  i: IntervencionIndicadores,
): DocumentoIndicador[] {
  if (i.documentos && i.documentos.length > 0) return i.documentos;
  const out: DocumentoIndicador[] = [];
  if (i.ejecutadoPor === "proveedor_externo") {
    for (const c of i.cotizaciones) {
      out.push({
        tipoDocumento: "cotizacion",
        categoria: "mano_de_obra",
        valorNeto: c.valorNeto ?? 0,
        estado: "aprobada",
      });
      if (c.facturaKey?.trim()) {
        out.push({
          tipoDocumento: "factura",
          categoria: "mano_de_obra",
          valorNeto: c.valorNeto ?? 0,
          estado: "pendiente",
        });
      }
    }
  }
  for (const h of i.hojalaterias) {
    out.push({
      tipoDocumento: "cotizacion",
      categoria: "hojalateria",
      valorNeto: h.valorNeto ?? 0,
      estado: "aprobada",
    });
  }
  return out;
}

export type CostoCategoriaNeto = {
  neto: number;
  estimado: boolean;
  cotizadoNeto: number;
  facturadoNeto: number;
};

export function costoCategoria(
  i: IntervencionIndicadores,
  categoria: CategoriaDocumentoFachada,
): CostoCategoriaNeto {
  if (categoria === "materiales") {
    const facturadoNeto = sumNeto(i.materiales);
    const docs = documentosEfectivos(i).filter((d) => d.categoria === "materiales");
    const cotizadoNeto = sumNeto(
      docs.filter((d) => d.tipoDocumento === "cotizacion" && d.estado === "aprobada"),
    );
    return {
      neto: facturadoNeto,
      estimado: false,
      cotizadoNeto,
      facturadoNeto,
    };
  }

  const docs = documentosEfectivos(i).filter((d) => d.categoria === categoria);
  const facturas = docs.filter(
    (d) => d.tipoDocumento === "factura" || d.tipoDocumento === "boleta",
  );
  const facturadoNeto = sumNeto(facturas);
  const cotizadoNeto = sumNeto(
    docs.filter((d) => d.tipoDocumento === "cotizacion" && d.estado === "aprobada"),
  );
  if (facturas.length > 0) {
    return { neto: facturadoNeto, estimado: false, cotizadoNeto, facturadoNeto };
  }
  return {
    neto: cotizadoNeto,
    estimado: cotizadoNeto > 0,
    cotizadoNeto,
    facturadoNeto: 0,
  };
}

export type CostoNetoIntervencion = {
  manoDeObra: CostoCategoriaNeto;
  materiales: CostoCategoriaNeto;
  hojalateria: CostoCategoriaNeto;
  totalNeto: number;
  estimado: boolean;
  costoPorM2: number | null;
};

export function costoNetoIntervencion(
  i: IntervencionIndicadores,
): CostoNetoIntervencion {
  const manoDeObra = costoCategoria(i, "mano_de_obra");
  const materiales = costoCategoria(i, "materiales");
  const hojalateria = costoCategoria(i, "hojalateria");
  const totalNeto = manoDeObra.neto + materiales.neto + hojalateria.neto;
  const m2 = m2Snapshot(i);
  return {
    manoDeObra,
    materiales,
    hojalateria,
    totalNeto,
    estimado: manoDeObra.estimado || hojalateria.estimado,
    costoPorM2: m2 > 0 && totalNeto > 0 ? Math.round(totalNeto / m2) : null,
  };
}

export function materialesNetoPorTipo(i: IntervencionIndicadores): {
  pintura: number;
  otros: number;
} {
  let pintura = 0;
  let otros = 0;
  for (const m of i.materiales) {
    const n = m.valorNeto ?? 0;
    if ((m.tipo ?? "otros") === "pintura") pintura += n;
    else otros += n;
  }
  return { pintura, otros };
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
  let hojalateriaNeto = 0;
  let materialesNeto = 0;
  let cotizacionesN = 0;
  let cotizacionesConFactura = 0;

  for (const i of paraCostos) {
    const costo = costoNetoIntervencion(i);
    cotizacionesNeto += costo.manoDeObra.neto;
    hojalateriaNeto += costo.hojalateria.neto;
    materialesNeto += costo.materiales.neto;
    if (costo.manoDeObra.cotizadoNeto > 0 || costo.manoDeObra.facturadoNeto > 0) {
      cotizacionesN += 1;
      if (costo.manoDeObra.facturadoNeto > 0) cotizacionesConFactura += 1;
    }
  }

  const totalNeto = cotizacionesNeto + hojalateriaNeto + materialesNeto;

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
      cotizacionesBruto: cotizacionesNeto,
      hojalateriaNeto,
      hojalateriaBruto: hojalateriaNeto,
      materialesNeto,
      materialesBruto: materialesNeto,
      totalNeto,
      totalBruto: totalNeto,
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
    if (filtro.recintoId && i.recintoId !== filtro.recintoId) {
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
  const costo = costoNetoIntervencion(i);
  const cotiz = costo.manoDeObra.neto;
  const hoja = costo.hojalateria.neto;
  const mat = costo.materiales.neto;
  const total = costo.totalNeto;
  const pct = (n: number): number | null =>
    total > 0 ? redondearM2((n / total) * 100) : null;
  const facturasN = costo.manoDeObra.cotizadoNeto > 0 || costo.manoDeObra.facturadoNeto > 0 ? 1 : 0;
  const facturasM = costo.manoDeObra.facturadoNeto > 0 ? 1 : 0;
  return {
    completaDias: esCompletaParaDias(i),
    completaCostos: esCompletaParaCostos(i),
    m2,
    dias,
    diasTotal,
    diasPorM2: m2 > 0 && diasTotal > 0 ? redondearM2(diasTotal / m2) : null,
    duracionCalendario: duracionCalendarioDias(i.fechaInicio, i.fechaTermino),
    desglose: [
      { key: "cotizaciones", label: "Mano de obra (neto)", bruto: cotiz, pct: pct(cotiz) },
      { key: "hojalateria", label: "Hojalatería (neto)", bruto: hoja, pct: pct(hoja) },
      { key: "materiales", label: "Materiales (neto)", bruto: mat, pct: pct(mat) },
    ],
    costoTotalBruto: total,
    costoPorM2: costo.costoPorM2,
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
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDiasCl(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n);
}

export type FachadaIndicadores = {
  id: string;
  recintoId: string | null;
  superficieM2: number;
  frecuenciaRevisionMeses: FrecuenciaRevisionMeses;
  letra?: string | null;
  codigoRecinto?: string | null;
};

export function addMonthsIso(iso: string, months: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const target = monthIndex + months;
  const ny = year + Math.floor(target / 12);
  const nm = ((target % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const d = Math.min(day, lastDay);
  return `${String(ny).padStart(4, "0")}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fechaReferenciaProgramada(i: IntervencionIndicadores): string | null {
  return i.fechaInicio || i.fechaTermino;
}

export function ultimaTerminada(
  intervenciones: IntervencionIndicadores[],
): IntervencionIndicadores | null {
  const term = intervenciones
    .filter((i) => estadoDeIntervencion(i) === "terminada" && i.fechaTermino)
    .slice()
    .sort((a, b) => (b.fechaTermino ?? "").localeCompare(a.fechaTermino ?? ""));
  return term[0] ?? null;
}

export function estadoCalculadoFachada(
  fachada: FachadaIndicadores,
  intervenciones: IntervencionIndicadores[],
  hoy: string,
): EstadoCalculadoFachada {
  const propias = intervenciones.filter((i) => i.fachadaId === fachada.id);
  if (propias.some((i) => estadoDeIntervencion(i) === "en_ejecucion")) {
    return "en_ejecucion";
  }
  const hayProgramadaFutura = propias.some((i) => {
    if (estadoDeIntervencion(i) !== "programada") return false;
    const f = fechaReferenciaProgramada(i);
    return Boolean(f && f > hoy);
  });
  if (hayProgramadaFutura) return "programada";
  const ultima = ultimaTerminada(propias);
  if (ultima?.fechaTermino) {
    const prox = addMonthsIso(ultima.fechaTermino, fachada.frecuenciaRevisionMeses);
    if (prox && prox > hoy) return "al_dia";
  }
  return "requiere_trabajo";
}

export function proximaRevision(
  fachada: FachadaIndicadores,
  intervenciones: IntervencionIndicadores[],
): string | null {
  const ultima = ultimaTerminada(
    intervenciones.filter((i) => i.fachadaId === fachada.id),
  );
  if (!ultima?.fechaTermino) return null;
  return addMonthsIso(ultima.fechaTermino, fachada.frecuenciaRevisionMeses);
}

export function etiquetaCortaFachada(
  codigoRecinto: string | null | undefined,
  letra: string | null | undefined,
): string {
  const codigo = (codigoRecinto ?? "").trim();
  const l = (letra ?? "").trim();
  if (codigo && l) return `${codigo}·${l}`;
  return codigo || l;
}

export type SuperficieDashboard = {
  m2Totales: number;
  m2Intervenidos: number;
  m2Restantes: number;
  pctIntervenidos: number | null;
  fachadasIntervenidasN: number;
  fachadasN: number;
};

export function superficieDashboard(
  fachadas: FachadaIndicadores[],
  intervenciones: IntervencionIndicadores[],
  filtro: FiltroDashboardFachadas,
): SuperficieDashboard {
  const fachadasFil = filtro.recintoId
    ? fachadas.filter((f) => f.recintoId === filtro.recintoId)
    : fachadas;
  const ids = new Set(fachadasFil.map((f) => f.id));
  const ints = filtrarIntervenciones(
    intervenciones.filter((i) => ids.has(i.fachadaId)),
    filtro,
  );
  const terminadasIds = new Set(
    ints
      .filter((i) => estadoDeIntervencion(i) === "terminada")
      .map((i) => i.fachadaId),
  );
  const m2Totales = redondearM2(
    fachadasFil.reduce((acc, f) => acc + f.superficieM2, 0),
  );
  let m2Intervenidos = 0;
  for (const f of fachadasFil) {
    if (terminadasIds.has(f.id)) m2Intervenidos += f.superficieM2;
  }
  m2Intervenidos = redondearM2(m2Intervenidos);
  return {
    m2Totales,
    m2Intervenidos,
    m2Restantes: redondearM2(m2Totales - m2Intervenidos),
    pctIntervenidos:
      m2Totales > 0 ? redondearM2((m2Intervenidos / m2Totales) * 100) : null,
    fachadasIntervenidasN: terminadasIds.size,
    fachadasN: fachadasFil.length,
  };
}

export type AlertaCotizacionSinFactura = {
  intervencionId: string;
  categoria: CategoriaDocumentoFachada;
  cotizadoNeto: number;
};

export type AlertaDiferenciaCotizadoFacturado = {
  intervencionId: string;
  categoria: CategoriaDocumentoFachada;
  cotizadoNeto: number;
  facturadoNeto: number;
  diferenciaNeto: number;
};

export function alertasDocumentos(intervenciones: IntervencionIndicadores[]): {
  cotizacionesAprobadasSinFactura: AlertaCotizacionSinFactura[];
  diferenciasCotizadoFacturado: AlertaDiferenciaCotizadoFacturado[];
} {
  const cotizacionesAprobadasSinFactura: AlertaCotizacionSinFactura[] = [];
  const diferenciasCotizadoFacturado: AlertaDiferenciaCotizadoFacturado[] = [];
  for (const i of intervenciones) {
    for (const categoria of CATEGORIAS_DOCUMENTO_FACHADA) {
      const c = costoCategoria(i, categoria);
      if (c.cotizadoNeto > 0 && c.facturadoNeto <= 0) {
        cotizacionesAprobadasSinFactura.push({
          intervencionId: i.id,
          categoria,
          cotizadoNeto: c.cotizadoNeto,
        });
      } else if (c.cotizadoNeto > 0 && c.facturadoNeto > 0 && c.cotizadoNeto !== c.facturadoNeto) {
        diferenciasCotizadoFacturado.push({
          intervencionId: i.id,
          categoria,
          cotizadoNeto: c.cotizadoNeto,
          facturadoNeto: c.facturadoNeto,
          diferenciaNeto: c.facturadoNeto - c.cotizadoNeto,
        });
      }
    }
  }
  return { cotizacionesAprobadasSinFactura, diferenciasCotizadoFacturado };
}
