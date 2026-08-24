import { createClient } from "@/lib/supabase/client";
import {
  kindFromFile,
  type TrabajoMediaTipo,
  type TrabajoMediaTipoArchivo,
} from "@/lib/trabajos";
import { derivarThumbnailKey, generarMiniatura } from "@/lib/media/thumbnail";

type PresignResponse = {
  url?: string;
  key?: string;
  error?: string;
};

async function solicitarPresign(body: {
  nombreArchivo: string;
  tipoArchivo: string;
  carpeta: string;
  keyObjetivo?: string;
}): Promise<{ url: string; key: string }> {
  const res = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as PresignResponse;
  if (!res.ok || !data.url || !data.key) {
    throw new Error(data.error ?? "No se pudo firmar la subida");
  }
  return { url: data.url, key: data.key };
}

async function subirABlob(
  url: string,
  body: Blob,
  contentType: string,
): Promise<void> {
  const put = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!put.ok) {
    throw new Error(
      `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket si es un PUT desde el navegador.`,
    );
  }
}

export type SubirTrabajoMediaOptions = {
  file: File;
  trabajoId: string;
  tipo: TrabajoMediaTipo;
  proveedorId?: string | null;
  nombreArchivo?: string | null;
  resolverTipoArchivo?: (file: File) => TrabajoMediaTipoArchivo;
};

export async function subirTrabajoMedia({
  file,
  trabajoId,
  tipo,
  proveedorId,
  nombreArchivo,
  resolverTipoArchivo,
}: SubirTrabajoMediaOptions): Promise<void> {
  const carpeta = `trabajos/${trabajoId}`;
  const tipoArchivo = resolverTipoArchivo?.(file) ?? kindFromFile(file);
  const nombre = nombreArchivo ?? (file.name || "archivo");

  const { url, key } = await solicitarPresign({
    nombreArchivo: nombre,
    tipoArchivo: file.type || "application/octet-stream",
    carpeta,
  });

  await subirABlob(url, file, file.type || "application/octet-stream");

  let thumbnailKey: string | null = null;
  if (tipoArchivo === "foto") {
    const thumbBlob = await generarMiniatura(file);
    thumbnailKey = derivarThumbnailKey(key);
    const thumbPresign = await solicitarPresign({
      nombreArchivo: "thumb.jpg",
      tipoArchivo: "image/jpeg",
      carpeta,
      keyObjetivo: thumbnailKey,
    });
    await subirABlob(thumbPresign.url, thumbBlob, "image/jpeg");
  }

  const supabase = createClient();
  const { error } = await supabase.from("trabajo_media").insert({
    trabajo_id: trabajoId,
    tipo,
    tipo_archivo: tipoArchivo,
    url: key,
    thumbnail_key: thumbnailKey,
    nombre_archivo: nombreArchivo ?? (file.name || null),
    ...(proveedorId ? { proveedor_id: proveedorId } : {}),
  });
  if (error) throw new Error(error.message);
}
