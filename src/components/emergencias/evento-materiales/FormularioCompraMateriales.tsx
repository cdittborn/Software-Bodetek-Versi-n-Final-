"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  aplicarCambioIva,
  aplicarCambioNeto,
  brutoDe,
  brutoDesde,
  estadoIvaVacio,
  faltantesCompra,
  mensajePieFormulario,
  parseEnteroClp,
  type ProyectoOpcionMaterial,
} from "@/lib/filtracion/materiales";
import {
  guardarCompraMaterial,
  subirFacturaCompra,
} from "@/lib/filtracion/guardarCompraMaterial";
import { formatMontoClp } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputCls = "h-11 min-h-[44px] text-base md:text-sm";

type FormularioCompraMaterialesProps = {
  eventoId: string;
  proyectos: ProyectoOpcionMaterial[];
  onCancelar: () => void;
  onGuardado: () => void;
};

export function FormularioCompraMateriales({
  eventoId,
  proyectos,
  onCancelar,
  onGuardado,
}: FormularioCompraMaterialesProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fechaCompra, setFechaCompra] = useState(hoyISO);
  const [proveedor, setProveedor] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [material, setMaterial] = useState("");
  const [netoTexto, setNetoTexto] = useState("");
  const [ivaTexto, setIvaTexto] = useState("");
  const [ivaForm, setIvaForm] = useState(estadoIvaVacio);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [trabajoIds, setTrabajoIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faltantes = useMemo(
    () =>
      faltantesCompra({
        fechaCompra,
        proveedor,
        numeroFactura,
        material,
        valorNeto: ivaForm.neto,
        facturaOk: Boolean(archivo),
        trabajoIds,
      }),
    [fechaCompra, proveedor, numeroFactura, material, ivaForm.neto, archivo, trabajoIds],
  );
  const pie = mensajePieFormulario(faltantes);
  const bruto = brutoDe(ivaForm);
  const listo = pie.ok && !busy;

  function onNetoChange(value: string) {
    setNetoTexto(value);
    const n = parseEnteroClp(value);
    const next = aplicarCambioNeto(ivaForm, n);
    setIvaForm(next);
    setIvaTexto(next.iva == null ? "" : String(next.iva));
  }

  function onIvaChange(value: string) {
    setIvaTexto(value);
    const n = parseEnteroClp(value);
    setIvaForm(aplicarCambioIva(ivaForm, n));
  }

  function toggleProyecto(id: string) {
    setTrabajoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function onGuardar() {
    if (!pie.ok || ivaForm.neto == null || ivaForm.iva == null || !archivo) return;
    setBusy(true);
    setError(null);
    const id = crypto.randomUUID();
    try {
      const factura = await subirFacturaCompra({ compraId: id, file: archivo });
      await guardarCompraMaterial({
        id,
        eventoId,
        fechaCompra,
        proveedor,
        numeroFactura,
        material,
        valorNeto: ivaForm.neto,
        valorIva: ivaForm.iva,
        valorBruto: brutoDesde(ivaForm.neto, ivaForm.iva),
        facturaKey: factura.key,
        facturaNombre: factura.nombre,
        trabajoIds,
      });
      toast.success("Compra guardada");
      onGuardado();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border-2 border-[#c8102e] bg-white p-4 shadow-[0_8px_24px_rgba(200,16,46,0.12)] md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Registrar compra de materiales</h2>
        <p className="text-xs text-muted-foreground">
          El IVA se calcula solo (19%); puedes corregirlo
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Campo label="Fecha de compra *">
          <Input
            type="date"
            className={inputCls}
            value={fechaCompra}
            onChange={(e) => setFechaCompra(e.target.value)}
          />
        </Campo>
        <Campo label="Proveedor *">
          <Input
            className={inputCls}
            placeholder="Ej. Sodimac Constructor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          />
        </Campo>
        <Campo label="N° de factura *">
          <Input
            className={inputCls}
            placeholder="Ej. F-884210"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
          />
        </Campo>
        <Campo label="Material comprado *">
          <Input
            className={inputCls}
            placeholder="Ej. Canaleta de zinc 3 m"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </Campo>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Campo label="Valor neto *">
          <Input
            className={inputCls}
            inputMode="numeric"
            placeholder="Ej. 480000"
            value={netoTexto}
            onChange={(e) => onNetoChange(e.target.value)}
          />
        </Campo>
        <Campo label="IVA">
          <Input
            className={inputCls}
            inputMode="numeric"
            value={ivaTexto}
            onChange={(e) => onIvaChange(e.target.value)}
          />
        </Campo>
        <Campo label="Valor bruto">
          <div className="flex h-11 min-h-[44px] items-center rounded-lg border border-input bg-zinc-100 px-2.5 text-sm tabular-nums">
            {bruto == null ? "—" : formatMontoClp(bruto)}
          </div>
        </Campo>
        <Campo label="Factura adjunta *">
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px] w-full justify-start truncate"
            onClick={() => fileRef.current?.click()}
          >
            {archivo ? archivo.name : "Subir factura"}
          </Button>
        </Campo>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium">
            Asociar a &apos;Proyectos-Filtraciones&apos;*
          </h3>
          <p className="text-xs text-muted-foreground">
            {trabajoIds.length === 0
              ? "ninguno seleccionado"
              : `${trabajoIds.length} seleccionado${trabajoIds.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Si eliges varios, el valor se reparte en partes iguales entre ellos.
        </p>
        {proyectos.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Este evento aún no tiene proyectos-filtración.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {proyectos.map((p) => {
              const on = trabajoIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProyecto(p.id)}
                  className={cn(
                    "min-h-[44px] rounded-full border px-3 py-2 text-sm",
                    on
                      ? "border-[#c8102e] bg-[#fdeced] font-medium text-[#a4131f]"
                      : "border-border bg-white text-zinc-700 hover:bg-zinc-50",
                  )}
                >
                  {p.etiqueta}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "text-sm",
            pie.ok ? "text-emerald-700" : "text-[#c8102e]",
          )}
        >
          {pie.texto}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px] flex-1 sm:flex-none"
            onClick={onCancelar}
            disabled={busy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-11 min-h-[44px] flex-1 bg-[#c8102e] text-white hover:bg-[#a4131f] sm:flex-none disabled:bg-zinc-200 disabled:text-zinc-400"
            disabled={!listo}
            onClick={() => void onGuardar()}
          >
            {busy ? "Guardando…" : "Guardar compra"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
