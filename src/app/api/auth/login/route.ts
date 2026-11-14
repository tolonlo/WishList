import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth";
import { USER_KEYS, userAliases, type UserKey } from "@/lib/users";
import { loginSchema } from "@/lib/validation";

/** Compara en tiempo constante (hash previo para igualar longitudes). */
function iguales(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const normalizar = (s: string) => s.trim().toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");

function claveConfigurada(key: UserKey): string | undefined {
  return key === "u1" ? process.env.USER1_PASS : process.env.USER2_PASS;
}

export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null);
  const datos = loginSchema.safeParse(cuerpo);
  if (!datos.success) {
    return Response.json({ error: "Escribe tu nombre y tu clave." }, { status: 400 });
  }

  const { username, password } = datos.data;
  const userNorm = normalizar(username);
  let encontrado: UserKey | null = null;

  for (const key of USER_KEYS) {
    const pass = claveConfigurada(key);
    if (!pass) continue;
    const aliases = userAliases(key);
    const okNombre = aliases.some((alias) => iguales(userNorm, normalizar(alias)));
    const okClave = iguales(password, pass);
    if (okNombre && okClave) encontrado = key;
  }

  if (!encontrado) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: "Ese nombre y esa clave no abren este libro." }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, await signSession(encontrado), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
