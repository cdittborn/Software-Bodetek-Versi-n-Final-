import { createClient } from "@/lib/supabase/server";

function isReachableWithoutTable(error: {
  code?: string;
  message: string;
  details?: string;
}): boolean {
  const text = `${error.code ?? ""} ${error.message} ${error.details ?? ""}`.toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    text.includes("does not exist") ||
    text.includes("could not find the table") ||
    text.includes("schema cache")
  );
}

export default async function TestConexionPage() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <p>
            Error: faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        </main>
      );
    }

    const supabase = await createClient();

    // Consulta a una tabla inexistente: si PostgREST responde, la conexión y la API key son válidas
    const { error } = await supabase
      .from("_bodetek_conexion_test")
      .select("*")
      .limit(1);

    if (!error || isReachableWithoutTable(error)) {
      return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <p>Conexión exitosa ✅</p>
        </main>
      );
    }

    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <p>Error: {error.message}</p>
      </main>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <p>Error: {message}</p>
      </main>
    );
  }
}
