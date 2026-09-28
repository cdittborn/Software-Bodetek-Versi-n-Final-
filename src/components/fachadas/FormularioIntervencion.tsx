"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import {
  Campo,
  CONTROL_H,
  InputDecimalCl,
  InputMontoNeto,
  Segmented,
} from "@/components/fachadas/CamposFormulario";
import {
  ESTADOS_INTERVENCION_FACHADA,
  ESTADO_INTERVENCION_FACHADA_LABEL,
  type EstadoFachada,
} from "@/lib/fachadas/estado";
import { EJECUTADO_POR_LABEL, formatMontoClp } from "@/lib/trabajos";
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
  type EjecutadoPorFachada,
  type TipoDocumentoFachada,
  type TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import { formatDecimalCl } from "@/lib/fachadas/formato";
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
}: {
  categoriaId: string;
  subtipoId: string;
  inicial: IntervencionDetalle;
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
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
    const id = await insertarDocumento({
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

  return (
    <div className="fachadas-ui mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={volver} className="underline">
            {form.fachadaNombre}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {inicial.fechaInicio ? "Editar intervención" : "Nueva intervención"}
        </h1>
      </div>

      <Seccion titulo="Trabajos">
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
            const actual = form.tipos.find((t) => t.tipo === tipo);
            const on = Boolean(actual);
            return (
              <div
                key={tipo}
                className={cn(
                  "rounded-xl border p-3",
                  on ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <label className="flex min-h-10 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1 size-5"
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
                    <span className="block font-medium">
                      {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {TIPO_INTERVENCION_FACHADA_DESCRIPCION[tipo]}
                    </span>
                  </span>
                </label>
                {actual ? (
                  <div className="mt-3">
                    <Campo label="Días">
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
                    </Campo>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Seccion>

      <Seccion titulo="Quién ejecuta">
        <Segmented
          disabled={!puedeEditar}
          value={form.ejecutadoPor}
          options={[
            { value: "maestros_bodetek", label: EJECUTADO_POR_LABEL.maestros_bodetek },
            { value: "proveedor_externo", label: EJECUTADO_POR_LABEL.proveedor_externo },
          ]}
          onChange={(v) =>
            setForm((f) => ({ ...f, ejecutadoPor: v as EjecutadoPorFachada }))
          }
        />
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
        {form.ejecutadoPor === "maestros_bodetek" ? (
          <Campo label="Maestros asignados">
            <Input
              className={CONTROL_H}
              disabled={!puedeEditar}
              value={form.maestrosAsignados ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, maestrosAsignados: e.target.value }))
              }
              placeholder="Nombres de los maestros Bodetek"
            />
          </Campo>
        ) : null}
      </Seccion>

      <Seccion titulo="Estado y fechas">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo label="Estado">
            <Select
              value={form.estado || "programada"}
              disabled={!puedeEditar}
              onValueChange={(v) => {
                if (!v) return;
                setForm((f) => ({ ...f, estado: v as EstadoFachada }));
              }}
            >
              <SelectTrigger className={cn(CONTROL_H, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_INTERVENCION_FACHADA.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_INTERVENCION_FACHADA_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo label="Fecha de inicio">
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
          <Campo label="Fecha de término">
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
      </Seccion>

      <Seccion titulo="Mano de obra">
        <p className="text-sm font-medium">Cotizaciones</p>
        {docs("mano_de_obra", "cotizacion").map((d) => (
          <DocumentoCard
            key={d.id}
            d={d}
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
              await borrarDocumento(d.id);
              setForm((f) => ({
                ...f,
                documentos: f.documentos.filter((x) => x.id !== d.id),
              }));
            }}
          />
        ))}
        {puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            className={CONTROL_H}
            onClick={() => void agregarDoc("cotizacion", "mano_de_obra")}
          >
            + Agregar cotización
          </Button>
        ) : null}

        <p className="mt-4 text-sm font-medium">Factura / boleta (valor neto facturado)</p>
        {docsFactura("mano_de_obra").map((d) => (
          <DocumentoCard
            key={d.id}
            d={d}
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
              await borrarDocumento(d.id);
              setForm((f) => ({
                ...f,
                documentos: f.documentos.filter((x) => x.id !== d.id),
              }));
            }}
          />
        ))}
        {puedeEditar ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className={CONTROL_H}
              onClick={() => void agregarDoc("factura", "mano_de_obra")}
            >
              + Adjuntar factura
            </Button>
            <Button
              type="button"
              variant="outline"
              className={CONTROL_H}
              onClick={() => void agregarDoc("boleta", "mano_de_obra")}
            >
              + Adjuntar boleta
            </Button>
          </div>
        ) : null}
      </Seccion>

      <Seccion titulo="Materiales">
        {form.materiales.map((m) => (
          <div key={m.id} className="space-y-2 rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Campo label="Tipo">
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MATERIAL_FACHADA.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_MATERIAL_FACHADA_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Detalle">
                <Input
                  className={CONTROL_H}
                  disabled={!puedeEditar}
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
              </Campo>
              <Campo label="Valor neto">
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
              </Campo>
            </div>
            {puedeEditar ? (
              <Button
                type="button"
                variant="ghost"
                className={CONTROL_H}
                onClick={async () => {
                  await borrarMaterial(m.id);
                  setForm((f) => ({
                    ...f,
                    materiales: f.materiales.filter((x) => x.id !== m.id),
                  }));
                }}
              >
                Quitar material
              </Button>
            ) : null}
          </div>
        ))}
        {puedeEditar ? (
          <Button
            type="button"
            variant="outline"
            className={CONTROL_H}
            onClick={async () => {
              const id = await insertarMaterialVacio(form.id);
              setForm((f) => ({
                ...f,
                sinMateriales: false,
                materiales: [...f.materiales, vacioMaterial(id)],
              }));
            }}
          >
            + Agregar material
          </Button>
        ) : null}

        <p className="mt-3 text-sm font-medium">Adjuntar factura / boleta</p>
        {docsFactura("materiales").map((d) => (
          <DocumentoCard
            key={d.id}
            d={d}
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
              await borrarDocumento(d.id);
              setForm((f) => ({
                ...f,
                documentos: f.documentos.filter((x) => x.id !== d.id),
              }));
            }}
          />
        ))}
        {puedeEditar ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className={CONTROL_H}
              onClick={() => void agregarDoc("factura", "materiales")}
            >
              + Factura de materiales
            </Button>
            <Button
              type="button"
              variant="outline"
              className={CONTROL_H}
              onClick={() => void agregarDoc("boleta", "materiales")}
            >
              + Boleta de materiales
            </Button>
          </div>
        ) : null}
        <p className="text-sm">
          Total materiales (valor neto): {formatMontoClp(totalMateriales)}
        </p>
      </Seccion>

      <Seccion titulo="¿Hubo hojalatería?">
        <Segmented
          disabled={!puedeEditar}
          value={form.requiereHojalateria ? "si" : "no"}
          options={[
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ]}
          onChange={async (v) => {
            const si = v === "si";
            if (si && form.hojalaterias.length === 0) {
              const id = await insertarHojalateriaVacia(form.id);
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
          }}
        />
        {form.requiereHojalateria ? (
          <div className="space-y-3">
            <Campo label="Proveedor">
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
                rubroPreferido="hojalateria"
                className={cn(CONTROL_H, "w-full")}
              />
            </Campo>
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
                rows={3}
              />
            </Campo>
            <p className="text-sm font-medium">Cotización (valor neto)</p>
            {docs("hojalateria", "cotizacion").map((d) => (
              <DocumentoCard
                key={d.id}
                d={d}
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
                  await borrarDocumento(d.id);
                  setForm((f) => ({
                    ...f,
                    documentos: f.documentos.filter((x) => x.id !== d.id),
                  }));
                }}
              />
            ))}
            {puedeEditar ? (
              <Button
                type="button"
                variant="outline"
                className={CONTROL_H}
                onClick={() => void agregarDoc("cotizacion", "hojalateria")}
              >
                + Cotización de hojalatería
              </Button>
            ) : null}
            <p className="text-sm font-medium">Factura (valor neto)</p>
            {docsFactura("hojalateria").map((d) => (
              <DocumentoCard
                key={d.id}
                d={d}
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
                  await borrarDocumento(d.id);
                  setForm((f) => ({
                    ...f,
                    documentos: f.documentos.filter((x) => x.id !== d.id),
                  }));
                }}
              />
            ))}
            {puedeEditar ? (
              <Button
                type="button"
                variant="outline"
                className={CONTROL_H}
                onClick={() => void agregarDoc("factura", "hojalateria")}
              >
                + Factura de hojalatería
              </Button>
            ) : null}
          </div>
        ) : null}
      </Seccion>

      <Seccion titulo="Resumen (valor neto)">
        <ul className="space-y-1 text-sm">
          <li>
            Mano de obra: {formatMontoClp(costo.manoDeObra.neto)}
            {costo.manoDeObra.estimado ? " · estimado" : ""}
          </li>
          <li>Materiales: {formatMontoClp(costo.materiales.neto)}</li>
          <li>
            Hojalatería: {formatMontoClp(costo.hojalateria.neto)}
            {costo.hojalateria.estimado ? " · estimado" : ""}
          </li>
        </ul>
        <p className="mt-2 text-lg font-semibold">
          Total neto: {formatMontoClp(costo.totalNeto)}
          {costo.estimado ? " · estimado" : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          Días: {formatDecimalCl(form.tipos.reduce((a, t) => a + (t.dias || 0), 0), 1)}
          {costo.costoPorM2 != null
            ? ` · ${formatMontoClp(costo.costoPorM2)} / m² (neto, snapshot)`
            : ""}
        </p>
      </Seccion>

      <Seccion titulo="Fotos antes y después">
        <p className="text-sm text-muted-foreground">
          Usa el mismo encuadre en las fotos de antes y después para comparar
          mejor el trabajo.
        </p>
        <GrupoFotos
          titulo="Antes"
          tipo="antes"
          form={form}
          puedeEditar={puedeEditar}
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
          titulo="Después"
          tipo="despues"
          form={form}
          puedeEditar={puedeEditar}
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
      </Seccion>

      <Seccion titulo="Notas">
        <Textarea
          disabled={!puedeEditar}
          value={form.notas ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          rows={3}
        />
      </Seccion>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 pb-8">
        <Button
          type="button"
          variant="outline"
          className={CONTROL_H}
          onClick={() => router.push(volver)}
        >
          Cancelar
        </Button>
        {puedeEditar ? (
          <Button
            type="button"
            disabled={busy}
            className={CONTROL_H}
            onClick={() => void persistir()}
          >
            {busy ? "Guardando…" : "Guardar intervención"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <SeccionErrorBoundary titulo={`No se pudo mostrar la sección «${titulo}».`}>
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-base font-medium">{titulo}</h2>
        {children}
      </section>
    </SeccionErrorBoundary>
  );
}

function DocumentoCard({
  d,
  fachadaId,
  intervencionId,
  puedeEditar,
  proveedores,
  setProveedores,
  onChange,
  onDelete,
}: {
  d: DocumentoFachada;
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
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {esCotiz
            ? "Cotización"
            : d.tipoDocumento === "boleta"
              ? "Boleta"
              : "Factura"}{" "}
          · valor neto
        </p>
        {puedeEditar ? (
          <Button type="button" variant="ghost" className={CONTROL_H} onClick={() => void onDelete()}>
            Quitar
          </Button>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
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
        <Campo label="Valor neto">
          <InputMontoNeto
            disabled={!puedeEditar}
            value={d.valorNeto}
            onChange={(n) => onChange({ ...d, valorNeto: n })}
          />
        </Campo>
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
      <UploaderArchivoSimple
        etiqueta={esCotiz ? "PDF cotización" : "PDF factura / boleta"}
        carpeta={carpeta}
        accept="application/pdf,.pdf,image/*"
        actualUrl={d.archivoUrl}
        actualNombre={d.archivoNombre}
        actualKey={d.archivoKey}
        puedeEditar={puedeEditar}
        onUploaded={async (key, nombre) => {
          await guardarArchivoDocumento(d.id, key, nombre);
          onChange({
            ...d,
            archivoKey: key,
            archivoNombre: nombre,
            archivoUrl: urlPublicaONull(key),
          });
        }}
        onCleared={async () => {
          await guardarArchivoDocumento(d.id, null, null);
          onChange({
            ...d,
            archivoKey: null,
            archivoNombre: null,
            archivoUrl: null,
          });
        }}
      />
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
  onPortada,
}: {
  titulo: string;
  tipo: "antes" | "despues";
  form: IntervencionDetalle;
  puedeEditar: boolean;
  onError: (m: string | null) => void;
  onAdd: (item: IntervencionDetalle["media"][number]) => void;
  onRemove: (id: string) => void;
  onPortada: (id: string) => void;
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
            {m.esPortada ? (
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">
                Portada
              </span>
            ) : null}
            {puedeEditar ? (
              <div className="mt-1 flex flex-col gap-1">
                {!m.esPortada ? (
                  <button
                    type="button"
                    className="min-h-10 rounded-md border text-xs"
                    onClick={async () => {
                      await marcarPortadaMedia({
                        id: m.id,
                        intervencionId: form.id,
                        tipo,
                      });
                      onPortada(m.id);
                    }}
                  >
                    Elegir portada
                  </button>
                ) : null}
                <button
                  type="button"
                  className="min-h-10 rounded-md bg-black/60 text-xs text-white"
                  onClick={async () => {
                    await borrarFotoIntervencion(m.id);
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
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className={CONTROL_H}
            onClick={() => camRef.current?.click()}
          >
            Cámara
          </Button>
          <Button
            type="button"
            className={CONTROL_H}
            onClick={() => fileRef.current?.click()}
          >
            Galería
          </Button>
        </div>
      ) : null}
    </div>
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
