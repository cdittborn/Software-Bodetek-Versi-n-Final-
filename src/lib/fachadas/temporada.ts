/** Temporada de fachadas: julio a junio, mientras el gerente no indique otra. */
export const MES_INICIO_TEMPORADA = 7;

const MESES = [
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

function dia(iso: string): string {
  return iso.slice(0, 10);
}

export function inicioTemporada(hoy: string): string {
  const fecha = dia(hoy);
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const temporada = mes < MES_INICIO_TEMPORADA ? anio - 1 : anio;
  return `${temporada}-${String(MES_INICIO_TEMPORADA).padStart(2, "0")}-01`;
}

export function finTemporada(inicio: string): string {
  const anio = Number(dia(inicio).slice(0, 4)) + 1;
  return `${anio}-06-30`;
}

/** Hasta hoy si la temporada sigue abierta; si no, el 30 de junio. */
export function fechaHastaTemporada(inicio: string, hoy: string): string {
  const desde = dia(inicio);
  const fin = finTemporada(desde);
  const actual = dia(hoy);
  if (actual < desde) return fin;
  return actual < fin ? actual : fin;
}

export function etiquetaInicioTemporada(inicio: string): string {
  const fecha = dia(inicio);
  const mes = Number(fecha.slice(5, 7));
  return `${MESES[mes - 1] ?? "jul"} ${fecha.slice(0, 4)}`;
}

export function opcionesTemporada(hoy: string): { inicio: string; etiqueta: string }[] {
  const actual = Number(inicioTemporada(hoy).slice(0, 4));
  return [0, 1, 2].map((salto) => {
    const anio = actual - salto;
    const inicio = `${anio}-07-01`;
    return { inicio, etiqueta: `Temporada ${anio}–${anio + 1}` };
  });
}
