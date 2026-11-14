"use client";

import Image from "next/image";
import { useState } from "react";
import { dosDigitos } from "@/lib/format";
import type { Imagen } from "@/lib/types";
import { Flecha, Icono } from "../Icono";

/** Lámina fotográfica estilo revista de catálogo / lookbook con miniaturas y cambio de toma. */
export function Galeria({
  imagenes,
  nombre,
  numeroCatalogo = 1,
  onAnadir,
}: {
  imagenes: Imagen[];
  nombre: string;
  numeroCatalogo?: number;
  onAnadir?: () => void;
}) {
  const [activa, setActiva] = useState(0);
  const [modoAjuste, setModoAjuste] = useState<"cover" | "contain">("cover");
  const indice = Math.min(activa, Math.max(0, imagenes.length - 1));
  const actual = imagenes[indice];

  if (!actual) {
    return (
      <div className="placa-trama relative flex min-h-[360px] flex-1 flex-col items-center justify-center gap-4 rounded-[2px] border border-regla bg-marfil/70 px-6 py-10 text-center text-tinta md:min-h-[470px]">
        <span className="font-serif text-[20px] text-tinta-2 italic">Lámina Nº {dosDigitos(numeroCatalogo)}</span>
        <Icono nombre="imagen" tamano={42} />
        <p className="max-w-[16ch] font-serif text-[28px] leading-[1.12] font-medium">Sin fotografía en catálogo</p>
        {onAnadir ? (
          <button type="button" onClick={onAnadir} className="enlace text-[15px]">
            + Subir fotografías
          </button>
        ) : (
          <p className="text-sm text-tinta-2">Consulta el enlace directo y las notas de la página contigua.</p>
        )}
        <span className="rotulo absolute bottom-4 left-5 text-tinta-2">Espacio reservado</span>
      </div>
    );
  }

  return (
    <figure className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Marco principal tipo editorial de revista */}
      <div className="group relative min-h-[360px] flex-1 overflow-hidden rounded-[2px] border border-regla bg-marfil/60 md:min-h-[460px]">
        <Image
          key={actual.id}
          src={actual.url}
          alt={imagenes.length > 1 ? `${nombre}, fotografía ${indice + 1} de ${imagenes.length}` : nombre}
          fill
          unoptimized
          sizes="(min-width: 768px) 560px, 100vw"
          className={`transition-transform duration-500 ${
            modoAjuste === "cover" ? "object-cover" : "object-contain p-3"
          }`}
          priority={indice === 0}
        />

        {/* Sello editorial superior izquierdo */}
        <span className=" absolute top-3 left-3 rounded-[2px] bg-papel/90 px-2.5 py-1 font-serif text-[15px] text-tinta italic shadow-xs backdrop-blur-[2px]">
          Fig. {dosDigitos(numeroCatalogo)}.{indice + 1}
        </span>

        {/* Botón sutil para alternar entre lookbook lleno (cover) o foto entera (contain) */}
        <button
          type="button"
          onClick={() => setModoAjuste((m) => (m === "cover" ? "contain" : "cover"))}
          className="rotulo absolute top-3 right-3 rounded-[2px] bg-papel/90 px-2.5 py-1 text-[10px] text-tinta-2 opacity-85 shadow-xs backdrop-blur-[2px] transition-opacity hover:text-tinta hover:opacity-100"
        >
          {modoAjuste === "cover" ? "Ver entera" : "Llenar página"}
        </button>

        {/* Controles rápidos sobre la imagen si hay varias tomas */}
        {imagenes.length > 1 && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiva((i) => (i - 1 + imagenes.length) % imagenes.length)}
              aria-label="Fotografía anterior"
              className="grid h-8 w-8 place-items-center rounded-full border border-regla bg-papel/92 text-tinta shadow-xs hover:bg-tinta hover:text-papel"
            >
              <Flecha izquierda />
            </button>
            <span className="rotulo rounded-full bg-papel/92 px-3 py-1 text-[11px] text-tinta tabular-nums shadow-xs">
              Toma {indice + 1} / {imagenes.length}
            </span>
            <button
              type="button"
              onClick={() => setActiva((i) => (i + 1) % imagenes.length)}
              aria-label="Fotografía siguiente"
              className="grid h-8 w-8 place-items-center rounded-full border border-regla bg-papel/92 text-tinta shadow-xs hover:bg-tinta hover:text-papel"
            >
              <Flecha />
            </button>
          </div>
        )}
      </div>

      {/* Tira de contacto / miniaturas o pie de foto de revista */}
      {imagenes.length > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <ul className="flex gap-2 overflow-x-auto py-0.5" aria-label="Miniaturas del producto">
            {imagenes.map((img, i) => (
              <li key={img.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiva(i)}
                  aria-label={`Ver fotografía ${i + 1}`}
                  aria-pressed={i === indice}
                  className={`relative block h-14 w-14 overflow-hidden rounded-[2px] border bg-marfil transition-all ${
                    i === indice
                      ? "border-tinta ring-1 ring-tinta"
                      : "border-regla opacity-65 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <figcaption className="hidden text-right font-serif text-[15px] text-tinta-2 italic sm:block">
            {imagenes.length} fotografías en archivo
          </figcaption>
        </div>
      ) : (
        <figcaption className="flex items-center justify-between border-t border-regla pt-2 text-xs text-tinta-2">
          <span className="font-serif text-[15px] italic">{nombre}</span>
          <span className="rotulo text-[10px]">Fotografía de referencia</span>
        </figcaption>
      )}
    </figure>
  );
}
