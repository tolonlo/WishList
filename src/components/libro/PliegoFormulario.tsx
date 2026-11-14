"use client";

import { useState } from "react";
import { dosDigitos } from "@/lib/format";
import { PRIORIDADES, type Item, type ItemPayload, type Prioridad } from "@/lib/types";
import { SubidorImagenes } from "./SubidorImagenes";

/**
 * Pliego de escritura (añadir un deseo nuevo o editar uno existente).
 * Mantiene la maquetación de doble página: lámina a la izquierda, ficha editorial a la derecha.
 */
export function PliegoFormulario({
  inicial,
  numeroPaginaIzq,
  etiquetaIzq,
  onGuardar,
  onCancelar,
}: {
  inicial?: Item;
  numeroPaginaIzq: number;
  etiquetaIzq: string;
  onGuardar: (payload: ItemPayload) => Promise<void>;
  onCancelar?: () => void;
}) {
  const [name, setName] = useState(inicial?.name ?? "");
  const [url, setUrl] = useState(inicial?.url ?? "");
  const [price, setPrice] = useState(inicial?.price !== null && inicial?.price !== undefined ? String(inicial.price) : "");
  const [priority, setPriority] = useState<Prioridad | null>(inicial?.priority ?? "media");
  const [notes, setNotes] = useState(inicial?.notes ?? "");
  const [images, setImages] = useState<string[]>(() => inicial?.images.map((i) => i.url) ?? []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const nombreLimpio = name.trim();
    if (!nombreLimpio) {
      setError("Escribe el nombre de lo que deseas.");
      return;
    }

    const precioLimpio = price.trim().replace(",", ".");
    const precioNumero = precioLimpio === "" ? null : Number(precioLimpio);
    if (precioNumero !== null && (!Number.isFinite(precioNumero) || precioNumero < 0)) {
      setError("El precio aproximado debe ser un número positivo.");
      return;
    }

    const urlLimpia = url.trim();
    const urlConProtocolo =
      urlLimpia && !/^https?:\/\//i.test(urlLimpia) ? `https://${urlLimpia}` : urlLimpia || null;

    setGuardando(true);
    try {
      await onGuardar({
        name: nombreLimpio,
        url: urlConProtocolo,
        notes: notes.trim() || null,
        price: precioNumero,
        priority,
        images,
      });
      if (!inicial) {
        setName("");
        setUrl("");
        setPrice("");
        setNotes("");
        setPriority("media");
        setImages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="pliego pliego-sombra grid grid-cols-1 rounded-[3px] bg-papel md:grid-cols-2">
      {/* Página izquierda: láminas de referencia */}
      <div className="pagina-izq flex min-h-0 flex-col border-b border-regla p-5 sm:p-7 md:min-h-[680px] md:border-r md:border-b-0 md:px-[52px] md:py-8">
        <div className="rotulo mb-6 flex justify-between text-tinta-2 tabular-nums md:mb-10">
          <span>{etiquetaIzq}</span>
          <span>Pág. {dosDigitos(numeroPaginaIzq)}</span>
        </div>
        <SubidorImagenes imagenes={images} onChange={setImages} />
        <p className="mt-4 text-xs text-tinta-2">
          Consejo: si viste algo en una tienda o en Pinterest, descárgalo en tu celular y súbelo aquí.
        </p>
      </div>

      {/* Página derecha: campos del deseo */}
      <div className="pagina-der flex min-h-0 flex-col p-5 sm:p-7 md:min-h-[680px] md:px-[52px] md:py-8">
        <div className="rotulo mb-6 flex justify-between text-tinta-2 tabular-nums md:mb-10">
          <span>{inicial ? "Editar página" : "Escribir una página nueva"}</span>
          <span>Pág. {dosDigitos(numeroPaginaIzq + 1)}</span>
        </div>

        <h2 className="mb-5 font-serif text-[clamp(30px,3.2vw,42px)] leading-[1.04] font-medium text-balance">
          {inicial ? "Corregir este deseo" : "¿Qué te gustaría recibir?"}
        </h2>

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="rotulo text-tinta-2">Nombre del deseo *</span>
            <input
              type="text"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cafetera italiana Bialetti 3 tazas"
              className="campo"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <label className="grid gap-1.5">
              <span className="rotulo text-tinta-2">Link específico (opcional)</span>
              <input
                type="text"
                inputMode="url"
                maxLength={2048}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://tienda.com/producto"
                className="campo"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="rotulo text-tinta-2">Precio aprox.</span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45000"
                className="campo tabular-nums"
              />
            </label>
          </div>

          <fieldset className="grid gap-1.5">
            <legend className="rotulo text-tinta-2">Prioridad</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRIORIDADES.map((p) => {
                const activa = priority === p.valor;
                return (
                  <button
                    key={p.valor}
                    type="button"
                    data-color={p.color}
                    aria-pressed={activa}
                    onClick={() => setPriority(activa ? null : p.valor)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      activa
                        ? "bg-[var(--c)] text-tinta ring-1.5 ring-tinta"
                        : "bg-placa/80 text-tinta-2 hover:bg-placa hover:text-tinta"
                    }`}
                  >
                    {p.etiqueta}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-1.5">
            <span className="rotulo text-tinta-2">Detalles / comentarios (talla, color, modelo…)</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Color crema o aluminio clásico, talla M, cualquier edición…"
              className="campo resize-y bg-terracota-claro/55"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-[3px] bg-terracota-claro px-3.5 py-2.5 text-[14px] text-tinta">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-regla pt-4 mt-6">
          {onCancelar ? (
            <button type="button" onClick={onCancelar} className="text-sm font-semibold text-tinta-2 hover:text-tinta">
              Cancelar cambios
            </button>
          ) : (
            <span className="text-xs text-tinta-2">Quedará guardado al final de tu libro.</span>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="rounded-[3px] bg-tinta px-5 py-2.5 text-xs font-semibold tracking-[0.06em] text-papel uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {guardando ? "Guardando página…" : inicial ? "Guardar cambios" : "Añadir al libro"}
          </button>
        </div>
      </div>
    </form>
  );
}
