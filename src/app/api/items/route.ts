import { crearItem, listarAjenos, listarMios } from "@/lib/items";
import { requireSesion } from "@/lib/session";
import { itemSchema, primerError } from "@/lib/validation";

/**
 * GET /api/items?libro=mio  → mis items, SIN estado de compra.
 * GET /api/items?libro=otro → items del otro + solo MI estado de compra.
 */
export async function GET(request: Request) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const libro = new URL(request.url).searchParams.get("libro") ?? "mio";
  if (libro === "otro") {
    return Response.json({ items: await listarAjenos(sesion.otro, sesion.yo) });
  }
  if (libro === "mio") {
    return Response.json({ items: await listarMios(sesion.yo) });
  }
  return Response.json({ error: "Libro no válido" }, { status: 400 });
}

/** POST /api/items → crea un item en MI carrito. El dueño sale de la sesión, nunca del cuerpo. */
export async function POST(request: Request) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const datos = itemSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: primerError(datos.error) }, { status: 400 });

  try {
    const id = await crearItem(sesion.yo, datos.data);
    return Response.json({ id }, { status: 201 });
  } catch (err) {
    console.error("[api/items] Error al crear", err);
    return Response.json({ error: "No se pudo guardar. Inténtalo de nuevo." }, { status: 500 });
  }
}
