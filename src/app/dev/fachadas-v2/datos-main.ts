import { FACHADAS_PLANO } from "@/components/fachadas/plano/geometria";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import type { FachadaListadoItem } from "@/lib/fachadas/tipos";

/** La fachada que ya tiene intervención en producción. */
export const FACHADA_REAL_ID = "95c58c33-5034-4403-977b-6bd04efb4310";
export const FACHADA_REAL_SVG = "s1-local-1-f1";
export const HOY_DEV_MAIN = "2026-10-09";

function etiquetaUnidad(nombre: string): string {
  return nombre.split(" · ")[0] ?? nombre;
}

export function fachadasDevMain(): FachadaListadoItem[] {
  const orden = new Map<string, number>();
  return FACHADAS_PLANO.map((geometria) => {
    const unidad = etiquetaUnidad(geometria.nombre);
    const siguiente = (orden.get(unidad) ?? 0) + 1;
    orden.set(unidad, siguiente);
    const real = geometria.id === FACHADA_REAL_SVG;
    return {
      id: real ? FACHADA_REAL_ID : `dev-${geometria.id}`,
      nombre: geometria.nombre,
      letra: null,
      svgId: geometria.id,
      ubicacion: geometria.ubicacion,
      unidadLabel: unidad,
      orden: siguiente,
      evaluadaEn: null,
      recintoId: null,
      recintoCodigo: null,
      recintoEtiqueta: unidad,
      superficieM2: null,
      frecuenciaRevisionMeses: 12,
      frecuenciaLimpiezaMeses: 6,
      frecuenciaReparacionMeses: 24,
      frecuenciaPinturaMeses: 24,
      ultimaLimpiezaFecha: null,
      ultimaReparacionFecha: null,
      ultimaPinturaFecha: null,
      fotoUrl: null,
      intervencionesN: real ? 1 : 0,
      ultimoEstado: "programada",
    };
  });
}

export function intervencionesDevMain(): IntervencionIndicadores[] {
  return [
    {
      id: "5709da4d-dev-programada",
      fachadaId: FACHADA_REAL_ID,
      ejecutadoPor: "maestros_bodetek",
      requiereHojalateria: false,
      sinMateriales: true,
      fechaInicio: "2026-11-02",
      fechaTermino: null,
      creadoEn: "2026-08-20",
      estado: "programada",
      altoMSnapshot: null,
      anchoMSnapshot: null,
      superficieM2Snapshot: null,
      tipos: [],
      cotizaciones: [],
      hojalaterias: [],
      materiales: [],
      documentos: [],
    },
  ];
}
