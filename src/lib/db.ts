import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type Fila = Record<string, unknown>;
type Ejecutor = (text: string, params: unknown[]) => Promise<Fila[]>;

/**
 * Producción: Neon (HTTP, sin estado, ideal para funciones serverless).
 * Desarrollo sin DATABASE_URL: PGlite en disco (./.pglite) con la migración aplicada al arrancar.
 * Toda consulta es parametrizada ($1, $2…): nunca se interpolan valores.
 */
const globalDb = globalThis as unknown as { __deseosDb?: Promise<Ejecutor> };

const ESQUEMA_INICIAL = [
  `CREATE TABLE IF NOT EXISTS items (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     owner       text NOT NULL CHECK (owner IN ('u1', 'u2')),
     name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
     url         text CHECK (url IS NULL OR char_length(url) <= 2048),
     notes       text CHECK (notes IS NULL OR char_length(notes) <= 2000),
     price       numeric(12, 2) CHECK (price IS NULL OR price >= 0),
     priority    text CHECK (priority IS NULL OR priority IN ('alta', 'media', 'baja')),
     position    integer NOT NULL DEFAULT 0,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS items_owner_position_idx ON items (owner, position, created_at)`,
  `CREATE TABLE IF NOT EXISTS item_images (
     id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     item_id   uuid NOT NULL REFERENCES items (id) ON DELETE CASCADE,
     url       text NOT NULL CHECK (char_length(url) <= 2048),
     position  integer NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS item_images_item_idx ON item_images (item_id, position)`,
  `CREATE TABLE IF NOT EXISTS purchase_status (
     item_id     uuid NOT NULL REFERENCES items (id) ON DELETE CASCADE,
     buyer       text NOT NULL CHECK (buyer IN ('u1', 'u2')),
     status      text NOT NULL CHECK (status IN ('pendiente', 'comprado')),
     updated_at  timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (item_id, buyer)
   )`,
  `CREATE INDEX IF NOT EXISTS purchase_status_buyer_idx ON purchase_status (buyer)`,
];

async function crearEjecutor(): Promise<Ejecutor> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    for (const sentencia of ESQUEMA_INICIAL) {
      await sql.query(sentencia, []);
    }
    return (text, params) => sql.query(text, params) as Promise<Fila[]>;
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.join(process.cwd(), ".pglite"));
  const migracion = await readFile(path.join(process.cwd(), "db/migrations/001_init.sql"), "utf8");
  await db.exec(migracion);
  console.info("[db] Usando PGlite local en ./.pglite (modo desarrollo).");
  return async (text, params) => (await db.query<Fila>(text, params)).rows;
}

export async function query<T = Fila>(text: string, params: unknown[] = []): Promise<T[]> {
  globalDb.__deseosDb ??= crearEjecutor().catch((err) => {
    globalDb.__deseosDb = undefined; // permite reintentar tras un fallo de conexión
    throw err;
  });
  const ejecutar = await globalDb.__deseosDb;
  return (await ejecutar(text, params)) as T[];
}
