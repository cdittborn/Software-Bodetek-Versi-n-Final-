"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select";
import {
  Campo,
  CONTROL_H,
  InputDecimalCl,
} from "@/components/fachadas/CamposFormulario";
import "./fachadas.css";
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import {
  aplicarCambioAlto,
  aplicarCambioAncho,
  aplicarCambioSuperficie,
  estadoMedidasVacio,
  hintSuperficie,
} from "@/lib/fachadas/indicadores";
import {
  FRECUENCIA_LIMPIEZA_DEFAULT,
  FRECUENCIA_PINTURA_DEFAULT,
  FRECUENCIA_REPARACION_DEFAULT,
  FRECUENCIAS_TIPO_MESES,
  type FrecuenciaTipoMeses,
} from "@/lib/fachadas/estado";
import { crearFachada, guardarArchivoFachada, guardarFachada } from "@/lib/fachadas/guardar";
import {
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  subirArchivoFachada,
} from "@/lib/fachadas/upload";
import type { FachadaDetalle } from "@/lib/fachadas/tipos";
import { cn } from "@/lib/utils";

function asFrecuenciaSelect(
  n: number | null | undefined,
  fallback: FrecuenciaTipoMeses,
): FrecuenciaTipoMeses {
  if (n === 3 || n === 6 || n === 12 || n === 24 || n === 36) return n;
  return fallback;
}

function labelFrecuencia(meses: number): string {
  return meses === 1 ? "Cada 1 mes" : `Cada ${meses} meses`;
}

export function FormularioFachada({
  open,
  onOpenChange,
  fachada,
  onSuccess,
  modoDemo = false,
  semilla,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fachada?: FachadaDetalle | null;
  onSuccess: (id: string) => void;
  modoDemo?: boolean;
  semilla?: Partial<{
    nombre: string;
    altoM: number;
    anchoM: number;
    superficieM2: number;
    frecuenciaLimpiezaMeses: number;
    frecuenciaReparacionMeses: number;
    frecuenciaPinturaMeses: number;
    notas: string;
  }> | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CamposFachada
          key={fachada?.id ?? semilla?.nombre ?? "nueva"}
          fachada={fachada}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          modoDemo={modoDemo}
          semilla={semilla}
        />
      ) : null}
    </Dialog>
  );
}

