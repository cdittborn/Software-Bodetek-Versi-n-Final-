"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  aplicarCambioAlto,
  aplicarCambioAncho,
  aplicarCambioSuperficie,
  estadoMedidasVacio,
  hintSuperficie,
} from "@/lib/fachadas/indicadores";
import { crearFachada, guardarFachada } from "@/lib/fachadas/guardar";
import { etiquetaRecintoSelector, type RecintoOption } from "@/lib/trabajos";
import type { FachadaDetalle } from "@/lib/fachadas/tipos";

const SIN_RECINTO = "general";

export function FormularioFachada({
  open,
  onOpenChange,
  recintos,
  fachada,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recintos: RecintoOption[];
  fachada?: FachadaDetalle | null;
  onSuccess: (id: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [recintoId, setRecintoId] = useState<string | null>(null);
  const [medidas, setMedidas] = useState(estadoMedidasVacio());
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNombre(fachada?.nombre ?? "");
    setRecintoId(fachada?.recintoId ?? null);
    setMedidas(
      fachada
        ? {
            altoM: fachada.altoM,
            anchoM: fachada.anchoM,
            superficieM2: fachada.superficieM2,
            superficieManual: true,
          }
        : estadoMedidasVacio(),
    );
    setNotas(fachada?.notas ?? "");
    setError(null);
  }, [open, fachada]);

  const hint = hintSuperficie(medidas.altoM, medidas.anchoM, medidas.superficieM2);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (fachada) {
        await guardarFachada({
          id: fachada.id,
          nombre,
          recintoId,
          medidas,
          notas,
        });
        onSuccess(fachada.id);
      } else {
        const id = await crearFachada({ nombre, recintoId, medidas, notas });
        onSuccess(id);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{fachada ? "Editar fachada" : "Nueva fachada"}</DialogTitle>
          <DialogDescription>
            Nombre, recinto opcional y medidas. La superficie se autocompleta con
            alto × ancho hasta que la edites.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fachada-nombre">Nombre *</Label>
            <Input
              id="fachada-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Recinto</Label>
            <Select
              value={recintoId ?? SIN_RECINTO}
              onValueChange={(v) => setRecintoId(v === SIN_RECINTO ? null : v)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_RECINTO}>General (sin recinto)</SelectItem>
                {recintos.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {etiquetaRecintoSelector(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label>Alto (m) *</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                inputMode="decimal"
                value={medidas.altoM ?? ""}
                onChange={(e) =>
                  setMedidas((m) =>
                    aplicarCambioAlto(m, e.target.value ? Number(e.target.value) : null),
                  )
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Ancho (m) *</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                inputMode="decimal"
                value={medidas.anchoM ?? ""}
                onChange={(e) =>
                  setMedidas((m) =>
                    aplicarCambioAncho(m, e.target.value ? Number(e.target.value) : null),
                  )
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>m² *</Label>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                inputMode="decimal"
                value={medidas.superficieM2 ?? ""}
                onChange={(e) =>
                  setMedidas((m) =>
                    aplicarCambioSuperficie(
                      m,
                      e.target.value ? Number(e.target.value) : null,
                    ),
                  )
                }
                required
              />
            </div>
          </div>
          {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}
          <div className="space-y-1">
            <Label>Notas</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : fachada ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
