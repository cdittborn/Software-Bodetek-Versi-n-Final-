"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import {
  CAMPOS_FILTRABLES,
  LABEL_CAMPO_FILTRABLE,
  campoTieneBusquedaInterna,
  crearTokenCampo,
  filtrarOpcionesPorTexto,
  opcionesCampo,
  type CampoFiltrable,
  type FiltroCampoToken,
} from "@/lib/filtracion/filtrosCampoEvento";
import { cn } from "@/lib/utils";

type EventoFiltracionPanelFiltrosProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proyectos: ProyectoFiltracionEnriquecido[];
  onSeleccionar: (token: FiltroCampoToken) => void;
};

export function EventoFiltracionPanelFiltros({
  open,
  onOpenChange,
  proyectos,
  onSeleccionar,
}: EventoFiltracionPanelFiltrosProps) {
  const [paso, setPaso] = useState<"campos" | "valores">("campos");
  const [campoActivo, setCampoActivo] = useState<CampoFiltrable | null>(null);
  const [busquedaOpciones, setBusquedaOpciones] = useState("");

  const opciones = useMemo(() => {
    if (!campoActivo) return [];
    return opcionesCampo(campoActivo, proyectos);
  }, [campoActivo, proyectos]);

  const opcionesFiltradas = useMemo(
    () => filtrarOpcionesPorTexto(opciones, busquedaOpciones),
    [opciones, busquedaOpciones],
  );

  function cerrar() {
    onOpenChange(false);
    setPaso("campos");
    setCampoActivo(null);
    setBusquedaOpciones("");
  }

  function elegirCampo(campo: CampoFiltrable) {
    setCampoActivo(campo);
    setBusquedaOpciones("");
    setPaso("valores");
  }

  function elegirValor(valor: string, label: string) {
    if (!campoActivo) return;
    onSeleccionar(
      crearTokenCampo(campoActivo, { valor, label }),
    );
    cerrar();
  }

  function volverCampos() {
    setPaso("campos");
    setCampoActivo(null);
    setBusquedaOpciones("");
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : cerrar())}>
      <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {paso === "valores" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 px-2"
                onClick={volverCampos}
              >
                ‹ Campos
              </Button>
            ) : (
              <DialogTitle className="text-base">Filtrar por campo</DialogTitle>
            )}
            {paso === "valores" && campoActivo ? (
              <DialogTitle className="text-base">
                {LABEL_CAMPO_FILTRABLE[campoActivo]}
              </DialogTitle>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0"
              onClick={cerrar}
            >
              Cerrar
            </Button>
          </div>
        </DialogHeader>

        {paso === "campos" ? (
          <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
            {CAMPOS_FILTRABLES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => elegirCampo(c.id)}
                className="min-h-[44px] rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:bg-muted/50"
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {campoActivo && campoTieneBusquedaInterna(campoActivo) ? (
              <Input
                value={busquedaOpciones}
                onChange={(e) => setBusquedaOpciones(e.target.value)}
                placeholder={
                  campoActivo === "recinto"
                    ? "Buscar recinto…"
                    : "Buscar arrendatario…"
                }
                className="h-10"
                autoFocus
              />
            ) : null}
            <div className="max-h-[50vh] overflow-y-auto">
              {opcionesFiltradas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin opciones para este campo
                </p>
              ) : (
                <div className="grid gap-1.5">
                  {opcionesFiltradas.map((o) => (
                    <button
                      key={o.valor}
                      type="button"
                      onClick={() => elegirValor(o.valor, o.label)}
                      className={cn(
                        "min-h-[44px] rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/50",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
