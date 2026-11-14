"use client";

import { dosDigitos, formatoPrecio, plural } from "@/lib/format";
import type { Item, ItemAjeno } from "@/lib/types";
import { Flecha, Icono } from "../Icono";

export type OrdenLibro = "manual" | "precio_asc" | "precio_desc" | "prioridad";

const SUBTITULO_ORDEN: Record<OrdenLibro, string> = {
  manual: "Toca cualquier título para abrir directamente su página, o pasa las hojas con las flechas.",
  precio_asc: "Ordenado de menor a mayor precio · Toca cualquier deseo para abrir su página.",
  precio_desc: "Ordenado de mayor a menor precio · Toca cualquier deseo para abrir su página.",
  prioridad: "Ordenado por prioridad (★ primero) · Toca cualquier deseo para abrir su página.",
};

/**
 * Primer pliego del libro:
 * - Página izquierda: cubierta interior de color plano con título en serif gigante, dueño y conteo.
 * - Página derecha: sumario / índice interactivo de deseos (o estado vacío con tono editorial).
 */
export function PliegoPortada({
  esMio,
  duenoNombre,
  items,
  orden = "manual",
  onIrAPliego,
}: {
  esMio: boolean;
  duenoNombre: string;
  items: (Item | ItemAjeno)[];
  orden?: OrdenLibro;
  onIrAPliego: (pliego: number) => void;
}) {
  const total = items.length;
  const comprados = esMio ? 0 : items.filter((it) => "comprado" in it && it.comprado).length;
  const tituloLibro = esMio ? "Mi carrito" : `Carrito de ${duenoNombre}`;

  return (
    <div className="pliego pliego-sombra grid grid-cols-1 rounded-[3px] bg-papel md:grid-cols-2">
      {/* Página izquierda: portada interior */}
      <div className="pagina-izq flex min-h-0 flex-col border-b border-regla p-4 sm:p-7 md:min-h-[680px] md:border-r md:border-b-0 md:px-[52px] md:py-8">
        <div className="rotulo mb-4 flex justify-between text-tinta-2 tabular-nums md:mb-11">
          <span>{tituloLibro} · Portada</span>
          <span>Pág. 01</span>
        </div>

        <div className="relative flex min-h-[210px] flex-1 flex-col justify-between rounded-[2px] bg-[var(--c)] p-5 text-[var(--c-texto)] shadow-[inset_12px_0_#25332b14] sm:min-h-[320px] sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <span className="rotulo">{tituloLibro}</span>
            <Icono nombre={esMio ? "regalo" : "corazon"} tamano={32} />
          </div>

          <div className="my-4 sm:my-8">
            <h1 className="font-serif text-[clamp(32px,5vw,66px)] leading-[0.98] font-medium text-balance">
              {esMio ? "Mi carrito" : `Carrito de ${duenoNombre}`}
            </h1>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-relaxed opacity-90 sm:mt-3 sm:text-[16px]">
              {esMio
                ? "Lo que me haría ilusión recibir."
                : `Cuando compres algo, márcalo con el sello: ${duenoNombre} nunca lo verá.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-current/35 pt-3 text-xs font-semibold tracking-[0.06em] uppercase">
            <span>{plural(total, "deseo", "deseos")}</span>
            {!esMio && total > 0 && (
              <span>
                {comprados} / {total} comprados
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Página derecha: sumario / índice o estado vacío */}
      <div className="pagina-der flex min-h-0 flex-col p-5 sm:p-7 md:min-h-[680px] md:px-[52px] md:py-8">
        <div className="rotulo mb-6 flex justify-between text-tinta-2 tabular-nums md:mb-11">
          <span>Sumario del volumen</span>
          <span>Pág. 02</span>
        </div>

        {total === 0 ? (
          <div className="my-auto flex flex-col items-start gap-4 py-8">
            <span className="rotulo text-tinta-2">Volumen sin estrenar</span>
            <h2 className="font-serif text-[clamp(34px,3.4vw,46px)] leading-[1.05] font-medium text-balance">
              {esMio
                ? "Tu libro aún está en blanco. Escribe la primera página."
                : `El libro de ${duenoNombre} aún está en blanco.`}
            </h2>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-tinta-2">
              {esMio
                ? "Pasa a la siguiente hoja para añadir tu primer deseo con foto, link, precio aproximado y detalles."
                : "Todavía no ha anotado ningún deseo. Vuelve a asomarte más adelante."}
            </p>
            {esMio && (
              <button
                type="button"
                onClick={() => onIrAPliego(2)}
                className="avanzar mt-2 inline-flex items-center gap-2.5 py-2 text-[16px] font-semibold text-tinta"
              >
                <span>Escribir la primera página</span>
                <Flecha />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <h2 className="font-serif text-[clamp(32px,3.2vw,44px)] leading-[1.05] font-medium">
              Índice de deseos
            </h2>
            <p className="mt-1.5 text-[15px] text-tinta-2">
              {SUBTITULO_ORDEN[orden]}
            </p>

            <ol className="mt-6 divide-y divide-regla border-y border-regla">
              {items.map((item, idx) => {
                const comprado = !esMio && "comprado" in item && item.comprado;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onIrAPliego(idx + 2)}
                      className="group grid w-full grid-cols-[38px_1fr_auto] items-baseline gap-2 px-2 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--c)_28%,transparent)]"
                    >
                      <span className="text-xs font-semibold text-tinta-2 tabular-nums">
                        {dosDigitos(idx + 1)}
                      </span>
                      <span className="font-serif text-[23px] leading-[1.15] font-medium text-tinta group-hover:underline">
                        {item.name}
                      </span>
                      <span className="flex items-center gap-2.5 text-xs font-semibold tabular-nums">
                        {comprado && (
                          <span className="rounded-[2px] border border-terracota-fuerte px-1.5 py-0.5 text-[10px] tracking-[0.06em] text-terracota-fuerte uppercase">
                            Comprado
                          </span>
                        )}
                        {item.price !== null ? (
                          <span className="text-tinta-2">{formatoPrecio(item.price)}</span>
                        ) : (
                          <span className="font-normal text-tinta-2/75 italic">A elección</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
              <button
                type="button"
                onClick={() => onIrAPliego(2)}
                className="avanzar inline-flex items-center gap-2.5 py-1.5 text-[15px] font-semibold text-tinta"
              >
                <span>Empezar por el primer deseo</span>
                <Flecha />
              </button>

              {esMio && (
                <button
                  type="button"
                  onClick={() => onIrAPliego(total + 2)}
                  className="enlace text-[14px]"
                >
                  + Añadir otro deseo al final
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
