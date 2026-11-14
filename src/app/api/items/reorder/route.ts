import { reordenar } from "@/lib/items";
import { requireSesion } from "@/lib/session";
import { primerError, reorderSchema } from "@/lib/validation";

/** POST /api/items/reorder { ids } → nuevo orden de MIS items (los ajenos se ignoran en SQL). */
export async function POST(request: Request) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const datos = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return Response.json({ error: primerError(datos.error) }, { status: 400 });

  try {
    await reordenar(sesion.yo, datos.data.ids);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/items/reorder] Error", err);
    return Response.json({ error: "No se pudo reordenar." }, { status: 500 });
  }
}
