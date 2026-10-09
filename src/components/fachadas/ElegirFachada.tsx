"use client";

import { useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import { PlanoFachadas } from "@/components/fachadas/plano/PlanoFachadas";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { agruparFachadasPorUnidad } from "@/lib/fachadas/dashboard";
import { estadoPlano } from "@/lib/fachadas/estado-a-fecha";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import type { EstadoPlano } from "@/lib/fachadas/plano";
import type { FachadaListadoItem } from "@/lib/fachadas/tipos";

export function ElegirFachada({
  open,
  onOpenChange,
  fachadas,
  intervenciones,
  hoy,
  onElegir,
}: {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  hoy: string;
  onElegir: (fachadaId: string) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const estados = useMemo(() => {
    const out: Record<string, EstadoPlano> = {};
    for (const fachada of fachadas) {
      if (!fachada.svgId) continue;
      out[fachada.svgId] = estadoPlano(fachada, intervenciones, hoy);
    }
    return out;
  }, [fachadas, intervenciones, hoy]);
  const grupos = useMemo(
    () => agruparFachadasPorUnidad(fachadas, intervenciones, { hoy }),
    [fachadas, intervenciones, hoy],
  );
  const texto = busqueda.trim().toLowerCase();
  const filtrados = grupos
    .map((grupo) => ({
      ...grupo,
      filas: grupo.filas.filter((fila) => {
        if (!texto) return true;
        return `${fila.nombre} ${fila.unidadLabel}`.toLowerCase().includes(texto);
      }),
    }))
    .filter((grupo) => grupo.filas.length > 0);

  function elegirPorSvg(svgId: string) {
    const fachada = fachadas.find((item) => item.svgId === svgId);
    if (fachada) onElegir(fachada.id);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) setBusqueda("");
        onOpenChange(abierto);
      }}
    >
      <DialogContent showCloseButton={false} className="fd-elegir-fachada">
        <div className="flex items-start justify-between gap-3">
          <DialogHeader>
            <DialogTitle>Elegir fachada</DialogTitle>
            <DialogDescription>
              Elige la fachada en la lista o tocando el plano. Después se abre el formulario.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            aria-label="Cerrar"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-200"
            style={{ width: 44, height: 44 }}
          >
            <XIcon aria-hidden="true" />
          </DialogClose>
        </div>
        {open ? (
          <>
            <Input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar fachada"
              aria-label="Buscar fachada para intervenir"
              className="w-full"
              style={{ height: 44, minHeight: 44, fontSize: 16 }}
            />
            <PlanoFachadas
              modo="hoy"
              variante="movil"
              estados={estados}
              mostrarHoja={false}
              onPick={elegirPorSvg}
            />
            <div className="max-h-[50vh] overflow-y-auto">
              {filtrados.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay fachadas con ese nombre.
                </p>
              ) : (
                filtrados.map((grupo) => (
                  <section key={grupo.unidadLabel} className="border-t py-1">
                    <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {grupo.unidadLabel}
                      {grupo.sitio ? ` · ${grupo.sitio}` : ""}
                    </p>
                    <ul>
                      {grupo.filas.map((fila) => (
                        <li key={fila.id}>
                          <button
                            type="button"
                            className="flex min-h-11 w-full items-center rounded-md px-2 text-left text-sm font-medium hover:bg-[#faf9f7]"
                            onClick={() => onElegir(fila.id)}
                          >
                            {fila.nombre}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
