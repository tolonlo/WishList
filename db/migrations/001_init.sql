-- 001_init.sql · Wishlist de pareja
-- Los dueños se guardan como 'u1' / 'u2' (claves estables); los nombres visibles viven en variables de entorno.

CREATE TABLE IF NOT EXISTS items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner       text NOT NULL CHECK (owner IN ('u1', 'u2')),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  url         text CHECK (url IS NULL OR char_length(url) <= 2048),
  notes       text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  price       numeric(12, 2) CHECK (price IS NULL OR price >= 0),
  priority    text CHECK (priority IS NULL OR priority IN ('alta', 'media', 'baja')),
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Lectura principal: los items de un dueño en orden.
CREATE INDEX IF NOT EXISTS items_owner_position_idx ON items (owner, position, created_at);

CREATE TABLE IF NOT EXISTS item_images (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id   uuid NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  url       text NOT NULL CHECK (char_length(url) <= 2048),
  position  integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS item_images_item_idx ON item_images (item_id, position);

-- Estado de compra PRIVADO: solo lo lee quien lo marcó (buyer). Nunca se consulta para el dueño.
CREATE TABLE IF NOT EXISTS purchase_status (
  item_id     uuid NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  buyer       text NOT NULL CHECK (buyer IN ('u1', 'u2')),
  status      text NOT NULL CHECK (status IN ('pendiente', 'comprado')),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, buyer)
);

CREATE INDEX IF NOT EXISTS purchase_status_buyer_idx ON purchase_status (buyer);

-- Rollback (migración reversible):
-- DROP TABLE IF EXISTS purchase_status;
-- DROP TABLE IF EXISTS item_images;
-- DROP TABLE IF EXISTS items;
