-- =============================================================
-- Arlett Fichaje · Esquema de base de datos para Supabase
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- =============================================================

-- Tabla de usuarios (empleados y administradores)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  pin_hash TEXT,
  pin_set BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de registros de fichaje
CREATE TABLE IF NOT EXISTS time_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  clock_in_note TEXT,
  clock_out_note TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_records_user ON time_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_clock_in ON time_records(clock_in);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: se usa service_role key desde el backend, así que
-- las políticas permiten todo para ese rol.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access records" ON time_records
  FOR ALL USING (true) WITH CHECK (true);
