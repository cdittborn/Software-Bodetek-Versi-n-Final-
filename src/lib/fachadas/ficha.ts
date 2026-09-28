/** Helpers de presentación de la ficha (captura 2). Sin I/O. */

import {
  costoNetoIntervencion,
  formatDiasCl,
  TIPOS_INTERVENCION_FACHADA,
  TIPO_INTERVENCION_FACHADA_LABEL,
  type CostoCategoriaNeto,
  type IntervencionIndicadores,
  type TipoIntervencionDias,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import type { MediaFachada } from "@/lib/fachadas/tipos";

export function hoyIsoChile(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function diasCalendario(
  inicio: string | null,
  termino: string | null,
): number | null {
  if (!inicio || !termino) return null;
  const a = Date.parse(`${inicio}T00:00:00Z`);
  const b = Date.parse(`${termino}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

export type ChipTipoFicha = {
  tipo: TipoIntervencionFachada;
  label: string;
  realizado: boolean;
};

export function chipsTiposIntervencion(
  tipos: TipoIntervencionDias[],
): ChipTipoFicha[] {
  const porTipo = new Map(tipos.map((t) => [t.tipo, t.dias]));
  return TIPOS_INTERVENCION_FACHADA.map((tipo) => {
    const dias = porTipo.get(tipo);
    const realizado = dias != null && dias > 0;
    return {
      tipo,
      label: realizado
        ? `${TIPO_INTERVENCION_FACHADA_LABEL[tipo]} · ${formatDiasCl(dias)} d`
        : TIPO_INTERVENCION_FACHADA_LABEL[tipo],
      realizado,
    };
  });
}

export function mediaPortada(
  media: MediaFachada[],
  tipo: "antes" | "despues",
): MediaFachada | null {
  const list = media.filter(
    (m) => m.tipo === tipo && m.tipoArchivo === "foto" && Boolean(m.publicUrl),
  );
  return list.find((m) => m.esPortada) ?? list[0] ?? null;
}

export function totalHistoricoNeto(ints: IntervencionIndicadores[]): number {
  return ints.reduce((acc, i) => acc + costoNetoIntervencion(i).totalNeto, 0);
}

export function diferenciaFacturadoMenosCotizado(
  cat: CostoCategoriaNeto,
): number {
  return cat.facturadoNeto - cat.cotizadoNeto;
}
