/** Iconos de línea fina (trazo 1.6, viewBox 48) en el mismo lenguaje que la referencia. */
const TRAZOS = {
  corazon: (
    <path d="M24 39s-14-8.4-14-18.6C10 15.2 13.8 11 18.6 11c2.6 0 4.4 1.3 5.4 3 1-1.7 2.8-3 5.4-3 4.8 0 8.6 4.2 8.6 9.4C38 30.6 24 39 24 39Z" />
  ),
  regalo: (
    <>
      <rect x="9" y="18" width="30" height="8" rx="1" />
      <path d="M12 26v13h24V26M24 18v21" />
      <path d="M24 18c-2-5-9-7-9-2.5 0 2.5 4 2.5 9 2.5ZM24 18c2-5 9-7 9-2.5 0 2.5-4 2.5-9 2.5Z" />
    </>
  ),
  lupa: (
    <>
      <circle cx="21" cy="21" r="11" />
      <path d="m29 29 11 11" />
    </>
  ),
  estrella: <path d="m24 9 4.4 9.6 10.4 1.2-7.7 7.1 2.1 10.3L24 32l-9.2 5.2 2.1-10.3-7.7-7.1 10.4-1.2Z" />,
  libro: (
    <>
      <path d="M24 14c-5-4-11-4-16-2v26c5-2 11-2 16 2 5-4 11-4 16-2V12c-5-2-11-2-16 2Z" />
      <path d="M24 14v26" />
    </>
  ),
  pluma: (
    <>
      <path d="M36 10c-10 2-18 10-21 22l-3 6" />
      <path d="M36 10c1 9-5 17-15 19M22 22l-4 4" />
    </>
  ),
  imagen: (
    <>
      <rect x="8" y="11" width="32" height="26" rx="1.5" />
      <circle cx="18" cy="20" r="3" />
      <path d="m8 33 10-9 8 7 5-4 9 7" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  tamano = 40,
  className,
}: {
  nombre: NombreIcono;
  tamano?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}

export function Flecha({ izquierda = false, className = "" }: { izquierda?: boolean; className?: string }) {
  return (
    <svg
      className={`flecha ${className}`}
      width="16"
      height="10"
      viewBox="0 0 16 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {izquierda ? <path d="M15 5H1m4-4L1 5l4 4" /> : <path d="M1 5h14m-4-4 4 4-4 4" />}
    </svg>
  );
}
