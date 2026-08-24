"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaUploadCounter } from "@/components/media/MediaUploadCounter";
import { formatFechaCl } from "@/lib/trabajos";
import { notifyUploadSuccess } from "@/lib/media/notifyUploadSuccess";
import type {
  RecintoDocumento,
  RecintoDocumentoTipo,
  RecintoPlanoArchivo,
} from "@/lib/recintos";

type RecintoArchivosUploaderProps = {
  recintoId: string;
  titulo: string;
  descripcion?: string;
  puedeEditar: boolean;
} & (
  | {
      tabla: "recinto_documentos";
      items: RecintoDocumento[];
      tipo: RecintoDocumentoTipo;
      conVencimiento?: boolean;
    }
  | {
      tabla: "recinto_planos";
      items: RecintoPlanoArchivo[];
      tipo?: never;
      conVencimiento?: false;
    }
);

export function RecintoArchivosUploader(props: RecintoArchivosUploaderProps) {
  const { recintoId, titulo, descripcion, puedeEditar, tabla, items } = props;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const carpeta =
      tabla === "recinto_documentos"
        ? `recintos/${recintoId}/documentos`
        : `recintos/${recintoId}/planos`;

    try {
      for (const file of Array.from(files)) {
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreArchivo: file.name || "archivo",
            tipoArchivo: file.type || "application/octet-stream",
            carpeta,
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
            `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket.`,
          );
        }

        if (tabla === "recinto_documentos") {
          const { error: insertError } = await supabase
            .from("recinto_documentos")
            .insert({
              recinto_id: recintoId,
              tipo: props.tipo,
              url: presign.key,
              nombre_archivo: file.name || null,
              fecha_vencimiento:
                props.conVencimiento && fechaVencimiento
                  ? fechaVencimiento
                  : null,
            });
          if (insertError) throw new Error(insertError.message);
        } else {
          const { error: insertError } = await supabase
            .from("recinto_planos")
            .insert({
              recinto_id: recintoId,
              url: presign.key,
              nombre_archivo: file.name || null,
            });
          if (insertError) throw new Error(insertError.message);
        }
        notifyUploadSuccess(file.name);
      }
      setFechaVencimiento("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function eliminar(id: string) {
    const supabase = createClient();
    const { error: delError } = await supabase.from(tabla).delete().eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  const uploadControls = puedeEditar ? (
    <div className="flex flex-wrap items-end gap-2">
      {props.conVencimiento ? (
        <div className="space-y-1">
          <Label htmlFor={`venc-${tabla}`} className="text-xs">
            Vencimiento (opcional)
          </Label>
          <Input
            id={`venc-${tabla}`}
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            className="w-40"
          />
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept={
          tabla === "recinto_planos"
            ? "image/*,.pdf,.dwg,.dxf"
            : ".pdf,.doc,.docx,.xls,.xlsx,image/*"
        }
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files)}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        {busy ? "Subiendo…" : "Adjuntar"}
      </Button>
    </div>
  ) : null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">{titulo}</h2>
            <MediaUploadCounter actual={items.length} />
          </div>
          {descripcion ? (
            <p className="text-sm text-muted-foreground">{descripcion}</p>
          ) : null}
        </div>
        {items.length === 0 ? uploadControls : null}
      </div>

      {items.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {items.map((item) => {
            const vencimiento =
              "fecha_vencimiento" in item ? item.fecha_vencimiento : null;
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 text-sm hover:underline"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {item.nombre_archivo ?? "Archivo"}
                  </span>
                  {vencimiento ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      vence {formatFechaCl(vencimiento)}
                    </span>
                  ) : null}
                </a>
                {puedeEditar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void eliminar(item.id)}
                  >
                    Quitar
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
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
