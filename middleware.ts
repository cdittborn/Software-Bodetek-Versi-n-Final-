import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static (assets estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico y archivos de imagen comunes
     * - /dev/fachadas-mobile, /dev/fachadas-v2 y /dev/informe-seguro (capturas locales; 404 en producción)
     * /informe-seguro/[token] sí pasa por el middleware, pero no exige login.
     */
    "/((?!_next/static|_next/image|favicon.ico|dev/fachadas-mobile|dev/fachadas-v2|dev/informe-seguro|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
