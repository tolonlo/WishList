"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { dosDigitos } from "@/lib/format";
import type { Item, ItemAjeno, ItemPayload } from "@/lib/types";
import { Flecha } from "../Icono";
import { PliegoFormulario } from "./PliegoFormulario";
import { PliegoPortada } from "./PliegoPortada";
import { PliegoProducto } from "./PliegoProducto";

/**
 * Hoja física 3D que gira 180° sobre el lomo central del libro al pasar de página:
 * - Al avanzar (dir = 1): la página derecha se levanta y gira de derecha a izquierda (0° → -180°).
 * - Al retroceder (dir = -1): la página izquierda se levanta y gira de izquierda a derecha (0° → 180°).
 * El libro de fondo permanece firme sobre la mesa (nunca desaparece ni parpadea).
 */
function HojaPasando({ giroId, direccion }: { giroId: number; direccion: 1 | -1 }) {
  return (
    <AnimatePresence>
      {giroId > 0 && (
        <motion.div
          key={giroId}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 overflow-visible"
          style={{ perspective: "2400px" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.62, times: [0, 0.86, 1], ease: "easeOut" }}
        >
          {/* Sombra proyectada sobre el libro abierto mientras la hoja está en el aire */}
          <motion.div
            className="absolute inset-y-2 inset-x-4 rounded-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0] }}
            transition={{ duration: 0.58, times: [0, 0.45, 1] }}
            style={{
              background:
                direccion > 0
                  ? "linear-gradient(90deg, transparent 15%, rgba(37,51,43,0.35) 50%, transparent 85%)"
                  : "linear-gradient(90deg, transparent 15%, rgba(37,51,43,0.35) 50%, transparent 85%)",
            }}
          />

          {/* En escritorio: media hoja anclada al lomo central (50%). En móvil: hoja completa anclada al borde. */}
          <motion.div
            className={`
              absolute inset-y-0 w-full md:w-1/2
              ${direccion > 0 ? " right-0 md:left-1/2" : "left-0 md:right-1/2"}
            `}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: direccion > 0 ? "left center" : "right center",
            }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: direccion > 0 ? -180 : 180 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Cara frontal de la hoja que se levanta */}
            <div
              className="absolute inset-0 flex flex-col justify-between rounded-[2px] border border-regla bg-papel p-7 md:px-11 md:py-8"
              style={{
                backfaceVisibility: "hidden",
                backgroundImage:
                  direccion > 0
                    ? "linear-gradient(90deg, rgba(37,51,43,0.12) 0%, rgba(250,248,244,0) 18%, rgba(37,51,43,0.06) 100%)"
                    : "linear-gradient(270deg, rgba(37,51,43,0.12) 0%, rgba(250,248,244,0) 18%, rgba(37,51,43,0.06) 100%)",
                boxShadow:
                  direccion > 0
                    ? "-18px 0 32px -12px rgba(37,51,43,0.32)"
                    : "18px 0 32px -12px rgba(37,51,43,0.32)",
              }}
            >
              <div className="h-px w-full bg-regla" />
              <div className="my-auto space-y-4 opacity-25">
                <div className="h-3 w-24 rounded-xs bg-tinta-2" />
                <div className="h-8 w-3/4 rounded-xs bg-tinta-2" />
                <div className="h-32 w-full rounded-xs border border-regla bg-marfil" />
              </div>
              <div className="h-px w-full bg-regla" />
            </div>

            {/* Reverso de la hoja al caer sobre el lado opuesto */}
            <div
              className="absolute inset-0 flex flex-col justify-between rounded-[2px] border border-regla bg-papel p-7 md:px-11 md:py-8"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                backgroundImage:
                  direccion > 0
                    ? "linear-gradient(270deg, rgba(37,51,43,0.14) 0%, rgba(250,248,244,0) 20%, rgba(37,51,43,0.04) 100%)"
                    : "linear-gradient(90deg, rgba(37,51,43,0.14) 0%, rgba(250,248,244,0) 20%, rgba(37,51,43,0.04) 100%)",
                boxShadow:
                  direccion > 0
                    ? "18px 0 32px -12px rgba(37,51,43,0.28)"
                    : "-18px 0 32px -12px rgba(37,51,43,0.28)",
              }}
            >
              <div className="h-px w-full bg-regla" />
              <div className="my-auto space-y-4 opacity-20">
                <div className="h-44 w-full rounded-xs border border-regla bg-marfil" />
                <div className="h-3 w-1/2 rounded-xs bg-tinta-2" />
              </div>
              <div className="h-px w-full bg-regla" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Vista de lectura "El libro abierto":
 * - Pliego 1: Portada + Sumario.
 * - Pliegos 2 .. N+1: Cada deseo a doble página estilo revista de catálogo.
 * - Pliego N+2 (solo en mi libro): "+ Añadir producto".
 */
