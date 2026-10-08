export const ESTADOS_PLANO = [
  "requiere_trabajo",
  "programada",
  "en_ejecucion",
  "al_dia",
  "sin_evaluar",
] as const;

export type EstadoPlano = (typeof ESTADOS_PLANO)[number];

export type PuntoPlano = readonly [number, number];

export const VIEWBOX_ANCHO = 1594;
export const VIEWBOX_ALTO = 945;

export const TOOLTIP_FONDO = "#000000";
export const TOOLTIP_TEXTO = "#FFFFFF";

export const UMBRAL_CERCANIA_PX = 22;

export type EstiloEstado = {
  color: string;
  dash: string | null;
  dashLeyenda: string | null;
  linecap: "round" | "butt";
  badgeBg: string;
  badgeTexto: string;
  etiqueta: string;
};

const ESTILOS: Record<EstadoPlano, EstiloEstado> = {
  requiere_trabajo: {
    color: "#EF4444",
    dash: null,
    dashLeyenda: null,
    linecap: "butt",
    badgeBg: "#FEECEB",
    badgeTexto: "#B42318",
    etiqueta: "Requiere trabajo",
  },
  programada: {
    color: "#EA8A0C",
    dash: "16 9",
    dashLeyenda: "8 5",
    linecap: "butt",
    badgeBg: "#FFF3E0",
    badgeTexto: "#8A4B00",
    etiqueta: "Programada",
  },
  en_ejecucion: {
    color: "#2563EB",
    dash: "0.1 11",
    dashLeyenda: "0.1 6",
    linecap: "round",
    badgeBg: "#EAF1FF",
    badgeTexto: "#1D4ED8",
    etiqueta: "En ejecución",
  },
  al_dia: {
    color: "#166534",
    dash: null,
    dashLeyenda: null,
    linecap: "butt",
    badgeBg: "#E8F5EC",
    badgeTexto: "#166534",
    etiqueta: "Al día",
  },
  sin_evaluar: {
    color: "#9CA3AF",
    dash: "6 8",
    dashLeyenda: "3 4",
    linecap: "butt",
    badgeBg: "#F1F2F4",
    badgeTexto: "#4B5563",
    etiqueta: "Sin evaluar",
  },
};

export function estiloEstado(estado: EstadoPlano): EstiloEstado {
  return ESTILOS[estado];
}

export function estadoVisible(
  modo: "hoy" | "antes" | "vacio",
  estados: Record<string, EstadoPlano>,
  id: string,
): EstadoPlano {
  if (modo === "vacio") return "sin_evaluar";
  return estados[id] ?? "sin_evaluar";
}

export function puntoMedioPolilinea(puntos: readonly PuntoPlano[]): PuntoPlano {
  if (puntos.length === 0) throw new Error("polilínea vacía");
  if (puntos.length === 1) return puntos[0];
  const largos: number[] = [];
  let total = 0;
  for (let i = 0; i < puntos.length - 1; i += 1) {
    const largo = Math.hypot(
      puntos[i + 1][0] - puntos[i][0],
      puntos[i + 1][1] - puntos[i][1],
    );
    largos.push(largo);
    total += largo;
  }
  if (total === 0) return puntos[0];
  let resto = total / 2;
  for (let i = 0; i < largos.length; i += 1) {
    if (resto <= largos[i] || i === largos.length - 1) {
      const t = largos[i] === 0 ? 0 : resto / largos[i];
      const a = puntos[i];
      const b = puntos[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    resto -= largos[i];
  }
  return puntos[puntos.length - 1];
}

export type AnclajeTooltip = {
  xPct: number;
  yPct: number;
  vertical: "arriba" | "abajo";
  horizontal: "centro" | "hacia-derecha" | "hacia-izquierda";
};

export function anclajeTooltip(
  punto: PuntoPlano,
  vista: { x: number; y: number; w: number; h: number } = {
    x: 0,
    y: 0,
    w: VIEWBOX_ANCHO,
    h: VIEWBOX_ALTO,
  },
): AnclajeTooltip {
  const xPct = ((punto[0] - vista.x) / vista.w) * 100;
  const yPct = ((punto[1] - vista.y) / vista.h) * 100;
  const vertical = punto[1] < VIEWBOX_ALTO * 0.3 ? "abajo" : "arriba";
  const horizontal =
    xPct < 12 ? "hacia-derecha" : xPct > 88 ? "hacia-izquierda" : "centro";
  return { xPct, yPct, vertical, horizontal };
}

function canal(valor: number): number {
  const s = valor / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

export function contraste(frente: string, fondo: string): number {
  const a = luminancia(frente);
  const b = luminancia(fondo);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}

export function distanciaPuntoSegmento(
  punto: PuntoPlano,
  a: PuntoPlano,
  b: PuntoPlano,
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo2 = dx * dx + dy * dy;
  if (largo2 === 0) return Math.hypot(punto[0] - a[0], punto[1] - a[1]);
  const t = Math.min(
    1,
    Math.max(0, ((punto[0] - a[0]) * dx + (punto[1] - a[1]) * dy) / largo2),
  );
  return Math.hypot(punto[0] - (a[0] + t * dx), punto[1] - (a[1] + t * dy));
}

export function distanciaPuntoPolilinea(
  punto: PuntoPlano,
  puntos: readonly PuntoPlano[],
): number {
  if (puntos.length === 0) return Number.POSITIVE_INFINITY;
  if (puntos.length === 1) {
    return Math.hypot(punto[0] - puntos[0][0], punto[1] - puntos[0][1]);
  }
  let mejor = Number.POSITIVE_INFINITY;
  for (let i = 0; i < puntos.length - 1; i += 1) {
    mejor = Math.min(mejor, distanciaPuntoSegmento(punto, puntos[i], puntos[i + 1]));
  }
  return mejor;
}

export function fachadaMasCercana(
  punto: PuntoPlano,
  fachadas: readonly { id: string; puntos: readonly PuntoPlano[] }[],
  escala: number,
  umbralPx = UMBRAL_CERCANIA_PX,
): string | null {
  if (!(escala > 0)) return null;
  let mejor: { id: string; px: number } | null = null;
  for (const fachada of fachadas) {
    const px = distanciaPuntoPolilinea(punto, fachada.puntos) * escala;
    if (!mejor || px < mejor.px) mejor = { id: fachada.id, px };
  }
  if (!mejor || mejor.px > umbralPx) return null;
  return mejor.id;
}
