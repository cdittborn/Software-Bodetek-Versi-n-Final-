"use client";

import { useRef, useState } from "react";
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
  Campo,
  CONTROL_H,
  InputDecimalCl,
  Segmented,
} from "@/components/fachadas/CamposFormulario";
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import {
  aplicarCambioAlto,
  aplicarCambioAncho,
  aplicarCambioSuperficie,
  estadoMedidasVacio,
  FACHADAS_LETRA_PRESET,
  formatM2Cl,
  hintSuperficie,
} from "@/lib/fachadas/indicadores";
import {
  FRECUENCIAS_REVISION_MESES,
  type FrecuenciaRevisionMeses,
} from "@/lib/fachadas/estado";
import { crearFachada, guardarArchivoFachada, guardarFachada } from "@/lib/fachadas/guardar";
import {
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  subirArchivoFachada,
} from "@/lib/fachadas/upload";
import { etiquetaRecintoSelector, type RecintoOption } from "@/lib/trabajos";
import type { FachadaDetalle } from "@/lib/fachadas/tipos";
import { cn } from "@/lib/utils";

function presetKey(letra: string | null | undefined, nombre: string): string {
  if (!letra && !nombre) return "";
  const hit = FACHADAS_LETRA_PRESET.find(
    (p) => p.letra === (letra ?? "") && p.nombre === nombre,
  );
  return hit ? hit.letra : "otra";
}

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CamposFachada
          key={fachada?.id ?? "nueva"}
          recintos={recintos}
          fachada={fachada}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  );
}

