"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormularioProveedor } from "@/components/proveedores/FormularioProveedor";
import type { Proveedor, ProveedorOption } from "@/lib/proveedores";
import {
  FILTRO_RUBRO_TODOS,
  proveedorPasaFiltroRubro,
  type RubroProveedor,
} from "@/lib/fachadas/indicadores";

const NONE = "none";
const NUEVO = "__nuevo__";

type SelectorProveedorProps = {
  value: string | null;
  onChange: (proveedorId: string | null) => void;
  proveedores: ProveedorOption[];
  onProveedoresChange?: (next: ProveedorOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  rubroPreferido?: RubroProveedor;
};

export function SelectorProveedor({
  value,
  onChange,
  proveedores,
  onProveedoresChange,
  disabled = false,
  placeholder = "Seleccionar proveedor",
  allowClear = true,
  className,
  rubroPreferido,
}: SelectorProveedorProps) {
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const options = useMemo(() => {
    const filtro = rubroPreferido && !mostrarTodos ? rubroPreferido : FILTRO_RUBRO_TODOS;
    return [...proveedores]
      .filter((p) => proveedorPasaFiltroRubro(p.rubros ?? [], filtro))
      .sort((a, b) => a.nombre_empresa.localeCompare(b.nombre_empresa, "es"));
  }, [proveedores, rubroPreferido, mostrarTodos]);

  return (
    <>
      {rubroPreferido ? (
        <label className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={mostrarTodos}
            disabled={disabled}
            onChange={(e) => setMostrarTodos(e.target.checked)}
          />
          Mostrar todos
        </label>
      ) : null}
      <Select
        value={value ?? (allowClear ? NONE : undefined)}
        disabled={disabled}
        onValueChange={(v) => {
          if (!v || v === NONE) {
            onChange(null);
            return;
          }
          if (v === NUEVO) {
            setNuevoOpen(true);
            return;
          }
          onChange(v);
        }}
      >
        <SelectTrigger className={className ?? "h-10 w-full"}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear ? (
            <SelectItem value={NONE}>Sin proveedor</SelectItem>
          ) : null}
          {options.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nombre_empresa}
            </SelectItem>
          ))}
          <SelectItem value={NUEVO}>+ Nuevo proveedor</SelectItem>
        </SelectContent>
      </Select>

      <FormularioProveedor
        open={nuevoOpen}
        onOpenChange={setNuevoOpen}
        onSuccess={(creado: Proveedor) => {
          const option: ProveedorOption = {
            id: creado.id,
            nombre_empresa: creado.nombre_empresa,
            rubros: creado.rubros ?? [],
          };
          onProveedoresChange?.([
            ...proveedores.filter((p) => p.id !== creado.id),
            option,
          ]);
          onChange(creado.id);
        }}
      />
    </>
  );
}
