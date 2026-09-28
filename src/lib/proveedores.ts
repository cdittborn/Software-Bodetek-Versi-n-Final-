export type Proveedor = {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string | null;
  celular: string | null;
  email: string | null;
  presente_antofagasta: boolean;
  created_at: string;
  rubros?: string[];
};

export type ProveedorOption = {
  id: string;
  nombre_empresa: string;
  rubros?: string[];
};

export const MENSAJE_PROVEEDOR_EN_USO =
  "Este proveedor tiene trabajos asociados; no se puede eliminar";

export function mensajeErrorBorrarProveedor(error: {
  code?: string;
  message?: string;
} | null): string {
  if (!error) return "";
  const code = error.code ?? "";
  const message = error.message ?? "";
  if (
    code === "23503" ||
    /foreign key|violates foreign key/i.test(message)
  ) {
    return MENSAJE_PROVEEDOR_EN_USO;
  }
  return message || MENSAJE_PROVEEDOR_EN_USO;
}
