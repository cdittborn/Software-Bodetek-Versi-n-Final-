"use client";

import { FileText, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type MediaPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  items: TrabajoMediaItem[];
};

export function MediaPreviewDialog({
  open,
  onOpenChange,
  titulo,
  items,
}: MediaPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {titulo}
            {items.length > 0 ? ` (${items.length})` : ""}
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin archivos</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="overflow-hidden rounded-lg border border-border bg-muted"
              >
                {item.tipo_archivo === "video" ? (
                  <div className="relative aspect-square">
                    <video
                      src={item.publicUrl}
                      className="size-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    />
                    <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/60 p-1">
                      <Play className="size-3 fill-white text-white" />
                    </span>
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
                    className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center hover:bg-muted/80"
                  >
                    <FileText className="size-8 text-muted-foreground" />
                    <span className="line-clamp-3 text-xs">
                      {item.nombre_archivo ?? "Documento"}
                    </span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
