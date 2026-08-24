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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la miniatura"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      CALIDAD_JPEG,
    );
  });
}

/** trabajos/{id}/{uuid}.jpg → trabajos/{id}/{uuid}-thumb.jpg */
export function derivarThumbnailKey(originalKey: string): string {
  const lastDot = originalKey.lastIndexOf(".");
  if (lastDot === -1) return `${originalKey}-thumb.jpg`;
  return `${originalKey.slice(0, lastDot)}-thumb.jpg`;
}
