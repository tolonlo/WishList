"use client";

import { useState } from "react";
import { dominio, dosDigitos, formatoPrecio } from "@/lib/format";
import type { Item, ItemAjeno } from "@/lib/types";
import { Flecha } from "../Icono";
import { Galeria } from "./Galeria";

const ETIQUETA_PRIORIDAD: Record<string, { texto: string; simbolo: string; clase: string }> = {
  alta: {
    texto: "Lo deseo mucho",
    simbolo: "★",
    clase: "border-[var(--c-fuerte)] bg-[color-mix(in_srgb,var(--c)_26%,var(--color-papel))] text-[var(--c-fuerte)]",
  },
  media: {
    texto: "Me encantaría",
    simbolo: "◆",
    clase: "border-mostaza-fuerte/50 bg-[color-mix(in_srgb,var(--color-mostaza)_36%,var(--color-papel))] text-mostaza-fuerte",
  },
  baja: {
    texto: "Si se da",
    simbolo: "○",
    clase: "border-regla bg-marfil text-tinta-2",
  },
};

/**
 * Pliego de producto maquetado como revista de catálogo / lookbook a doble página:
 * - Izquierda: fotografía grande a sangre controlada con tira de miniaturas.
 * - Derecha: número de pieza en serif cursiva, titular editorial, línea de precio de catálogo,
 *   tabla limpia de especificaciones/notas, botón de tienda y controles.
 */
