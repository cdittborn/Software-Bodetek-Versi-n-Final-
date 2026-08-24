"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaGrid } from "@/components/media/MediaGrid";
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

        <MediaGrid
          items={items}
          variant="dialog"
          emptyMessage="Sin archivos"
        />
      </DialogContent>
    </Dialog>
  );
}
