import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedDashboardPath,
  moduloFromPathname,
} from "@/lib/modulos";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isProtectedRoute = isProtectedDashboardPath(pathname);

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/trabajos";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute) {
    const modulo = moduloFromPathname(pathname);

    if (modulo) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (!perfil?.rol) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      const { data: permiso } = await supabase
        .from("modulo_permisos")
        .select("puede_ver")
        .eq("rol", perfil.rol)
        .eq("modulo", modulo)
        .maybeSingle();

      if (!permiso?.puede_ver) {
        const url = request.nextUrl.clone();
        // Evitar bucle si tampoco puede ver trabajos
        url.pathname = modulo === "trabajos" ? "/login" : "/trabajos";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
