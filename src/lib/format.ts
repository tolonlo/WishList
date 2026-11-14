/** Utilidades de formato compartidas (cliente y servidor). */
const numero = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });

export function formatoPrecio(valor: number): string {
  return `$${numero.format(valor)}`;
}

export const dosDigitos = (n: number) => String(n).padStart(2, "0");

export function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}
