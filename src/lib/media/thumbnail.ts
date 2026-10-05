const MAX_ANCHO = 300;
const CALIDAD_JPEG = 0.75;

function cargarImagen(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/**
 * Baja la foto para que el lado mayor no pase de `maxLado` px.
 * Si ya cabe, devuelve el mismo archivo.
 */
export async function reducirImagenMaxLado(
  archivo: File,
  maxLado = 2560,
): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;
  const img = await cargarImagen(archivo);
  const lado = Math.max(img.width, img.height);
  if (!lado || lado <= maxLado) return archivo;
  const escala = maxLado / lado;
  const ancho = Math.max(1, Math.round(img.width * escala));
  const alto = Math.max(1, Math.round(img.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return archivo;
  ctx.drawImage(img, 0, 0, ancho, alto);
  const blob = await blobJpeg(canvas, 0.85);
  const nombre = archivo.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${nombre}.jpg`, { type: "image/jpeg" });
}

/** Primer cuadro usable del video + duración, para la miniatura ▶. */
export async function miniaturaDesdeVideo(
  archivo: File,
): Promise<{ blob: Blob; duracionSeg: number }> {
  const url = URL.createObjectURL(archivo);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("No se pudo leer el video")), 4000);
      video.onloadeddata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error("No se pudo leer el video"));
      };
    });
    const duracionSeg = Number.isFinite(video.duration) ? video.duration : 0;
    const marca = duracionSeg > 0 ? Math.min(0.4, duracionSeg / 2) : 0;
    if (marca > 0) {
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = marca;
      });
    }
    const maxAncho = 480;
    const vw = video.videoWidth || 480;
    const vh = video.videoHeight || 270;
    const escala = vw > maxAncho ? maxAncho / vw : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(vw * escala));
    canvas.height = Math.max(1, Math.round(vh * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await blobJpeg(canvas, CALIDAD_JPEG);
    return { blob, duracionSeg };
  } finally {
    URL.revokeObjectURL(url);
    video.src = "";
  }
}

function blobJpeg(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      calidad,
    );
  });
}

/** Genera miniatura JPEG en el navegador (max 300px ancho). Solo para fotos. */
export async function generarMiniatura(
  archivo: File,
  maxAncho = MAX_ANCHO,
): Promise<Blob> {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("Solo se generan miniaturas para imágenes");
  }

  const img = await cargarImagen(archivo);
  const escala = img.width > maxAncho ? maxAncho / img.width : 1;
  const ancho = Math.round(img.width * escala);
  const alto = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.drawImage(img, 0, 0, ancho, alto);

  return blobJpeg(canvas, CALIDAD_JPEG);
}

/** trabajos/{id}/{uuid}.jpg → trabajos/{id}/{uuid}-thumb.jpg */
export function derivarThumbnailKey(originalKey: string): string {
  const lastDot = originalKey.lastIndexOf(".");
  if (lastDot === -1) return `${originalKey}-thumb.jpg`;
  return `${originalKey.slice(0, lastDot)}-thumb.jpg`;
}
