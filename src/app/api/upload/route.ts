import { requireSesion } from "@/lib/session";
import { firmaCoincide, guardarImagen, tipoPermitido } from "@/lib/storage";

const MAX_BYTES = 4 * 1024 * 1024; // < 4.5 MB (límite de cuerpo de Vercel). El cliente ya comprime a ~1600px.

/** POST /api/upload (multipart, campo "file") → { url } */
export async function POST(request: Request) {
  const sesion = await requireSesion();
  if (sesion instanceof Response) return sesion;

  const form = await request.formData().catch(() => null);
  const archivo = form?.get("file");
  if (!(archivo instanceof File)) {
    return Response.json({ error: "No llegó ninguna imagen." }, { status: 400 });
  }
  if (!tipoPermitido(archivo.type)) {
    return Response.json({ error: "Formato no admitido (usa JPG, PNG o WebP)." }, { status: 415 });
  }
  if (archivo.size > MAX_BYTES) {
    return Response.json({ error: "La imagen pesa demasiado (máx. 4 MB)." }, { status: 413 });
  }

  const datos = await archivo.arrayBuffer();
  if (!firmaCoincide(new Uint8Array(datos, 0, Math.min(12, datos.byteLength)), archivo.type)) {
    return Response.json({ error: "El archivo no parece una imagen válida." }, { status: 415 });
  }

  try {
    const url = await guardarImagen(sesion.yo, datos, archivo.type);
    return Response.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[api/upload] Error", err);
    return Response.json({ error: "No se pudo subir la imagen." }, { status: 500 });
  }
}
