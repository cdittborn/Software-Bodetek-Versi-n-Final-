import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre_completo: z.string().min(1),
  rol: z.enum(["admin", "pablo", "asistente", "socio", "cliente"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil || !["admin", "pablo"].includes(perfil.rol)) {
      return NextResponse.json(
        { error: "No tienes permiso para crear usuarios" },
        { status: 403 },
      );
    }

    const json = await request.json();
    const parsed = createUserSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { email, password, nombre_completo, rol } = parsed.data;
    const admin = createAdminClient();

    // Convención: en Auth usamos metadata "nombre_completo";
    // el trigger on_auth_user_created lo copia a perfiles.nombre
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error interno al crear usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
