import "server-only";
import { query } from "./db";
import type { Imagen, Item, ItemAjeno, ItemPayload, Prioridad } from "./types";
import type { UserKey } from "./users";

/**
 * Capa de acceso a datos. Regla de privacidad:
 *  - Las funciones del DUEÑO (listarMios, crear, actualizar, eliminar, reordenar) jamás tocan purchase_status.
 *  - listarAjenos solo une purchase_status filtrando por buyer = quien consulta.
 * Cada lectura es una sola consulta: imágenes agregadas por subconsulta indexada (sin N+1).
 */

type FilaItem = {
  id: string;
  name: string;
  url: string | null;
  notes: string | null;
  price: string | number | null;
  priority: Prioridad | null;
  position: number;
  images: Imagen[] | string;
};

const COLUMNAS = `
  i.id, i.name, i.url, i.notes, i.price, i.priority, i.position,
  COALESCE(
    (SELECT json_agg(json_build_object('id', im.id, 'url', im.url) ORDER BY im.position)
       FROM item_images im WHERE im.item_id = i.id),
    '[]'::json
  ) AS images`;

function aItem(f: FilaItem): Item {
  return {
    id: f.id,
    name: f.name,
    url: f.url,
    notes: f.notes,
    price: f.price === null ? null : Number(f.price),
    priority: f.priority,
    position: f.position,
    images: typeof f.images === "string" ? (JSON.parse(f.images) as Imagen[]) : f.images,
  };
}

export async function listarMios(owner: UserKey): Promise<Item[]> {
  const filas = await query<FilaItem>(
    `SELECT ${COLUMNAS} FROM items i WHERE i.owner = $1 ORDER BY i.position, i.created_at`,
    [owner],
  );
  return filas.map(aItem);
}

export async function listarAjenos(owner: UserKey, buyer: UserKey): Promise<ItemAjeno[]> {
  const filas = await query<FilaItem & { comprado: boolean }>(
    `SELECT ${COLUMNAS}, COALESCE(ps.status = 'comprado', false) AS comprado
       FROM items i
       LEFT JOIN purchase_status ps ON ps.item_id = i.id AND ps.buyer = $2
      WHERE i.owner = $1
      ORDER BY i.position, i.created_at`,
    [owner, buyer],
  );
  return filas.map((f) => ({ ...aItem(f), comprado: Boolean(f.comprado) }));
}

/** Datos del estante: cuántos tengo, cuántos tiene el otro y cuántos de los suyos marqué yo. */
export async function resumenEstante(yo: UserKey, otro: UserKey) {
  const [fila] = await query<{ mios: number | string; ajenos: number | string; comprados: number | string }>(
    `SELECT
       (SELECT count(*) FROM items WHERE owner = $1) AS mios,
       (SELECT count(*) FROM items WHERE owner = $2) AS ajenos,
       (SELECT count(*) FROM purchase_status ps JOIN items i ON i.id = ps.item_id
         WHERE ps.buyer = $1 AND i.owner = $2 AND ps.status = 'comprado') AS comprados`,
    [yo, otro],
  );
  return { mios: Number(fila.mios), ajenos: Number(fila.ajenos), comprados: Number(fila.comprados) };
}

export async function crearItem(owner: UserKey, p: ItemPayload): Promise<string> {
  const [fila] = await query<{ id: string }>(
    `WITH nuevo AS (
       INSERT INTO items (owner, name, url, notes, price, priority, position)
       VALUES ($1, $2, $3, $4, $5, $6,
               (SELECT COALESCE(MAX(position) + 1, 0) FROM items WHERE owner = $1))
       RETURNING id
     ), imgs AS (
       INSERT INTO item_images (item_id, url, position)
       SELECT nuevo.id, t.url, t.ord - 1
         FROM nuevo, unnest($7::text[]) WITH ORDINALITY AS t(url, ord)
     )
     SELECT id FROM nuevo`,
    [owner, p.name, p.url, p.notes, p.price, p.priority, p.images],
  );
  return fila.id;
}

/** Actualiza un item propio. Devuelve null si no existe o no es del dueño; si no, las URLs de imagen retiradas. */
export async function actualizarItem(owner: UserKey, id: string, p: ItemPayload): Promise<string[] | null> {
  const [fila] = await query<{ actualizados: number | string; anteriores: string[] | null }>(
    `WITH previas AS (
       SELECT im.url FROM item_images im JOIN items i ON i.id = im.item_id
        WHERE im.item_id = $1 AND i.owner = $2
     ), upd AS (
       UPDATE items SET name = $3, url = $4, notes = $5, price = $6, priority = $7
        WHERE id = $1 AND owner = $2
       RETURNING id
     ), borrar AS (
       DELETE FROM item_images WHERE item_id IN (SELECT id FROM upd)
     ), insertar AS (
       INSERT INTO item_images (item_id, url, position)
       SELECT upd.id, t.url, t.ord - 1
         FROM upd, unnest($8::text[]) WITH ORDINALITY AS t(url, ord)
     )
     SELECT (SELECT count(*) FROM upd) AS actualizados,
            (SELECT array_agg(url) FROM previas) AS anteriores`,
    [id, owner, p.name, p.url, p.notes, p.price, p.priority, p.images],
  );
  if (Number(fila.actualizados) === 0) return null;
  const nuevas = new Set(p.images);
  return (fila.anteriores ?? []).filter((url) => !nuevas.has(url));
}

/** Elimina un item propio. Devuelve null si no existe/no es del dueño; si no, sus URLs de imagen. */
export async function eliminarItem(owner: UserKey, id: string): Promise<string[] | null> {
  const [fila] = await query<{ eliminados: number | string; urls: string[] | null }>(
    `WITH imgs AS (
       SELECT im.url FROM item_images im JOIN items i ON i.id = im.item_id
        WHERE im.item_id = $1 AND i.owner = $2
     ), borrado AS (
       DELETE FROM items WHERE id = $1 AND owner = $2 RETURNING id
     )
     SELECT (SELECT count(*) FROM borrado) AS eliminados, (SELECT array_agg(url) FROM imgs) AS urls`,
    [id, owner],
  );
  return Number(fila.eliminados) === 0 ? null : (fila.urls ?? []);
}

/** Reordena en una sola sentencia: position = índice en la lista. Ignora ids ajenos. */
export async function reordenar(owner: UserKey, ids: string[]): Promise<void> {
  await query(
    `UPDATE items i SET position = t.ord - 1
       FROM unnest($1::uuid[]) WITH ORDINALITY AS t(id, ord)
      WHERE i.id = t.id AND i.owner = $2`,
    [ids, owner],
  );
}

/**
 * Marca el estado de compra de un item AJENO. El filtro owner = $4 (el otro) impide marcar items propios.
 * Devuelve false si el item no existe o es del propio comprador.
 */
export async function marcarCompra(
  buyer: UserKey,
  owner: UserKey,
  itemId: string,
  status: "pendiente" | "comprado",
): Promise<boolean> {
  const filas = await query(
    `INSERT INTO purchase_status (item_id, buyer, status)
     SELECT id, $2, $3 FROM items WHERE id = $1 AND owner = $4
     ON CONFLICT (item_id, buyer) DO UPDATE SET status = EXCLUDED.status, updated_at = now()
     RETURNING item_id`,
    [itemId, buyer, status, owner],
  );
  return filas.length > 0;
}
