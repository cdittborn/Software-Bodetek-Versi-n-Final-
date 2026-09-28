import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser, getPerfil } from "@/lib/supabase/sesion";
import { MODULOS_NAVEGABLES } from "@/lib/modulos";
import { BotonLogout } from "@/components/shared/BotonLogout";
import { NavLink } from "@/components/shared/NavLink";

export async function NavPrincipal() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const perfil = await getPerfil(user.id);

  if (!perfil?.rol) {
    return null;
  }

  const supabase = await createClient();
  const { data: permisos } = await supabase
    .from("modulo_permisos")
    .select("modulo, puede_ver")
    .eq("rol", perfil.rol)
    .eq("puede_ver", true);

  const permitidos = new Set(
    (permisos ?? []).map((p) => p.modulo as string),
  );

  const links = MODULOS_NAVEGABLES.filter((m) => permitidos.has(m.modulo));

  return (
    <header className="border-b border-border bg-card">
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-8">
          <NavLink href="/trabajos" className="shrink-0">
            <Image
              src="/logo-bodetek.png"
              alt="Bodetek"
              width={148}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {perfil.nombre ?? user.email} · {perfil.rol}
          </span>
          <BotonLogout />
        </div>
      </div>
    </header>
  );
}
