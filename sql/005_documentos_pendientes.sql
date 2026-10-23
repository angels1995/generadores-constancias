CREATE TABLE IF NOT EXISTS documentos_pendientes (
  autog text PRIMARY KEY CHECK (autog ~ '^DOC-[A-F0-9]{32}$'),
  tipo text NOT NULL CHECK (tipo IN ('receta-minsa-v2','receta-essalud-v2','laluz-certificado','laluz-receta','laluz-descanso','certificado-essalud','receta-essalud-v1')),
  estado text NOT NULL DEFAULT 'PENDIENTE_FIRMA' CHECK (estado='PENDIENTE_FIRMA'),
  pdf_sha256 text NOT NULL CHECK (pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
