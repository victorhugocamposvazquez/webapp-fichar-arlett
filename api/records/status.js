import { supabase } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { data: openRecord } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Start of today in Europe/Madrid
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  const todayStart = new Date(`${todayStr}T00:00:00+01:00`).toISOString();

  const { data: todayRecords } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('clock_in', todayStart)
    .order('clock_in', { ascending: false });

  const totalMinutesToday = (todayRecords || []).reduce(
    (sum, r) => sum + (r.duration_minutes || 0),
    0
  );

  res.json({
    isWorking: !!openRecord,
    currentRecord: openRecord || null,
    todayRecords: todayRecords || [],
    totalMinutesToday,
  });
}
