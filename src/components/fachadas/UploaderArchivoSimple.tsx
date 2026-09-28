"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { subirArchivoFachada } from "@/lib/fachadas/upload";
import { esImagen, esPdf } from "@/lib/fachadas/url";

export function UploaderArchivoSimple({
  etiqueta,
  carpeta,
  accept,
  actualUrl,
  actualNombre,
  actualKey,
  puedeEditar,
  onUploaded,
  onCleared,
}: {
  etiqueta: string;
  carpeta: string;
  accept: string;
  actualUrl: string | null;
  actualNombre: string | null;
  actualKey: string | null;
  puedeEditar: boolean;
  onUploaded: (key: string, nombre: string) => Promise<void>;
  onCleared: () => Promise<void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdf = esPdf(actualNombre, actualKey);
  const img = esImagen(actualNombre, actualKey);

  async function onChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { key, nombre } = await subirArchivoFachada({ file, carpeta });
      await onUploaded(key, nombre);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{etiqueta}</p>
      {img && actualUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={actualUrl} alt="" className="max-h-48 rounded-md border object-contain" />
      ) : null}
      {pdf && actualUrl ? (
        <a
          href={actualUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline"
        >
          Descargar {actualNombre || "PDF"}
        </a>
      ) : null}
      {!actualUrl ? (
        <p className="text-sm text-muted-foreground">Sin archivo</p>
      ) : null}
      {puedeEditar ? (
        <div className="flex flex-wrap gap-2">
          <input
            ref={ref}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => void onChange(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => ref.current?.click()}
          >
            {busy ? "Subiendo…" : actualUrl ? "Reemplazar" : "Subir"}
          </Button>
          {actualUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void onCleared()}
            >
              Quitar
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
