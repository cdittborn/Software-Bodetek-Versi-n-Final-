export type Proveedor = {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string | null;
  celular: string | null;
  email: string | null;
  presente_antofagasta: boolean;
  created_at: string;
};

export type ProveedorOption = {
  id: string;
  nombre_empresa: string;
};
