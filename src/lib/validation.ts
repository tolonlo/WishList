import { z } from "zod";
import { MAX_IMAGENES } from "./types";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null));

const esHttp = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

/** Solo se aceptan imágenes que hayamos subido nosotros (Blob) o, en desarrollo, /uploads local. */
const esImagenPropia = (v: string) => {
  if (v.startsWith("/uploads/") && /^\/uploads\/[\w.-]+$/.test(v)) return !process.env.VERCEL;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
};

export const itemSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(160, "Máximo 160 caracteres"),
  url: textoOpcional(2048).refine((v) => v === null || esHttp(v), "El link debe empezar con http:// o https://"),
  notes: textoOpcional(2000),
  price: z
    .number()
    .finite()
    .nonnegative("El precio no puede ser negativo")
    .max(9_999_999_999)
    .nullish()
    .transform((v) => (v === undefined ? null : v)),
  priority: z
    .enum(["alta", "media", "baja"])
    .nullish()
    .transform((v) => v ?? null),
  images: z
    .array(z.string().max(2048).refine(esImagenPropia, "Imagen no válida"))
    .max(MAX_IMAGENES, `Máximo ${MAX_IMAGENES} imágenes`)
    .default([]),
});

export const idSchema = z.uuid();

export const reorderSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(500),
});

export const purchaseSchema = z.object({
  status: z.enum(["pendiente", "comprado"]),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

/** Primer mensaje de error legible de un ZodError. */
export function primerError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos";
}
