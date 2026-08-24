"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MediaGrid } from "@/components/media/MediaGrid";
import { eliminarTrabajoMedia } from "@/lib/media/delete";
import { subirTrabajoMedia } from "@/lib/media/upload";
import { SelectorProveedor } from "@/components/shared/SelectorProveedor";
import type { TrabajoMediaItem, TrabajoMediaTipo } from "@/lib/trabajos";
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

    try {
      if (maxArchivos === 1) {
        for (const item of items) {
          await eliminarTrabajoMedia(item.id);
        }
      }

      for (const file of Array.from(files)) {
        await subirTrabajoMedia({
          file,
          trabajoId,
          tipo,
          proveedorId: pedirProveedor ? proveedorId : undefined,
          nombreArchivo: file.name || null,
        });
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
    try {
      await eliminarTrabajoMedia(id);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      setError(message);
      throw err;
    }
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

      <MediaGrid
        items={items}
        onDelete={(id) => void eliminar(id)}
        puedeEditar={puedeEditar}
        showProveedor={pedirProveedor}
        bordered
      />
    </section>
  );
}
