"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InfoProyectoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: string | null;
  planAccion: string | null;
};

export function InfoProyectoDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  planAccion,
}: InfoProyectoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <section>
            <h3 className="mb-1 text-sm font-medium">Problema</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {descripcion?.trim() || "—"}
            </p>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-medium">Plan de acción</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {planAccion?.trim() || "—"}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
