import { marcarCompra } from "@/lib/items";
import { requireSesion } from "@/lib/session";
import { idSchema, purchaseSchema } from "@/lib/validation";

/**
 * PUT /api/purchases/:itemId { status } → marca en secreto un item del OTRO.
 * El comprador sale de la sesión; marcar un item propio devuelve 404 (el SQL exige owner = otro).
 */
export async function PUT(request: Request, ctx: { params: Promise<{ itemId: string }> }) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const itemId = idSchema.safeParse((await ctx.params).itemId);
  if (!itemId.success) return Response.json({ error: "No encontrado" }, { status: 404 });

  const datos = purchaseSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: "Estado no válido" }, { status: 400 });

  try {
    const ok = await marcarCompra(sesion.yo, sesion.otro, itemId.data, datos.data.status);
    if (!ok) return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ status: datos.data.status });
  } catch (err) {
    console.error("[api/purchases] Error", err);
    return Response.json({ error: "No se pudo guardar el estado." }, { status: 500 });
  }
}
