-- Registro interno mínimo. No almacena identidad ni datos clínicos.
CREATE TABLE IF NOT EXISTS essalud_documentos_pendientes (
  autog text PRIMARY KEY CHECK (autog ~ '^ESSALUD-[A-F0-9]{32}$'),
  estado text NOT NULL DEFAULT 'OPERATIVO' CHECK (estado = 'OPERATIVO'),
  pdf_sha256 text NOT NULL CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE essalud_documentos_pendientes DROP CONSTRAINT IF EXISTS essalud_documentos_pendientes_estado_check;
ALTER TABLE essalud_documentos_pendientes ALTER COLUMN estado SET DEFAULT 'OPERATIVO';
UPDATE essalud_documentos_pendientes SET estado='OPERATIVO' WHERE estado='PENDIENTE_FIRMA';
ALTER TABLE essalud_documentos_pendientes ADD CONSTRAINT essalud_documentos_pendientes_estado_check CHECK (estado='OPERATIVO');
