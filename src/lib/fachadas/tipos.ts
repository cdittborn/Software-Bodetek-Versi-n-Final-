import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";
import type {
  CategoriaDocumentoFachada,
  EjecutadoPorFachada,
  TipoDocumentoFachada,
  TipoIntervencionFachada,
  TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import type { EstadoFachada } from "@/lib/fachadas/estado";

export type ArchivoFachada = {
  key: string | null;
  nombre: string | null;
  url: string | null;
};

export type FachadaListadoItem = {
  id: string;
  nombre: string;
  letra: string | null;
  recintoId: string | null;
  recintoCodigo: string | null;
  recintoEtiqueta: string;
  superficieM2: number;
  frecuenciaRevisionMeses: number;
  frecuenciaLimpiezaMeses: number;
  frecuenciaReparacionMeses: number;
  frecuenciaPinturaMeses: number;
  ultimaLimpiezaFecha: string | null;
  ultimaReparacionFecha: string | null;
  ultimaPinturaFecha: string | null;
  fotoUrl: string | null;
  intervencionesN: number;
  ultimoEstado: EstadoFachada;
};

export type PortadaIntervencion = {
  intervencionId: string;
  antesUrl: string | null;
  despuesUrl: string | null;
};

export type IntervencionResumen = {
  id: string;
  estado: EstadoFachada;
  fechaInicio: string | null;
  fechaTermino: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  costoTotalBruto: number;
  costoPorM2: number | null;
  superficieM2Snapshot: number;
};

export type FachadaDetalle = {
  id: string;
  nombre: string;
  letra: string | null;
  recintoId: string | null;
  recintoCodigo: string | null;
  recintoEtiqueta: string;
  altoM: number;
  anchoM: number;
  superficieM2: number;
  frecuenciaRevisionMeses: number;
  frecuenciaLimpiezaMeses: number;
  frecuenciaReparacionMeses: number;
  frecuenciaPinturaMeses: number;
  ultimaLimpiezaFecha: string | null;
  ultimaReparacionFecha: string | null;
  ultimaPinturaFecha: string | null;
  notas: string | null;
  foto: ArchivoFachada;
  plano: ArchivoFachada;
  intervenciones: IntervencionResumen[];
};

export type MediaFachada = {
  id: string;
  tipo: "antes" | "despues";
  tipoArchivo: "foto" | "video";
  objectKey: string;
  nombreArchivo: string | null;
  thumbnailKey: string | null;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  esPortada: boolean;
  orden: number;
  fecha: string | null;
};

export type CotizacionDetalle = {
  id: string;
  proveedorId: string | null;
  numeroCotizacion: string | null;
  valorNeto: number;
  valorIva: number;
  valorBruto: number;
  cotizacionKey: string | null;
  cotizacionNombre: string | null;
  cotizacionUrl: string | null;
  facturaKey: string | null;
  facturaNombre: string | null;
  facturaUrl: string | null;
  tipos: TipoIntervencionFachada[];
};

export type HojalateriaDetalle = {
  id: string;
  proveedorId: string | null;
  descripcion: string | null;
  valorNeto: number;
  valorIva: number;
  valorBruto: number;
  cotizacionKey: string | null;
  cotizacionNombre: string | null;
  cotizacionUrl: string | null;
  facturaKey: string | null;
  facturaNombre: string | null;
  facturaUrl: string | null;
};

export type MaterialDetalle = {
  id: string;
  tipo: TipoMaterialFachada;
  fechaCompra: string | null;
  proveedorId: string | null;
  numeroFactura: string | null;
  material: string;
  valorNeto: number;
  valorIva: number;
  valorBruto: number;
  facturaKey: string | null;
  facturaNombre: string | null;
  facturaUrl: string | null;
};

export type DocumentoFachada = {
  id: string;
  tipoDocumento: TipoDocumentoFachada;
  categoria: CategoriaDocumentoFachada;
  proveedorId: string | null;
  numero: string | null;
  fecha: string | null;
  valorNeto: number;
  archivoKey: string | null;
  archivoNombre: string | null;
  archivoUrl: string | null;
  estado: string;
};

export type IntervencionDetalle = {
  id: string;
  fachadaId: string;
  fachadaNombre: string;
  estado: EstadoFachada;
  fechaInicio: string | null;
  fechaTermino: string | null;
  notas: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  proveedorId: string | null;
  maestrosAsignados: string | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  altoMSnapshot: number;
  anchoMSnapshot: number;
  superficieM2Snapshot: number;
  tipos: { tipo: TipoIntervencionFachada; dias: number }[];
  cotizaciones: CotizacionDetalle[];
  hojalaterias: HojalateriaDetalle[];
  materiales: MaterialDetalle[];
  documentos: DocumentoFachada[];
  media: MediaFachada[];
};

export type CatalogosFachadas = {
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
};

export type ConteosBorrarFachada = {
  intervenciones: number;
  cotizaciones: number;
  fotos: number;
};
