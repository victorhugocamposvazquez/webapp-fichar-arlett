import bcrypt from 'bcryptjs';
import { supabase } from '../../_lib/supabase.js';
import { requireAdmin } from '../../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;
  const userId = parseInt(id);
  const { newPin } = req.body;

  if (!newPin || newPin.length < 4 || newPin.length > 6) {
    return res.status(400).json({ error: 'El nuevo PIN debe tener entre 4 y 6 dígitos' });
  }

  // Check uniqueness
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, pin_hash')
    .eq('active', true)
    .eq('pin_set', true)
    .neq('id', userId);

  const conflicts = await Promise.all(
    (allUsers || []).map(async (u) => bcrypt.compare(newPin, u.pin_hash))
  );
  if (conflicts.some(Boolean)) {
    return res.status(409).json({ error: 'Este PIN ya está en uso. Elige otro.' });
  }

  const hash = await bcrypt.hash(newPin, 10);

  const { error } = await supabase
    .from('users')
    .update({
      pin_hash: hash,
      pin_set: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return res.status(500).json({ error: 'Error al resetear PIN' });
  }

  res.json({ message: 'PIN actualizado correctamente.' });
}
