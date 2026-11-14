"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SalirBoton() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className="uppercase tracking-[0.04em] underline decoration-regla decoration-1 underline-offset-4 transition-colors hover:decoration-tinta"
    >
      {saliendo ? "Saliendo…" : "Salir"}
    </button>
  );
}
