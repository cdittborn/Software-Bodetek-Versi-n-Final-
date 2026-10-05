/** Cola de fotos y videos de Fachadas. Sin DOM: la UI y el canvas viven aparte. */

export const PARALELO_SUBIDA = 3;
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;
export const FOTO_MAX_LADO_PX = 2560;

export type TipoArchivoFachada = "foto" | "video";

export type EstadoItemCola = "en_cola" | "subiendo" | "listo" | "error";

export type ValidacionArchivoFachada =
  | { ok: true; tipo: TipoArchivoFachada }
  | { ok: false; mensaje: string };

export function validarArchivoFachada(file: {
  name: string;
  type: string;
  size: number;
}): ValidacionArchivoFachada {
  const nombre = file.name || "archivo";
  if (file.type.startsWith("video/")) {
    if (file.size > VIDEO_MAX_BYTES) {
      return {
        ok: false,
        mensaje: `«${nombre}» supera los 200 MB. El máximo para un video es 200 MB.`,
      };
    }
    return { ok: true, tipo: "video" };
  }
  if (file.type.startsWith("image/")) {
    return { ok: true, tipo: "foto" };
  }
  return {
    ok: false,
    mensaje: `«${nombre}» no es una foto ni un video.`,
  };
}

/** «Subiendo X de N archivos» mientras quede algo en cola o subiendo. */
export function mensajeSubida(
  items: { estado: EstadoItemCola }[],
): string | null {
  const total = items.length;
  if (total === 0) return null;
  const subiendo = items.filter((i) => i.estado === "subiendo").length;
  const enCola = items.filter((i) => i.estado === "en_cola").length;
  if (subiendo === 0 && enCola === 0) return null;
  const listos = items.filter((i) => i.estado === "listo").length;
  const x = Math.min(total, listos + subiendo);
  return `Subiendo ${x} de ${total} archivos`;
}

/** Escala para que el lado mayor no pase de `max`. 1 si ya cabe. */
export function escalaMaxLado(ancho: number, alto: number, max = FOTO_MAX_LADO_PX): number {
  const lado = Math.max(ancho, alto);
  if (!Number.isFinite(lado) || lado <= 0 || lado <= max) return 1;
  return max / lado;
}

export function formatDuracionVideo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const total = Math.round(segundos);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

/**
 * Corre tareas con un tope de paralelismo. El orden de los resultados
 * sigue el orden de entrada. Si una falla, las que ya empezaron terminan
 * y la promesa rechaza con ese error (el llamador decide el reintento).
 */
export async function correrConTope<T>(
  tareas: Array<() => Promise<T>>,
  tope = PARALELO_SUBIDA,
  onInicio?: (index: number, activos: number) => void,
): Promise<T[]> {
  const resultados = new Array<T>(tareas.length);
  let siguiente = 0;
  let activos = 0;
  let fallo: unknown = null;

  await new Promise<void>((resolve) => {
    const lanzar = () => {
      if (fallo && activos === 0) {
        resolve();
        return;
      }
      if (siguiente >= tareas.length && activos === 0) {
        resolve();
        return;
      }
      while (!fallo && activos < tope && siguiente < tareas.length) {
        const index = siguiente;
        siguiente += 1;
        activos += 1;
        onInicio?.(index, activos);
        tareas[index]()
          .then((valor) => {
            resultados[index] = valor;
          })
          .catch((err) => {
            fallo = err;
          })
          .finally(() => {
            activos -= 1;
            lanzar();
          });
      }
    };
    if (tareas.length === 0) {
      resolve();
      return;
    }
    lanzar();
  });

  if (fallo) throw fallo;
  return resultados;
}
