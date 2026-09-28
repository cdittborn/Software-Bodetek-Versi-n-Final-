/** Agregados del dashboard Fachadas (captura 1). Sin I/O. */

import {
  ESTADOS_CALCULADOS_FACHADA,
  type EstadoCalculadoFachada,
} from "@/lib/fachadas/estado";
import {
  costoNetoIntervencion,
  estadoCalculadoFachada,
  etiquetaCortaFachada,
  filtrarIntervenciones,
  TIPOS_INTERVENCION_FACHADA,
  type FachadaIndicadores,
  type FiltroDashboardFachadas,
  type IntervencionIndicadores,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import type { FachadaListadoItem } from "@/lib/fachadas/tipos";

export function listadoAIndicadores(f: FachadaListadoItem): FachadaIndicadores {
  return {
    id: f.id,
    recintoId: f.recintoId,
    superficieM2: f.superficieM2,
    frecuenciaRevisionMeses: f.frecuenciaRevisionMeses,
    letra: f.letra,
    codigoRecinto: f.recintoCodigo,
  };
}

export function estadoDeListado(
  f: FachadaListadoItem,
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): EstadoCalculadoFachada {
  return estadoCalculadoFachada(listadoAIndicadores(f), intervenciones, hoy);
}

export type ConteosEstadoFachada = Record<EstadoCalculadoFachada, number> & {
  total: number;
  intervenidas: number;
  pendientes: number;
};

export function conteosEstado(
  fachadas: FachadaListadoItem[],
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): ConteosEstadoFachada {
  const out: ConteosEstadoFachada = {
    al_dia: 0,
    en_ejecucion: 0,
    programada: 0,
    requiere_trabajo: 0,
    total: fachadas.length,
    intervenidas: 0,
    pendientes: 0,
  };
  for (const f of fachadas) {
    const e = estadoDeListado(f, intervenciones, hoy);
    out[e] += 1;
  }
  out.intervenidas = out.al_dia + out.en_ejecucion;
  out.pendientes = out.programada + out.requiere_trabajo;
  return out;
}

export type TrabajoRealizado = {
  key: TipoIntervencionFachada | "hojalateria";
  fachadasN: number;
  dias: number;
  neto: number;
};

export function trabajosRealizados(
  intervenciones: IntervencionIndicadores[],
): TrabajoRealizado[] {
  const acc: Record<
    TipoIntervencionFachada | "hojalateria",
    { fachadas: Set<string>; dias: number; neto: number }
  > = {
    limpieza: { fachadas: new Set(), dias: 0, neto: 0 },
    reparacion: { fachadas: new Set(), dias: 0, neto: 0 },
    pintura: { fachadas: new Set(), dias: 0, neto: 0 },
    hojalateria: { fachadas: new Set(), dias: 0, neto: 0 },
  };

  for (const i of intervenciones) {
    const costo = costoNetoIntervencion(i);
    const tipos = i.tipos.filter((t) => t.dias > 0);
    const diasTotal = tipos.reduce((a, t) => a + t.dias, 0);
    const resto = costo.manoDeObra.neto + costo.materiales.neto;
    for (const t of tipos) {
      acc[t.tipo].fachadas.add(i.fachadaId);
      acc[t.tipo].dias += t.dias;
      acc[t.tipo].neto +=
        diasTotal > 0 ? resto * (t.dias / diasTotal) : resto / tipos.length;
    }
    if (i.requiereHojalateria || costo.hojalateria.neto > 0) {
      acc.hojalateria.fachadas.add(i.fachadaId);
      acc.hojalateria.neto += costo.hojalateria.neto;
    }
  }

  const keys: Array<TipoIntervencionFachada | "hojalateria"> = [
    ...TIPOS_INTERVENCION_FACHADA,
    "hojalateria",
  ];
  return keys.map((key) => ({
    key,
    fachadasN: acc[key].fachadas.size,
    dias: Math.round(acc[key].dias * 10) / 10,
    neto: Math.round(acc[key].neto),
  }));
}

export type QuienEjecutoDash = {
  maestrosFachadas: number;
  externosFachadas: number;
  maestrosNeto: number;
  externosNeto: number;
  maestrosM2: number;
  externosM2: number;
  maestrosCostoM2: number | null;
  externosCostoM2: number | null;
  intervenidas: number;
  pctMaestrosNeto: number | null;
  pctExternosNeto: number | null;
};

export function quienEjecuto(
  intervenciones: IntervencionIndicadores[],
): QuienEjecutoDash {
  const maestros = new Set<string>();
  const externos = new Set<string>();
  const maestrosM2Map = new Map<string, number>();
  const externosM2Map = new Map<string, number>();
  let maestrosNeto = 0;
  let externosNeto = 0;
  for (const i of intervenciones) {
    const neto = costoNetoIntervencion(i).totalNeto;
    const m2 = i.superficieM2Snapshot ?? 0;
    if (i.ejecutadoPor === "maestros_bodetek") {
      maestros.add(i.fachadaId);
      maestrosNeto += neto;
      maestrosM2Map.set(i.fachadaId, m2);
    } else if (i.ejecutadoPor === "proveedor_externo") {
      externos.add(i.fachadaId);
      externosNeto += neto;
      externosM2Map.set(i.fachadaId, m2);
    }
  }
  const totalNeto = maestrosNeto + externosNeto;
  const intervenidas = new Set([...maestros, ...externos]).size;
  const maestrosM2 = [...maestrosM2Map.values()].reduce((a, n) => a + n, 0);
  const externosM2 = [...externosM2Map.values()].reduce((a, n) => a + n, 0);
  return {
    maestrosFachadas: maestros.size,
    externosFachadas: externos.size,
    maestrosNeto: Math.round(maestrosNeto),
    externosNeto: Math.round(externosNeto),
    maestrosM2,
    externosM2,
    maestrosCostoM2: maestrosM2 > 0 ? Math.round(maestrosNeto / maestrosM2) : null,
    externosCostoM2: externosM2 > 0 ? Math.round(externosNeto / externosM2) : null,
    intervenidas,
    pctMaestrosNeto:
      totalNeto > 0 ? Math.round((maestrosNeto / totalNeto) * 100) : null,
    pctExternosNeto:
      totalNeto > 0 ? Math.round((externosNeto / totalNeto) * 100) : null,
  };
}

export type UltimaIntervencionDash = {
  id: string;
  fachadaId: string;
  fecha: string | null;
  tipos: TipoIntervencionFachada[];
  hojalateria: boolean;
  ejecutadoPor: IntervencionIndicadores["ejecutadoPor"];
  proveedorId: string | null;
  totalNeto: number;
};

export function ultimasIntervenciones(
  intervenciones: IntervencionIndicadores[],
  limite = 3,
): UltimaIntervencionDash[] {
  return intervenciones
    .slice()
    .sort((a, b) =>
      (b.fechaTermino || b.fechaInicio || "").localeCompare(
        a.fechaTermino || a.fechaInicio || "",
      ),
    )
    .slice(0, limite)
    .map((i) => ({
      id: i.id,
      fachadaId: i.fachadaId,
      fecha: i.fechaTermino || i.fechaInicio,
      tipos: i.tipos.filter((t) => t.dias > 0).map((t) => t.tipo),
      hojalateria: i.requiereHojalateria,
      ejecutadoPor: i.ejecutadoPor,
      proveedorId: i.proveedorId ?? null,
      totalNeto: costoNetoIntervencion(i).totalNeto,
    }));
}

export type FilaTablaFachada = {
  id: string;
  etiqueta: string;
  recinto: string;
  m2: number;
  ultimaLabel: string | null;
  ultimaIso: string | null;
  tipos: Array<TipoIntervencionFachada | "hojalateria">;
  ejecutor: string | null;
  docsLabel: string;
  estado: EstadoCalculadoFachada;
  fotoUrl: string | null;
};

export function filasTablaFachadas(
  fachadas: FachadaListadoItem[],
  intervenciones: IntervencionIndicadores[],
  hoy = hoyIsoChile(),
): FilaTablaFachada[] {
  return fachadas.map((f) => {
    const propias = intervenciones.filter((i) => i.fachadaId === f.id);
    const ultima = propias
      .slice()
      .sort((a, b) =>
        (b.fechaTermino || b.fechaInicio || "").localeCompare(
          a.fechaTermino || a.fechaInicio || "",
        ),
      )[0];
    const tipos = new Set<TipoIntervencionFachada | "hojalateria">();
    let cot = 0;
    let fact = 0;
    for (const i of propias) {
      for (const t of i.tipos) {
        if (t.dias > 0) tipos.add(t.tipo);
      }
      if (i.requiereHojalateria) tipos.add("hojalateria");
      for (const d of i.documentos ?? []) {
        if (d.tipoDocumento === "cotizacion") cot += 1;
        if (d.tipoDocumento === "factura" || d.tipoDocumento === "boleta") fact += 1;
      }
    }
    let docsLabel = "Sin documentos";
    if (cot && !fact) {
      docsLabel = `${cot} cot. · sin factura`;
    } else if (cot || fact) {
      const partes: string[] = [];
      if (cot) partes.push(`${cot} cot.`);
      if (fact) partes.push(`${fact} factura${fact === 1 ? "" : "s"}`);
      docsLabel = partes.join(" · ");
    }
    return {
      id: f.id,
      etiqueta:
        etiquetaCortaFachada(f.recintoCodigo, f.letra) || f.nombre,
      recinto: f.recintoEtiqueta || f.recintoCodigo || f.nombre,
      m2: f.superficieM2,
      ultimaLabel: ultima
        ? ultima.estado === "en_ejecucion"
          ? "En curso"
          : ultima.fechaTermino || ultima.fechaInicio
        : null,
      ultimaIso: ultima?.fechaTermino || ultima?.fechaInicio || null,
      tipos: [...tipos],
      ejecutor: ultima?.ejecutadoPor ?? null,
      docsLabel,
      estado: estadoDeListado(f, intervenciones, hoy),
      fotoUrl: f.fotoUrl,
    };
  });
}

export function filtrarFachadasPorRecinto(
  fachadas: FachadaListadoItem[],
  recintoId: string | null,
): FachadaListadoItem[] {
  if (!recintoId) return fachadas;
  return fachadas.filter((f) => f.recintoId === recintoId);
}

export function filtrarDashboard(
  intervenciones: IntervencionIndicadores[],
  filtro: FiltroDashboardFachadas,
): IntervencionIndicadores[] {
  return filtrarIntervenciones(intervenciones, filtro);
}

export { ESTADOS_CALCULADOS_FACHADA };
