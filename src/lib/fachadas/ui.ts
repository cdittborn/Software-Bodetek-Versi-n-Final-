import type { EstadoPlano } from "@/lib/fachadas/plano";
import type { TipoIntervencionFachada } from "@/lib/fachadas/indicadores";

/** Paleta de la captura Claude Design. Solo Fachadas. */
export const COLOR_TIPO: Record<
  TipoIntervencionFachada | "hojalateria",
  { chip: string; bar: string; cardOn: string; letter: string }
> = {
  limpieza: {
    chip: "border-sky-200 bg-sky-50 text-sky-800",
    bar: "bg-sky-500",
    cardOn: "border-sky-300 bg-sky-50",
    letter: "bg-sky-600 text-white",
  },
  reparacion: {
    chip: "border-orange-200 bg-orange-50 text-orange-800",
    bar: "bg-orange-500",
    cardOn: "border-orange-300 bg-orange-50",
    letter: "bg-orange-500 text-white",
  },
  pintura: {
    chip: "border-violet-200 bg-violet-50 text-violet-800",
    bar: "bg-violet-500",
    cardOn: "border-violet-300 bg-violet-50",
    letter: "bg-violet-600 text-white",
  },
  hojalateria: {
    chip: "border-slate-200 bg-slate-50 text-slate-700",
    bar: "bg-slate-400",
    cardOn: "border-slate-300 bg-slate-50",
    letter: "bg-slate-600 text-white",
  },
};

/** Badges de estado. La misma paleta que el trazo del plano. */
export const COLOR_ESTADO_CALC: Record<EstadoPlano, string> = {
  al_dia: "bg-[#E8F5EC] text-[#166534]",
  en_ejecucion: "bg-[#EAF1FF] text-[#1D4ED8]",
  programada: "bg-[#FFF3E0] text-[#8A4B00]",
  requiere_trabajo: "bg-[#FEECEB] text-[#B42318]",
  sin_evaluar: "bg-[#F1F2F4] text-[#4B5563]",
};

export const COLOR_CELDA_ESTADO: Record<EstadoPlano, string> = {
  al_dia: "bg-[#166534] text-white",
  en_ejecucion: "bg-[#2563EB] text-white",
  programada: "bg-[#EA8A0C] text-white",
  requiere_trabajo: "bg-[#EF4444] text-white",
  sin_evaluar: "bg-[#9CA3AF] text-white",
};

/** Texto corto de cada estado en leyenda y mapa. */
export const LABEL_CELDA_ESTADO: Record<EstadoPlano, string> = {
  al_dia: "Al día",
  en_ejecucion: "En ejecución",
  programada: "Programada",
  requiere_trabajo: "Requiere",
  sin_evaluar: "Sin evaluar",
};

export const LETRA_TIPO: Record<TipoIntervencionFachada | "hojalateria", string> =
  {
    limpieza: "L",
    reparacion: "R",
    pintura: "P",
    hojalateria: "H",
  };

const MESES_CORTO = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

function fechaLocal(iso: string): Date {
  return iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00`);
}

function mesCorto(d: Date): string {
  return MESES_CORTO[d.getMonth()] ?? "";
}

export function formatMesCortoCl(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = fechaLocal(iso);
  const mes = mesCorto(d);
  const anio = d.getFullYear();
  const mesTit = mes ? mes.charAt(0).toUpperCase() + mes.slice(1) : "";
  return `${mesTit} ${anio}`;
}

/** «01 sep 2026» */
export function formatDiaMesCorto(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = fechaLocal(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia} ${mesCorto(d)} ${d.getFullYear()}`;
}

/** «18 ago» */
export function formatDiaMes(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = fechaLocal(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  return `${dia} ${mesCorto(d)}`;
}

/** «01 – 12 sep 2026» */
export function formatRangoDiaMes(
  inicio: string | null | undefined,
  termino: string | null | undefined,
): string {
  if (!inicio && !termino) return "—";
  if (!inicio) return formatDiaMesCorto(termino);
  if (!termino) return formatDiaMesCorto(inicio);
  const a = fechaLocal(inicio);
  const b = fechaLocal(termino);
  const diaA = String(a.getDate()).padStart(2, "0");
  const diaB = String(b.getDate()).padStart(2, "0");
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${diaA} – ${diaB} ${mesCorto(b)} ${b.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${diaA} ${mesCorto(a)} – ${diaB} ${mesCorto(b)} ${b.getFullYear()}`;
  }
  return `${formatDiaMesCorto(inicio)} – ${formatDiaMesCorto(termino)}`;
}

export function formatMillonesClp(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(m)} M`;
  }
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}
