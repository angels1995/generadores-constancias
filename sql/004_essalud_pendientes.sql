-- Registro interno mínimo. No almacena identidad ni datos clínicos.
CREATE TABLE IF NOT EXISTS essalud_documentos_pendientes (
  autog text PRIMARY KEY CHECK (autog ~ '^ESSALUD-[A-F0-9]{32}$'),
  estado text NOT NULL DEFAULT 'PENDIENTE_FIRMA' CHECK (estado = 'PENDIENTE_FIRMA'),
  pdf_sha256 text NOT NULL CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
