"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDeleteMediaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreArchivo?: string | null;
  onConfirm: () => void;
  busy?: boolean;
};

export function ConfirmDeleteMediaDialog({
  open,
  onOpenChange,
  nombreArchivo,
  onConfirm,
  busy = false,
}: ConfirmDeleteMediaDialogProps) {
  const etiqueta = nombreArchivo?.trim() || "este archivo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>¿Eliminar archivo?</DialogTitle>
          <DialogDescription>
            Se borrará permanentemente <strong>{etiqueta}</strong> del almacenamiento
            y de la base de datos. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
