import { supabase } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { note } = req.body || {};

  const { data: open } = await supabase
    .from('time_records')
    .select('*')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!open) {
    return res.status(400).json({ error: 'No tienes ninguna jornada abierta.' });
  }

  const now = new Date();
  const clockIn = new Date(open.clock_in);
  const durationMinutes = Math.round((now - clockIn) / 60000);

  const { data, error } = await supabase
    .from('time_records')
    .update({
      clock_out: now.toISOString(),
      clock_out_note: note || null,
      duration_minutes: durationMinutes,
    })
    .eq('id', open.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Error al fichar salida' });
  }

  res.json(data);
}
