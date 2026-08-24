"use client";

import { useState } from "react";
import type { TrabajoMediaItem } from "@/lib/trabajos";
import { ConfirmDeleteMediaDialog } from "@/components/media/ConfirmDeleteMediaDialog";
import { MediaLightbox } from "@/components/media/MediaLightbox";
import { MediaThumbnail } from "@/components/media/MediaThumbnail";

type MediaGridProps = {
  items: TrabajoMediaItem[];
  onDelete?: (id: string) => void | Promise<void>;
  puedeEditar?: boolean;
  showProveedor?: boolean;
  variant?: "inline" | "dialog";
  bordered?: boolean;
  emptyMessage?: string;
};

export function MediaGrid({
  items,
  onDelete,
  puedeEditar = false,
  showProveedor = false,
  variant = "inline",
  bordered: borderedProp,
  emptyMessage = "Sin archivos todavía",
}: MediaGridProps) {
  const [lightboxItem, setLightboxItem] = useState<TrabajoMediaItem | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<TrabajoMediaItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const gapClass = variant === "dialog" ? "gap-3" : "gap-2";
  const bordered = borderedProp ?? variant === "dialog";
  const puedeEliminar = puedeEditar && Boolean(onDelete);

  function solicitarEliminacion(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (item) setPendingDelete(item);
  }

  async function confirmarEliminacion() {
    if (!pendingDelete || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ul className={`grid grid-cols-2 sm:grid-cols-3 ${gapClass}`}>
        {items.map((item) => (
          <MediaThumbnail
            key={item.id}
            item={item}
            onOpen={setLightboxItem}
            onDelete={puedeEliminar ? solicitarEliminacion : undefined}
            puedeEditar={puedeEliminar}
            showProveedor={showProveedor}
            bordered={bordered}
          />
        ))}
      </ul>

      <MediaLightbox
        open={lightboxItem !== null}
        onOpenChange={(open) => {
          if (!open) setLightboxItem(null);
        }}
        item={lightboxItem}
        items={items}
        onNavigate={setLightboxItem}
      />

      <ConfirmDeleteMediaDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
        nombreArchivo={pendingDelete?.nombre_archivo}
        onConfirm={() => void confirmarEliminacion()}
        busy={deleting}
      />
    </>
  );
}
