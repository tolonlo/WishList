/** Los dos únicos usuarios. Las claves 'u1'/'u2' son estables; nombres y contraseñas viven en env. */
export type UserKey = "u1" | "u2";

export type Usuario = { key: UserKey; name: string };

export const USER_KEYS: readonly UserKey[] = ["u1", "u2"] as const;

export function isUserKey(value: unknown): value is UserKey {
  return value === "u1" || value === "u2";
}

export function otherKey(key: UserKey): UserKey {
  return key === "u1" ? "u2" : "u1";
}

/** Nombre corto para toda la interfaz ("Tom" y "Val"). */
export function userName(key: UserKey): string {
  const raw = (key === "u1" ? process.env.USER1_NAME : process.env.USER2_NAME)?.trim();
  if (!raw) return key === "u1" ? "Tom" : "Val";
  if (/^tom[aá]s$/i.test(raw)) return "Tom";
  if (/^val(eria|entina)?$/i.test(raw)) return "Val";
  return raw;
}

/** Nombres aceptados en el login para cada usuario (tanto el corto como el completo). */
export function userAliases(key: UserKey): string[] {
  const raw = (key === "u1" ? process.env.USER1_NAME : process.env.USER2_NAME)?.trim();
  const corto = userName(key);
  return Array.from(new Set([corto, raw ?? corto, key === "u1" ? "Tomás" : "Valeria"]));
}

/** Color fijo por persona: naranja mandarina cálido para Tom (u1), morado orquídea vivo para Val (u2). */
export function userColor(key: UserKey): "naranja" | "morado" {
  return key === "u1" ? "naranja" : "morado";
}
