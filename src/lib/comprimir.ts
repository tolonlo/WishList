/** Compresión y redimensionado en el navegador antes de subir (móvil: fotos de 4–12 MB → ~200–500 KB). */
const LADO_MAX = 1600;
const CALIDAD = 0.82;

async function decodificar(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Respaldo para navegadores que no decodifican el formato con createImageBitmap.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, CALIDAD));
}

export async function comprimirImagen(file: File): Promise<File> {
  let fuente: ImageBitmap | HTMLImageElement;
  try {
    fuente = await decodificar(file);
  } catch {
    throw new Error("No se pudo leer esta imagen. Prueba con JPG o PNG.");
  }

  const ancho = "naturalWidth" in fuente ? fuente.naturalWidth : fuente.width;
  const alto = "naturalHeight" in fuente ? fuente.naturalHeight : fuente.height;
  const escala = Math.min(1, LADO_MAX / Math.max(ancho, alto));
  const w = Math.max(1, Math.round(ancho * escala));
  const h = Math.max(1, Math.round(alto * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo procesar la imagen.");
  ctx.fillStyle = "#faf8f4"; // fondo papel para PNG con transparencia
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(fuente, 0, 0, w, h);
  if ("close" in fuente) fuente.close();

  // WebP si el navegador sabe codificarlo; si no (Safari antiguo), JPEG.
  let blob = await aBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await aBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `imagen.${ext}`, { type: blob.type });
}
