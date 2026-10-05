export type ModuloKey =
  | "rentas"
  | "trabajos"
  | "ggcc"
  | "legal"
  | "usuarios"
  | "recintos"
  | "proveedores";

/** Rutas reales del dashboard → clave en modulo_permisos */
export const MODULOS_NAVEGABLES: {
  modulo: ModuloKey;
  href: string;
  label: string;
}[] = [
  { modulo: "trabajos", href: "/trabajos", label: "Trabajos" },
  { modulo: "recintos", href: "/recintos", label: "Recintos" },
  { modulo: "proveedores", href: "/proveedores", label: "Proveedores" },
  { modulo: "usuarios", href: "/usuarios", label: "Usuarios" },
];

export function esRutaDemoFachadas(pathname: string): boolean {
  return (
    pathname === "/trabajos/fachadas/demo" ||
    pathname.startsWith("/trabajos/fachadas/demo/") ||
    pathname === "/demo/fachadas" ||
    pathname.startsWith("/demo/fachadas/")
  );
}

export function moduloFromPathname(pathname: string): ModuloKey | null {
  if (esRutaDemoFachadas(pathname)) {
    return "trabajos";
  }
  if (pathname === "/trabajos" || pathname.startsWith("/trabajos/")) {
    return "trabajos";
  }
  if (pathname === "/recintos" || pathname.startsWith("/recintos/")) {
    return "recintos";
  }
  if (pathname === "/proveedores" || pathname.startsWith("/proveedores/")) {
    return "proveedores";
  }
  if (pathname === "/usuarios" || pathname.startsWith("/usuarios/")) {
    return "usuarios";
  }
  if (pathname === "/rentas" || pathname.startsWith("/rentas/")) {
    return "rentas";
  }
  if (pathname === "/ggcc" || pathname.startsWith("/ggcc/")) {
    return "ggcc";
  }
  if (pathname === "/legal" || pathname.startsWith("/legal/")) {
    return "legal";
  }
  return null;
}

/** Link del informe para el seguro: sin login, sin menú, solo el snapshot publicado. */
export function esRutaInformeSeguroPublico(pathname: string): boolean {
  return (
    pathname === "/informe-seguro" || pathname.startsWith("/informe-seguro/")
  );
}

export function isProtectedDashboardPath(pathname: string): boolean {
  if (esRutaInformeSeguroPublico(pathname)) return false;
  return moduloFromPathname(pathname) !== null;
}
