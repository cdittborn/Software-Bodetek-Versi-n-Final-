export type ModuloKey =
  | "rentas"
  | "trabajos"
  | "ggcc"
  | "legal"
  | "usuarios"
  | "recintos";

/** Rutas reales del dashboard → clave en modulo_permisos */
export const MODULOS_NAVEGABLES: {
  modulo: ModuloKey;
  href: string;
  label: string;
}[] = [
  { modulo: "trabajos", href: "/trabajos", label: "Trabajos" },
  { modulo: "recintos", href: "/recintos", label: "Recintos" },
  { modulo: "usuarios", href: "/usuarios", label: "Usuarios" },
];

export function moduloFromPathname(pathname: string): ModuloKey | null {
  if (pathname === "/trabajos" || pathname.startsWith("/trabajos/")) {
    return "trabajos";
  }
  if (pathname === "/recintos" || pathname.startsWith("/recintos/")) {
    return "recintos";
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

export function isProtectedDashboardPath(pathname: string): boolean {
  return moduloFromPathname(pathname) !== null;
}
