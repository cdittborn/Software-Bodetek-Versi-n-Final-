"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type EvidenciaUploaderProps = {
  trabajoId: string;
  momento: "antes" | "despues";
  titulo: string;
  items: TrabajoMediaItem[];
  puedeEditar: boolean;
};

function kindFromFile(file: File): "foto" | "video" {
  if (file.type.startsWith("video/")) return "video";
  return "foto";
}

export function EvidenciaUploader({
  trabajoId,
  momento,
  titulo,
  items,
  puedeEditar,
}: EvidenciaUploaderProps) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreArchivo: file.name || `captura.${file.type.includes("video") ? "mp4" : "jpg"}`,
            tipoArchivo: file.type || "application/octet-stream",
            carpeta: `trabajos/${trabajoId}`,
          }),
        });
        const presign = (await presignRes.json()) as {
          url?: string;
          key?: string;
          error?: string;
        };
        if (!presignRes.ok || !presign.url || !presign.key) {
          throw new Error(presign.error ?? "No se pudo firmar la subida");
        }

        const put = await fetch(presign.url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });
        if (!put.ok) {
          throw new Error(
            `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket si es un PUT desde el navegador.`,
          );
        }

        const { error: insertError } = await supabase.from("trabajo_media").insert({
          trabajo_id: trabajoId,
          tipo: momento,
          tipo_archivo: kindFromFile(file),
          url: presign.key,
        });
        if (insertError) throw new Error(insertError.message);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium">{titulo}</h2>
        {puedeEditar ? (
          <div className="flex flex-wrap gap-2">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void uploadFiles(e.target.files)}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => void uploadFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              Tomar foto o video
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => galleryRef.current?.click()}
            >
              {busy ? "Subiendo…" : "Subir fotos y videos"}
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin archivos todavía</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              {item.tipo_archivo === "video" ? (
                <>
                  <video
                    src={item.publicUrl}
                    className="size-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="size-8 fill-white text-white" />
                  </span>
                  <a
                    href={item.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0"
                    aria-label="Ver video"
                  />
                </>
              ) : (
                <a href={item.publicUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.publicUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
