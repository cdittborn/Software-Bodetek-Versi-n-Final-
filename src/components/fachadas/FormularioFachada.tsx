"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import {
  BotonesCapturaGaleria,
  ListaColaSubida,
  MiniaturaMedia,
  useColaSubida,
} from "@/components/fachadas/ZonaFotos";
import { validarArchivoFachada } from "@/lib/fachadas/cola-subida";
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
  AYUDA_SUPERFICIE_M2,
  estadoMedidasVacio,
  addMonthsIso,
} from "@/lib/fachadas/indicadores";
import { formatDiaMesCorto } from "@/lib/fachadas/ui";
import {
  FRECUENCIA_LIMPIEZA_DEFAULT,
  FRECUENCIA_PINTURA_DEFAULT,
  FRECUENCIA_REPARACION_DEFAULT,
  FRECUENCIAS_TIPO_MESES,
  type FrecuenciaTipoMeses,
} from "@/lib/fachadas/estado";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
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

type SemillaFachada = Partial<{
  nombre: string;
  altoM: number | null;
  anchoM: number | null;
  superficieM2: number | null;
  frecuenciaLimpiezaMeses: number;
  frecuenciaReparacionMeses: number;
  frecuenciaPinturaMeses: number;
  ultimaLimpiezaFecha: string | null;
  ultimaReparacionFecha: string | null;
  ultimaPinturaFecha: string | null;
  notas: string;
}>;

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
  semilla?: SemillaFachada | null;
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
  semilla?: SemillaFachada | null;
}) {
  const hoy = hoyIsoChile();
  const [nombre, setNombre] = useState(fachada?.nombre ?? semilla?.nombre ?? "");
  const [medidas, setMedidas] = useState(
    fachada || semilla
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
  const [ultimaLimpieza, setUltimaLimpieza] = useState(
    fachada?.ultimaLimpiezaFecha || semilla?.ultimaLimpiezaFecha || "",
  );
  const [ultimaReparacion, setUltimaReparacion] = useState(
    fachada?.ultimaReparacionFecha || semilla?.ultimaReparacionFecha || "",
  );
  const [ultimaPintura, setUltimaPintura] = useState(
    fachada?.ultimaPinturaFecha || semilla?.ultimaPinturaFecha || "",
  );
  const [notas, setNotas] = useState(fachada?.notas ?? semilla?.notas ?? "");
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const [fotoPortada, setFotoPortada] = useState(0);
  const [planoFile, setPlanoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      ultimaLimpiezaFecha: ultimaLimpieza || null,
      ultimaReparacionFecha: ultimaReparacion || null,
      ultimaPinturaFecha: ultimaPintura || null,
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
        const portada =
          fotoFiles.find((f, i) => i === fotoPortada && f.type.startsWith("image/")) ??
          fotoFiles.find((f) => f.type.startsWith("image/")) ??
          null;
        if (portada) {
          const up = await subirArchivoFachada({
            file: portada,
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
    <DialogContent className="fachadas-scope fd-form-sheet max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-[36rem]">
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

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Campo label="Alto (m)">
            <InputDecimalCl
              min={0.01}
              fractionDigits={2}
              value={medidas.altoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAlto(m, n))}
            />
          </Campo>
          <Campo label="Ancho (m)">
            <InputDecimalCl
              min={0.01}
              fractionDigits={2}
              value={medidas.anchoM}
              onChange={(n) => setMedidas((m) => aplicarCambioAncho(m, n))}
            />
          </Campo>
          <div className="col-span-2 space-y-1 md:col-span-1">
            <Campo label="Superficie (m²)">
              <div className="fd-superficie">
                <InputDecimalCl
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
        <p className="fd-hint -mt-3">{AYUDA_SUPERFICIE_M2}</p>

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
            <FotosEstadoActual
              fachadaId={fachada.id}
              actualUrl={fachada.foto.url}
              onGuardar={async (file) => {
                const up = await subirArchivoFachada({
                  file,
                  carpeta: carpetaFachadaGeneral(fachada.id),
                });
                await guardarArchivoFachada(fachada.id, "foto", up.key, up.nombre);
              }}
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <PendienteArchivo
              etiqueta="Plano con medidas"
              subtitulo="PDF, DWG exportado o imagen"
              accept="image/*,.pdf,application/pdf"
              file={planoFile}
              onFile={setPlanoFile}
            />
            <FotosEstadoActual
              archivos={fotoFiles}
              portada={fotoPortada}
              onArchivos={setFotoFiles}
              onPortada={setFotoPortada}
            />
          </div>
        )}

        <div className="hidden gap-3 md:grid md:grid-cols-3">
          <div className="space-y-3">
            <SelectFrecuencia
              label="Frecuencia limpieza"
              value={freqLimpieza}
              onChange={setFreqLimpieza}
            />
            <CampoFechaBase
              label="Última limpieza"
              value={ultimaLimpieza}
              max={hoy}
              onChange={setUltimaLimpieza}
            />
          </div>
          <div className="space-y-3">
            <SelectFrecuencia
              label="Frecuencia reparación"
              value={freqReparacion}
              onChange={setFreqReparacion}
            />
            <CampoFechaBase
              label="Última reparación"
              value={ultimaReparacion}
              max={hoy}
              onChange={setUltimaReparacion}
            />
          </div>
          <div className="space-y-3">
            <SelectFrecuencia
              label="Frecuencia pintura"
              value={freqPintura}
              onChange={setFreqPintura}
            />
            <CampoFechaBase
              label="Última pintura"
              value={ultimaPintura}
              max={hoy}
              onChange={setUltimaPintura}
            />
          </div>
        </div>
        <div className="space-y-3 md:hidden">
          <p className="text-sm font-semibold">Mantención periódica</p>
          <p className="fd-hint">
            Frecuencia y última vez que se hizo cada trabajo. Si no sabes o nunca se hizo, déjalo vacío: quedará como pendiente.
          </p>
          {(
            [
              ["Limpieza", freqLimpieza, setFreqLimpieza, ultimaLimpieza, setUltimaLimpieza],
              ["Reparación", freqReparacion, setFreqReparacion, ultimaReparacion, setUltimaReparacion],
              ["Pintura", freqPintura, setFreqPintura, ultimaPintura, setUltimaPintura],
            ] as const
          ).map(([titulo, freq, setFreq, ultima, setUltima]) => {
            const proxima = ultima ? addMonthsIso(ultima, freq) : null;
            return (
              <section key={titulo} className="rounded-xl border border-[#e6e3de] p-3">
                <p className="mb-2 text-sm font-semibold">{titulo}</p>
                <div className="grid grid-cols-2 gap-2">
                  <SelectFrecuencia label="Frecuencia" value={freq} onChange={setFreq} />
                  <CampoFechaBase
                    label="Última vez"
                    value={ultima}
                    max={hoy}
                    onChange={setUltima}
                  />
                </div>
                <p className={proxima ? "fd-hint mt-2" : "mt-2 text-xs font-medium text-[#c8102e]"}>
                  {proxima
                    ? `Próxima: ${formatDiaMesCorto(proxima)}`
                    : "Sin fecha: quedará pendiente"}
                </p>
              </section>
            );
          })}
        </div>
        <p className="fd-hint -mt-2 hidden md:block">
          Si no sabes o nunca se hizo, déjalo vacío: quedará como pendiente
        </p>

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

        <DialogFooter className="fd-form-actions gap-2 sm:justify-end">
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

function CampoFechaBase({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: string;
  onChange: (v: string) => void;
}) {
  return (
    <Campo label={label}>
      <Input
        type="date"
        className={CONTROL_H}
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
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
  accept,
  file,
  onFile,
}: {
  etiqueta: string;
  subtitulo: string;
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
          <FileText className="mx-auto size-6" strokeWidth={1.5} />
        </span>
        <span className="text-sm font-semibold">
          {file ? file.name : "Subir plano"}
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

const SIN_ARCHIVOS: File[] = [];

function FotosEstadoActual({
  fachadaId,
  actualUrl,
  onGuardar,
  archivos = SIN_ARCHIVOS,
  portada = 0,
  onArchivos,
  onPortada,
}: {
  fachadaId?: string;
  actualUrl?: string | null;
  onGuardar?: (file: File) => Promise<void>;
  archivos?: File[];
  portada?: number;
  onArchivos?: (files: File[]) => void;
  onPortada?: (index: number) => void;
}) {
  const [locales, setLocales] = useState<File[]>(archivos);
  const [indice, setIndice] = useState(portada);
  const [aviso, setAviso] = useState<string | null>(null);
  const cola = useColaSubida(async (file, onProgress) => {
    if (!onGuardar) return;
    onProgress(0.15);
    await onGuardar(file);
    onProgress(1);
  });
  const controlado = Boolean(onArchivos);
  const lista = controlado ? archivos : locales;
  const idx = controlado ? portada : indice;

  const previews = useMemo(
    () => lista.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [lista],
  );
  useEffect(() => {
    return () => {
      for (const p of previews) URL.revokeObjectURL(p.url);
    };
  }, [previews]);

  function agregar(files: File[]) {
    const ok: File[] = [];
    const avisos: string[] = [];
    for (const file of files) {
      const v = validarArchivoFachada(file);
      if (!v.ok) avisos.push(v.mensaje);
      else ok.push(file);
    }
    setAviso(avisos.length ? avisos.join(" ") : null);
    if (!ok.length) return;
    const siguiente = [...lista, ...ok];
    if (onArchivos) onArchivos(siguiente);
    else setLocales(siguiente);
    if (onGuardar && fachadaId) {
      const rechazos = cola.encolar(ok);
      if (rechazos.length) setAviso(rechazos.join(" "));
    }
  }

  return (
    <div className="space-y-2">
      <p className="fd-label">Fotos del estado actual</p>
      <BotonesCapturaGaleria etiquetaGaleria="De la galería" onFiles={agregar} />
      {actualUrl || previews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {actualUrl && previews.length === 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={actualUrl} alt="" className="h-20 w-full rounded-md object-cover" />
          ) : null}
          {previews.map((p, i) => (
            <button
              key={p.url}
              type="button"
              className="text-left"
              onClick={() => {
                if (!p.file.type.startsWith("image/")) return;
                if (onPortada) onPortada(i);
                else setIndice(i);
              }}
            >
              <MiniaturaMedia
                tipoArchivo={p.file.type.startsWith("video/") ? "video" : "foto"}
                src={p.file.type.startsWith("video/") ? null : p.url}
                videoUrl={p.url}
                alt=""
                className="h-20 w-full rounded-md"
              />
              {i === idx && p.file.type.startsWith("image/") ? (
                <span className="mt-1 block text-center text-[10px] font-semibold">★ Portada</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <ListaColaSubida items={cola.items} onReintentar={cola.reintentar} />
      <p className="fd-hint">Quedará como punto de partida.</p>
      {aviso ? <p className="text-sm text-destructive">{aviso}</p> : null}
    </div>
  );
}
