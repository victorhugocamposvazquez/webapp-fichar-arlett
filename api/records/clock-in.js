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
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) {
    return res.status(400).json({ error: 'Ya tienes una jornada abierta. Debes fichar la salida primero.' });
  }

  const { data, error } = await supabase
    .from('time_records')
    .insert({
      user_id: user.id,
      clock_in: new Date().toISOString(),
      clock_in_note: note || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Error al fichar entrada' });
  }

  res.status(201).json(data);
}
