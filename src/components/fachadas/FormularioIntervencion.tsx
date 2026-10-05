"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon } from "lucide-react";
import {
  BotonesCapturaGaleria,
  ListaColaSubida,
  MiniaturaMedia,
  ZonaSoltarArchivos,
  useColaSubida,
} from "@/components/fachadas/ZonaFotos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectorProveedor } from "@/components/shared/SelectorProveedor";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import {
  Campo,
  CONTROL_H,
  InputDecimalCl,
  InputMontoNeto,
} from "@/components/fachadas/CamposFormulario";
import { formatMontoClp } from "@/lib/trabajos";
import {
  costoNetoIntervencion,
  detalleAIndicadores,
  ESTADO_COTIZACION_DOC_LABEL,
  ESTADO_FACTURA_DOC_LABEL,
  ESTADOS_COTIZACION_DOC,
  ESTADOS_FACTURA_DOC,
  TIPOS_FACTURA_BOLETA,
  TIPOS_INTERVENCION_FACHADA,
  TIPO_INTERVENCION_FACHADA_DESCRIPCION,
  TIPO_INTERVENCION_FACHADA_LABEL,
  TIPO_MATERIAL_FACHADA_LABEL,
  TIPOS_MATERIAL_FACHADA,
  type CategoriaDocumentoFachada,
  type TipoDocumentoFachada,
  type TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import { COLOR_TIPO } from "@/lib/fachadas/ui";
import "./fachadas.css";
import {
  borrarDocumento,
  borrarMaterial,
  guardarArchivoDocumento,
  guardarIntervencion,
  insertarDocumento,
  insertarHojalateriaVacia,
  insertarMaterialVacio,
  marcarPortadaMedia,
} from "@/lib/fachadas/guardar";
import {
  borrarFotoIntervencion,
  carpetaIntervencionDocs,
  subirArchivoFachada,
  materializarArchivoLocal,
  subirFotoIntervencion,
} from "@/lib/fachadas/upload";
import { fachadaHref } from "@/lib/fachadas/rutas";
import { urlPublicaONull } from "@/lib/fachadas/url";
import { cn } from "@/lib/utils";
import type {
  DocumentoFachada,
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
  modoDemo = false,
  variant = "page",
  titulo,
  onCancelar,
}: {
  categoriaId: string;
  subtipoId: string;
  inicial: IntervencionDetalle;
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
  modoDemo?: boolean;
  variant?: "page" | "modal";
  titulo?: string;
  onCancelar?: () => void;
}) {
  const router = useRouter();
  const volver = fachadaHref(categoriaId, subtipoId, inicial.fachadaId);
  const [form, setForm] = useState(inicial);
  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const costo = useMemo(
    () =>
      costoNetoIntervencion(
        detalleAIndicadores({
          id: form.id,
          fachadaId: form.fachadaId,
          proveedorId: form.proveedorId,
          ejecutadoPor: form.ejecutadoPor,
          requiereHojalateria: form.requiereHojalateria,
          sinMateriales: form.sinMateriales,
          fechaInicio: form.fechaInicio,
          fechaTermino: form.fechaTermino,
          altoMSnapshot: form.altoMSnapshot,
          anchoMSnapshot: form.anchoMSnapshot,
          superficieM2Snapshot: form.superficieM2Snapshot,
          tipos: form.tipos,
          cotizaciones: [],
          hojalaterias: [],
          materiales: form.materiales,
          documentos: form.documentos.map((d) => ({
            tipoDocumento: d.tipoDocumento,
            categoria: d.categoria,
            valorNeto: d.valorNeto,
            estado: d.estado,
          })),
          estado: form.estado,
        }),
      ),
    [form],
  );

  const docs = (categoria: CategoriaDocumentoFachada, tipo: TipoDocumentoFachada) =>
    form.documentos.filter(
      (d) => d.categoria === categoria && d.tipoDocumento === tipo,
    );
  const docsFactura = (categoria: CategoriaDocumentoFachada) =>
    form.documentos.filter(
      (d) =>
        d.categoria === categoria &&
        (d.tipoDocumento === "factura" || d.tipoDocumento === "boleta"),
    );

  async function agregarDoc(
    tipoDocumento: TipoDocumentoFachada,
    categoria: CategoriaDocumentoFachada,
  ) {
    const id = modoDemo
      ? `demo-doc-${Date.now()}`
      : await insertarDocumento({
          intervencionId: form.id,
          tipoDocumento,
          categoria,
        });
    setForm((f) => ({
      ...f,
      documentos: [...f.documentos, vacioDocumento(id, tipoDocumento, categoria)],
    }));
  }

  async function persistir() {
    if (form.tipos.some((t) => !Number.isFinite(t.dias) || t.dias <= 0)) {
      setError("Los días de cada trabajo marcado deben ser mayores a 0 (se aceptan decimales).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (modoDemo) {
        onCancelar?.();
        return;
      }
      const hoja = form.hojalaterias[0] ?? null;
      await guardarIntervencion({
        id: form.id,
        estado: form.estado,
        fechaInicio: form.fechaInicio,
        fechaTermino: form.fechaTermino,
        notas: form.notas,
        ejecutadoPor: form.ejecutadoPor,
        proveedorId: form.proveedorId,
        maestrosAsignados: form.maestrosAsignados,
        requiereHojalateria: form.requiereHojalateria,
        sinMateriales: form.materiales.length === 0,
        tipos: form.tipos,
        documentos: form.documentos.map((d) => ({
          id: d.id,
          proveedorId: d.proveedorId,
          numero: d.numero,
          fecha: d.fecha,
          valorNeto: d.valorNeto,
          estado: d.estado,
          tipoDocumento: d.tipoDocumento,
        })),
        hojalateria: form.requiereHojalateria
          ? {
              id: hoja?.id ?? null,
              proveedorId: hoja?.proveedorId ?? null,
              descripcion: hoja?.descripcion ?? null,
            }
          : null,
        materiales: form.materiales.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          material: m.material,
          valorNeto: m.valorNeto,
        })),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const totalMateriales = form.materiales.reduce((acc, m) => acc + (m.valorNeto || 0), 0);
  const tituloMostrado =
    titulo ?? (inicial.fechaInicio ? "Editar intervención" : "Nueva intervención");

  const cuerpo = (
      <div className="fd-form-sheet relative mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm">
      {variant === "modal" ? (
        <button
          type="button"
          className="absolute right-4 top-4 text-muted-foreground"
          aria-label="Cerrar"
          onClick={() => (onCancelar ? onCancelar() : router.push(volver))}
        >
          ×
        </button>
      ) : null}
      <div className="mb-5">
        <p className="fd-hint">
          {form.fachadaNombre}
          {" · "}
          <EtiquetaM2 m2={form.superficieM2Snapshot} />
          <span> · Todos los montos en valor neto</span>
        </p>
        <h1 className="fd-title mt-1 text-[1.65rem]">
          {tituloMostrado}
        </h1>
      </div>

      <Seccion titulo="¿Qué trabajos se hicieron y cuánto tardó cada uno?">
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
            const actual = form.tipos.find((t) => t.tipo === tipo);
            const on = Boolean(actual);
            return (
              <div
                key={tipo}
                className={cn(
                  "rounded-xl border p-3",
                  on ? COLOR_TIPO[tipo].cardOn : "border-border bg-white",
                )}
              >
                <label className="flex min-h-10 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[#e30613]"
                    disabled={!puedeEditar}
                    checked={on}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        tipos: e.target.checked
                          ? [...f.tipos, { tipo, dias: 1 }]
                          : f.tipos.filter((t) => t.tipo !== tipo),
                      }));
                    }}
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {TIPO_INTERVENCION_FACHADA_DESCRIPCION[tipo]}
                    </span>
                  </span>
                </label>
                {actual ? (
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                      Días
                    </p>
                    <InputDecimalCl
                      disabled={!puedeEditar}
                      min={0.1}
                      value={actual.dias}
                      onChange={(n) => {
                        const dias = n ?? 0;
                        setForm((f) => ({
                          ...f,
                          tipos: f.tipos.map((t) =>
                            t.tipo === tipo ? { ...t, dias } : t,
                          ),
                        }));
                      }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="fd-hint">
          Días hábiles de trabajo efectivo. Se aceptan medios días (ej: 3,5).
        </p>
      </Seccion>

      <Seccion titulo="¿Quién lo ejecutó?">
        <div className="fd-exec">
          {(
            [
              ["maestros_bodetek", "Maestros Bodetek"],
              ["proveedor_externo", "Proveedor externo"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={form.ejecutadoPor === value}
              disabled={!puedeEditar}
              onClick={() =>
                setForm((f) => ({ ...f, ejecutadoPor: value }))
              }
            >
              {label}
            </button>
          ))}
        </div>
        {form.ejecutadoPor === "proveedor_externo" ? (
          <Campo label="Proveedor">
            <SelectorProveedor
              value={form.proveedorId}
              onChange={(id) => setForm((f) => ({ ...f, proveedorId: id }))}
              proveedores={proveedores}
              onProveedoresChange={setProveedores}
              disabled={!puedeEditar}
              className={cn(CONTROL_H, "w-full")}
            />
          </Campo>
        ) : null}
      </Seccion>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Inicio">
          <Input
            type="date"
            className={CONTROL_H}
            disabled={!puedeEditar}
            value={form.fechaInicio ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, fechaInicio: e.target.value || null }))
            }
          />
        </Campo>
        <Campo label="Término">
          <Input
            type="date"
            className={CONTROL_H}
            disabled={!puedeEditar}
            value={form.fechaTermino ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, fechaTermino: e.target.value || null }))
            }
          />
        </Campo>
      </div>

      <Seccion
        titulo="Mano de obra"
        extra={<span className="fd-hint uppercase tracking-wide">Valor neto</span>}
      >
        <ParDocumentos
          categoria="mano_de_obra"
          labels={{
            cotiz: "Cotización",
            cotizHint: "PDF o imagen · puedes subir varias",
            fact: "Factura",
            factHint: "PDF o imagen",
            netoCotiz: "Valor neto cotizado",
            netoFact: "Valor neto facturado",
          }}
          form={form}
          setForm={setForm}
          puedeEditar={puedeEditar}
          proveedores={proveedores}
          setProveedores={setProveedores}
          hideCards={variant === "modal"}
        />
      </Seccion>

      <Seccion
        titulo="Materiales comprados"
        extra={<span className="fd-hint uppercase tracking-wide">Valor neto</span>}
      >
        {form.materiales.map((m) => (
          <div key={m.id} className="grid grid-cols-[7.5rem_1fr_7.5rem_auto] items-end gap-2">
            <Select
              value={m.tipo}
              disabled={!puedeEditar}
              onValueChange={(v) => {
                if (!v) return;
                setForm((f) => ({
                  ...f,
                  materiales: f.materiales.map((x) =>
                    x.id === m.id ? { ...x, tipo: v as TipoMaterialFachada } : x,
                  ),
                }));
              }}
            >
              <SelectTrigger className={cn(CONTROL_H, "w-full")}>
                <span className="flex-1 truncate text-left">
                  {TIPO_MATERIAL_FACHADA_LABEL[m.tipo] ?? m.tipo}
                </span>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MATERIAL_FACHADA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_MATERIAL_FACHADA_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className={CONTROL_H}
              disabled={!puedeEditar}
              placeholder="Detalle"
              value={m.material}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  materiales: f.materiales.map((x) =>
                    x.id === m.id ? { ...x, material: e.target.value } : x,
                  ),
                }))
              }
            />
            <InputMontoNeto
              disabled={!puedeEditar}
              value={m.valorNeto}
              onChange={(n) =>
                setForm((f) => ({
                  ...f,
                  materiales: f.materiales.map((x) =>
                    x.id === m.id ? { ...x, valorNeto: n } : x,
                  ),
                }))
              }
            />
            {puedeEditar ? (
              <button
                type="button"
                className="h-10 px-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  if (!modoDemo) await borrarMaterial(m.id);
                  setForm((f) => ({
                    ...f,
                    materiales: f.materiales.filter((x) => x.id !== m.id),
                  }));
                }}
              >
                Quitar
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
        {puedeEditar ? (
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="text-sm font-semibold text-[#e30613] hover:underline"
              onClick={async () => {
                const id = modoDemo
                  ? `demo-mat-${Date.now()}`
                  : await insertarMaterialVacio(form.id);
                setForm((f) => ({
                  ...f,
                  sinMateriales: false,
                  materiales: [...f.materiales, vacioMaterial(id)],
                }));
              }}
            >
              + Agregar material
            </button>
            <button
              type="button"
              className="text-sm font-medium text-muted-foreground hover:underline"
              onClick={() => void agregarDoc("factura", "materiales")}
            >
              Adjuntar factura / boleta
            </button>
          </div>
        ) : null}
        {variant === "modal"
          ? null
          : docsFactura("materiales").map((d) => (
          <DocumentoCard
            key={d.id}
            d={d}
            compact
            fachadaId={form.fachadaId}
            intervencionId={form.id}
            puedeEditar={puedeEditar}
            proveedores={proveedores}
            setProveedores={setProveedores}
            onChange={(next) =>
              setForm((f) => ({
                ...f,
                documentos: f.documentos.map((x) => (x.id === d.id ? next : x)),
              }))
            }
            onDelete={async () => {
              if (!modoDemo) await borrarDocumento(d.id);
              setForm((f) => ({
                ...f,
                documentos: f.documentos.filter((x) => x.id !== d.id),
              }));
            }}
          />
        ))}
        <p className="text-right text-sm font-semibold">
          Total materiales {formatMontoClp(totalMateriales)}
        </p>
      </Seccion>

      <Seccion titulo="¿Hubo hojalatería?">
        <div className="flex items-center justify-end">
          <div className="fd-exec w-36">
            {(
              [
                ["no", "No"],
                ["si", "Sí"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={
                  value === "si"
                    ? form.requiereHojalateria
                    : !form.requiereHojalateria
                }
                disabled={!puedeEditar}
                onClick={() => void (async () => {
                  const si = value === "si";
                  if (si && form.hojalaterias.length === 0) {
                    const id = modoDemo
                      ? `demo-hoj-${Date.now()}`
                      : await insertarHojalateriaVacia(form.id);
                    setForm((f) => ({
                      ...f,
                      requiereHojalateria: true,
                      hojalaterias: [
                        {
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
                        },
                      ],
                    }));
                    return;
                  }
                  setForm((f) => ({ ...f, requiereHojalateria: si }));
                })()}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {form.requiereHojalateria ? (
          <div className="space-y-3">
            <p className="fd-hint">Piezas fabricadas por proveedor externo para la reparación</p>
            <div className="grid grid-cols-[1fr_8rem] gap-2">
              <Campo label="Proveedor de hojalatería">
                <SelectorProveedor
                  value={form.hojalaterias[0]?.proveedorId ?? null}
                  onChange={(id) =>
                    setForm((f) => ({
                      ...f,
                      hojalaterias: f.hojalaterias.map((h, i) =>
                        i === 0 ? { ...h, proveedorId: id } : h,
                      ),
                    }))
                  }
                  proveedores={proveedores}
                  onProveedoresChange={setProveedores}
                  disabled={!puedeEditar}
                  rubroPreferido={modoDemo ? undefined : "hojalateria"}
                  className={cn(CONTROL_H, "w-full")}
                />
              </Campo>
              <Campo label="Valor neto">
                <InputMontoNeto
                  disabled={!puedeEditar}
                  value={
                    docsFactura("hojalateria")[0]?.valorNeto ||
                    docs("hojalateria", "cotizacion")[0]?.valorNeto ||
                    form.hojalaterias[0]?.valorNeto ||
                    0
                  }
                  onChange={(n) => {
                    const fact = docsFactura("hojalateria")[0];
                    const cot = docs("hojalateria", "cotizacion")[0];
                    const target = fact ?? cot;
                    setForm((f) => ({
                      ...f,
                      hojalaterias: f.hojalaterias.map((h, i) =>
                        i === 0 ? { ...h, valorNeto: n } : h,
                      ),
                      documentos: target
                        ? f.documentos.map((d) =>
                            d.id === target.id ? { ...d, valorNeto: n } : d,
                          )
                        : f.documentos,
                    }));
                  }}
                />
              </Campo>
            </div>
            <Campo label="Piezas fabricadas">
              <Textarea
                disabled={!puedeEditar}
                value={form.hojalaterias[0]?.descripcion ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hojalaterias: f.hojalaterias.map((h, i) =>
                      i === 0 ? { ...h, descripcion: e.target.value } : h,
                    ),
                  }))
                }
                rows={2}
              />
            </Campo>
            <ParDocumentos
              categoria="hojalateria"
              labels={{
                cotiz: "Cotización hojalatería",
                cotizHint: "PDF o imagen",
                fact: "Factura hojalatería",
                factHint: "PDF o imagen",
                netoCotiz: "Valor neto cotizado",
                netoFact: "Valor neto facturado",
              }}
              form={form}
              setForm={setForm}
              puedeEditar={puedeEditar}
              proveedores={proveedores}
              setProveedores={setProveedores}
              hideMontos
              hideCards={variant === "modal"}
            />
          </div>
        ) : null}
      </Seccion>

      <Seccion titulo="Resumen">
        <ul className="space-y-1 text-sm">
          <li className="flex justify-between">
            <span>Mano de obra</span>
            <span>{formatMontoClp(costo.manoDeObra.neto)}</span>
          </li>
          <li className="flex justify-between">
            <span>Materiales</span>
            <span>{formatMontoClp(costo.materiales.neto)}</span>
          </li>
          <li className="flex justify-between">
            <span>Hojalatería</span>
            <span>{formatMontoClp(costo.hojalateria.neto)}</span>
          </li>
        </ul>
        <p className="mt-2 flex justify-between text-base font-bold">
          <span>Total neto</span>
          <span className="fd-total">{formatMontoClp(costo.totalNeto)}</span>
        </p>
      </Seccion>

      <Seccion titulo="Fotos">
        <div className="grid gap-3 sm:grid-cols-2">
          <GrupoFotos
            titulo="Fotos ANTES"
            hint="Estado actual · arrastra o elige"
            tipo="antes"
            form={form}
            puedeEditar={puedeEditar}
            modoDemo={modoDemo}
            onError={setError}
            onAdd={(item) => setForm((f) => ({ ...f, media: [...f.media, item] }))}
            onRemove={(id) =>
              setForm((f) => ({ ...f, media: f.media.filter((m) => m.id !== id) }))
            }
            onPortada={(id) =>
              setForm((f) => ({
                ...f,
                media: f.media.map((m) =>
                  m.tipo === "antes" ? { ...m, esPortada: m.id === id } : m,
                ),
              }))
            }
          />
          <GrupoFotos
            titulo="Fotos DESPUÉS"
            hint="Mismo encuadre que el antes"
            tipo="despues"
            form={form}
            puedeEditar={puedeEditar}
            modoDemo={modoDemo}
            onError={setError}
            onAdd={(item) => setForm((f) => ({ ...f, media: [...f.media, item] }))}
            onRemove={(id) =>
              setForm((f) => ({ ...f, media: f.media.filter((m) => m.id !== id) }))
            }
            onPortada={(id) =>
              setForm((f) => ({
                ...f,
                media: f.media.map((m) =>
                  m.tipo === "despues" ? { ...m, esPortada: m.id === id } : m,
                ),
              }))
            }
          />
        </div>
        <p className="fd-hint">
          Consejo: toma la foto “después” desde el mismo punto que la “antes”
          para que la comparación se vea bien ante el directorio.
        </p>
      </Seccion>

      <Seccion titulo="Notas">
        <Textarea
          disabled={!puedeEditar}
          value={form.notas ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          rows={3}
          placeholder="Ej: se reparó grieta sobre portón 2 y se selló junta."
        />
      </Seccion>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="fd-form-actions mt-4 flex justify-end gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 min-h-10 rounded-xl px-4"
          onClick={() => (onCancelar ? onCancelar() : router.push(volver))}
        >
          Cancelar
        </Button>
        {puedeEditar ? (
          <Button
            type="button"
            disabled={busy}
            className="fd-btn-primary h-10 min-h-10 rounded-xl px-5"
            onClick={() => void persistir()}
          >
            {busy ? "Guardando…" : "Guardar intervención"}
          </Button>
        ) : null}
      </div>
      </div>
  );

  if (variant === "modal") {
    return (
      <div className="fachadas-scope fd-modal-form fixed inset-0 z-50 overflow-y-auto bg-black/25 py-8 max-md:bg-white max-md:py-0">
        <div className="relative mx-auto w-full max-w-lg px-4">{cuerpo}</div>
      </div>
    );
  }

  return (
    <div className="fachadas-scope min-h-full bg-[#f6f5f2] px-4 py-8">
      {cuerpo}
    </div>
  );
}

