create table if not exists constancias_minsa (
  autog text primary key,
  hospital text not null,
  paciente_nombre text not null,
  paciente_dni text not null,
  paciente_edad text,
  fecha_atencion date not null,
  descanso_inicio date not null,
  descanso_fin date not null,
  descanso_dias int not null,
  diagnostico text,
  sintomas_json jsonb,
  valido_hasta date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_constancias_minsa_valido_hasta
  on constancias_minsa (valido_hasta);

-- Si la tabla ya existía (de la versión anterior con Supabase JS), solo agrega la columna nueva:
-- alter table constancias_minsa add column if not exists valido_hasta date;
