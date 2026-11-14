import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./auth";
import { otherKey, userColor, userName, type UserKey } from "./users";

export type Sesion = {
  yo: UserKey;
  otro: UserKey;
  miNombre: string;
  otroNombre: string;
  miColor: "naranja" | "morado";
  otroColor: "naranja" | "morado";
};

function construir(yo: UserKey): Sesion {
  const otro = otherKey(yo);
  return {
    yo,
    otro,
    miNombre: userName(yo),
    otroNombre: userName(otro),
    miColor: userColor(yo),
    otroColor: userColor(otro),
  };
}

/** Lee y valida la cookie. Devuelve null si no hay sesión válida. */
export async function getSesion(): Promise<Sesion | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const yo = await verifySession(token);
  return yo ? construir(yo) : null;
}

/** Para route handlers: sesión o respuesta 401. */
export async function requireSesion(): Promise<Sesion | Response> {
  const sesion = await getSesion();
  return sesion ?? Response.json({ error: "No autorizado" }, { status: 401 });
}