function CamposFachada({
  fachada,
  onOpenChange,
  onSuccess,
  modoDemo = false,
  semilla,
}: {
  fachada?: FachadaDetalle | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
  modoDemo?: boolean;
  semilla?: Partial<{
    nombre: string;
    altoM: number;
    anchoM: number;
    superficieM2: number;
    frecuenciaLimpiezaMeses: number;
    frecuenciaReparacionMeses: number;
    frecuenciaPinturaMeses: number;
    notas: string;
  }> | null;
}) {
  const [nombre, setNombre] = useState(fachada?.nombre ?? semilla?.nombre ?? "");
  const [medidas, setMedidas] = useState(
    fachada || semilla?.altoM
      ? {
          altoM: fachada?.altoM ?? semilla?.altoM ?? null,
          anchoM: fachada?.anchoM ?? semilla?.anchoM ?? null,
          superficieM2: fachada?.superficieM2 ?? semilla?.superficieM2 ?? null,
          superficieManual: true,
        }
      : estadoMedidasVacio(),
  );
  const [freqLimpieza, setFreqLimpieza] = useState<FrecuenciaTipoMeses>(
    asFrecuenciaSelect(
      fachada?.frecuenciaLimpiezaMeses ?? semilla?.frecuenciaLimpiezaMeses,
      FRECUENCIA_LIMPIEZA_DEFAULT,
    ),
  );
  const [freqReparacion, setFreqReparacion] = useState<FrecuenciaTipoMeses>(
    asFrecuenciaSelect(
      fachada?.frecuenciaReparacionMeses ?? semilla?.frecuenciaReparacionMeses,
      FRECUENCIA_REPARACION_DEFAULT,
    ),
  );
  const [freqPintura, setFreqPintura] = useState<FrecuenciaTipoMeses>(
    asFrecuenciaSelect(
      fachada?.frecuenciaPinturaMeses ?? semilla?.frecuenciaPinturaMeses,
      FRECUENCIA_PINTURA_DEFAULT,
    ),
  );
  const [notas, setNotas] = useState(fachada?.notas ?? semilla?.notas ?? "");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [planoFile, setPlanoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hint = hintSuperficie(medidas.altoM, medidas.anchoM, medidas.superficieM2);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nombreFinal = nombre.trim();
    if (!nombreFinal) {
      setError("El nombre de la fachada es obligatorio");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      nombre: nombreFinal,
      medidas,
      frecuenciaLimpiezaMeses: freqLimpieza,
      frecuenciaReparacionMeses: freqReparacion,
      frecuenciaPinturaMeses: freqPintura,
      notas,
    };
    try {
      if (modoDemo) {
        onSuccess("demo");
        onOpenChange(false);
        return;
      }
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
    <DialogContent className="fachadas-scope max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[36rem]">
      <DialogHeader className="space-y-1 text-left">
        <DialogTitle className="fd-title text-[1.7rem]">
          {fachada ? "Editar fachada" : "Nueva fachada"}
        </DialogTitle>
        <DialogDescription className="fd-hint text-[0.8rem]">
          Se crea una vez; las intervenciones se agregan después en su ficha.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        <Campo label="Fachada *">
          <Input
            className={CONTROL_H}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder='Ej. "Bodega 14 frente"'
          />
        </Campo>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Alto (m) *">
            <InputDecimalCl
              required
              min={0.01}
              fractionDigits={2}
              value={medidas.altoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAlto(m, n))}
            />
          </Campo>
          <Campo label="Ancho (m) *">
            <InputDecimalCl
              required
              min={0.01}
              fractionDigits={2}
              value={medidas.anchoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAncho(m, n))}
            />
          </Campo>
          <div className="space-y-1">
            <Campo label="Superficie">
              <div className="fd-superficie">
                <InputDecimalCl
                  required
                  min={0.01}
                  fractionDigits={2}
                  value={medidas.superficieM2}
                  onChange={(n) => setMedidas((m) => aplicarCambioSuperficie(m, n))}
                />
                <span>m²</span>
              </div>
            </Campo>
          </div>
        </div>
        <p className="fd-hint -mt-3">
          Se calcula alto × ancho. Puedes descontar portones en el plano.
          {hint ? ` (${hint})` : ""}
        </p>

        {fachada ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="fd-label mb-1.5">Plano con medidas</p>
              <UploaderArchivoSimple
                etiqueta=""
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
            <div>
              <p className="fd-label mb-1.5">Foto estado actual</p>
              <UploaderArchivoSimple
                etiqueta=""
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
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <PendienteArchivo
              etiqueta="Plano con medidas"
              subtitulo="PDF, DWG exportado o imagen"
              icono="plano"
              accept="image/*,.pdf,application/pdf"
              file={planoFile}
              onFile={setPlanoFile}
            />
            <PendienteArchivo
              etiqueta="Foto estado actual"
              subtitulo="Quedará como punto de partida"
              icono="foto"
              accept="image/*"
              file={fotoFile}
              onFile={setFotoFile}
            />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <SelectFrecuencia
            label="Frecuencia limpieza"
            value={freqLimpieza}
            onChange={setFreqLimpieza}
          />
          <SelectFrecuencia
            label="Frecuencia reparación"
            value={freqReparacion}
            onChange={setFreqReparacion}
          />
          <SelectFrecuencia
            label="Frecuencia pintura"
            value={freqPintura}
            onChange={setFreqPintura}
          />
        </div>

        <Campo label="Notas">
          <Textarea
            className="min-h-20 rounded-lg"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Material del muro, color de pintura, observaciones"
          />
        </Campo>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 min-h-10 rounded-xl px-4"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={busy}
            className="fd-btn-primary h-10 min-h-10 rounded-xl px-5"
          >
            {busy ? "Guardando…" : fachada ? "Guardar fachada" : "Crear fachada"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function SelectFrecuencia({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FrecuenciaTipoMeses;
  onChange: (v: FrecuenciaTipoMeses) => void;
}) {
  return (
    <Campo label={label}>
      <Select
        value={String(value)}
        onValueChange={(v) => {
          const n = Number(v);
          if (n === 3 || n === 6 || n === 12 || n === 24 || n === 36) onChange(n);
        }}
      >
        <SelectTrigger className={cn(CONTROL_H, "w-full rounded-lg")}>
          <span className="flex-1 truncate text-left">{labelFrecuencia(value)}</span>
        </SelectTrigger>
        <SelectContent>
          {FRECUENCIAS_TIPO_MESES.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {labelFrecuencia(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Campo>
  );
}

function PendienteArchivo({
  etiqueta,
  subtitulo,
  icono,
  accept,
  file,
  onFile,
}: {
  etiqueta: string;
  subtitulo: string;
  icono: "plano" | "foto";
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="fd-label mb-1.5">{etiqueta}</p>
      <button
        type="button"
        className="fd-drop w-full"
        onClick={() => ref.current?.click()}
      >
        <span className="text-muted-foreground" aria-hidden>
          {icono === "plano" ? (
            <FileText className="mx-auto size-6" strokeWidth={1.5} />
          ) : (
            <ImageIcon className="mx-auto size-6" strokeWidth={1.5} />
          )}
        </span>
        <span className="text-sm font-semibold">
          {file ? file.name : icono === "plano" ? "Subir plano" : "Subir fotos"}
        </span>
        <span className="fd-hint">{subtitulo}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
