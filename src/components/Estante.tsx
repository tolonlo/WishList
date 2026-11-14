"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { plural } from "@/lib/format";
import { Icono, type NombreIcono } from "./Icono";

type Caja = {
  libro: "mio" | "otro";
  titulo: string;
  color: string;
  icono: NombreIcono;
  subtitulo: string;
  barras: { total: number; llenas: number };
  conteo: string;
  aria: string;
};

const MAX_BARRAS = 16;

/**
 * Lazo/moño superior con piezas separadas (alas, colas y nudo) para que al pasar el mouse
 * se afloje y al hacer clic se desate a medias mientras se levanta la tapa.
 */
function LazoEditorial() {
  return (
    <svg
      className="regalo-lazo pointer-events-none absolute -top-[32px] left-1/2 z-20 block h-[34px] w-[96px] -translate-x-1/2 overflow-visible sm:-top-[40px] sm:h-[42px] sm:w-[120px]"
      viewBox="0 0 112 38"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Ala izquierda del moño */}
      <g className="lazo-ala-izq">
        <path
          d="M56 31C42 31 18 27 18 14C18 4 38 4 56 26Z"
          fill="color-mix(in srgb, var(--c-claro, var(--c)) 78%, #faf8f4)"
        />
        <path d="M52 27C41 22 30 16 27 13" opacity="0.5" />
      </g>

      {/* Ala derecha del moño */}
      <g className="lazo-ala-der">
        <path
          d="M56 31C70 31 94 27 94 14C94 4 74 4 56 26Z"
          fill="color-mix(in srgb, var(--c-claro, var(--c)) 78%, #faf8f4)"
        />
        <path d="M60 27C71 22 82 16 85 13" opacity="0.5" />
      </g>

      {/* Cintas sueltas que se estiran al desatarse */}
      <path className="lazo-cola-izq" d="M51 31L34 37" />
      <path className="lazo-cola-der" d="M61 31L78 37" />

      {/* Nudo central */}
      <rect
        className="lazo-nudo"
        x="49"
        y="22"
        width="14"
        height="11"
        rx="2.5"
        fill="var(--c-claro, var(--c))"
      />
    </svg>
  );
}

/** Destellos editoriales de 4 puntas que emergen del interior brillante al abrir la caja. */
function DestellosInterior() {
  return (
    <svg
      aria-hidden="true"
      className="regalo-haz pointer-events-none absolute -top-11 inset-x-2 z-10 h-16 w-[calc(100%-16px)] overflow-visible"
      viewBox="0 0 240 64"
      fill="none"
    >
      {/* Rayos suaves saliendo de la caja */}
      <path
        d="M120 60L75 8M120 60L120 2M120 60L165 8M120 60L42 22M120 60L198 22"
        stroke="#fef08a"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Estrellas editoriales de 4 puntas */}
      <path
        d="M120 4L122.5 11.5L130 14L122.5 16.5L120 24L117.5 16.5L110 14L117.5 11.5Z"
        fill="#fffbeb"
        stroke="var(--c-fuerte)"
        strokeWidth="1"
      />
      <path
        d="M68 14L69.8 19.2L75 21L69.8 22.8L68 28L66.2 22.8L61 21L66.2 19.2Z"
        fill="#fef08a"
        stroke="var(--c-fuerte)"
        strokeWidth="0.9"
      />
      <path
        d="M172 12L173.8 17.2L179 19L173.8 20.8L172 26L170.2 20.8L165 19L170.2 17.2Z"
        fill="#fef08a"
        stroke="var(--c-fuerte)"
        strokeWidth="0.9"
      />
      <circle cx="94" cy="18" r="2.2" fill="#fffbeb" />
      <circle cx="148" cy="16" r="2.2" fill="#fffbeb" />
    </svg>
  );
}

