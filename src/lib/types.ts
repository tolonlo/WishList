/** Tipos compartidos entre servidor y cliente. */
export type Prioridad = "alta" | "media" | "baja";

export type Imagen = { id: string; url: string };

/** Item tal como lo ve su dueño: SIN ningún dato de compra. */
export type Item = {
  id: string;
  name: string;
  url: string | null;
  notes: string | null;
  price: number | null;
  priority: Prioridad | null;
  position: number;
  images: Imagen[];
};

/** Item del otro, visto por mí: incluye solo MI estado de compra. */
export type ItemAjeno = Item & { comprado: boolean };

export type ItemPayload = {
  name: string;
  url: string | null;
  notes: string | null;
  price: number | null;
  priority: Prioridad | null;
  images: string[];
};

export const PRIORIDADES: { valor: Prioridad; etiqueta: string; color: string }[] = [
  { valor: "alta", etiqueta: "Lo deseo mucho", color: "terracota" },
  { valor: "media", etiqueta: "Me encantaría", color: "mostaza" },
  { valor: "baja", etiqueta: "Si se da", color: "salvia" },
];

export const MAX_IMAGENES = 6;
