import { SignJWT, jwtVerify } from "jose";
import { isUserKey, type UserKey } from "./users";

/** Token de sesión firmado (HS256). Este módulo no usa APIs de Node: sirve en proxy y en handlers. */
export const SESSION_COOKIE = "deseos_sesion";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe existir y tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(user: UserKey): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<UserKey | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return isUserKey(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}
