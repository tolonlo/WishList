import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UserKey } from "./users";

/**
 * Producción: Vercel Blob (público, nombre aleatorio no adivinable).
 * Desarrollo sin BLOB_READ_WRITE_TOKEN: archivos en ./public/uploads.
 */
const usaBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const DIR_LOCAL = path.join(process.cwd(), "public", "uploads");

const EXTENSION: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function tipoPermitido(tipo: string): boolean {
  return tipo in EXTENSION;
}

export async function guardarImagen(owner: UserKey, datos: ArrayBuffer, tipo: string): Promise<string> {
  const nombre = `${owner}-${randomUUID()}.${EXTENSION[tipo]}`;
  if (usaBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`deseos/${nombre}`, datos, { access: "public", contentType: tipo });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN no está configurado.");
  await mkdir(DIR_LOCAL, { recursive: true });
  await writeFile(path.join(DIR_LOCAL, nombre), Buffer.from(datos));
  return `/uploads/${nombre}`;
}

/** Borra imágenes que ya no se usan. Nunca lanza: un fallo aquí no debe romper la operación principal. */
export async function borrarImagenes(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  try {
    const remotas = urls.filter((u) => u.startsWith("https://"));
    if (remotas.length && usaBlob()) {
      const { del } = await import("@vercel/blob");
      await del(remotas);
    }
    const locales = urls.filter((u) => /^\/uploads\/[\w.-]+$/.test(u));
    await Promise.all(locales.map((u) => unlink(path.join(DIR_LOCAL, path.basename(u))).catch(() => {})));
  } catch (err) {
    console.error("[storage] No se pudieron borrar imágenes", err);
  }
}

/** Comprueba la firma real del archivo (no basta con el Content-Type que manda el cliente). */
export function firmaCoincide(bytes: Uint8Array, tipo: string): boolean {
  const empieza = (...b: number[]) => b.every((v, i) => bytes[i] === v);
  if (tipo === "image/jpeg") return empieza(0xff, 0xd8, 0xff);
  if (tipo === "image/png") return empieza(0x89, 0x50, 0x4e, 0x47);
  if (tipo === "image/webp")
    return empieza(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}
