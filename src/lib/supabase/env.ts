/**
 * Variables públicas de Supabase usadas en browser, server y middleware.
 * Fallar con mensaje claro si faltan (evita crashes opacos en Vercel).
 */
export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL — revisa la configuración en Vercel",
    );
  }
  if (!anonKey) {
    throw new Error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY — revisa la configuración en Vercel",
    );
  }

  return { url, anonKey };
}
