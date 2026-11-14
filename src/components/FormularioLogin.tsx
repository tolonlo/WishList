"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flecha } from "./Icono";

export function FormularioLogin({ nombres }: { nombres: [string, string] }) {
  const router = useRouter();
  const [username, setUsername] = useState(nombres[0]);
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-2 grid max-w-[380px] gap-4">
      <div className="grid gap-2">
        <span className="rotulo text-tinta-2">¿Quién abre el estante?</span>
        <div className="grid grid-cols-2 gap-2">
          {nombres.map((nombre, i) => {
            const activo = username.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es");
            return (
              <button
                key={nombre}
                type="button"
                data-color={i === 0 ? "naranja" : "morado"}
                aria-pressed={activo}
                onClick={() => setUsername(nombre)}
                className={`rounded-[3px] border px-3.5 py-2.5 text-left transition-all ${
                  activo
                    ? "border-tinta bg-[var(--c)] font-semibold text-tinta"
                    : "border-regla bg-papel text-tinta-2 hover:border-tinta hover:text-tinta"
                }`}
              >
                <span className="rotulo block text-[10px] opacity-75">Lector 0{i + 1}</span>
                <span className="font-serif text-[22px] leading-tight font-medium text-tinta">
                  {nombre}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="grid gap-1.5">
        <span className="rotulo text-tinta-2">Nombre</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="campo"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="rotulo text-tinta-2">Clave privada</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="campo"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-[3px] bg-terracota-claro px-3.5 py-2.5 text-[14px] text-tinta">
          {error}
        </p>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={cargando}
          className="avanzar inline-flex items-center gap-2.5 rounded-[3px] bg-tinta px-5 py-3 text-xs font-semibold tracking-[0.06em] text-papel uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <span>{cargando ? "Abriendo biblioteca…" : "Entrar al estante"}</span>
          <Flecha />
        </button>
      </div>
    </form>
  );
}
