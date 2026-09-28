import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Deduplica auth.getUser() entre Nav, layout y page del mismo request. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Perfil del usuario (rol + nombre) una vez por request. */
export const getPerfil = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfiles")
    .select("rol, nombre")
    .eq("id", userId)
    .maybeSingle();
  return data;
});