export function LibroAbierto({
  libro,
  pliegoInicial,
  miNombre,
  otroNombre,
  miColor,
  otroColor,
  itemsIniciales,
}: {
  libro: "mio" | "otro";
  pliegoInicial: number;
  miNombre: string;
  otroNombre: string;
  miColor: string;
  otroColor: string;
  itemsIniciales: (Item | ItemAjeno)[];
}) {
  const router = useRouter();
  const esMio = libro === "mio";
  const duenoNombre = esMio ? miNombre : otroNombre;
  const colorActivo = esMio ? miColor : otroColor;

  const [items, setItems] = useState<(Item | ItemAjeno)[]>(itemsIniciales);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const [giroId, setGiroId] = useState(0);

  const totalPliegos = 1 + items.length + (esMio ? 1 : 0);
  const clampPliego = useCallback(
    (n: number) => Math.max(1, Math.min(totalPliegos, Number.isFinite(n) ? Math.trunc(n) : 1)),
    [totalPliegos],
  );

  const [pliegoBase, setPliego] = useState<number>(() => clampPliego(pliegoInicial));
  const pliego = clampPliego(pliegoBase);

  const irAPliego = useCallback(
    (destino: number) => {
      const siguiente = clampPliego(destino);
      setEditandoId(null);
      setPliego((actual) => {
        const actualSeguro = clampPliego(actual);
        if (siguiente !== actualSeguro) {
          setDireccion(siguiente > actualSeguro ? 1 : -1);
          setGiroId((g) => g + 1);
        }
        return siguiente;
      });
      const url = `/?libro=${libro}&pliego=${siguiente}`;
      window.history.replaceState(null, "", url);
    },
    [clampPliego, libro],
  );

  useEffect(() => {
    window.history.replaceState(null, "", `/?libro=${libro}&pliego=${pliego}`);
  }, [libro, pliego]);

  useEffect(() => {
    function alPresionar(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowLeft" && pliego > 1) {
        e.preventDefault();
        irAPliego(pliego - 1);
      } else if (e.key === "ArrowRight" && pliego < totalPliegos) {
        e.preventDefault();
        irAPliego(pliego + 1);
      }
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [irAPliego, pliego, totalPliegos]);

  const toqueInicio = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) toqueInicio.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const inicio = toqueInicio.current;
    toqueInicio.current = null;
    const fin = e.changedTouches[0];
    if (!inicio || !fin) return;
    const dx = fin.clientX - inicio.x;
    const dy = fin.clientY - inicio.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0 && pliego < totalPliegos) irAPliego(pliego + 1);
    if (dx > 0 && pliego > 1) irAPliego(pliego - 1);
  }

  async function recargarItems(): Promise<(Item | ItemAjeno)[]> {
    const res = await fetch(`/api/items?libro=${libro}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo actualizar el libro.");
    const data = (await res.json()) as { items: (Item | ItemAjeno)[] };
    setItems(data.items);
    router.refresh();
    return data.items;
  }

  async function crearNuevo(payload: ItemPayload) {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo guardar.");
    const actualizados = await recargarItems();
    irAPliego(actualizados.length + 1);
  }

  async function guardarEdicion(id: string, payload: ItemPayload) {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo guardar.");
    setEditandoId(null);
    await recargarItems();
  }

  async function eliminarActual(id: string) {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    const cuerpo = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(cuerpo.error ?? "No se pudo eliminar.");
    const actualizados = await recargarItems();
    const nuevoMax = 1 + actualizados.length + (esMio ? 1 : 0);
    irAPliego(Math.min(pliego, nuevoMax));
  }

  async function moverActual(indiceItem: number, delta: -1 | 1) {
    const destino = indiceItem + delta;
    if (destino < 0 || destino >= items.length) return;
    const copia = [...items];
    const [movido] = copia.splice(indiceItem, 1);
    copia.splice(destino, 0, movido);
    setItems(copia);
    irAPliego(destino + 2);
    await fetch("/api/items/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: copia.map((i) => i.id) }),
    });
    router.refresh();
  }

  async function cambiarCompra(itemId: string, comprado: boolean) {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? ({ ...it, comprado } as ItemAjeno) : it)),
    );
    const res = await fetch(`/api/purchases/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: comprado ? "comprado" : "pendiente" }),
    });
    if (!res.ok) {
      await recargarItems();
    } else {
      router.refresh();
    }
  }

  const esPortada = pliego === 1;
  const esFormularioNuevo = esMio && pliego === totalPliegos;
  const indiceProducto = pliego - 2;
  const productoActual = !esPortada && !esFormularioNuevo ? items[indiceProducto] : undefined;
  const numeroPaginaIzq = (pliego - 1) * 2 + 1;

  const contadorSuperior = esPortada
    ? `Portada · ${dosDigitos(items.length)} ${items.length === 1 ? "deseo" : "deseos"}`
    : esFormularioNuevo
      ? `Nueva página · Pliego ${dosDigitos(pliego)} / ${dosDigitos(totalPliegos)}`
      : `Producto ${dosDigitos(indiceProducto + 1)} / ${dosDigitos(items.length)}`;

  return (
    <section
      data-color={colorActivo}
      className="pt-5 pb-20 md:pb-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barra superior: ← Volver al estante | Contador */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/" className="volver inline-flex items-center gap-2.5 py-2 text-[15px] font-semibold">
          <Flecha izquierda />
          <span>Volver al estante</span>
        </Link>
        <span className="text-[13px] font-semibold tracking-[0.06em] uppercase tabular-nums">
          {contadorSuperior}
        </span>
      </div>

      {/* Marco del pliego con botones circulares a izquierda y derecha */}
      <div className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-[48px_minmax(0,1fr)_48px] xl:-mx-[70px] xl:grid-cols-[56px_minmax(0,1fr)_56px]">
        <div className="relative hidden md:block">
          <button
            type="button"
            disabled={pliego <= 1}
            onClick={() => irAPliego(pliego - 1)}
            aria-label="Pliego anterior"
            title="Pliego anterior (←)"
            className="hoja hover:not-disabled:-translate-x-1 md:sticky md:top-[calc(50svh-28px)] md:mt-[260px] md:h-12 md:w-12 xl:h-14 xl:w-14"
          >
            <Flecha izquierda />
          </button>
        </div>

        {/* Contenedor del libro con hoja 3D que gira sobre el lomo central */}
        <div className="relative min-w-0">
          <HojaPasando giroId={giroId} direccion={direccion} />

          {esPortada ? (
            <PliegoPortada
              esMio={esMio}
              duenoNombre={duenoNombre}
              items={items}
              onIrAPliego={irAPliego}
            />
          ) : esFormularioNuevo ? (
            <PliegoFormulario
              numeroPaginaIzq={numeroPaginaIzq}
              etiquetaIzq="Mi carrito · + Añadir producto"
              onGuardar={crearNuevo}
            />
          ) : productoActual && editandoId === productoActual.id ? (
            <PliegoFormulario
              inicial={productoActual}
              numeroPaginaIzq={numeroPaginaIzq}
              etiquetaIzq={`Mi carrito · Editando ${dosDigitos(indiceProducto + 1)} de ${dosDigitos(items.length)}`}
              onGuardar={(payload) => guardarEdicion(productoActual.id, payload)}
              onCancelar={() => setEditandoId(null)}
            />
          ) : productoActual ? (
            <PliegoProducto
              item={productoActual}
              indice={indiceProducto}
              total={items.length}
              esMio={esMio}
              duenoNombre={duenoNombre}
              numeroPaginaIzq={numeroPaginaIzq}
              onEditar={esMio ? () => setEditandoId(productoActual.id) : undefined}
              onEliminar={esMio ? () => eliminarActual(productoActual.id) : undefined}
              onMover={esMio ? (delta) => moverActual(indiceProducto, delta) : undefined}
              onToggleCompra={!esMio ? (comprado) => cambiarCompra(productoActual.id, comprado) : undefined}
            />
          ) : null}
        </div>

        <div className="relative hidden md:block">
          <button
            type="button"
            disabled={pliego >= totalPliegos}
            onClick={() => irAPliego(pliego + 1)}
            aria-label="Pliego siguiente"
            title="Pliego siguiente (→)"
            className="hoja hover:not-disabled:translate-x-1 md:sticky md:top-[calc(50svh-28px)] md:mt-[260px] md:h-12 md:w-12 xl:h-14 xl:w-14"
          >
            <Flecha />
          </button>
        </div>
      </div>

      {/* Barra móvil de paso de página: flechas abajo con indicador de pliego */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-full border border-regla bg-papel px-2.5 py-1.5 shadow-xs md:hidden">
        <button
          type="button"
          disabled={pliego <= 1}
          onClick={() => irAPliego(pliego - 1)}
          aria-label="Página anterior"
          className="hoja"
        >
          <Flecha izquierda />
        </button>

        <div className="text-center">
          <span className="rotulo block text-[11px] text-tinta tabular-nums">
            {esPortada
              ? "Portada e índice"
              : esFormularioNuevo
                ? "+ Añadir deseo"
                : `Deseo ${dosDigitos(indiceProducto + 1)} de ${dosDigitos(items.length)}`}
          </span>
          <span className="text-[11px] text-tinta-2">
            Desliza o usa las flechas
          </span>
        </div>

        <button
          type="button"
          disabled={pliego >= totalPliegos}
          onClick={() => irAPliego(pliego + 1)}
          aria-label="Página siguiente"
          className="hoja"
        >
          <Flecha />
        </button>
      </div>

      {/* Paginador de círculos numerados */}
      <nav aria-label="Pliegos del libro" className="mt-7 mb-2 flex justify-center">
        <ol className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPliegos }, (_, i) => {
            const num = i + 1;
            const actual = num === pliego;
            const esUltimoAnadir = esMio && num === totalPliegos;
            const etiqueta =
              num === 1
                ? "Pliego 1: Portada e índice"
                : esUltimoAnadir
                  ? `Pliego ${num}: Añadir producto`
                  : `Pliego ${num}: ${items[num - 2]?.name ?? `Producto ${num - 1}`}`;
            return (
              <li key={num}>
                <button
                  type="button"
                  onClick={() => irAPliego(num)}
                  aria-current={actual ? "page" : undefined}
                  aria-label={etiqueta}
                  title={etiqueta}
                  className={`h-[34px] w-[34px] rounded-full border-[1.5px] text-sm font-semibold tabular-nums transition-colors md:h-[38px] md:w-[38px] ${
                    actual
                      ? "border-tinta bg-tinta text-papel"
                      : esUltimoAnadir
                        ? "border-dashed border-tinta-2 bg-papel text-tinta hover:border-tinta"
                        : "border-[var(--c-fuerte,var(--color-tinta))] bg-papel text-tinta hover:bg-[var(--c)]"
                  }`}
                >
                  {esUltimoAnadir ? "+" : num === 1 ? "I" : num - 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Navegación rápida entre los dos libros al pie */}
      <nav
        aria-label="Cambiar de libro"
        className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-regla pt-5 sm:flex-row sm:items-center"
      >
        <ol className="flex flex-wrap gap-6 sm:gap-10">
          <li>
            <Link
              href="/?libro=mio&pliego=1"
              className={`py-1.5 text-[15px] underline decoration-[3px] underline-offset-[12px] transition-colors ${
                esMio
                  ? "font-semibold text-tinta decoration-[var(--c)]"
                  : "text-tinta-2 decoration-transparent hover:text-tinta"
              }`}
            >
              01 · Mi carrito
            </Link>
          </li>
          <li>
            <Link
              href="/?libro=otro&pliego=1"
              className={`py-1.5 text-[15px] underline decoration-[3px] underline-offset-[12px] transition-colors ${
                !esMio
                  ? "font-semibold text-tinta decoration-[var(--c)]"
                  : "text-tinta-2 decoration-transparent hover:text-tinta"
              }`}
            >
              02 · Carrito de {otroNombre}
            </Link>
          </li>
        </ol>

        {esMio && !esFormularioNuevo && (
          <button
            type="button"
            onClick={() => irAPliego(totalPliegos)}
            className="enlace text-[14px]"
          >
            + Añadir producto en la última página
          </button>
        )}
      </nav>
    </section>
  );
}
