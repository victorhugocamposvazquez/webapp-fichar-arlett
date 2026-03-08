import { supabase } from '../_lib/supabase.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';

async function clockIn(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  const { note } = req.body || {};

  const { data: open } = await supabase
    .from('time_records').select('id')
    .eq('user_id', user.id).is('clock_out', null)
    .order('clock_in', { ascending: false }).limit(1).maybeSingle();

  if (open) return res.status(400).json({ error: 'Ya tienes una jornada abierta. Debes fichar la salida primero.' });

  const { data, error } = await supabase
    .from('time_records')
    .insert({ user_id: user.id, clock_in: new Date().toISOString(), clock_in_note: note || null })
    .select().single();

  if (error) return res.status(500).json({ error: 'Error al fichar entrada' });
  res.status(201).json(data);
}

async function clockOut(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  const { note } = req.body || {};

  const { data: open } = await supabase
    .from('time_records').select('*')
    .eq('user_id', user.id).is('clock_out', null)
    .order('clock_in', { ascending: false }).limit(1).maybeSingle();

  if (!open) return res.status(400).json({ error: 'No tienes ninguna jornada abierta.' });

  const now = new Date();
  const durationMinutes = Math.round((now - new Date(open.clock_in)) / 60000);

  const { data, error } = await supabase
    .from('time_records')
    .update({ clock_out: now.toISOString(), clock_out_note: note || null, duration_minutes: durationMinutes })
    .eq('id', open.id).select().single();

  if (error) return res.status(500).json({ error: 'Error al fichar salida' });
  res.json(data);
}

async function status(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { data: openRecord } = await supabase
    .from('time_records').select('*')
    .eq('user_id', user.id).is('clock_out', null)
    .order('clock_in', { ascending: false }).limit(1).maybeSingle();

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  const todayStart = new Date(`${todayStr}T00:00:00+01:00`).toISOString();

  const { data: todayRecords } = await supabase
    .from('time_records').select('*')
    .eq('user_id', user.id).gte('clock_in', todayStart)
    .order('clock_in', { ascending: false });

  const totalMinutesToday = (todayRecords || []).reduce((s, r) => s + (r.duration_minutes || 0), 0);

  res.json({
    isWorking: !!openRecord,
    currentRecord: openRecord || null,
    todayRecords: todayRecords || [],
    totalMinutesToday,
  });
}

async function history(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;

  const { from, to, page = 1, limit = 30 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase.from('time_records').select('*', { count: 'exact' }).eq('user_id', user.id);
  if (from) query = query.gte('clock_in', from);
  if (to) query = query.lte('clock_in', `${to}T23:59:59`);
  query = query.order('clock_in', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: 'Error al obtener historial' });
  res.json({ records: data || [], total: count || 0, page: parseInt(page), limit: parseInt(limit) });
}

// Público: lista de empleados que tienen jornada abierta (sin auth, para pantalla de PIN)
async function working(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { data: openRecords, error } = await supabase
    .from('time_records')
    .select('user_id')
    .is('clock_out', null);

  if (error) return res.status(500).json({ error: 'Error al consultar' });

  const userIds = [...new Set((openRecords || []).map((r) => r.user_id))];
  if (userIds.length === 0) return res.json({ working: [] });

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)
    .eq('active', true);

  if (usersError) return res.status(500).json({ error: 'Error al consultar' });
  res.json({ working: users || [] });
}

async function all(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  const { from, to, userId, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase.from('time_records').select('*, users!inner(name)', { count: 'exact' });
  if (userId) query = query.eq('user_id', parseInt(userId));
  if (from) query = query.gte('clock_in', from);
  if (to) query = query.lte('clock_in', `${to}T23:59:59`);
  query = query.order('clock_in', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: 'Error al obtener registros' });

  const records = (data || []).map((r) => ({ ...r, user_name: r.users?.name, users: undefined }));
  res.json({ records, total: count || 0, page: parseInt(page), limit: parseInt(limit) });
}

const routes = {
  'clock-in': clockIn,
  'clock-out': clockOut,
  status,
  history,
  all,
  working,
};

export default async function handler(req, res) {
  try {
    const { action } = req.query;
    const fn = routes[action];
    if (!fn) return res.status(404).json({ error: 'Ruta no encontrada' });
    await fn(req, res);
  } catch (err) {
    console.error('Records handler error:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
}
