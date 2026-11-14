import { redirect } from "next/navigation";
import { Colofon, Encabezado } from "@/components/Encabezado";
import { FormularioLogin } from "@/components/FormularioLogin";
import { Icono } from "@/components/Icono";
import { getSesion } from "@/lib/session";
import { userName } from "@/lib/users";

export default async function LoginPage() {
  const sesion = await getSesion();
  if (sesion) redirect("/");

  const nombres: [string, string] = [userName("u1"), userName("u2")];

  return (
    <div className="mx-auto flex min-h-svh max-w-[1260px] flex-col px-4 sm:px-7 lg:px-12">
      <Encabezado />

      <main className="my-auto pt-8 pb-6 md:pt-12">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_minmax(300px,430px)] md:gap-16">
          <div className="grid gap-5 max-w-[36rem]">
            <span className="rotulo text-tinta-2">Acceso privado · Solo dos lectores</span>
            <h1 className="font-serif text-[clamp(44px,5.4vw,72px)] leading-[1.0] font-medium tracking-[-0.01em] text-balance">
              Una biblioteca para saber qué regalarnos.
            </h1>
            <p className="text-[17px] text-tinta-2">
              Elige tu nombre e introduce tu clave para pasar al estante. Tu sesión quedará abierta durante treinta días en este dispositivo.
            </p>

            <FormularioLogin nombres={nombres} />
          </div>

          {/* Portada decorativa (inspirada en .portada de la referencia) */}
          <div
            data-color="naranja"
            aria-hidden="true"
            className="hidden aspect-[3/4] w-full max-w-[390px] flex-col justify-between justify-self-end rounded-[2px_6px_6px_2px] bg-[var(--c)] p-[34px_36px_28px_48px] text-[var(--c-texto)] shadow-[inset_16px_0_#25332b14,10px_0_0_-4px_var(--color-papel),30px_34px_50px_-34px_#25332b8c] md:flex"
          >
            <span className="rotulo">Nuestra wishlist · Edición de pareja</span>
            <div>
              <p className="font-serif text-[clamp(48px,4.5vw,66px)] leading-[0.98] font-medium">
                Dos libros,
                <br />
                ningún spoiler.
              </p>
              <p className="mt-3 text-[16px]">
                {nombres[0]} · {nombres[1]}
              </p>
            </div>
            <div className="my-auto self-center">
              <Icono nombre="libro" tamano={56} />
            </div>
            <div className="border-t border-current/35 pt-3.5 text-xs font-semibold tracking-[0.06em] uppercase">
              Ex libris · Prohibido preguntar qué quieres
            </div>
          </div>
        </div>
      </main>

      <Colofon />
    </div>
  );
}
