"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorProveedor } from "@/components/shared/SelectorProveedor";
import { HintMdeN } from "@/components/fachadas/HintMdeN";
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import {
  ESTADOS_LLUVIAS,
  ESTADO_TRABAJO_LABEL,
  EJECUTADO_POR_LABEL,
  formatMontoClp,
} from "@/lib/trabajos";
import type { EstadoFachada } from "@/lib/fachadas/estado";
import {
  debeAdvertirCambioEjecutor,
  detalleAIndicadores,
  formatM2Cl,
  indicadoresDeIntervencion,
  TIPOS_INTERVENCION_FACHADA,
  TIPO_INTERVENCION_FACHADA_LABEL,
  tiposSinCotizacion,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import {
  aplicarCambioIva,
  aplicarCambioNeto,
  brutoDesde,
  estadoIvaVacio,
  ivaDesdeNeto,
} from "@/lib/filtracion/materiales";
import {
  actualizarSnapshotIntervencion,
  borrarCotizacion,
  borrarHojalateria,
  borrarMaterial,
  guardarIntervencion,
  guardarKeyDocumento,
  insertarCotizacionVacia,
  insertarHojalateriaVacia,
  insertarMaterialVacio,
} from "@/lib/fachadas/guardar";
import {
  borrarFotoIntervencion,
  carpetaIntervencionDocs,
  subirFotoIntervencion,
} from "@/lib/fachadas/upload";
import { urlPublicaONull } from "@/lib/fachadas/url";
import { fachadaHref } from "@/lib/fachadas/rutas";
import type {
  CotizacionDetalle,
  HojalateriaDetalle,
  IntervencionDetalle,
  MaterialDetalle,
} from "@/lib/fachadas/tipos";
import type { ProveedorOption } from "@/lib/proveedores";

export function FormularioIntervencion({
  categoriaId,
  subtipoId,
  inicial,
  proveedores: proveedoresIniciales,
  puedeEditar,
}: {
  categoriaId: string;
  subtipoId: string;
  inicial: IntervencionDetalle;
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(inicial);
  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ejecutorGuardado, setEjecutorGuardado] = useState(inicial.ejecutadoPor);

  const indicadores = useMemo(
    () => indicadoresDeIntervencion(detalleAIndicadores(form)),
    [form],
  );
  const tiposFaltantes = useMemo(
    () => tiposSinCotizacion(detalleAIndicadores(form)),
    [form],
  );

  async function persistir() {
    if (form.tipos.some((t) => !Number.isFinite(t.dias) || t.dias <= 0)) {
      setError("Los días de cada tipo marcado deben ser mayores a 0 (se aceptan medios días).");
      return;
    }
    if (
      debeAdvertirCambioEjecutor(
        ejecutorGuardado,
        form.ejecutadoPor,
        form.cotizaciones.length,
      )
    ) {
      const ok = window.confirm(
        "Hay cotizaciones cargadas. Se ocultarán en la UI si el ejecutor no es proveedor externo, pero no se borrarán. ¿Guardar igual?",
      );
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      await guardarIntervencion({
        id: form.id,
        estado: form.estado,
        fechaInicio: form.fechaInicio,
        fechaTermino: form.fechaTermino,
        notas: form.notas,
        ejecutadoPor: form.ejecutadoPor,
        proveedorId: form.proveedorId,
        requiereHojalateria: form.requiereHojalateria,
        sinMateriales: form.sinMateriales,
        tipos: form.tipos,
        cotizaciones: form.cotizaciones.map((c) => ({
          id: c.id,
          proveedorId: c.proveedorId,
          numeroCotizacion: c.numeroCotizacion,
          valorNeto: c.valorNeto,
          valorIva: c.valorIva,
          tipos: c.tipos,
        })),
        hojalaterias: form.hojalaterias.map((h) => ({
          id: h.id,
          proveedorId: h.proveedorId,
          descripcion: h.descripcion,
          valorNeto: h.valorNeto,
          valorIva: h.valorIva,
        })),
        materiales: form.materiales.map((m) => ({
          id: m.id,
          fechaCompra: m.fechaCompra,
          proveedorId: m.proveedorId,
          numeroFactura: m.numeroFactura,
          material: m.material,
          valorNeto: m.valorNeto,
          valorIva: m.valorIva,
        })),
      });
      setEjecutorGuardado(form.ejecutadoPor);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link
            href={fachadaHref(categoriaId, subtipoId, form.fachadaId)}
            className="underline"
          >
            {form.fachadaNombre}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Intervención</h1>
      </div>

      <Seccion titulo="1. General">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Estado">
            <Select
              value={form.estado || "__vacio__"}
              disabled={!puedeEditar}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  estado: v === "__vacio__" ? "" : (v as EstadoFachada),
                }))
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__vacio__">{ESTADO_TRABAJO_LABEL[""]}</SelectItem>
                {ESTADOS_LLUVIAS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_TRABAJO_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Fecha inicio">
            <Input
              type="date"
              disabled={!puedeEditar}
              value={form.fechaInicio ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, fechaInicio: e.target.value || null }))
              }
            />
          </Campo>
          <Campo label="Fecha término">
            <Input
              type="date"
              disabled={!puedeEditar}
              value={form.fechaTermino ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, fechaTermino: e.target.value || null }))
              }
            />
          </Campo>
        </div>
        <Campo label="Notas">
          <Textarea
            disabled={!puedeEditar}
            value={form.notas ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            rows={3}
          />
        </Campo>
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          Snapshot: {formatM2Cl(form.altoMSnapshot)} × {formatM2Cl(form.anchoMSnapshot)} m
          = {formatM2Cl(form.superficieM2Snapshot)} m²
        </div>
        {puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              if (
                !window.confirm(
                  "Esto reemplaza el snapshot de medidas por las medidas actuales de la fachada. ¿Continuar?",
                )
              ) {
                return;
              }
              try {
                const snap = await actualizarSnapshotIntervencion(
                  form.id,
                  form.fachadaId,
                );
                setForm((f) => ({ ...f, ...snap }));
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo actualizar");
              }
            }}
          >
            Actualizar medidas desde la fachada
          </Button>
        ) : null}
      </Seccion>

      <Seccion titulo="2. Trabajos">
        {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
          const actual = form.tipos.find((t) => t.tipo === tipo);
          return (
            <div key={tipo} className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={!puedeEditar}
                  checked={Boolean(actual)}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      tipos: e.target.checked
                        ? [...f.tipos, { tipo, dias: 1 }]
                        : f.tipos.filter((t) => t.tipo !== tipo),
                    }));
                  }}
                />
                {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
              </label>
              {actual ? (
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  className="h-9 w-24"
                  disabled={!puedeEditar}
                  value={actual.dias}
                  onChange={(e) => {
                    const dias = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      tipos: f.tipos.map((t) =>
                        t.tipo === tipo ? { ...t, dias } : t,
                      ),
                    }));
                  }}
                />
              ) : null}
              {actual ? <span className="text-xs text-muted-foreground">días</span> : null}
            </div>
          );
        })}
      </Seccion>

      <Seccion titulo="3. Fotos">
        <GrupoFotos
          titulo="Antes"
          tipo="antes"
          form={form}
          puedeEditar={puedeEditar}
          onError={setError}
          onAdd={(item) =>
            setForm((f) => ({ ...f, media: [...f.media, item] }))
          }
          onRemove={(id) =>
            setForm((f) => ({
              ...f,
              media: f.media.filter((m) => m.id !== id),
            }))
          }
        />
        <GrupoFotos
          titulo="Después (trabajo terminado)"
          tipo="despues"
          form={form}
          puedeEditar={puedeEditar}
          onError={setError}
          onAdd={(item) =>
            setForm((f) => ({ ...f, media: [...f.media, item] }))
          }
          onRemove={(id) =>
            setForm((f) => ({
              ...f,
              media: f.media.filter((m) => m.id !== id),
            }))
          }
        />
      </Seccion>

      <Seccion titulo="4. Ejecutado por">
        <Select
          value={form.ejecutadoPor ?? "__vacio__"}
          disabled={!puedeEditar}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              ejecutadoPor:
                v === "maestros_bodetek" || v === "proveedor_externo" ? v : null,
            }))
          }
        >
          <SelectTrigger className="h-10 w-full sm:max-w-sm">
            <SelectValue placeholder="Sin definir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__vacio__">Sin definir</SelectItem>
            <SelectItem value="maestros_bodetek">
              {EJECUTADO_POR_LABEL.maestros_bodetek}
            </SelectItem>
            <SelectItem value="proveedor_externo">
              {EJECUTADO_POR_LABEL.proveedor_externo}
            </SelectItem>
          </SelectContent>
        </Select>

        {form.ejecutadoPor === "proveedor_externo" ? (
          <div className="space-y-3">
            <Campo label="Proveedor">
              <SelectorProveedor
                value={form.proveedorId}
                onChange={(id) => setForm((f) => ({ ...f, proveedorId: id }))}
                proveedores={proveedores}
                onProveedoresChange={setProveedores}
                disabled={!puedeEditar}
              />
            </Campo>
            {tiposFaltantes.length > 0 ? (
              <p className="text-sm text-amber-700">
                Tipos sin cotización:{" "}
                {tiposFaltantes.map((t) => TIPO_INTERVENCION_FACHADA_LABEL[t]).join(", ")}
              </p>
            ) : null}
            {form.cotizaciones.map((c, idx) => (
              <CotizacionCard
                key={c.id}
                c={c}
                idx={idx}
                fachadaId={form.fachadaId}
                intervencionId={form.id}
                puedeEditar={puedeEditar}
                onChange={(next) =>
                  setForm((f) => ({
                    ...f,
                    cotizaciones: f.cotizaciones.map((x) =>
                      x.id === c.id ? next : x,
                    ),
                  }))
                }
                onDelete={async () => {
                  await borrarCotizacion(c.id);
                  setForm((f) => ({
                    ...f,
                    cotizaciones: f.cotizaciones.filter((x) => x.id !== c.id),
                  }));
                }}
              />
            ))}
            {puedeEditar ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const id = await insertarCotizacionVacia(form.id);
                  setForm((f) => ({
                    ...f,
                    cotizaciones: [...f.cotizaciones, vaciaCotizacion(id)],
                  }));
                }}
              >
                + Cotización
              </Button>
            ) : null}
          </div>
        ) : null}
      </Seccion>

      <Seccion titulo="5. Hojalatería">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!puedeEditar}
            checked={form.requiereHojalateria}
            onChange={(e) =>
              setForm((f) => ({ ...f, requiereHojalateria: e.target.checked }))
            }
          />
          Requiere hojalatería
        </label>
        {form.requiereHojalateria
          ? form.hojalaterias.map((h) => (
              <HojalateriaCard
                key={h.id}
                h={h}
                fachadaId={form.fachadaId}
                intervencionId={form.id}
                puedeEditar={puedeEditar}
                proveedores={proveedores}
                setProveedores={setProveedores}
                onChange={(next) =>
                  setForm((f) => ({
                    ...f,
                    hojalaterias: f.hojalaterias.map((x) =>
                      x.id === h.id ? next : x,
                    ),
                  }))
                }
                onDelete={async () => {
                  await borrarHojalateria(h.id);
                  setForm((f) => ({
                    ...f,
                    hojalaterias: f.hojalaterias.filter((x) => x.id !== h.id),
                  }));
                }}
              />
            ))
          : null}
        {form.requiereHojalateria && puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const id = await insertarHojalateriaVacia(form.id);
              setForm((f) => ({
                ...f,
                hojalaterias: [...f.hojalaterias, vaciaHojalateria(id)],
              }));
            }}
          >
            + Hojalatería
          </Button>
        ) : null}
      </Seccion>

      <Seccion titulo="6. Materiales">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            disabled={!puedeEditar || form.materiales.length > 0}
            checked={form.sinMateriales}
            onChange={(e) =>
              setForm((f) => ({ ...f, sinMateriales: e.target.checked }))
            }
          />
          Esta intervención no usó materiales
        </label>
        {form.materiales.map((m) => (
          <MaterialCard
            key={m.id}
            m={m}
            fachadaId={form.fachadaId}
            intervencionId={form.id}
            puedeEditar={puedeEditar}
            proveedores={proveedores}
            setProveedores={setProveedores}
            onChange={(next) =>
              setForm((f) => ({
                ...f,
                materiales: f.materiales.map((x) => (x.id === m.id ? next : x)),
              }))
            }
            onDelete={async () => {
              await borrarMaterial(m.id);
              setForm((f) => ({
                ...f,
                materiales: f.materiales.filter((x) => x.id !== m.id),
              }));
            }}
          />
        ))}
        {puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const id = await insertarMaterialVacio(form.id);
              setForm((f) => ({
                ...f,
                sinMateriales: false,
                materiales: [...f.materiales, vacioMaterial(id)],
              }));
            }}
          >
            + Material
          </Button>
        ) : null}
      </Seccion>

      <Seccion titulo="7. Indicadores de la intervención">
        <p className="text-lg font-semibold">
          {formatMontoClp(indicadores.costoTotalBruto)}
        </p>
        <ul className="text-sm text-muted-foreground">
          {indicadores.desglose.map((d) => (
            <li key={d.key}>
              {d.label}: {formatMontoClp(d.bruto)}
              {d.pct != null ? ` (${d.pct}%)` : ""}
            </li>
          ))}
        </ul>
        <p className="text-sm">
          Costo/m²:{" "}
          {indicadores.costoPorM2 == null
            ? "—"
            : formatMontoClp(Math.round(indicadores.costoPorM2))}
        </p>
        <p className="text-sm">
          Días: {indicadores.diasTotal}
          {TIPOS_INTERVENCION_FACHADA.map(
            (t) => ` · ${TIPO_INTERVENCION_FACHADA_LABEL[t]} ${indicadores.dias[t]}`,
          )}
        </p>
        <p className="text-sm">
          Días/m²: {indicadores.diasPorM2 ?? "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          Duración calendario:{" "}
          {indicadores.duracionCalendario == null
            ? "—"
            : `${indicadores.duracionCalendario} días`}{" "}
          (informativa)
        </p>
        <HintMdeN
          m={indicadores.completaDias ? 1 : 0}
          n={1}
          etiqueta="Completa para días"
        />
        <HintMdeN
          m={indicadores.completaCostos ? 1 : 0}
          n={1}
          etiqueta="Completa para costos"
        />
        <HintMdeN
          m={indicadores.facturas.m}
          n={indicadores.facturas.n}
          etiqueta="Documentación (cotizaciones con factura)"
        />
      </Seccion>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {puedeEditar ? (
        <Button type="button" disabled={busy} onClick={() => void persistir()}>
          {busy ? "Guardando…" : "Guardar intervención"}
        </Button>
      ) : null}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-base font-medium">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function GrupoFotos({
  titulo,
  tipo,
  form,
  puedeEditar,
  onError,
  onAdd,
  onRemove,
}: {
  titulo: string;
  tipo: "antes" | "despues";
  form: IntervencionDetalle;
  puedeEditar: boolean;
  onError: (m: string | null) => void;
  onAdd: (item: IntervencionDetalle["media"][number]) => void;
  onRemove: (id: string) => void;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const items = form.media.filter((m) => m.tipo === tipo);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    onError(null);
    try {
      for (const file of Array.from(files)) {
        const item = await subirFotoIntervencion({
          file,
          fachadaId: form.fachadaId,
          intervencionId: form.id,
          tipo,
        });
        onAdd(item);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      if (camRef.current) camRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{titulo}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="relative">
            {m.tipoArchivo === "foto" && (m.thumbnailUrl || m.publicUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.thumbnailUrl || m.publicUrl || ""}
                alt=""
                className="h-24 w-full rounded-md object-cover"
              />
            ) : (
              <p className="truncate text-xs">{m.nombreArchivo}</p>
            )}
            {puedeEditar ? (
              <button
                type="button"
                className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
                onClick={async () => {
                  await borrarFotoIntervencion(m.id);
                  onRemove(m.id);
                }}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {puedeEditar ? (
        <div className="flex flex-wrap gap-2">
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => camRef.current?.click()}>
            Cámara
          </Button>
          <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
            Galería
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MoneyInputs({
  neto,
  iva,
  disabled,
  onNeto,
  onIva,
}: {
  neto: number;
  iva: number;
  disabled: boolean;
  onNeto: (n: number, iva: number) => void;
  onIva: (iva: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Campo label="Neto">
        <Input
          type="number"
          min={0}
          disabled={disabled}
          value={neto}
          onChange={(e) => {
            const n = Number(e.target.value || 0);
            const next = aplicarCambioNeto(estadoIvaVacio(), n);
            onNeto(n, next.iva ?? ivaDesdeNeto(n));
          }}
        />
      </Campo>
      <Campo label="IVA">
        <Input
          type="number"
          min={0}
          disabled={disabled}
          value={iva}
          onChange={(e) => {
            const v = Number(e.target.value || 0);
            aplicarCambioIva({ neto, iva, ivaManual: true }, v);
            onIva(v);
          }}
        />
      </Campo>
      <Campo label="Bruto">
        <Input disabled value={brutoDesde(neto, iva)} />
      </Campo>
    </div>
  );
}

function TiposCheck({
  value,
  disabled,
  onChange,
}: {
  value: TipoIntervencionFachada[];
  disabled: boolean;
  onChange: (next: TipoIntervencionFachada[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {TIPOS_INTERVENCION_FACHADA.map((t) => (
        <label key={t} className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            disabled={disabled}
            checked={value.includes(t)}
            onChange={(e) =>
              onChange(
                e.target.checked ? [...value, t] : value.filter((x) => x !== t),
              )
            }
          />
          {TIPO_INTERVENCION_FACHADA_LABEL[t]}
        </label>
      ))}
    </div>
  );
}

function CotizacionCard({
  c,
  idx,
  fachadaId,
  intervencionId,
  puedeEditar,
  onChange,
  onDelete,
}: {
  c: CotizacionDetalle;
  idx: number;
  fachadaId: string;
  intervencionId: string;
  puedeEditar: boolean;
  onChange: (c: CotizacionDetalle) => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Cotización {idx + 1}</p>
        {puedeEditar ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete()}>
            Quitar
          </Button>
        ) : null}
      </div>
      <Campo label="N° cotización">
        <Input
          disabled={!puedeEditar}
          value={c.numeroCotizacion ?? ""}
          onChange={(e) => onChange({ ...c, numeroCotizacion: e.target.value })}
        />
      </Campo>
      <TiposCheck
        value={c.tipos}
        disabled={!puedeEditar}
        onChange={(tipos) => onChange({ ...c, tipos })}
      />
      <MoneyInputs
        neto={c.valorNeto}
        iva={c.valorIva}
        disabled={!puedeEditar}
        onNeto={(neto, iva) =>
          onChange({ ...c, valorNeto: neto, valorIva: iva, valorBruto: brutoDesde(neto, iva) })
        }
        onIva={(iva) =>
          onChange({ ...c, valorIva: iva, valorBruto: brutoDesde(c.valorNeto, iva) })
        }
      />
      <DocPair
        fachadaId={fachadaId}
        intervencionId={intervencionId}
        tabla="fachada_cotizaciones"
        id={c.id}
        puedeEditar={puedeEditar}
        cotizacion={{ key: c.cotizacionKey, nombre: c.cotizacionNombre, url: c.cotizacionUrl }}
        factura={{ key: c.facturaKey, nombre: c.facturaNombre, url: c.facturaUrl }}
        onCotizacion={(key, nombre, url) =>
          onChange({
            ...c,
            cotizacionKey: key,
            cotizacionNombre: nombre,
            cotizacionUrl: url,
          })
        }
        onFactura={(key, nombre, url) =>
          onChange({
            ...c,
            facturaKey: key,
            facturaNombre: nombre,
            facturaUrl: url,
          })
        }
      />
    </div>
  );
}

function HojalateriaCard({
  h,
  fachadaId,
  intervencionId,
  puedeEditar,
  proveedores,
  setProveedores,
  onChange,
  onDelete,
}: {
  h: HojalateriaDetalle;
  fachadaId: string;
  intervencionId: string;
  puedeEditar: boolean;
  proveedores: ProveedorOption[];
  setProveedores: (p: ProveedorOption[]) => void;
  onChange: (h: HojalateriaDetalle) => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex justify-end">
        {puedeEditar ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete()}>
            Quitar
          </Button>
        ) : null}
      </div>
      <Campo label="Proveedor">
        <SelectorProveedor
          value={h.proveedorId}
          onChange={(id) => onChange({ ...h, proveedorId: id })}
          proveedores={proveedores}
          onProveedoresChange={setProveedores}
          disabled={!puedeEditar}
          rubroPreferido="hojalateria"
        />
      </Campo>
      <Campo label="Descripción">
        <Input
          disabled={!puedeEditar}
          value={h.descripcion ?? ""}
          onChange={(e) => onChange({ ...h, descripcion: e.target.value })}
        />
      </Campo>
      <MoneyInputs
        neto={h.valorNeto}
        iva={h.valorIva}
        disabled={!puedeEditar}
        onNeto={(neto, iva) =>
          onChange({ ...h, valorNeto: neto, valorIva: iva, valorBruto: brutoDesde(neto, iva) })
        }
        onIva={(iva) =>
          onChange({ ...h, valorIva: iva, valorBruto: brutoDesde(h.valorNeto, iva) })
        }
      />
      <DocPair
        fachadaId={fachadaId}
        intervencionId={intervencionId}
        tabla="fachada_hojalateria"
        id={h.id}
        puedeEditar={puedeEditar}
        cotizacion={{ key: h.cotizacionKey, nombre: h.cotizacionNombre, url: h.cotizacionUrl }}
        factura={{ key: h.facturaKey, nombre: h.facturaNombre, url: h.facturaUrl }}
        onCotizacion={(key, nombre, url) =>
          onChange({
            ...h,
            cotizacionKey: key,
            cotizacionNombre: nombre,
            cotizacionUrl: url,
          })
        }
        onFactura={(key, nombre, url) =>
          onChange({
            ...h,
            facturaKey: key,
            facturaNombre: nombre,
            facturaUrl: url,
          })
        }
      />
    </div>
  );
}

function MaterialCard({
  m,
  fachadaId,
  intervencionId,
  puedeEditar,
  proveedores,
  setProveedores,
  onChange,
  onDelete,
}: {
  m: MaterialDetalle;
  fachadaId: string;
  intervencionId: string;
  puedeEditar: boolean;
  proveedores: ProveedorOption[];
  setProveedores: (p: ProveedorOption[]) => void;
  onChange: (m: MaterialDetalle) => void;
  onDelete: () => Promise<void>;
}) {
  const carpeta = carpetaIntervencionDocs(fachadaId, intervencionId);
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex justify-end">
        {puedeEditar ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete()}>
            Quitar
          </Button>
        ) : null}
      </div>
      <Campo label="Material">
        <Input
          disabled={!puedeEditar}
          value={m.material}
          onChange={(e) => onChange({ ...m, material: e.target.value })}
        />
      </Campo>
      <Campo label="Fecha">
        <Input
          type="date"
          disabled={!puedeEditar}
          value={m.fechaCompra ?? ""}
          onChange={(e) => onChange({ ...m, fechaCompra: e.target.value || null })}
        />
      </Campo>
      <Campo label="Proveedor">
        <SelectorProveedor
          value={m.proveedorId}
          onChange={(id) => onChange({ ...m, proveedorId: id })}
          proveedores={proveedores}
          onProveedoresChange={setProveedores}
          disabled={!puedeEditar}
          rubroPreferido="materiales"
        />
      </Campo>
      <Campo label="N° factura">
        <Input
          disabled={!puedeEditar}
          value={m.numeroFactura ?? ""}
          onChange={(e) => onChange({ ...m, numeroFactura: e.target.value })}
        />
      </Campo>
      <MoneyInputs
        neto={m.valorNeto}
        iva={m.valorIva}
        disabled={!puedeEditar}
        onNeto={(neto, iva) =>
          onChange({ ...m, valorNeto: neto, valorIva: iva, valorBruto: brutoDesde(neto, iva) })
        }
        onIva={(iva) =>
          onChange({ ...m, valorIva: iva, valorBruto: brutoDesde(m.valorNeto, iva) })
        }
      />
      <UploaderArchivoSimple
        etiqueta="Factura PDF"
        carpeta={carpeta}
        accept="application/pdf,.pdf"
        actualUrl={m.facturaUrl}
        actualNombre={m.facturaNombre}
        actualKey={m.facturaKey}
        puedeEditar={puedeEditar}
        onUploaded={async (key, nombre) => {
          await guardarKeyDocumento("fachada_materiales", m.id, "factura", key, nombre);
          onChange({
            ...m,
            facturaKey: key,
            facturaNombre: nombre,
            facturaUrl: urlPublicaONull(key),
          });
        }}
        onCleared={async () => {
          await guardarKeyDocumento("fachada_materiales", m.id, "factura", null, null);
          onChange({
            ...m,
            facturaKey: null,
            facturaNombre: null,
            facturaUrl: null,
          });
        }}
      />
    </div>
  );
}

function DocPair({
  fachadaId,
  intervencionId,
  tabla,
  id,
  puedeEditar,
  cotizacion,
  factura,
  onCotizacion,
  onFactura,
}: {
  fachadaId: string;
  intervencionId: string;
  tabla: "fachada_cotizaciones" | "fachada_hojalateria";
  id: string;
  puedeEditar: boolean;
  cotizacion: { key: string | null; nombre: string | null; url: string | null };
  factura: { key: string | null; nombre: string | null; url: string | null };
  onCotizacion: (key: string | null, nombre: string | null, url: string | null) => void;
  onFactura: (key: string | null, nombre: string | null, url: string | null) => void;
}) {
  const carpeta = carpetaIntervencionDocs(fachadaId, intervencionId);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <UploaderArchivoSimple
        etiqueta="PDF cotización"
        carpeta={carpeta}
        accept="application/pdf,.pdf"
        actualUrl={cotizacion.url}
        actualNombre={cotizacion.nombre}
        actualKey={cotizacion.key}
        puedeEditar={puedeEditar}
        onUploaded={async (key, nombre) => {
          await guardarKeyDocumento(tabla, id, "cotizacion", key, nombre);
          onCotizacion(key, nombre, urlPublicaONull(key));
        }}
        onCleared={async () => {
          await guardarKeyDocumento(tabla, id, "cotizacion", null, null);
          onCotizacion(null, null, null);
        }}
      />
      <UploaderArchivoSimple
        etiqueta="PDF factura"
        carpeta={carpeta}
        accept="application/pdf,.pdf"
        actualUrl={factura.url}
        actualNombre={factura.nombre}
        actualKey={factura.key}
        puedeEditar={puedeEditar}
        onUploaded={async (key, nombre) => {
          await guardarKeyDocumento(tabla, id, "factura", key, nombre);
          onFactura(key, nombre, urlPublicaONull(key));
        }}
        onCleared={async () => {
          await guardarKeyDocumento(tabla, id, "factura", null, null);
          onFactura(null, null, null);
        }}
      />
    </div>
  );
}

function vaciaCotizacion(id: string): CotizacionDetalle {
  return {
    id,
    proveedorId: null,
    numeroCotizacion: null,
    valorNeto: 0,
    valorIva: 0,
    valorBruto: 0,
    cotizacionKey: null,
    cotizacionNombre: null,
    cotizacionUrl: null,
    facturaKey: null,
    facturaNombre: null,
    facturaUrl: null,
    tipos: [],
  };
}

function vaciaHojalateria(id: string): HojalateriaDetalle {
  return {
    id,
    proveedorId: null,
    descripcion: null,
    valorNeto: 0,
    valorIva: 0,
    valorBruto: 0,
    cotizacionKey: null,
    cotizacionNombre: null,
    cotizacionUrl: null,
    facturaKey: null,
    facturaNombre: null,
    facturaUrl: null,
  };
}

function vacioMaterial(id: string): MaterialDetalle {
  return {
    id,
    fechaCompra: null,
    proveedorId: null,
    numeroFactura: null,
    material: "",
    valorNeto: 0,
    valorIva: 0,
    valorBruto: 0,
    facturaKey: null,
    facturaNombre: null,
    facturaUrl: null,
  };
}

