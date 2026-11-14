import Link from "next/link";
import { SalirBoton } from "./SalirBoton";

/** Encabezado minimalista: marca · lema · dato. Línea fina debajo. */
export function Encabezado({ nombre }: { nombre?: string }) {
  return (
    <header className="grid min-h-[72px] grid-cols-[1fr_auto] items-center border-b border-regla text-[13px] uppercase tracking-[0.04em] md:min-h-[92px] md:grid-cols-[1fr_auto_1fr]">
      <Link href="/" className="justify-self-start text-[15px] leading-tight font-semibold tracking-[0.02em]">
        Nuestra
        <br />
        wishlist
      </Link>
      <span className="hidden font-semibold md:block">Una biblioteca de deseos para dos</span>
      <span className="flex items-center justify-self-end gap-3 tabular-nums">
        {nombre ? (
          <>
            <span className="text-tinta-2">
              <span className="hidden sm:inline">Leyendo como </span>
              <span className="font-semibold text-tinta">{nombre}</span>
            </span>
            <span aria-hidden="true" className="text-regla">
              ·
            </span>
            <SalirBoton />
          </>
        ) : (
          <span className="text-tinta-2">Vol. 01 · Edición privada</span>
        )}
      </span>
    </header>
  );
}

export function Colofon() {
  return (
    <footer className="mt-14 flex flex-col gap-2 border-t border-regla pt-5 pb-10 text-xs uppercase tracking-[0.04em] text-tinta-2 md:flex-row md:justify-between md:gap-6">
      <span>Una biblioteca de dos libros · hecha a mano</span>
      <span>Los sellos de compra solo los ve quien los pone</span>
    </footer>
  );
}