function CamposFachada({
  recintos,
  fachada,
  onOpenChange,
  onSuccess,
}: {
  recintos: RecintoOption[];
  fachada?: FachadaDetalle | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
}) {
  const [recintoId, setRecintoId] = useState<string>(fachada?.recintoId ?? "");
  const [preset, setPreset] = useState(
    presetKey(fachada?.letra ?? null, fachada?.nombre ?? ""),
  );
  const [letra, setLetra] = useState(fachada?.letra ?? "");
  const [nombre, setNombre] = useState(fachada?.nombre ?? "");
  const [medidas, setMedidas] = useState(
    fachada
      ? {
          altoM: fachada.altoM,
          anchoM: fachada.anchoM,
          superficieM2: fachada.superficieM2,
          superficieManual: true,
        }
      : estadoMedidasVacio(),
  );
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRevisionMeses>(
    fachada?.frecuenciaRevisionMeses ?? 12,
  );
  const [notas, setNotas] = useState(fachada?.notas ?? "");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [planoFile, setPlanoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hint = hintSuperficie(medidas.altoM, medidas.anchoM, medidas.superficieM2);

  function elegirPreset(letraPreset: string) {
    if (letraPreset === "otra") {
      setPreset("otra");
      return;
    }
    const p = FACHADAS_LETRA_PRESET.find((x) => x.letra === letraPreset);
    if (!p) return;
    setPreset(p.letra);
    setLetra(p.letra);
    setNombre(p.nombre);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recintoId) {
      setError("El recinto es obligatorio");
      return;
    }
    const letraFinal = letra.trim().toUpperCase();
    const nombreFinal = nombre.trim();
    if (!letraFinal || !nombreFinal) {
      setError("Elige una fachada (A, B, C) o escribe letra y nombre");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      nombre: nombreFinal,
      letra: letraFinal,
      recintoId,
      medidas,
      frecuenciaRevisionMeses: frecuencia,
      notas,
    };
    try {
      if (fachada) {
        await guardarFachada({ id: fachada.id, ...payload });
        onSuccess(fachada.id);
      } else {
        const id = await crearFachada(payload);
        if (fotoFile) {
          const up = await subirArchivoFachada({
            file: fotoFile,
            carpeta: carpetaFachadaGeneral(id),
          });
          await guardarArchivoFachada(id, "foto", up.key, up.nombre);
        }
        if (planoFile) {
          const up = await subirArchivoFachada({
            file: planoFile,
            carpeta: carpetaFachadaPlano(id),
          });
          await guardarArchivoFachada(id, "plano", up.key, up.nombre);
        }
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
    <DialogContent className="fachadas-ui max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{fachada ? "Editar fachada" : "Nueva fachada"}</DialogTitle>
        <DialogDescription>
          Recinto, etiqueta, medidas y archivos del estado inicial. La
          superficie se calcula con alto × ancho (coma decimal) y se puede
          editar.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <Campo label="Recinto *">
          <Select
            value={recintoId || undefined}
            onValueChange={(v) => {
              if (v) setRecintoId(v);
            }}
          >
            <SelectTrigger className={cn(CONTROL_H, "w-full")}>
              <SelectValue placeholder="Seleccionar recinto" />
            </SelectTrigger>
            <SelectContent>
              {recintos.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {etiquetaRecintoSelector(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>

        <div className="space-y-2">
          <Label>Fachada *</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {FACHADAS_LETRA_PRESET.map((p) => {
              const on = preset === p.letra;
              return (
                <button
                  key={p.letra}
                  type="button"
                  className={cn(
                    "min-h-10 rounded-lg border px-3 py-2 text-left text-sm",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                  onClick={() => elegirPreset(p.letra)}
                >
                  <span className="font-medium">
                    {p.letra} · {p.nombre}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className={cn(
                "min-h-10 rounded-lg border px-3 py-2 text-left text-sm",
                preset === "otra"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
              onClick={() => elegirPreset("otra")}
            >
              Otra (texto libre)
            </button>
          </div>
          {preset === "otra" ? (
            <div className="grid grid-cols-[88px_1fr] gap-2">
              <Campo label="Letra *">
                <Input
                  className={CONTROL_H}
                  value={letra}
                  maxLength={3}
                  onChange={(e) => setLetra(e.target.value.toUpperCase())}
                  required
                />
              </Campo>
              <Campo label="Nombre *">
                <Input
                  className={CONTROL_H}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </Campo>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Campo label="Alto (m) *">
            <InputDecimalCl
              required
              min={0.01}
              value={medidas.altoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAlto(m, n))}
            />
          </Campo>
          <Campo label="Ancho (m) *">
            <InputDecimalCl
              required
              min={0.01}
              value={medidas.anchoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAncho(m, n))}
            />
          </Campo>
          <Campo
            label="Superficie (m²) *"
            hint={
              medidas.superficieM2 != null
                ? `${formatM2Cl(medidas.superficieM2)} m²`
                : undefined
            }
          >
            <InputDecimalCl
              required
              min={0.01}
              value={medidas.superficieM2}
              onChange={(n) => setMedidas((m) => aplicarCambioSuperficie(m, n))}
            />
          </Campo>
        </div>
        {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}

        {fachada ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <UploaderArchivoSimple
                etiqueta="Foto del estado actual"
                carpeta={carpetaFachadaGeneral(fachada.id)}
                accept="image/*"
                actualUrl={fachada.foto.url}
                actualNombre={fachada.foto.nombre}
                actualKey={fachada.foto.key}
                puedeEditar
                onUploaded={async (key, nombreArchivo) => {
                  await guardarArchivoFachada(fachada.id, "foto", key, nombreArchivo);
                }}
                onCleared={async () => {
                  await guardarArchivoFachada(fachada.id, "foto", null, null);
                }}
              />
            </div>
            <div className="rounded-lg border p-3">
              <UploaderArchivoSimple
                etiqueta="Plano (PDF o imagen)"
                carpeta={carpetaFachadaPlano(fachada.id)}
                accept="image/*,.pdf,application/pdf"
                actualUrl={fachada.plano.url}
                actualNombre={fachada.plano.nombre}
                actualKey={fachada.plano.key}
                puedeEditar
                onUploaded={async (key, nombreArchivo) => {
                  await guardarArchivoFachada(fachada.id, "plano", key, nombreArchivo);
                }}
                onCleared={async () => {
                  await guardarArchivoFachada(fachada.id, "plano", null, null);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <PendienteArchivo
              etiqueta="Foto del estado actual"
              accept="image/*"
              file={fotoFile}
              onFile={setFotoFile}
            />
            <PendienteArchivo
              etiqueta="Plano (PDF o imagen)"
              accept="image/*,.pdf,application/pdf"
              file={planoFile}
              onFile={setPlanoFile}
            />
          </div>
        )}

        <Campo label="Frecuencia de revisión">
          <Segmented
            columns={3}
            value={String(frecuencia) as "6" | "12" | "24"}
            options={FRECUENCIAS_REVISION_MESES.map((m) => ({
              value: String(m) as "6" | "12" | "24",
              label: `${m} meses`,
            }))}
            onChange={(v) => setFrecuencia(Number(v) as FrecuenciaRevisionMeses)}
          />
        </Campo>

        <Campo label="Notas">
          <Textarea
            className="min-h-24"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
          />
        </Campo>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={CONTROL_H}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} className={CONTROL_H}>
            {busy ? "Guardando…" : fachada ? "Guardar fachada" : "Crear fachada"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function PendienteArchivo({
  etiqueta,
  accept,
  file,
  onFile,
}: {
  etiqueta: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-sm font-medium">{etiqueta}</p>
      <p className="text-xs text-muted-foreground">
        {file ? file.name : "Sin archivo. Se sube al guardar."}
      </p>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className={CONTROL_H}
          onClick={() => ref.current?.click()}
        >
          {file ? "Reemplazar" : "Elegir archivo"}
        </Button>
        {file ? (
          <Button
            type="button"
            variant="ghost"
            className={CONTROL_H}
            onClick={() => {
              onFile(null);
              if (ref.current) ref.current.value = "";
            }}
          >
            Quitar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
