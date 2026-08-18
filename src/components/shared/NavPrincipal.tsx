import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MODULOS_NAVEGABLES } from "@/lib/modulos";
import { BotonLogout } from "@/components/shared/BotonLogout";

export async function NavPrincipal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil?.rol) {
    return null;
  }

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
          <Link href="/trabajos" className="shrink-0">
            <Image
              src="/logo-bodetek.png"
              alt="Bodetek"
              width={148}
              height={36}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
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
