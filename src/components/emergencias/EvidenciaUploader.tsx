"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaUploadCounter } from "@/components/media/MediaUploadCounter";
import { eliminarTrabajoMedia } from "@/lib/media/delete";
import { notifyUploadSuccess } from "@/lib/media/notifyUploadSuccess";
import { subirTrabajoMedia } from "@/lib/media/upload";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type EvidenciaUploaderProps = {
  trabajoId: string;
  momento: "antes" | "despues";
  titulo: string;
  items: TrabajoMediaItem[];
  puedeEditar: boolean;
};

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

    try {
      for (const file of Array.from(files)) {
        await subirTrabajoMedia({
          file,
          trabajoId,
          tipo: momento,
        });
        notifyUploadSuccess(file.name);
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

  async function eliminar(id: string) {
    setError(null);
    try {
      await eliminarTrabajoMedia(id);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      setError(message);
      throw err;
    }
  }

  const uploadControls = puedeEditar ? (
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
  ) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium">{titulo}</h2>
          <MediaUploadCounter actual={items.length} />
        </div>
        {items.length === 0 ? uploadControls : null}
      </div>

      {items.length > 0 ? (
        <div className="mb-4">
          <MediaGrid
            items={items}
            onDelete={(id) => eliminar(id)}
            puedeEditar={puedeEditar}
            bordered
          />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mb-4 flex flex-wrap justify-end">{uploadControls}</div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin archivos todavía</p>
      ) : null}
    </section>
  );
}
