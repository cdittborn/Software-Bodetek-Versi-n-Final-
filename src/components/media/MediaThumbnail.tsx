"use client";

import { FileText, Play, Trash2 } from "lucide-react";
import { urlGrillaMedia } from "@/lib/media/urls";
import type { TrabajoMediaItem } from "@/lib/trabajos";

type MediaThumbnailProps = {
  item: TrabajoMediaItem;
  onOpen?: (item: TrabajoMediaItem) => void;
  onDelete?: (id: string) => void;
  puedeEditar?: boolean;
  showProveedor?: boolean;
  bordered?: boolean;
};

function MediaDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="absolute top-1 right-1 z-10 flex size-7 items-center justify-center rounded-md bg-black/60 text-white transition-colors hover:bg-destructive"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label="Eliminar archivo"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

export function MediaThumbnail({
  item,
  onOpen,
  onDelete,
  puedeEditar = false,
  showProveedor = false,
  bordered = false,
}: MediaThumbnailProps) {
  const shellClass = bordered
    ? "relative overflow-hidden rounded-lg border border-border bg-muted"
    : "relative aspect-square overflow-hidden rounded-lg bg-muted";

  const deleteButton =
    puedeEditar && onDelete ? (
      <MediaDeleteButton onClick={() => onDelete(item.id)} />
    ) : null;

  if (item.tipo_archivo === "video") {
    return (
      <li className={shellClass}>
        <button
          type="button"
          className="relative flex aspect-square size-full items-center justify-center bg-muted"
          onClick={() => onOpen?.(item)}
          aria-label="Reproducir video"
        >
          <Play className="size-10 fill-muted-foreground/40 text-muted-foreground/60" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex size-12 items-center justify-center rounded-full bg-black/50">
              <Play className="ml-0.5 size-6 fill-white text-white" />
            </span>
          </span>
        </button>
        {showProveedor && item.proveedor_nombre ? (
          <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
            {item.proveedor_nombre}
          </p>
        ) : null}
        {deleteButton}
      </li>
    );
  }

  if (item.tipo_archivo === "foto") {
    return (
      <li className={shellClass}>
        <button
          type="button"
          className="block aspect-square size-full"
          onClick={() => onOpen?.(item)}
          aria-label="Ver foto"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urlGrillaMedia(item)}
            alt={item.nombre_archivo ?? ""}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </button>
        {showProveedor && item.proveedor_nombre ? (
          <p className="truncate px-1.5 py-1 text-[10px] text-muted-foreground">
            {item.proveedor_nombre}
          </p>
        ) : null}
        {deleteButton}
      </li>
    );
  }

  return (
    <li className={shellClass}>
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
        {item.proveedor_nombre ? (
          <span className="line-clamp-2 text-[10px] text-muted-foreground">
            {item.proveedor_nombre}
          </span>
        ) : null}
      </a>
      {deleteButton}
    </li>
  );
}
