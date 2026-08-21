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
}: SelectorProveedorProps) {
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const options = useMemo(
    () =>
      [...proveedores].sort((a, b) =>
        a.nombre_empresa.localeCompare(b.nombre_empresa, "es"),
      ),
    [proveedores],
  );

  return (
    <>
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
