import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  paso: z.enum(["firmar", "r2", "guardar"]),
  status: z.number().int().nullable(),
  rls: z.boolean().optional(),
  mensaje: z.string().max(200),
  detalle: z.string().max(240),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  console.error("[fachadas subida]", {
    userId: user.id,
    ...parsed.data,
  });
  return new NextResponse(null, { status: 204 });
}
