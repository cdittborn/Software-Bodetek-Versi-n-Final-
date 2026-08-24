"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type MediaLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TrabajoMediaItem | null;
  items?: TrabajoMediaItem[];
  onNavigate?: (item: TrabajoMediaItem) => void;
};

function itemsVisibles(items: TrabajoMediaItem[]): TrabajoMediaItem[] {
  return items.filter(
    (i) => i.tipo_archivo === "foto" || i.tipo_archivo === "video",
  );
}

export function MediaLightbox({
  open,
  onOpenChange,
  item,
  items = [],
  onNavigate,
}: MediaLightboxProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const visibles = itemsVisibles(items.length > 0 ? items : item ? [item] : []);
  const index = item ? visibles.findIndex((i) => i.id === item.id) : -1;
  const puedeAnterior = index > 0;
  const puedeSiguiente = index >= 0 && index < visibles.length - 1;

  useEffect(() => {
    if (!open || !item) {
      setVideoSrc(null);
      return;
    }
    if (item.tipo_archivo === "video") {
      setVideoSrc(item.publicUrl);
    } else {
      setVideoSrc(null);
    }
  }, [open, item]);

  function navegar(delta: number) {
    if (!onNavigate || index < 0) return;
    const next = visibles[index + delta];
    if (next) onNavigate(next);
  }

  const titulo =
    item?.nombre_archivo ??
    (item?.tipo_archivo === "video" ? "Video" : "Foto");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="truncate pr-8 text-sm font-medium">
            {titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex min-h-[50vh] items-center justify-center bg-black/95 p-4">
          {item?.tipo_archivo === "foto" ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.publicUrl}
              alt={item.nombre_archivo ?? ""}
              className="max-h-[80vh] max-w-full object-contain"
            />
          ) : item?.tipo_archivo === "video" && videoSrc ? (
            <video
              src={videoSrc}
              className="max-h-[80vh] max-w-full"
              controls
              playsInline
              preload="none"
              autoPlay
            />
          ) : null}

          {onNavigate && visibles.length > 1 ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2"
                disabled={!puedeAnterior}
                onClick={() => navegar(-1)}
                aria-label="Anterior"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2"
                disabled={!puedeSiguiente}
                onClick={() => navegar(1)}
                aria-label="Siguiente"
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
