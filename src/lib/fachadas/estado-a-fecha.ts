import type { EstadoIntervencionFachada } from "@/lib/fachadas/estado";
import {
  estadoCalculadoFachada,
  type FachadaIndicadores,
  type IntervencionIndicadores,
} from "@/lib/fachadas/indicadores";
import type { EstadoPlano } from "@/lib/fachadas/plano";
import type { FachadaListadoItem } from "@/lib/fachadas/tipos";

function aIndicadores(fachada: FachadaListadoItem): FachadaIndicadores {
  return {
    id: fachada.id,
    nombre: fachada.nombre,
    recintoId: fachada.recintoId,
    superficieM2: fachada.superficieM2,
    frecuenciaLimpiezaMeses: fachada.frecuenciaLimpiezaMeses,
    frecuenciaReparacionMeses: fachada.frecuenciaReparacionMeses,
    frecuenciaPinturaMeses: fachada.frecuenciaPinturaMeses,
    frecuenciaRevisionMeses: fachada.frecuenciaRevisionMeses,
    letra: fachada.letra,
    codigoRecinto: fachada.recintoCodigo,
    ultimaLimpiezaFecha: fachada.ultimaLimpiezaFecha,
    ultimaReparacionFecha: fachada.ultimaReparacionFecha,
    ultimaPinturaFecha: fachada.ultimaPinturaFecha,
  };
}

function dia(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function creadoEl(intervencion: IntervencionIndicadores): string | null {
  return dia(intervencion.creadoEn) ?? dia(intervencion.fechaInicio) ?? dia(intervencion.fechaTermino);
}

function estadoEnFecha(
  intervencion: IntervencionIndicadores,
  fecha: string,
): EstadoIntervencionFachada {
  const termino = dia(intervencion.fechaTermino);
  const inicio = dia(intervencion.fechaInicio);
  if (termino && termino <= fecha) return "terminada";
  if (inicio && inicio <= fecha) return "en_ejecucion";
  return "programada";
}

/** Intervenciones que ya existían en D, con el estado que tenían ese día. */
export function intervencionesAFecha(
  intervenciones: IntervencionIndicadores[],
  fecha: string,
): IntervencionIndicadores[] {
  const diaCorte = dia(fecha) ?? fecha;
  return intervenciones.flatMap((intervencion) => {
    const creado = creadoEl(intervencion);
    if (!creado || creado > diaCorte) return [];
    return [{ ...intervencion, estado: estadoEnFecha(intervencion, diaCorte) }];
  });
}

export function estadoPlano(
  fachada: FachadaListadoItem,
  intervenciones: IntervencionIndicadores[],
  hoy: string,
): EstadoPlano {
  const propias = intervenciones.filter((intervencion) => intervencion.fachadaId === fachada.id);
  if (fachada.evaluadaEn == null && propias.length === 0) return "sin_evaluar";
  return estadoCalculadoFachada(aIndicadores(fachada), propias, dia(hoy) ?? hoy);
}

export function estadoAFecha(
  fachada: FachadaListadoItem,
  intervenciones: IntervencionIndicadores[],
  fecha: string,
): EstadoPlano {
  const diaCorte = dia(fecha) ?? fecha;
  const propias = intervencionesAFecha(
    intervenciones.filter((intervencion) => intervencion.fachadaId === fachada.id),
    diaCorte,
  );
  const evaluada = dia(fachada.evaluadaEn);
  if (propias.length === 0 && (evaluada == null || evaluada > diaCorte)) return "sin_evaluar";
  return estadoCalculadoFachada(aIndicadores(fachada), propias, diaCorte);
}
