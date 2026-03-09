-- =============================================================
-- Borrar registros de jornadas (time_records)
-- Ejecuta en Supabase: SQL Editor → New query
-- =============================================================

-- 1) BORRAR TODOS los registros de fichaje
-- DELETE FROM time_records;

-- 2) Borrar solo registros de un rango de fechas (ejemplo: marzo 2026)
-- DELETE FROM time_records
-- WHERE clock_in >= '2026-03-01' AND clock_in < '2026-04-01';

-- 3) Borrar solo los de un empleado (cambia el user_id)
-- DELETE FROM time_records WHERE user_id = 2;

-- 4) Borrar solo jornadas ABIERTAS (sin hora de salida)
-- DELETE FROM time_records WHERE clock_out IS NULL;

-- 5) Borrar registros ANTES de una fecha (ejemplo: antes del 1 ene 2026)
-- DELETE FROM time_records WHERE clock_in < '2026-01-01';

-- ========== RECOMENDADO: ver antes de borrar ==========
-- Descomenta y ejecuta primero para ver qué se borraría:

-- SELECT id, user_id, clock_in, clock_out, duration_minutes
-- FROM time_records
-- ORDER BY clock_in DESC
-- LIMIT 100;

-- Luego descomenta el DELETE que quieras y ejecútalo.
