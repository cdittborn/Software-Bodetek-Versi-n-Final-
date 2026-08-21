"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectorProveedor } from "@/components/shared/SelectorProveedor";
import {
  kindFromFile,
  type TrabajoMediaItem,
  type TrabajoMediaTipo,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

type AdjuntosUploaderProps = {
  trabajoId: string;
  tipo: TrabajoMediaTipo;
  titulo: string;
  descripcion?: string;
  items: TrabajoMediaItem[];
  puedeEditar: boolean;
  maxArchivos?: number;
  accept?: string;
  etiquetaBoton?: string;
  proveedores?: ProveedorOption[];
  pedirProveedor?: boolean;
};

export function AdjuntosUploader({
  trabajoId,
  tipo,
  titulo,
  descripcion,
  items,
  puedeEditar,
  maxArchivos,
  accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf",
  etiquetaBoton = "Subir fotos y videos",
  proveedores: proveedoresIniciales = [],
  pedirProveedor = false,
}: AdjuntosUploaderProps) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proveedorId, setProveedorId] = useState<string | null>(null);
  const [proveedores, setProveedores] = useState(proveedoresIniciales);

  useEffect(() => {
    setProveedores(proveedoresIniciales);
  }, [proveedoresIniciales]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    if (pedirProveedor && !proveedorId) {
      setError("Selecciona un proveedor antes de subir la cotización");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      if (maxArchivos === 1) {
        const ids = items.map((item) => item.id);
        if (ids.length > 0) {
          await supabase.from("trabajo_media").delete().in("id", ids);
        }
      }

      for (const file of Array.from(files)) {
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreArchivo: file.name || "archivo",
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
          tipo,
          tipo_archivo: kindFromFile(file),
          url: presign.key,
          nombre_archivo: file.name || null,
          ...(pedirProveedor ? { proveedor_id: proveedorId } : {}),
        });
        if (insertError) throw new Error(insertError.message);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function eliminar(id: string) {
    setError(null);
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("trabajo_media")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-medium">{titulo}</h2>
          {descripcion ? (
            <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
          ) : null}
        </div>
        {puedeEditar ? (
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            {pedirProveedor ? (
              <div className="w-full min-w-[14rem] space-y-1">
                <Label className="text-xs">Proveedor de la cotización</Label>
                <SelectorProveedor
                  value={proveedorId}
                  onChange={setProveedorId}
                  proveedores={proveedores}
                  onProveedoresChange={setProveedores}
                  allowClear={false}
                  placeholder="Elegir proveedor"
                />
              </div>
            ) : null}
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
              ref={fileRef}
              type="file"
              accept={accept}
              multiple={maxArchivos !== 1}
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
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Subiendo…" : etiquetaBoton}
            </Button>
            </div>
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
              className="relative overflow-hidden rounded-lg border border-border bg-muted"
            >
              {item.tipo_archivo === "video" ? (
                <div className="relative aspect-square">
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
                </div>
              ) : item.tipo_archivo === "foto" ? (
                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.publicUrl}
                    alt={item.nombre_archivo ?? ""}
                    className="size-full object-cover"
                  />
                </a>
              ) : (
                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center"
                >
                  <FileText className="size-8 text-muted-foreground" />
                  <span className="line-clamp-3 text-xs">
                    {item.nombre_archivo ?? "Documento"}
                  </span>
                  {item.proveedor_nombre ? (
                    <span className="line-clamp-2 text-[10px] text-muted-foreground">
                      {item.proveedor_nombre}
                    </span>
                  ) : null}
                </a>
              )}
              {pedirProveedor && item.proveedor_nombre && item.tipo_archivo !== "documento" ? (
                <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                  {item.proveedor_nombre}
                </p>
              ) : null}
              {puedeEditar ? (
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                  onClick={() => void eliminar(item.id)}
                >
                  Quitar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
