import { formatMontoClp, etiquetaRecintoSelector, type RecintoOption } from "@/lib/trabajos";
import { estadoFachadaDesdeDb } from "@/lib/fachadas/estado";
import {
  indicadoresDeIntervencion,
  type EjecutadoPorFachada,
  type IntervencionIndicadores,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import { urlPublicaONull } from "@/lib/fachadas/url";
import type {
  CotizacionDetalle,
  FachadaDetalle,
  FachadaListadoItem,
  HojalateriaDetalle,
  IntervencionResumen,
  MaterialDetalle,
  MediaFachada,
} from "@/lib/fachadas/tipos";

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
  alto_m_snapshot: number;
  ancho_m_snapshot: number;
  superficie_m2_snapshot: number;
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
  materiales: { valor_neto: number; valor_bruto: number }[];
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
    altoMSnapshot: Number(row.alto_m_snapshot),
    anchoMSnapshot: Number(row.ancho_m_snapshot),
    superficieM2Snapshot: Number(row.superficie_m2_snapshot),
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
      valorNeto: m.valor_neto,
      valorBruto: m.valor_bruto,
    })),
  };
}

export function mapFachadaListado(
  row: {
    id: string;
    nombre: string;
    recinto_id: string | null;
    superficie_m2: number;
    foto_key: string | null;
    intervenciones: { id: string; estado: string | null; created_at: string }[];
  },
  recintos: RecintoOption[],
): FachadaListadoItem {
  const ints = [...row.intervenciones].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  return {
    id: row.id,
    nombre: row.nombre,
    recintoId: row.recinto_id,
    recintoEtiqueta: etiquetaRecintoOGeneral(row.recinto_id, recintos),
    superficieM2: Number(row.superficie_m2),
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
    superficieM2Snapshot: row.indicadores.superficieM2Snapshot ?? 0,
  };
}

export function mapFachadaDetalle(
  row: {
    id: string;
    nombre: string;
    recinto_id: string | null;
    alto_m: number;
    ancho_m: number;
    superficie_m2: number;
    notas: string | null;
    foto_key: string | null;
    foto_nombre: string | null;
    plano_key: string | null;
    plano_nombre: string | null;
  },
  recintos: RecintoOption[],
  intervenciones: IntervencionResumen[],
): FachadaDetalle {
  return {
    id: row.id,
    nombre: row.nombre,
    recintoId: row.recinto_id,
    recintoEtiqueta: etiquetaRecintoOGeneral(row.recinto_id, recintos),
    altoM: Number(row.alto_m),
    anchoM: Number(row.ancho_m),
    superficieM2: Number(row.superficie_m2),
    notas: row.notas,
    foto: {
      key: row.foto_key,
      nombre: row.foto_nombre,
      url: urlPublicaONull(row.foto_key),
    },
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

export function mapMedia(row: {
  id: string;
  tipo: string;
  tipo_archivo: string;
  object_key: string;
  nombre_archivo: string | null;
  thumbnail_key: string | null;
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
  };
}

export { formatMontoClp };