function Seccion({
  titulo,
  extra,
  children,
}: {
  titulo: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SeccionErrorBoundary titulo={`No se pudo mostrar la sección «${titulo}».`}>
      <section className="mb-5 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">{titulo}</h2>
          {extra}
        </div>
        {children}
      </section>
    </SeccionErrorBoundary>
  );
}

function ParDocumentos({
  categoria,
  labels,
  form,
  setForm,
  puedeEditar,
  proveedores,
  setProveedores,
  hideMontos,
  hideCards,
}: {
  categoria: CategoriaDocumentoFachada;
  labels: {
    cotiz: string;
    cotizHint: string;
    fact: string;
    factHint: string;
    netoCotiz: string;
    netoFact: string;
  };
  form: IntervencionDetalle;
  setForm: React.Dispatch<React.SetStateAction<IntervencionDetalle>>;
  puedeEditar: boolean;
  proveedores: ProveedorOption[];
  setProveedores: (p: ProveedorOption[]) => void;
  hideMontos?: boolean;
  hideCards?: boolean;
}) {
  const cotiz = form.documentos.filter(
    (d) => d.categoria === categoria && d.tipoDocumento === "cotizacion",
  );
  const facts = form.documentos.filter(
    (d) =>
      d.categoria === categoria &&
      (d.tipoDocumento === "factura" || d.tipoDocumento === "boleta"),
  );

  function patchDoc(id: string, next: DocumentoFachada) {
    setForm((f) => ({
      ...f,
      documentos: f.documentos.map((x) => (x.id === id ? next : x)),
    }));
  }

  function addDoc(d: DocumentoFachada) {
    setForm((f) => ({ ...f, documentos: [...f.documentos, d] }));
  }

  async function removeDoc(id: string) {
    await borrarDocumento(id);
    setForm((f) => ({
      ...f,
      documentos: f.documentos.filter((x) => x.id !== id),
    }));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DropDoc
          titulo={labels.cotiz}
          hint={labels.cotizHint}
          tipoDocumento="cotizacion"
          categoria={categoria}
          docs={cotiz}
          form={form}
          puedeEditar={puedeEditar}
          onAdd={addDoc}
          onChange={patchDoc}
        />
        <DropDoc
          titulo={labels.fact}
          hint={labels.factHint}
          tipoDocumento="factura"
          categoria={categoria}
          docs={facts}
          form={form}
          puedeEditar={puedeEditar}
          onAdd={addDoc}
          onChange={patchDoc}
        />
      </div>
      {hideMontos ? null : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="fd-hint mb-1">{labels.netoCotiz}</p>
            <InputMontoNeto
              disabled={!puedeEditar}
              value={cotiz[0]?.valorNeto ?? 0}
              onChange={(n) => {
                if (cotiz[0]) {
                  patchDoc(cotiz[0].id, { ...cotiz[0], valorNeto: n });
                  return;
                }
                void (async () => {
                  const id = await insertarDocumento({
                    intervencionId: form.id,
                    tipoDocumento: "cotizacion",
                    categoria,
                  });
                  addDoc({ ...vacioDocumento(id, "cotizacion", categoria), valorNeto: n });
                })();
              }}
            />
          </div>
          <div>
            <p className="fd-hint mb-1">{labels.netoFact}</p>
            <InputMontoNeto
              disabled={!puedeEditar}
              value={facts[0]?.valorNeto ?? 0}
              onChange={(n) => {
                if (facts[0]) {
                  patchDoc(facts[0].id, { ...facts[0], valorNeto: n });
                  return;
                }
                void (async () => {
                  const id = await insertarDocumento({
                    intervencionId: form.id,
                    tipoDocumento: "factura",
                    categoria,
                  });
                  addDoc({ ...vacioDocumento(id, "factura", categoria), valorNeto: n });
                })();
              }}
            />
          </div>
        </div>
      )}
      {hideCards
        ? null
        : [...cotiz, ...facts].map((d) => (
        <DocumentoCard
          key={d.id}
          d={d}
          compact
          fachadaId={form.fachadaId}
          intervencionId={form.id}
          puedeEditar={puedeEditar}
          proveedores={proveedores}
          setProveedores={setProveedores}
          onChange={(next) => patchDoc(d.id, next)}
          onDelete={() => removeDoc(d.id)}
        />
      ))}
    </div>
  );
}

