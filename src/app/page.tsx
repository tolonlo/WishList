import { redirect } from "next/navigation";
import { Colofon, Encabezado } from "@/components/Encabezado";
import { Estante } from "@/components/Estante";
import { LibroAbierto } from "@/components/libro/LibroAbierto";
import { listarAjenos, listarMios, resumenEstante } from "@/lib/items";
import { getSesion } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ libro?: string; pliego?: string }>;
}) {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  const params = await searchParams;
  const libroParam = params.libro === "mio" || params.libro === "otro" ? params.libro : null;
  const pliegoInicial = Math.max(1, Number.parseInt(params.pliego ?? "1", 10) || 1);

  if (libroParam) {
    const items =
      libroParam === "mio"
        ? await listarMios(sesion.yo)
        : await listarAjenos(sesion.otro, sesion.yo);

    return (
      <div className="mx-auto flex min-h-svh max-w-[1260px] flex-col px-4 sm:px-7 lg:px-12">
        <Encabezado nombre={sesion.miNombre} />
        <main className="flex-1">
          <LibroAbierto
            key={libroParam}
            libro={libroParam}
            pliegoInicial={pliegoInicial}
            miNombre={sesion.miNombre}
            otroNombre={sesion.otroNombre}
            miColor={sesion.miColor}
            otroColor={sesion.otroColor}
            itemsIniciales={items}
          />
        </main>
        <Colofon />
      </div>
    );
  }

  const resumen = await resumenEstante(sesion.yo, sesion.otro);

  return (
    <div className="mx-auto flex min-h-svh max-w-[1260px] flex-col px-4 sm:px-7 lg:px-12">
      <Encabezado nombre={sesion.miNombre} />
      <main className="flex-1">
        <Estante
          miNombre={sesion.miNombre}
          otroNombre={sesion.otroNombre}
          mios={resumen.mios}
          ajenos={resumen.ajenos}
          comprados={resumen.comprados}
          miColor={sesion.miColor}
          otroColor={sesion.otroColor}
        />
      </main>
      <Colofon />
    </div>
  );
}