export function PliegoProducto({
  item,
  indice,
  total,
  esMio,
  duenoNombre,
  numeroPaginaIzq,
  onEditar,
  onEliminar,
  onMover,
  onToggleCompra,
}: {
  item: Item | ItemAjeno;
  indice: number;
  total: number;
  esMio: boolean;
  duenoNombre: string;
  numeroPaginaIzq: number;
  onEditar?: () => void;
  onEliminar?: () => Promise<void>;
  onMover?: (direccion: -1 | 1) => Promise<void>;
  onToggleCompra?: (comprado: boolean) => Promise<void>;
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const comprado = !esMio && "comprado" in item && item.comprado;
  const etiquetaLibro = esMio ? "Mi catálogo" : `Catálogo de ${duenoNombre}`;
  const prioridadInfo = item.priority ? ETIQUETA_PRIORIDAD[item.priority] : null;
  const numPieza = dosDigitos(indice + 1);

  async function cambiarCompra(nuevoEstado: boolean) {
    if (!onToggleCompra || ocupado || nuevoEstado === comprado) return;
    setOcupado(true);
    try {
      await onToggleCompra(nuevoEstado);
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarEliminar() {
    if (!onEliminar || ocupado) return;
    setOcupado(true);
    try {
      await onEliminar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="pliego pliego-sombra grid grid-cols-1 rounded-[3px] bg-papel md:grid-cols-2">
      {/* Página izquierda: lámina fotográfica de catálogo */}
      <div className="pagina-izq flex min-h-0 flex-col border-b border-regla p-5 sm:p-7 md:min-h-[680px] md:border-r md:border-b-0 md:px-[46px] md:py-8">
        <header className="rotulo mb-4 flex items-center justify-between border-b border-regla pb-2.5 text-tinta-2 tabular-nums">
          <span>
            {etiquetaLibro} · Pieza {numPieza} / {dosDigitos(total)}
          </span>
          <span>Pág. {dosDigitos(numeroPaginaIzq)}</span>
        </header>

        <Galeria
          imagenes={item.images}
          nombre={item.name}
          numeroCatalogo={indice + 1}
          onAnadir={esMio ? onEditar : undefined}
        />
      </div>

      {/* Página derecha: ficha editorial de revista de catálogo */}
      <div className="pagina-der relative flex min-h-0 flex-col p-5 sm:p-7 md:min-h-[680px] md:px-[48px] md:py-8">
        <header className="rotulo mb-6 flex items-center justify-between border-b border-regla pb-2.5 text-tinta-2 tabular-nums">
          <span>Especificaciones de catálogo</span>
          <span>Pág. {dosDigitos(numeroPaginaIzq + 1)}</span>
        </header>

        {/* Sello de biblioteca "COMPRADO" — solo para el comprador en el libro del otro */}
        {!esMio && comprado && (
          <div
            aria-label="Marcado en secreto como comprado por ti"
            className="sello pointer-events-none absolute top-20 right-6 z-10 -rotate-[6deg] rounded-[2px] px-3.5 py-1.5 text-center select-none sm:top-24 sm:right-9"
          >
            <span className="block font-serif text-[22px] leading-none font-semibold tracking-[0.12em] uppercase">
              Comprado
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.08em] uppercase">
              En secreto · Solo visible para ti
            </span>
          </div>
        )}

        {/* Numeración de pieza + insignia de prioridad */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-serif text-[22px] leading-none text-[var(--c-fuerte)] italic">
            Deseo Nº {numPieza}
          </span>
          {prioridadInfo && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase ${prioridadInfo.clase}`}
            >
              <span aria-hidden="true">{prioridadInfo.simbolo}</span>
              <span>{prioridadInfo.texto}</span>
            </span>
          )}
        </div>

        {/* Titular grande estilo revista */}
        <h1 className="mt-3 max-w-[20ch] font-serif text-[clamp(38px,3.8vw,54px)] leading-[1.0] font-medium tracking-[-0.01em] text-balance">
          {item.name}
        </h1>

        {/* Línea de precio estilo catálogo impreso con línea punteada */}
        <div className="mt-6 flex items-baseline justify-between gap-3 border-y border-regla py-4">
          <span className="rotulo shrink-0 text-tinta-2">Valor estimado</span>
          <span aria-hidden="true" className="mb-1 flex-1 border-b border-dotted border-regla" />
          {item.price !== null ? (
            <span
              className="font-serif text-[clamp(44px,4.8vw,64px)] leading-[0.88] font-medium tracking-[-0.01em] text-tinta"
              style={{ fontVariantNumeric: "oldstyle-nums" }}
            >
              {formatoPrecio(item.price)}
            </span>
          ) : (
            <span className="font-serif text-[24px] text-tinta-2 italic">A elección</span>
          )}
        </div>

        {/* Bloque de notas y especificaciones tipo ficha editorial */}
        <dl className="mt-5 grid gap-4 text-[15px]">
          <div className="grid gap-1.5">
            <dt className="rotulo text-tinta-2">Notas · Talla, color o referencia</dt>
            <dd className="rounded-[2px] border-l-2 border-[var(--c-fuerte)] bg-marfil/65 px-4 py-3 leading-relaxed text-tinta">
              {item.notes ? (
                <p className="whitespace-pre-line">{item.notes}</p>
              ) : (
                <p className="font-serif text-[18px] text-tinta-2 italic">
                  Sin especificaciones adicionales — libre elección.
                </p>
              )}
            </dd>
          </div>

          {item.url && (
            <div className="flex items-center justify-between gap-4 border-t border-regla pt-4">
              <div>
                <dt className="rotulo text-tinta-2">Dónde encontrarlo</dt>
                <dd className="mt-0.5 text-sm text-tinta-2">{dominio(item.url)}</dd>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="avanzar inline-flex items-center gap-2.5 rounded-[2px] border border-tinta bg-papel px-4 py-2 text-xs font-semibold tracking-[0.06em] text-tinta uppercase transition-colors hover:bg-tinta hover:text-papel"
              >
                <span>Ver en tienda</span>
                <Flecha />
              </a>
            </div>
          )}
        </dl>

        {/* Pie de página: estado de compra privado (libro del otro) o herramientas de edición (mi libro) */}
        <div className="mt-auto border-t border-regla pt-4 mt-8">
          {!esMio ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rotulo block text-tinta-2">Registro secreto de regalo</span>
                <span className="text-xs text-tinta-2">
                  {duenoNombre} jamás verá lo que marques aquí.
                </span>
              </div>

              <div
                role="group"
                aria-label="Estado de compra"
                className="inline-flex overflow-hidden rounded-full border-[1.5px] border-tinta bg-papel"
              >
                <button
                  type="button"
                  disabled={ocupado}
                  aria-pressed={!comprado}
                  onClick={() => cambiarCompra(false)}
                  className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    !comprado ? "bg-tinta text-papel" : "text-tinta hover:bg-marfil"
                  }`}
                >
                  Pendiente
                </button>
                <button
                  type="button"
                  disabled={ocupado}
                  aria-pressed={comprado}
                  onClick={() => cambiarCompra(true)}
                  className={`border-l border-regla px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    comprado ? "bg-terracota-fuerte text-papel" : "text-tinta hover:bg-marfil"
                  }`}
                >
                  ✓ Ya lo compré
                </button>
              </div>
            </div>
          ) : confirmandoBorrado ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] bg-terracota-claro/80 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-tinta">¿Arrancar esta página de tu catálogo?</span>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setConfirmandoBorrado(false)}
                  className="text-tinta-2 hover:text-tinta"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={confirmarEliminar}
                  className="rounded-[2px] bg-terracota-fuerte px-3 py-1 text-papel hover:opacity-90"
                >
                  {ocupado ? "Borrando…" : "Sí, eliminar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-tinta-2">
              <div className="flex items-center gap-4">
                <button type="button" onClick={onEditar} className="enlace text-xs text-tinta">
                  Editar página
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoBorrado(true)}
                  className="hover:text-terracota-fuerte"
                >
                  Eliminar
                </button>
              </div>

              {total > 1 && onMover && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.04em]">Orden:</span>
                  <button
                    type="button"
                    disabled={indice === 0 || ocupado}
                    onClick={() => onMover(-1)}
                    aria-label="Mover una página antes"
                    className="rounded-[2px] border border-regla px-2 py-0.5 text-tinta hover:bg-marfil disabled:opacity-35"
                  >
                    ← Antes
                  </button>
                  <button
                    type="button"
                    disabled={indice === total - 1 || ocupado}
                    onClick={() => onMover(1)}
                    aria-label="Mover una página después"
                    className="rounded-[2px] border border-regla px-2 py-0.5 text-tinta hover:bg-marfil disabled:opacity-35"
                  >
                    Después →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
