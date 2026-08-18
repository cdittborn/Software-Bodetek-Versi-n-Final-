export type RecintoListado = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string | null;
  sitio: string;
  galpon: string;
  arrendatario_actual: string | null;
  superficie_m2: number | null;
  superficie_1er_piso: number | null;
  superficie_2o_piso: number | null;
};

export type PlanoActivo = {
  id: string;
  nombre: string;
  imagenUrl: string;
};

export type EtiquetaPlano = {
  posicionId: string;
  recintoId: string;
  codigo: string;
  sitio: string;
  galpon: string;
  arrendatario_actual: string | null;
  x_pct: number;
  y_pct: number;
};

export function etiquetaCodigoRecinto(r: {
  sitio: string;
  galpon: string;
  codigo: string;
}): string {
  const galpon = r.galpon.trim();
  return galpon
    ? `Sitio ${r.sitio} · ${galpon} · ${r.codigo}`
    : `Sitio ${r.sitio} · ${r.codigo}`;
}

export function toPct(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 1000) / 1000));
}

type RecintoEnPosicion = {
  id: string;
  codigo: string;
  sitio: string;
  galpon: string;
  arrendatario_actual: string | null;
};

export function etiquetasDesdePosiciones(
  posiciones: ReadonlyArray<{
    id: string;
    x_pct: number | string;
    y_pct: number | string;
    recintos: RecintoEnPosicion | RecintoEnPosicion[] | null;
  }>,
): EtiquetaPlano[] {
  return posiciones.flatMap((p) => {
    const recinto = Array.isArray(p.recintos)
      ? (p.recintos[0] ?? null)
      : p.recintos;
    if (!recinto) return [];
    return [
      {
        posicionId: p.id,
        recintoId: recinto.id,
        codigo: recinto.codigo,
        sitio: recinto.sitio,
        galpon: recinto.galpon,
        arrendatario_actual: recinto.arrendatario_actual,
        x_pct: toPct(p.x_pct),
        y_pct: toPct(p.y_pct),
      },
    ];
  });
}
