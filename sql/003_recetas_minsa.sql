-- Adición independiente: no modifica constancias ni descansos existentes.
CREATE TABLE IF NOT EXISTS recetas_minsa (
  autog text PRIMARY KEY CHECK (autog ~ '^RECETA-[A-F0-9]{32}$'),
  input_json jsonb NOT NULL CHECK (jsonb_typeof(input_json) = 'object'),
  valido_hasta date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