export function Estante({
  otroNombre,
  mios,
  ajenos,
  comprados,
  miColor,
  otroColor,
}: {
  miNombre?: string;
  otroNombre: string;
  mios: number;
  ajenos: number;
  comprados: number;
  miColor: string;
  otroColor: string;
}) {
  const router = useRouter();
  const [sacado, setSacado] = useState<"mio" | "otro" | null>(null);

  const cajas: Caja[] = [
    {
      libro: "mio",
      titulo: "Mi carrito",
      color: miColor,
      icono: "regalo",
      subtitulo: "Lo que quiero que me regales",
      barras: { total: Math.max(mios, 6), llenas: mios },
      conteo: mios === 0 ? "Aún en blanco" : plural(mios, "deseo", "deseos"),
      aria: `Mi carrito. ${plural(mios, "deseo", "deseos")}.`,
    },
    {
      libro: "otro",
      titulo: `Carrito de ${otroNombre}`,
      color: otroColor,
      icono: "corazon",
      subtitulo: `Lo que ${otroNombre} sueña recibir`,
      barras: { total: Math.max(ajenos, 6), llenas: comprados },
      conteo: ajenos === 0 ? "Aún en blanco" : `${comprados} de ${ajenos} comprados`,
      aria: `Carrito de ${otroNombre}. ${plural(ajenos, "deseo", "deseos")}, ${comprados} comprados por ti.`,
    },
  ];

  function abrirCaja(libro: "mio" | "otro") {
    if (sacado) return;
    setSacado(libro);
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Deja ver cómo se desata el moño, se levanta la tapa y brilla por dentro antes de pasar al libro
    window.setTimeout(() => router.push(`/?libro=${libro}&pliego=1`), reducido ? 0 : 880);
  }

  return (
    <section className="pt-6 sm:pt-10 md:pt-12">
      <div className="mx-auto max-w-[780px] text-center">
        <h1 className="font-serif text-[clamp(32px,6vw,72px)] leading-[1.02] font-medium tracking-[0.04em] uppercase text-balance">
          Nuestra lista de deseos
        </h1>
      </div>

      <ol
        className={`estante mx-auto mt-10 grid max-w-[760px] grid-cols-2 sm:mt-12 md:mt-16 ${
          sacado ? "sacando" : ""
        }`}
        aria-label="Estante de regalos"
      >
        {cajas.map((c) => {
          const estado = sacado ? (sacado === c.libro ? "sacado" : "apagado") : "";
          const total = Math.min(c.barras.total, MAX_BARRAS);
          const llenas = Math.min(c.barras.llenas, total);
          return (
            <li key={c.libro} data-color={c.color} className={`grid grid-rows-[1fr_auto_auto] ${estado}`}>
              <button
                type="button"
                onClick={() => abrirCaja(c.libro)}
                aria-label={c.aria}
                className="regalo avanzar group relative mx-1.5 flex h-full flex-col items-stretch pt-8 text-center sm:mx-4 sm:pt-10"
              >
                {/* Tapa limpia que lleva el moño encima y se levanta dejando salir el brillo */}
                <span className="regalo-tapa relative z-20 flex h-9 shrink-0 items-center justify-center rounded-[3px] sm:h-12">
                  <LazoEditorial />
                  <span aria-hidden="true" className="regalo-cinta cinta-tapa h-full w-6 border-x sm:w-9" />
                </span>

                {/* Cuerpo de la caja con resplandor interior, destellos y cintas que se sueltan */}
                <span className="regalo-cuerpo relative mx-1 flex min-h-[210px] flex-1 flex-col items-center justify-center px-2.5 py-5 sm:mx-1.5 sm:min-h-[300px] sm:px-7 sm:py-8 md:min-h-[330px]">
                  {/* Brillo cálido y destellos que salen desde adentro cuando la tapa se abre */}
                  <span
                    aria-hidden="true"
                    className="regalo-resplandor pointer-events-none absolute -top-9 inset-x-1 z-10 h-16 rounded-full"
                  />
                  <DestellosInterior />

                  {/* Cinta vertical */}
                  <span
                    aria-hidden="true"
                    className="regalo-cinta cinta-v pointer-events-none absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 border-x sm:w-9"
                  />
                  {/* Cinta horizontal */}
                  <span
                    aria-hidden="true"
                    className="regalo-cinta cinta-h pointer-events-none absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 border-y sm:h-8"
                  />

                  {/* Cartel central minimalista: icono + título grande */}
                  <span className="regalo-tarjeta relative z-10 flex min-h-[118px] w-full max-w-[250px] flex-col items-center justify-center gap-2 rounded-[3px] px-3 py-4 text-center text-tinta sm:min-h-[164px] sm:gap-3 sm:px-6 sm:py-7">
                    <span className="text-[var(--c-fuerte)]">
                      <Icono nombre={c.icono} className="h-6 w-6 sm:h-7 sm:w-7" />
                    </span>
                    <span className="block font-serif text-[clamp(23px,4.6vw,38px)] leading-[1.04] font-medium text-balance">
                      {c.titulo}
                    </span>
                  </span>
                </span>
              </button>

              {/* La repisa: barra gruesa que sostiene las dos cajas */}
              <span className="border-t-[10px] border-tinta px-2 pt-3.5 text-[12px] leading-snug text-tinta-2 sm:border-t-[12px] sm:px-5 sm:pt-5 sm:text-[15px]">
                {c.subtitulo}
              </span>

              {/* Rayitas de progreso debajo de cada regalo */}
              <span className="grid gap-1.5 px-2 pt-2 sm:gap-2 sm:px-5 sm:pt-2.5">
                <span className="flex flex-wrap gap-1" aria-hidden="true">
                  {Array.from({ length: total }, (_, b) => (
                    <i
                      key={b}
                      className={`h-1 w-[12px] rounded-[2px] sm:w-[18px] ${
                        b < llenas ? "bg-[var(--c-fuerte)]" : "bg-regla"
                      }`}
                    />
                  ))}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.05em] text-tinta-2 uppercase sm:text-[11px]">
                  {c.conteo}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
