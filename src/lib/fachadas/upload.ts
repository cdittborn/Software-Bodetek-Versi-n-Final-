import { createClient } from "@/lib/supabase/client";
import {
  derivarThumbnailKey,
  generarMiniatura,
  miniaturaDesdeVideo,
  reducirImagenMaxLado,
} from "@/lib/media/thumbnail";
import { validarArchivoFachada } from "@/lib/fachadas/cola-subida";
import {
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  carpetaIntervencionDocs,
  carpetaIntervencionFotos,
} from "@/lib/fachadas/carpetas";
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

async function subirABlob(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraccion: number) => void,
): Promise<void> {
  if (!onProgress) {
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
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) onProgress(ev.loaded / ev.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        reject(
          new Error(
            `R2 rechazó el archivo (${xhr.status}). Revisa CORS del bucket si es un PUT desde el navegador.`,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new Error("No se pudo subir el archivo"));
    xhr.send(body);
  });
}

const portadaCola = new Map<string, Promise<void>>();

function conCandadoPortada<T>(clave: string, tarea: () => Promise<T>): Promise<T> {
  const previo = portadaCola.get(clave) ?? Promise.resolve();
  const actual = previo.then(tarea, tarea);
  const asentado = actual.then(
    () => undefined,
    () => undefined,
  );
  portadaCola.set(clave, asentado);
  return actual;
}

export async function subirArchivoFachada(input: {
  file: File;
  carpeta: string;
  onProgress?: (fraccion: number) => void;
}): Promise<{ key: string; nombre: string }> {
  const nombre = input.file.name || "archivo";
  const { url, key } = await solicitarPresign({
    nombreArchivo: nombre,
    tipoArchivo: input.file.type || "application/octet-stream",
    carpeta: input.carpeta,
  });
  await subirABlob(
    url,
    input.file,
    input.file.type || "application/octet-stream",
    input.onProgress,
  );
  return { key, nombre };
}

export async function prepararArchivoMedia(
  file: File,
  onProgress?: (fraccion: number) => void,
): Promise<{ file: File; tipoArchivo: "foto" | "video"; duracionSeg: number | null }> {
  const validacion = validarArchivoFachada(file);
  if (!validacion.ok) throw new Error(validacion.mensaje);
  if (validacion.tipo === "foto") {
    onProgress?.(0.05);
    const reducido = await reducirImagenMaxLado(file);
    onProgress?.(0.15);
    return { file: reducido, tipoArchivo: "foto", duracionSeg: null };
  }
  return { file, tipoArchivo: "video", duracionSeg: null };
}

export async function subirFotoIntervencion(input: {
  file: File;
  fachadaId: string;
  intervencionId: string;
  tipo: "antes" | "despues";
  onProgress?: (fraccion: number) => void;
}): Promise<MediaFachada> {
  const preparado = await prepararArchivoMedia(input.file, input.onProgress);
  const file = preparado.file;
  const tipoArchivo = preparado.tipoArchivo;
  const carpeta = carpetaIntervencionFotos(input.fachadaId, input.intervencionId);
  const { key, nombre } = await subirArchivoFachada({
    file,
    carpeta,
    onProgress: (fraccion) => input.onProgress?.(0.15 + fraccion * 0.6),
  });
  let thumbnailKey: string | null = null;
  let duracionSeg: number | null = null;
  try {
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
    } else {
      const poster = await miniaturaDesdeVideo(input.file);
      duracionSeg = poster.duracionSeg;
      thumbnailKey = derivarThumbnailKey(key);
      const thumbPresign = await solicitarPresign({
        nombreArchivo: "thumb.jpg",
        tipoArchivo: "image/jpeg",
        carpeta,
        keyObjetivo: thumbnailKey,
      });
      await subirABlob(thumbPresign.url, poster.blob, "image/jpeg");
    }
  } catch {
    thumbnailKey = null;
  }
  input.onProgress?.(0.9);
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const hoy = new Date().toISOString().slice(0, 10);
  const clavePortada = `${input.intervencionId}:${input.tipo}`;
  const insertado = await conCandadoPortada(clavePortada, async () => {
    const { count } = await supabase
      .from("fachada_media")
      .select("id", { count: "exact", head: true })
      .eq("intervencion_id", input.intervencionId)
      .eq("tipo", input.tipo)
      .eq("tipo_archivo", "foto");
    const esPortada = tipoArchivo === "foto" && (count ?? 0) === 0;
    const { count: ordenCount } = await supabase
      .from("fachada_media")
      .select("id", { count: "exact", head: true })
      .eq("intervencion_id", input.intervencionId)
      .eq("tipo", input.tipo);
    const orden = ordenCount ?? 0;
    const { data, error } = await supabase
      .from("fachada_media")
      .insert({
        intervencion_id: input.intervencionId,
        tipo: input.tipo,
        tipo_archivo: tipoArchivo,
        object_key: key,
        nombre_archivo: nombre,
        thumbnail_key: thumbnailKey,
        es_portada: esPortada,
        orden,
        fecha: hoy,
        created_by: userData.user?.id ?? null,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "No se pudo guardar la foto");
    return { id: data.id as string, esPortada, orden };
  });
  input.onProgress?.(1);
  return {
    id: insertado.id,
    tipo: input.tipo,
    tipoArchivo,
    objectKey: key,
    nombreArchivo: nombre,
    thumbnailKey,
    publicUrl: urlPublicaONull(key),
    thumbnailUrl: urlPublicaONull(thumbnailKey),
    esPortada: insertado.esPortada,
    orden: insertado.orden,
    fecha: hoy,
    duracionSeg,
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