function DropDoc({
  titulo,
  hint,
  tipoDocumento,
  categoria,
  docs,
  form,
  puedeEditar,
  onAdd,
  onChange,
}: {
  titulo: string;
  hint: string;
  tipoDocumento: TipoDocumentoFachada;
  categoria: CategoriaDocumentoFachada;
  docs: DocumentoFachada[];
  form: IntervencionDetalle;
  puedeEditar: boolean;
  onAdd: (d: DocumentoFachada) => void;
  onChange: (id: string, d: DocumentoFachada) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const first = docs[0];
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      let d = first;
      if (!d) {
        const id = await insertarDocumento({
          intervencionId: form.id,
          tipoDocumento,
          categoria,
        });
        d = vacioDocumento(id, tipoDocumento, categoria);
        onAdd(d);
      }
      const up = await subirArchivoFachada({
        file,
        carpeta: carpetaIntervencionDocs(form.fachadaId, form.id),
      });
      await guardarArchivoDocumento(d.id, up.key, up.nombre);
      onChange(d.id, {
        ...d,
        archivoKey: up.key,
        archivoNombre: up.nombre,
        archivoUrl: urlPublicaONull(up.key),
      });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <button
        type="button"
        className="fd-drop fd-drop-sm w-full"
        disabled={!puedeEditar || busy}
        onClick={() => ref.current?.click()}
      >
        <FileText className="size-5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-sm font-semibold">
          {busy ? "Subiendo…" : first?.archivoNombre ?? titulo}
        </span>
        <span className="fd-hint">{hint}</span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,.pdf,image/*"
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
    </div>
  );
}

function DocumentoCard({
  d,
  compact,
  fachadaId,
  intervencionId,
  puedeEditar,
  proveedores,
  setProveedores,
  onChange,
  onDelete,
}: {
  d: DocumentoFachada;
  compact?: boolean;
  fachadaId: string;
  intervencionId: string;
  puedeEditar: boolean;
  proveedores: ProveedorOption[];
  setProveedores: (p: ProveedorOption[]) => void;
  onChange: (d: DocumentoFachada) => void;
  onDelete: () => Promise<void>;
}) {
  const esCotiz = d.tipoDocumento === "cotizacion";
  const carpeta = carpetaIntervencionDocs(fachadaId, intervencionId);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2 rounded-lg border border-[#eee] p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {esCotiz
            ? "Cotización"
            : d.tipoDocumento === "boleta"
              ? "Boleta"
              : "Factura"}
          {d.archivoNombre ? ` · ${d.archivoNombre}` : ""}
        </p>
        {puedeEditar ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => void onDelete()}
          >
            Quitar
          </button>
        ) : null}
      </div>
      <div className={cn("grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-2")}>
        <Campo label="Proveedor">
          <SelectorProveedor
            value={d.proveedorId}
            onChange={(id) => onChange({ ...d, proveedorId: id })}
            proveedores={proveedores}
            onProveedoresChange={setProveedores}
            disabled={!puedeEditar}
            className={cn(CONTROL_H, "w-full")}
          />
        </Campo>
        <Campo label="N°">
          <Input
            className={CONTROL_H}
            disabled={!puedeEditar}
            value={d.numero ?? ""}
            onChange={(e) => onChange({ ...d, numero: e.target.value })}
          />
        </Campo>
        <Campo label="Fecha">
          <Input
            type="date"
            className={CONTROL_H}
            disabled={!puedeEditar}
            value={d.fecha ?? ""}
            onChange={(e) => onChange({ ...d, fecha: e.target.value || null })}
          />
        </Campo>
        {compact ? null : (
          <Campo label="Valor neto">
            <InputMontoNeto
              disabled={!puedeEditar}
              value={d.valorNeto}
              onChange={(n) => onChange({ ...d, valorNeto: n })}
            />
          </Campo>
        )}
        <Campo label="Estado">
          <Select
            value={d.estado}
            disabled={!puedeEditar}
            onValueChange={(v) => {
              if (!v) return;
              onChange({ ...d, estado: v });
            }}
          >
            <SelectTrigger className={cn(CONTROL_H, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {esCotiz
                ? ESTADOS_COTIZACION_DOC.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ESTADO_COTIZACION_DOC_LABEL[e]}
                    </SelectItem>
                  ))
                : ESTADOS_FACTURA_DOC.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ESTADO_FACTURA_DOC_LABEL[e]}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </Campo>
        {!esCotiz ? (
          <Campo label="Tipo">
            <Select
              value={d.tipoDocumento}
              disabled={!puedeEditar}
              onValueChange={(v) => {
                if (!v) return;
                onChange({ ...d, tipoDocumento: v as TipoDocumentoFachada });
              }}
            >
              <SelectTrigger className={cn(CONTROL_H, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_FACTURA_BOLETA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "boleta" ? "Boleta" : "Factura"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
        ) : null}
      </div>
      {d.archivoKey ? null : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void (async () => {
                const up = await subirArchivoFachada({ file, carpeta });
                await guardarArchivoDocumento(d.id, up.key, up.nombre);
                onChange({
                  ...d,
                  archivoKey: up.key,
                  archivoNombre: up.nombre,
                  archivoUrl: urlPublicaONull(up.key),
                });
              })();
            }}
          />
          {puedeEditar ? (
            <button
              type="button"
              className="text-xs font-medium text-[#e30613] hover:underline"
              onClick={() => fileRef.current?.click()}
            >
              Adjuntar archivo
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function GrupoFotos({
  titulo,
  hint,
  tipo,
  form,
  puedeEditar,
  onError,
  onAdd,
  onRemove,
  onPortada,
  modoDemo = false,
}: {
  titulo: string;
  hint?: string;
  tipo: "antes" | "despues";
  form: IntervencionDetalle;
  puedeEditar: boolean;
  onError: (m: string | null) => void;
  onAdd: (item: IntervencionDetalle["media"][number]) => void;
  onRemove: (id: string) => void;
  onPortada: (id: string) => void;
  modoDemo?: boolean;
}) {
  const items = form.media.filter((m) => m.tipo === tipo);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const hayPortada = useRef(items.some((m) => m.tipoArchivo === "foto" && m.esPortada));
  const cola = useColaSubida(async (file, onProgress) => {
    if (modoDemo) {
      const local = await materializarArchivoLocal(file, onProgress);
      const esPortada = local.tipoArchivo === "foto" && !hayPortada.current;
      if (esPortada) hayPortada.current = true;
      onAdd({
        id: local.id,
        tipo,
        tipoArchivo: local.tipoArchivo,
        objectKey: local.objectKey,
        nombreArchivo: local.nombreArchivo,
        thumbnailKey: null,
        publicUrl: local.publicUrl,
        thumbnailUrl: local.thumbnailUrl,
        esPortada,
        orden: 0,
        fecha: local.fecha,
        duracionSeg: local.duracionSeg,
      });
      return;
    }
    const item = await subirFotoIntervencion({
      file,
      fachadaId: form.fachadaId,
      intervencionId: form.id,
      tipo,
      onProgress,
    });
    onAdd(item);
  });

  function recibir(files: File[]) {
    onError(null);
    const avisos = cola.encolar(files);
    if (avisos.length) onError(avisos.join(" "));
  }

  return (
    <ZonaSoltarArchivos
      zona={tipo}
      onFiles={puedeEditar ? recibir : () => undefined}
      className="space-y-2"
    >
      <button
        type="button"
        className={cn("fd-drop w-full", tipo === "despues" && "fd-drop-after")}
        disabled={!puedeEditar}
        onClick={() => galeriaRef.current?.click()}
      >
        <ImageIcon className="size-5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-sm font-semibold">{titulo}</span>
        {hint ? <span className="fd-hint">{hint}</span> : null}
      </button>
      <div className="grid grid-cols-3 gap-2">
        {items.map((m) => (
          <div key={m.id} className="relative" data-archivo data-nombre={m.nombreArchivo ?? ""}>
            <MiniaturaMedia
              tipoArchivo={m.tipoArchivo}
              src={m.thumbnailUrl || (m.tipoArchivo === "foto" ? m.publicUrl : null)}
              videoUrl={m.publicUrl}
              duracionSeg={m.duracionSeg}
              alt={m.tipo}
              className="h-24 w-full rounded-md"
            />
            {m.tipoArchivo === "foto" && m.esPortada ? (
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">
                ★ Portada
              </span>
            ) : null}
            {puedeEditar ? (
              <div className="mt-1 flex flex-col gap-1">
                {m.tipoArchivo === "foto" && !m.esPortada ? (
                  <button
                    type="button"
                    className="min-h-10 rounded-md border text-xs"
                    onClick={async () => {
                      if (!modoDemo) {
                        await marcarPortadaMedia({
                          id: m.id,
                          intervencionId: form.id,
                          tipo,
                        });
                      }
                      onPortada(m.id);
                    }}
                  >
                    ★ Portada
                  </button>
                ) : null}
                <button
                  type="button"
                  className="min-h-10 rounded-md bg-black/60 text-xs text-white"
                  onClick={async () => {
                    if (!modoDemo) await borrarFotoIntervencion(m.id);
                    onRemove(m.id);
                  }}
                >
                  Quitar
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <ListaColaSubida items={cola.items} onReintentar={cola.reintentar} />
      {puedeEditar ? (
        <BotonesCapturaGaleria galeriaRef={galeriaRef} onFiles={recibir} />
      ) : null}
    </ZonaSoltarArchivos>
  );
}

function vacioDocumento(
  id: string,
  tipoDocumento: TipoDocumentoFachada,
  categoria: CategoriaDocumentoFachada,
): DocumentoFachada {
  return {
    id,
    tipoDocumento,
    categoria,
    proveedorId: null,
    numero: null,
    fecha: null,
    valorNeto: 0,
    archivoKey: null,
    archivoNombre: null,
    archivoUrl: null,
    estado: tipoDocumento === "cotizacion" ? "pendiente" : "pendiente",
  };
}

function vacioMaterial(id: string): MaterialDetalle {
  return {
    id,
    tipo: "otros",
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
