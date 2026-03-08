import { supabase } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { from, to, page = 1, limit = 30 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('time_records')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (from) query = query.gte('clock_in', from);
  if (to) query = query.lte('clock_in', `${to}T23:59:59`);

  query = query
    .order('clock_in', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  const { data, count, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Error al obtener historial' });
  }

  res.json({
    records: data || [],
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  });
}
