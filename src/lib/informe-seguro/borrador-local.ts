import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";

/** Borrador de esta pestaña. Sobrevive a un cambio de ?recinto= que vuelva a montar la pantalla. */
export type BorradorRecordado = {
  borrador: BorradorInforme;
  baseFirma: string;
  guardadoA: string | null;
  /** null: no se sabe qué recintos cambiaron. Si hay firmas, el guardado manda solo esos. */
  firmasBase: Record<string, string> | null;
};

type AlmacenBorrador = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function claveBorradorInforme(eventoId: string): string {
  return `informe-seguro-borrador:${eventoId}`;
}

/** El borrador de la pestaña solo reemplaza al servidor si parte de lo que hay guardado ahora. */
export function borradorRecordadoCompatible(
  firmaServidor: string,
  firmaLocal: string,
  baseFirma: string,
): boolean {
  return baseFirma === firmaServidor || firmaLocal === firmaServidor;
}

function firmasBaseDe(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const firmas: Record<string, string> = {};
  for (const [clave, firma] of Object.entries(value)) {
    if (typeof firma !== "string") return null;
    firmas[clave] = firma;
  }
  return firmas;
}

function esBorrador(value: unknown): value is BorradorInforme {
  if (!value || typeof value !== "object") return false;
  const fila = value as BorradorInforme;
  return (
    typeof fila.encabezado === "object" &&
    fila.encabezado !== null &&
    (typeof fila.tokenExpira === "string" || fila.tokenExpira === null) &&
    Array.isArray(fila.recintos) &&
    Array.isArray(fila.subproyectos) &&
    Array.isArray(fila.media)
  );
}

export function leerBorradorRecordado(
  almacen: AlmacenBorrador,
  clave: string,
): BorradorRecordado | null {
  try {
    const raw = almacen.getItem(clave);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BorradorRecordado>;
    if (!esBorrador(parsed.borrador) || typeof parsed.baseFirma !== "string") return null;
    return {
      borrador: parsed.borrador,
      baseFirma: parsed.baseFirma,
      guardadoA: typeof parsed.guardadoA === "string" ? parsed.guardadoA : null,
      firmasBase: firmasBaseDe(parsed.firmasBase),
    };
  } catch {
    return null;
  }
}

export function escribirBorradorRecordado(
  almacen: AlmacenBorrador,
  clave: string,
  valor: BorradorRecordado,
): void {
  try {
    almacen.setItem(clave, JSON.stringify(valor));
  } catch {
    // Si el navegador rechaza sessionStorage, el borrador sigue en memoria.
  }
}

const EVENTO_BORRADOR = "informe-borrador-local";

const cache = new Map<string, { raw: string | null; valor: BorradorRecordado | null }>();

export function suscribirBorrador(aviso: () => void): () => void {
  window.addEventListener(EVENTO_BORRADOR, aviso);
  return () => window.removeEventListener(EVENTO_BORRADOR, aviso);
}

/** Misma referencia si la pestaña no cambió, para no redibujar en bucle. */
export function snapshotBorradorRecordado(clave: string | null): BorradorRecordado | null {
  if (!clave || typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(clave);
  const previo = cache.get(clave);
  if (previo && previo.raw === raw) return previo.valor;
  const valor = raw ? leerBorradorRecordado(window.sessionStorage, clave) : null;
  cache.set(clave, { raw, valor });
  return valor;
}

export function publicarBorradorRecordado(clave: string, valor: BorradorRecordado): void {
  escribirBorradorRecordado(window.sessionStorage, clave, valor);
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(clave);
  } catch {
    raw = null;
  }
  cache.set(clave, { raw, valor });
  window.dispatchEvent(new Event(EVENTO_BORRADOR));
}
