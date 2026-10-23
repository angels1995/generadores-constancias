CREATE TABLE IF NOT EXISTS documentos_pendientes (
  autog text PRIMARY KEY CHECK (autog ~ '^DOC-[A-F0-9]{32}$'),
  tipo text NOT NULL CHECK (tipo IN ('receta-minsa-v2','receta-essalud-v2','laluz-certificado','laluz-receta','laluz-descanso','certificado-essalud','receta-essalud-v1')),
  estado text NOT NULL DEFAULT 'OPERATIVO' CHECK (estado='OPERATIVO'),
  pdf_sha256 text NOT NULL CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE documentos_pendientes DROP CONSTRAINT IF EXISTS documentos_pendientes_estado_check;
ALTER TABLE documentos_pendientes ALTER COLUMN estado SET DEFAULT 'OPERATIVO';
UPDATE documentos_pendientes SET estado='OPERATIVO' WHERE estado='PENDIENTE_FIRMA';
ALTER TABLE documentos_pendientes ADD CONSTRAINT documentos_pendientes_estado_check CHECK (estado='OPERATIVO');
