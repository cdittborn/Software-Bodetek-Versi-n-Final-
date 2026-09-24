import { createClient } from "@/lib/supabase/client";
import { kindFromFile } from "@/lib/trabajos";
import { derivarThumbnailKey, generarMiniatura } from "@/lib/media/thumbnail";
import {
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  carpetaIntervencionDocs,
  carpetaIntervencionFotos,
} from "@/lib/storage/autorizarCarpeta";
import { urlPublicaONull } from "@/lib/fachadas/url";
import type { MediaFachada } from "@/lib/fachadas/tipos";

type PresignResponse = { url?: string; key?: string; error?: string };

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

async function subirABlob(url: string, body: Blob, contentType: string): Promise<void> {
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

export async function subirArchivoFachada(input: {
  file: File;
  carpeta: string;
}): Promise<{ key: string; nombre: string }> {
  const nombre = input.file.name || "archivo";
  const { url, key } = await solicitarPresign({
    nombreArchivo: nombre,
    tipoArchivo: input.file.type || "application/octet-stream",
    carpeta: input.carpeta,
  });
  await subirABlob(url, input.file, input.file.type || "application/octet-stream");
  return { key, nombre };
}

export async function subirFotoIntervencion(input: {
  file: File;
  fachadaId: string;
  intervencionId: string;
  tipo: "antes" | "despues";
}): Promise<MediaFachada> {
  const carpeta = carpetaIntervencionFotos(input.fachadaId, input.intervencionId);
  const tipoArchivo = kindFromFile(input.file);
  if (tipoArchivo === "documento") {
    throw new Error("Solo se aceptan fotos o videos");
  }
  const { key, nombre } = await subirArchivoFachada({ file: input.file, carpeta });
  let thumbnailKey: string | null = null;
  if (tipoArchivo === "foto") {
    const thumbBlob = await generarMiniatura(input.file);
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
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_media")
    .insert({
      intervencion_id: input.intervencionId,
      tipo: input.tipo,
      tipo_archivo: tipoArchivo,
      object_key: key,
      nombre_archivo: nombre,
      thumbnail_key: thumbnailKey,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo guardar la foto");
  return {
    id: data.id,
    tipo: input.tipo,
    tipoArchivo: tipoArchivo,
    objectKey: key,
    nombreArchivo: nombre,
    thumbnailKey,
    publicUrl: urlPublicaONull(key),
    thumbnailUrl: urlPublicaONull(thumbnailKey),
  };
}

export async function borrarFotoIntervencion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_media").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export {
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  carpetaIntervencionDocs,
};
