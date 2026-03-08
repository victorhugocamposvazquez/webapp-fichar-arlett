import { supabase } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, pin_set')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json(data);
}
