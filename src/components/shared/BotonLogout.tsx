"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type BotonLogoutProps = {
  className?: string;
};

export function BotonLogout({ className }: BotonLogoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center px-1 text-[12.5px] text-ink-mute hover:text-ink disabled:opacity-60",
        className,
      )}
    >
      {loading ? "Saliendo…" : "Salir"}
    </button>
  );
}
