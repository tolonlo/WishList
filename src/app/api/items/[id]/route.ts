import { actualizarItem, eliminarItem } from "@/lib/items";
import { requireSesion } from "@/lib/session";
import { borrarImagenes } from "@/lib/storage";
import { idSchema, itemSchema, primerError } from "@/lib/validation";

/** PATCH /api/items/:id → edita un item propio (404 si no existe o es del otro). */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "No encontrado" }, { status: 404 });

  const datos = itemSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: primerError(datos.error) }, { status: 400 });

  try {
    const retiradas = await actualizarItem(sesion.yo, id.data, datos.data);
    if (retiradas === null) return Response.json({ error: "No encontrado" }, { status: 404 });
    await borrarImagenes(retiradas);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/items/:id] Error al actualizar", err);
    return Response.json({ error: "No se pudo guardar. Inténtalo de nuevo." }, { status: 500 });
  }
}

/** DELETE /api/items/:id → elimina un item propio y sus imágenes. */
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return Response.json({ error: "No encontrado" }, { status: 404 });

  try {
    const urls = await eliminarItem(sesion.yo, id.data);
    if (urls === null) return Response.json({ error: "No encontrado" }, { status: 404 });
    await borrarImagenes(urls);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/items/:id] Error al eliminar", err);
    return Response.json({ error: "No se pudo eliminar. Inténtalo de nuevo." }, { status: 500 });
  }
}
