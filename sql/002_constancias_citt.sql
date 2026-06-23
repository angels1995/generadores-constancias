create table if not exists constancias_citt (
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

create index if not exists idx_constancias_citt_valido_hasta
  on constancias_citt (valido_hasta);