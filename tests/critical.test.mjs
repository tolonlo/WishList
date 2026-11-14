import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode("secreto-de-prueba-con-mas-de-32-caracteres-2026");

test("JWT de sesión firma y rechaza tokens manipulados", async () => {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("u1")
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);

  const { payload } = await jwtVerify(token, SECRET, { algorithms: ["HS256"] });
  assert.equal(payload.sub, "u1");

  const otroSecreto = new TextEncoder().encode("otro-secreto-distinto-con-mas-de-32-caracteres");
  await assert.rejects(() => jwtVerify(token, otroSecreto, { algorithms: ["HS256"] }));
});

test("Esquema SQL, privacidad de purchase_status y plan de consulta (EXPLAIN)", async () => {
  const db = new PGlite();
  const sql = await readFile(new URL("../db/migrations/001_init.sql", import.meta.url), "utf8");
  await db.exec(sql);

  // 1. Crear un deseo de u1 con dos imágenes
  const creado = await db.query(
    `WITH nuevo AS (
       INSERT INTO items (owner, name, url, notes, price, priority, position)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING id
     ), imgs AS (
       INSERT INTO item_images (item_id, url, position)
       SELECT nuevo.id, t.url, t.ord - 1
         FROM nuevo, unnest($7::text[]) WITH ORDINALITY AS t(url, ord)
     )
     SELECT id FROM nuevo`,
    [
      "u1",
      "Cafetera Bialetti",
      "https://ejemplo.com/cafetera",
      "Color aluminio, 3 tazas",
      45000,
      "alta",
      ["/uploads/a.webp", "/uploads/b.webp"],
    ],
  );
  const itemId = creado.rows[0].id;
  assert.ok(itemId);

  // 2. u1 NO puede marcar como comprado su propio item (owner debe ser el otro)
  const intentoPropio = await db.query(
    `INSERT INTO purchase_status (item_id, buyer, status)
     SELECT id, $2, $3 FROM items WHERE id = $1 AND owner = $4
     RETURNING item_id`,
    [itemId, "u1", "comprado", "u2"],
  );
  assert.equal(intentoPropio.rows.length, 0);

  // 3. u2 marca en secreto como comprado el item de u1
  const marcadoPorPareja = await db.query(
    `INSERT INTO purchase_status (item_id, buyer, status)
     SELECT id, $2, $3 FROM items WHERE id = $1 AND owner = $4
     ON CONFLICT (item_id, buyer) DO UPDATE SET status = EXCLUDED.status
     RETURNING item_id, status`,
    [itemId, "u2", "comprado", "u1"],
  );
  assert.equal(marcadoPorPareja.rows.length, 1);
  assert.equal(marcadoPorPareja.rows[0].status, "comprado");

  // 4. La consulta del dueño (u1) jamás expone estado de compra
  const vistaDueno = await db.query(
    `SELECT i.id, i.name, i.url, i.notes, i.price, i.priority, i.position
       FROM items i WHERE i.owner = $1 ORDER BY i.position, i.created_at`,
    ["u1"],
  );
  assert.equal(vistaDueno.rows.length, 1);
  assert.equal("comprado" in vistaDueno.rows[0], false);
  assert.equal("status" in vistaDueno.rows[0], false);

  // 5. La consulta del comprador (u2) sí ve su sello privado
  const vistaComprador = await db.query(
    `SELECT i.id, COALESCE(ps.status = 'comprado', false) AS comprado
       FROM items i
       LEFT JOIN purchase_status ps ON ps.item_id = i.id AND ps.buyer = $2
      WHERE i.owner = $1`,
    ["u1", "u2"],
  );
  assert.equal(vistaComprador.rows[0].comprado, true);

  // 6. Verificar plan de ejecución con EXPLAIN sobre la consulta con índice
  await db.exec("SET enable_seqscan = off;");
  const plan = await db.query(
    `EXPLAIN SELECT i.id, i.name FROM items i WHERE i.owner = $1 ORDER BY i.position, i.created_at`,
    ["u1"],
  );
  const textoPlan = plan.rows.map((r) => Object.values(r).join(" ")).join("\n");
  assert.match(textoPlan, /items_owner_position_idx/);
});

test("Ordenamiento del libro por precio (menor a mayor, mayor a menor) y prioridad mantiene sin precio al final", () => {
  const PESO = { alta: 0, media: 1, baja: 2 };
  function ordenar(lista, orden) {
    if (orden === "manual" || lista.length <= 1) return lista;
    return lista.slice().sort((a, b) => {
      if (orden === "precio_asc") {
        if (a.price === null && b.price === null) return a.position - b.position;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price || a.position - b.position;
      }
      if (orden === "precio_desc") {
        if (a.price === null && b.price === null) return a.position - b.position;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return b.price - a.price || a.position - b.position;
      }
      const pa = a.priority ? (PESO[a.priority] ?? 3) : 3;
      const pb = b.priority ? (PESO[b.priority] ?? 3) : 3;
      if (pa !== pb) return pa - pb;
      const precioA = a.price ?? Number.POSITIVE_INFINITY;
      const precioB = b.price ?? Number.POSITIVE_INFINITY;
      if (precioA !== precioB) return precioA - precioB;
      return a.position - b.position;
    });
  }

  const muestra = [
    { id: "1", name: "Chaqueta", price: 180000, priority: "media", position: 0 },
    { id: "2", name: "Libro sorpresa", price: null, priority: "alta", position: 1 },
    { id: "3", name: "Medias", price: 25000, priority: "baja", position: 2 },
    { id: "4", name: "Camiseta", price: 70000, priority: "alta", position: 3 },
  ];

  assert.deepEqual(
    ordenar(muestra, "precio_asc").map((i) => i.name),
    ["Medias", "Camiseta", "Chaqueta", "Libro sorpresa"],
  );
  assert.deepEqual(
    ordenar(muestra, "precio_desc").map((i) => i.name),
    ["Chaqueta", "Camiseta", "Medias", "Libro sorpresa"],
  );
  assert.deepEqual(
    ordenar(muestra, "prioridad").map((i) => i.name),
    ["Camiseta", "Libro sorpresa", "Chaqueta", "Medias"],
  );
});
