"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaUploadCounter } from "@/components/media/MediaUploadCounter";
import { eliminarTrabajoMedia } from "@/lib/media/delete";
import { notifyUploadSuccess } from "@/lib/media/notifyUploadSuccess";
import { subirTrabajoMedia } from "@/lib/media/upload";
import type { TrabajoMediaItem, TrabajoMediaTipo } from "@/lib/trabajos";
import type { TipoProblema } from "@/lib/filtracion/problemas";
import { cn } from "@/lib/utils";

const MAX_BYTES = 200 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,video/mp4,.jpg,.jpeg,.png,.mp4";

type ZonaEvidenciaUploadProps = {
  tipo: TrabajoMediaTipo;
  instruccion: string;
  subtexto?: string;
  items: TrabajoMediaItem[];
  pendingFiles: File[];
  onPendingChange: (files: File[]) => void;
  trabajoId: string | null;
  /** Si se omite, no hay tope de cantidad (Antes/Después). */
  maxArchivos?: number;
  puedeSubir: boolean;
  onUploaded: () => void;
  theme?: "amber" | "green" | "neutral";
  proveedorId?: string | null;
  problemaTipo?: TipoProblema;
  acceptExtra?: string;
};

function validarArchivo(file: File, allowPdf: boolean): string | null {
  const okTipo =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "video/mp4" ||
    (allowPdf &&
      (file.type === "application/pdf" || /\.pdf$/i.test(file.name))) ||
    /\.(jpe?g|png|mp4)$/i.test(file.name);
  if (!okTipo) {
    return allowPdf
      ? `${file.name}: solo JPG, PNG, MP4 o PDF`
      : `${file.name}: solo JPG, PNG o MP4`;
  }
  if (file.size > MAX_BYTES) return `${file.name}: supera 200 MB`;
  return null;
}

export function ZonaEvidenciaUpload({
  tipo,
  instruccion,
  subtexto,
  items,
  pendingFiles,
  onPendingChange,
  trabajoId,
  maxArchivos,
  puedeSubir,
  onUploaded,
  theme = "neutral",
  proveedorId,
  problemaTipo,
  acceptExtra,
}: ZonaEvidenciaUploadProps) {
  const allowPdf = Boolean(acceptExtra?.includes("pdf"));
  const acceptAttr = allowPdf ? `${ACCEPT},${acceptExtra}` : ACCEPT;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.length + pendingFiles.length;
  const ilimitado = maxArchivos == null;
  const cupo = ilimitado
    ? Number.POSITIVE_INFINITY
    : Math.max(0, maxArchivos - total);
  const sinCupo = !ilimitado && cupo <= 0;
  const puedeEliminar = puedeSubir && Boolean(trabajoId);
  const bytesPendientes = pendingFiles.reduce((sum, f) => sum + f.size, 0);

  const themeClass =
    theme === "amber"
      ? "border-[#ecdfc9] bg-[#fdfaf3]"
      : theme === "green"
        ? "border-[#d5e6d8] bg-[#f6fbf7]"
        : "border-[#e4e4e7] bg-[#fafafa]";

  async function procesarLista(fileList: FileList | null) {
    if (!fileList?.length || !puedeSubir) return;
    setError(null);

    const nuevos: File[] = [];
    for (const file of Array.from(fileList)) {
      if (!ilimitado && items.length + pendingFiles.length + nuevos.length >= (maxArchivos ?? 0)) {
        setError(`Máximo ${maxArchivos} archivos`);
        break;
      }
      const err = validarArchivo(file, allowPdf);
      if (err) {
        setError(err);
        continue;
      }
      nuevos.push(file);
    }
    if (!nuevos.length) return;

    if (trabajoId) {
      setBusy(true);
      try {
        for (const file of nuevos) {
          await subirTrabajoMedia({
            file,
            trabajoId,
            tipo,
            proveedorId: proveedorId ?? undefined,
            nombreArchivo: file.name,
            problemaTipo,
          });
          notifyUploadSuccess(file.name);
        }
        onUploaded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    } else {
      onPendingChange([...pendingFiles, ...nuevos]);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function eliminar(id: string) {
    setError(null);
    try {
      await eliminarTrabajoMedia(id);
      onUploaded();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      setError(message);
      throw err;
    }
  }

  function quitarPendiente(index: number) {
    onPendingChange(pendingFiles.filter((_, i) => i !== index));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (sinCupo || !puedeSubir) return;
    void procesarLista(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-3">
      <MediaUploadCounter
        actual={total}
        max={maxArchivos}
        bytes={bytesPendientes > 0 ? bytesPendientes : undefined}
      />

      {(items.length > 0 || pendingFiles.length > 0) && (
        <div className="space-y-2">
          {items.length > 0 ? (
            <MediaGrid
              items={items}
              onDelete={(id) => eliminar(id)}
              puedeEditar={puedeEliminar}
            />
          ) : null}
          {pendingFiles.length > 0 ? (
            <ul className="space-y-1 text-xs text-[#71717a]">
              {pendingFiles.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-[#e4e4e7] bg-white px-2 py-1.5"
                >
                  <span className="truncate">Pendiente: {f.name}</span>
                  {puedeSubir ? (
                    <button
                      type="button"
                      className="flex size-6 shrink-0 items-center justify-center rounded text-[#71717a] hover:bg-[#fef2f2] hover:text-[#a4131f]"
                      onClick={() => quitarPendiente(i)}
                      aria-label={`Quitar ${f.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!sinCupo && puedeSubir) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-4 transition-colors",
          themeClass,
          dragOver && !sinCupo && "border-[#c8102e] bg-white",
          sinCupo && "pointer-events-none opacity-50",
        )}
        aria-disabled={sinCupo}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="size-6 text-[#8a8a92]" />
          <p className="text-sm text-[#3f3f46]">
            {sinCupo
              ? `Máximo ${maxArchivos} archivos alcanzado`
              : instruccion}
          </p>
          {subtexto && !sinCupo ? (
            <p className="text-xs text-[#71717a]">{subtexto}</p>
          ) : null}
          {puedeSubir && !sinCupo ? (
            <p className="text-[11px] text-[#8a8a92]">
              {allowPdf ? "JPG, PNG, MP4 o PDF" : "JPG, PNG o MP4"} · máx. 200 MB
              por archivo
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[#a4131f]">{error}</p>
      ) : null}

      {puedeSubir && !sinCupo ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            multiple
            className="hidden"
            onChange={(e) => void procesarLista(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="min-h-[44px]"
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Subiendo…" : allowPdf ? "Subir archivo" : "Subir fotos y videos"}
          </Button>
        </>
      ) : null}
    </div>
  );
}

export async function subirPendientes(
  trabajoId: string,
  files: File[],
  tipo: TrabajoMediaTipo,
  proveedorId?: string | null,
  problemaTipo?: TipoProblema,
) {
  for (const file of files) {
    await subirTrabajoMedia({
      file,
      trabajoId,
      tipo,
      proveedorId: proveedorId ?? undefined,
      nombreArchivo: file.name,
      problemaTipo,
    });
    notifyUploadSuccess(file.name);
  }
}
