import { formatMontoClp, etiquetaRecintoSelector, type RecintoOption } from "@/lib/trabajos";
import {
  estadoFachadaDesdeDb,
  estadoIntervencionDesdeDb,
  FRECUENCIA_LIMPIEZA_DEFAULT,
  FRECUENCIA_PINTURA_DEFAULT,
  FRECUENCIA_REPARACION_DEFAULT,
} from "@/lib/fachadas/estado";
import {
  asMedidaNullable,
  indicadoresDeIntervencion,
  type CategoriaDocumentoFachada,
  type DocumentoIndicador,
  type EjecutadoPorFachada,
  type IntervencionIndicadores,
  type TipoDocumentoFachada,
  type TipoIntervencionFachada,
  type TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import { urlPublicaONull } from "@/lib/fachadas/url";
import type {
  ArchivoEstadoFachada,
  CotizacionDetalle,
  DocumentoFachada,
  FachadaDetalle,
  FachadaListadoItem,
  HojalateriaDetalle,
  IntervencionResumen,
  MaterialDetalle,
  MediaFachada,
  TipoEspacioFachada,
  UbicacionFachada,
} from "@/lib/fachadas/tipos";

function asFrecuenciaTipo(
  value: number | null | undefined,
  fallback: number,
): number {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  return fallback;
}

function asFechaIso(value: string | null | undefined): string | null {
  const t = (value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function asTipoMaterial(value: string | null | undefined): TipoMaterialFachada {
  return value === "pintura" ? "pintura" : "otros";
}

function asTipo(value: string): TipoIntervencionFachada | null {
  if (value === "limpieza" || value === "reparacion" || value === "pintura") {
    return value;
  }
  return null;
}

function asEjecutor(value: string | null): EjecutadoPorFachada | null {
  if (value === "maestros_bodetek" || value === "proveedor_externo") return value;
  return null;
}

function asUbicacion(value: string | null | undefined): UbicacionFachada | null {
  if (value === "interior" || value === "exterior") return value;
  return null;
}

function asTipoEspacio(value: string | null | undefined): TipoEspacioFachada | null {
  if (
    value === "unidad" ||
    value === "compartida" ||
    value === "espacio_comun" ||
    value === "perimetro"
  ) {
    return value;
  }
  return null;
}

function columnasPlano(row: {
  svg_id?: string | null;
  ubicacion?: string | null;
  tipo_espacio?: string | null;
  unidad_label?: string | null;
  orden?: number | null;
  largo_plano_m?: number | null;
  evaluada_en?: string | null;
}) {
  const orden = Number(row.orden);
  return {
    svgId: row.svg_id ?? null,
    ubicacion: asUbicacion(row.ubicacion),
    tipoEspacio: asTipoEspacio(row.tipo_espacio),
    unidadLabel: row.unidad_label ?? null,
    orden: Number.isInteger(orden) && orden > 0 ? orden : null,
    largoPlanoM: asMedidaNullable(row.largo_plano_m),
    evaluadaEn: asFechaIso(row.evaluada_en),
  };
}

export function etiquetaRecintoOGeneral(
  recintoId: string | null,
  recintos: RecintoOption[],
): string {
  if (!recintoId) return "General";
  const r = recintos.find((x) => x.id === recintoId);
  return r ? etiquetaRecintoSelector(r) : "General";
}

export function rowAIndicadores(row: {
  id: string;
  fachada_id: string;
  recinto_id?: string | null;
  proveedor_id: string | null;
  ejecutado_por: string | null;
  requiere_hojalateria: boolean;
  sin_materiales: boolean;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  estado?: string | null;
  alto_m_snapshot: number | null;
  ancho_m_snapshot: number | null;
  superficie_m2_snapshot: number | null;
  tipos: { tipo: string; dias: number }[];
  cotizaciones: {
    valor_neto: number;
    valor_bruto: number;
    cotizacion_key: string | null;
    factura_key: string | null;
    tipos: string[];
  }[];
  hojalaterias: {
    proveedor_id: string | null;
    valor_neto: number;
    valor_bruto: number;
  }[];
  materiales: { valor_neto: number; valor_bruto: number; tipo?: string | null }[];
  documentos?: {
    tipo_documento: string;
    categoria: string;
    valor_neto: number;
    estado: string;
  }[];
}): IntervencionIndicadores {
  return {
    id: row.id,
    fachadaId: row.fachada_id,
    recintoId: row.recinto_id ?? null,
    proveedorId: row.proveedor_id,
    ejecutadoPor: asEjecutor(row.ejecutado_por),
    requiereHojalateria: row.requiere_hojalateria,
    sinMateriales: row.sin_materiales,
    fechaInicio: row.fecha_inicio,
    fechaTermino: row.fecha_termino,
    estado: estadoIntervencionDesdeDb(row.estado),
    altoMSnapshot: asMedidaNullable(row.alto_m_snapshot),
    anchoMSnapshot: asMedidaNullable(row.ancho_m_snapshot),
    superficieM2Snapshot: asMedidaNullable(row.superficie_m2_snapshot),
    tipos: row.tipos
      .map((t) => {
        const tipo = asTipo(t.tipo);
        return tipo ? { tipo, dias: Number(t.dias) } : null;
      })
      .filter((t): t is { tipo: TipoIntervencionFachada; dias: number } => t != null),
    cotizaciones: row.cotizaciones.map((c) => ({
      valorNeto: c.valor_neto,
      valorBruto: c.valor_bruto,
      cotizacionKey: c.cotizacion_key,
      facturaKey: c.factura_key,
      tipos: c.tipos
        .map(asTipo)
        .filter((t): t is TipoIntervencionFachada => t != null),
    })),
    hojalaterias: row.hojalaterias.map((h) => ({
      proveedorId: h.proveedor_id,
      valorNeto: h.valor_neto,
      valorBruto: h.valor_bruto,
    })),
    materiales: row.materiales.map((m) => ({
      tipo: asTipoMaterial(m.tipo),
      valorNeto: m.valor_neto,
      valorBruto: m.valor_bruto,
    })),
    documentos: (row.documentos ?? [])
      .map((d): DocumentoIndicador | null => {
        const tipoDocumento: TipoDocumentoFachada | null =
          d.tipo_documento === "cotizacion" ||
          d.tipo_documento === "factura" ||
          d.tipo_documento === "boleta"
            ? d.tipo_documento
            : null;
        const categoria: CategoriaDocumentoFachada | null =
          d.categoria === "mano_de_obra" ||
          d.categoria === "materiales" ||
          d.categoria === "hojalateria"
            ? d.categoria
            : null;
        if (!tipoDocumento || !categoria) return null;
        return {
          tipoDocumento,
          categoria,
          valorNeto: d.valor_neto,
          estado: d.estado,
        };
      })
      .filter((d): d is DocumentoIndicador => d != null),
  };
}

export function mapFachadaListado(
  row: {
    id: string;
    nombre: string;
    letra?: string | null;
    recinto_id: string | null;
    superficie_m2: number | null;
    frecuencia_revision_meses?: number | null;
    frecuencia_limpieza_meses?: number | null;
    frecuencia_reparacion_meses?: number | null;
    frecuencia_pintura_meses?: number | null;
    ultima_limpieza_fecha?: string | null;
    ultima_reparacion_fecha?: string | null;
    ultima_pintura_fecha?: string | null;
    foto_key: string | null;
    svg_id?: string | null;
    ubicacion?: string | null;
    tipo_espacio?: string | null;
    unidad_label?: string | null;
    orden?: number | null;
    largo_plano_m?: number | null;
    evaluada_en?: string | null;
    intervenciones: { id: string; estado: string | null; created_at: string }[];
  },
  recintos: RecintoOption[],
): FachadaListadoItem {
  const ints = [...row.intervenciones].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const recinto = recintos.find((r) => r.id === row.recinto_id);
  return {
    id: row.id,
    nombre: row.nombre,
    letra: row.letra ?? null,
    ...columnasPlano(row),
    recintoId: row.recinto_id,
    recintoCodigo: recinto?.codigo ?? null,
    recintoEtiqueta: etiquetaRecintoOGeneral(row.recinto_id, recintos),
    superficieM2: asMedidaNullable(row.superficie_m2),
    frecuenciaRevisionMeses: asFrecuenciaTipo(row.frecuencia_revision_meses, 12),
    frecuenciaLimpiezaMeses: asFrecuenciaTipo(
      row.frecuencia_limpieza_meses,
      FRECUENCIA_LIMPIEZA_DEFAULT,
    ),
    frecuenciaReparacionMeses: asFrecuenciaTipo(
      row.frecuencia_reparacion_meses,
      FRECUENCIA_REPARACION_DEFAULT,
    ),
    frecuenciaPinturaMeses: asFrecuenciaTipo(
      row.frecuencia_pintura_meses,
      FRECUENCIA_PINTURA_DEFAULT,
    ),
    ultimaLimpiezaFecha: asFechaIso(row.ultima_limpieza_fecha),
    ultimaReparacionFecha: asFechaIso(row.ultima_reparacion_fecha),
    ultimaPinturaFecha: asFechaIso(row.ultima_pintura_fecha),
    fotoUrl: urlPublicaONull(row.foto_key),
    intervencionesN: row.intervenciones.length,
    ultimoEstado: estadoFachadaDesdeDb(ints[0]?.estado ?? null),
  };
}

export function mapIntervencionResumen(row: {
  id: string;
  estado: string | null;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  ejecutado_por: string | null;
  indicadores: IntervencionIndicadores;
}): IntervencionResumen {
  const ind = indicadoresDeIntervencion(row.indicadores);
  return {
    id: row.id,
    estado: estadoFachadaDesdeDb(row.estado),
    fechaInicio: row.fecha_inicio,
    fechaTermino: row.fecha_termino,
    ejecutadoPor: asEjecutor(row.ejecutado_por),
    costoTotalBruto: ind.costoTotalBruto,
    costoPorM2: ind.costoPorM2,
    superficieM2Snapshot: asMedidaNullable(row.indicadores.superficieM2Snapshot),
  };
}

export function mapFachadaDetalle(
  row: {
    id: string;
    nombre: string;
    letra?: string | null;
    recinto_id: string | null;
    alto_m: number | null;
    ancho_m: number | null;
    superficie_m2: number | null;
    frecuencia_revision_meses?: number | null;
    frecuencia_limpieza_meses?: number | null;
    frecuencia_reparacion_meses?: number | null;
    frecuencia_pintura_meses?: number | null;
    ultima_limpieza_fecha?: string | null;
    ultima_reparacion_fecha?: string | null;
    ultima_pintura_fecha?: string | null;
    notas: string | null;
    foto_key: string | null;
    foto_nombre: string | null;
    plano_key: string | null;
    plano_nombre: string | null;
    svg_id?: string | null;
    ubicacion?: string | null;
    tipo_espacio?: string | null;
    unidad_label?: string | null;
    orden?: number | null;
    largo_plano_m?: number | null;
    evaluada_en?: string | null;
  },
  recintos: RecintoOption[],
  intervenciones: IntervencionResumen[],
): FachadaDetalle {
  return {
    id: row.id,
    nombre: row.nombre,
    letra: row.letra ?? null,
    ...columnasPlano(row),
    recintoId: row.recinto_id,
    recintoCodigo: recintos.find((r) => r.id === row.recinto_id)?.codigo ?? null,
    recintoEtiqueta: etiquetaRecintoOGeneral(row.recinto_id, recintos),
    altoM: asMedidaNullable(row.alto_m),
    anchoM: asMedidaNullable(row.ancho_m),
    superficieM2: asMedidaNullable(row.superficie_m2),
    frecuenciaRevisionMeses: asFrecuenciaTipo(row.frecuencia_revision_meses, 12),
    frecuenciaLimpiezaMeses: asFrecuenciaTipo(
      row.frecuencia_limpieza_meses,
      FRECUENCIA_LIMPIEZA_DEFAULT,
    ),
    frecuenciaReparacionMeses: asFrecuenciaTipo(
      row.frecuencia_reparacion_meses,
      FRECUENCIA_REPARACION_DEFAULT,
    ),
    frecuenciaPinturaMeses: asFrecuenciaTipo(
      row.frecuencia_pintura_meses,
      FRECUENCIA_PINTURA_DEFAULT,
    ),
    ultimaLimpiezaFecha: asFechaIso(row.ultima_limpieza_fecha),
    ultimaReparacionFecha: asFechaIso(row.ultima_reparacion_fecha),
    ultimaPinturaFecha: asFechaIso(row.ultima_pintura_fecha),
    notas: row.notas,
    foto: {
      key: row.foto_key,
      nombre: row.foto_nombre,
      url: urlPublicaONull(row.foto_key),
    },
    archivos: [],
    plano: {
      key: row.plano_key,
      nombre: row.plano_nombre,
      url: urlPublicaONull(row.plano_key),
    },
    intervenciones,
  };
}

export function mapCotizacion(row: {
  id: string;
  proveedor_id: string | null;
  numero_cotizacion: string | null;
  valor_neto: number;
  valor_iva: number;
  valor_bruto: number;
  cotizacion_key: string | null;
  cotizacion_nombre: string | null;
  factura_key: string | null;
  factura_nombre: string | null;
  tipos: string[];
}): CotizacionDetalle {
  return {
    id: row.id,
    proveedorId: row.proveedor_id,
    numeroCotizacion: row.numero_cotizacion,
    valorNeto: row.valor_neto,
    valorIva: row.valor_iva,
    valorBruto: row.valor_bruto,
    cotizacionKey: row.cotizacion_key,
    cotizacionNombre: row.cotizacion_nombre,
    cotizacionUrl: urlPublicaONull(row.cotizacion_key),
    facturaKey: row.factura_key,
    facturaNombre: row.factura_nombre,
    facturaUrl: urlPublicaONull(row.factura_key),
    tipos: row.tipos
      .map(asTipo)
      .filter((t): t is TipoIntervencionFachada => t != null),
  };
}

export function mapHojalateria(row: {
  id: string;
  proveedor_id: string | null;
  descripcion: string | null;
  valor_neto: number;
  valor_iva: number;
  valor_bruto: number;
  cotizacion_key: string | null;
  cotizacion_nombre: string | null;
  factura_key: string | null;
  factura_nombre: string | null;
}): HojalateriaDetalle {
  return {
    id: row.id,
    proveedorId: row.proveedor_id,
    descripcion: row.descripcion,
    valorNeto: row.valor_neto,
    valorIva: row.valor_iva,
    valorBruto: row.valor_bruto,
    cotizacionKey: row.cotizacion_key,
    cotizacionNombre: row.cotizacion_nombre,
    cotizacionUrl: urlPublicaONull(row.cotizacion_key),
    facturaKey: row.factura_key,
    facturaNombre: row.factura_nombre,
    facturaUrl: urlPublicaONull(row.factura_key),
  };
}

export function mapMaterial(row: {
  id: string;
  tipo?: string | null;
  fecha_compra: string | null;
  proveedor_id: string | null;
  numero_factura: string | null;
  material: string;
  valor_neto: number;
  valor_iva: number;
  valor_bruto: number;
  factura_key: string | null;
  factura_nombre: string | null;
}): MaterialDetalle {
  return {
    id: row.id,
    tipo: asTipoMaterial(row.tipo),
    fechaCompra: row.fecha_compra,
    proveedorId: row.proveedor_id,
    numeroFactura: row.numero_factura,
    material: row.material,
    valorNeto: row.valor_neto,
    valorIva: row.valor_iva,
    valorBruto: row.valor_bruto,
    facturaKey: row.factura_key,
    facturaNombre: row.factura_nombre,
    facturaUrl: urlPublicaONull(row.factura_key),
  };
}

export function mapArchivoEstado(row: {
  id: string;
  tipo_archivo: string;
  object_key: string;
  nombre_archivo: string | null;
  thumbnail_key: string | null;
  es_portada?: boolean | null;
  orden?: number | null;
  fecha?: string | null;
  momento?: string | null;
  duracion_seg?: number | null;
}): ArchivoEstadoFachada {
  const duracion = row.duracion_seg == null ? null : Number(row.duracion_seg);
  return {
    id: row.id,
    tipoArchivo: row.tipo_archivo === "video" ? "video" : "foto",
    objectKey: row.object_key,
    nombreArchivo: row.nombre_archivo,
    thumbnailKey: row.thumbnail_key,
    publicUrl: urlPublicaONull(row.object_key),
    thumbnailUrl: urlPublicaONull(row.thumbnail_key),
    esPortada: Boolean(row.es_portada),
    orden: row.orden ?? 0,
    fecha: row.fecha ?? null,
    momento: row.momento === "despues" ? "despues" : "antes",
    duracionSeg: duracion != null && Number.isFinite(duracion) && duracion >= 0 ? duracion : null,
  };
}

export function mapMedia(row: {
  id: string;
  tipo: string;
  tipo_archivo: string;
  object_key: string;
  nombre_archivo: string | null;
  thumbnail_key: string | null;
  es_portada?: boolean | null;
  orden?: number | null;
  fecha?: string | null;
}): MediaFachada | null {
  if (row.tipo !== "antes" && row.tipo !== "despues") return null;
  if (row.tipo_archivo !== "foto" && row.tipo_archivo !== "video") return null;
  return {
    id: row.id,
    tipo: row.tipo,
    tipoArchivo: row.tipo_archivo,
    objectKey: row.object_key,
    nombreArchivo: row.nombre_archivo,
    thumbnailKey: row.thumbnail_key,
    publicUrl: urlPublicaONull(row.object_key),
    thumbnailUrl: urlPublicaONull(row.thumbnail_key),
    esPortada: Boolean(row.es_portada),
    orden: row.orden ?? 0,
    fecha: row.fecha ?? null,
  };
}

export function mapDocumento(row: {
  id: string;
  tipo_documento: string;
  categoria: string;
  proveedor_id: string | null;
  numero: string | null;
  fecha: string | null;
  valor_neto: number;
  archivo_key: string | null;
  archivo_nombre: string | null;
  estado: string;
}): DocumentoFachada | null {
  const tipoDocumento =
    row.tipo_documento === "cotizacion" ||
    row.tipo_documento === "factura" ||
    row.tipo_documento === "boleta"
      ? (row.tipo_documento as TipoDocumentoFachada)
      : null;
  const categoria =
    row.categoria === "mano_de_obra" ||
    row.categoria === "materiales" ||
    row.categoria === "hojalateria"
      ? (row.categoria as CategoriaDocumentoFachada)
      : null;
  if (!tipoDocumento || !categoria) return null;
  return {
    id: row.id,
    tipoDocumento,
    categoria,
    proveedorId: row.proveedor_id,
    numero: row.numero,
    fecha: row.fecha,
    valorNeto: row.valor_neto,
    archivoKey: row.archivo_key,
    archivoNombre: row.archivo_nombre,
    archivoUrl: urlPublicaONull(row.archivo_key),
    estado: row.estado,
  };
}

export { formatMontoClp };
