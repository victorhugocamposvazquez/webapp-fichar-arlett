-- Añadir columna invite_code a la tabla users (si no existe)
-- Ejecuta esto en Supabase: SQL Editor → New query → pegar y Run

ALTER TABLE users
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
