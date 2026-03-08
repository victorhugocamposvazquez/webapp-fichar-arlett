import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const { currentPin, newPin } = req.body;

  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Se requiere el PIN actual y el nuevo' });
  }
  if (newPin.length !== 4) {
    return res.status(400).json({ error: 'El PIN debe tener exactamente 4 dígitos' });
  }

  const { data: me } = await supabase
    .from('users')
    .select('pin_hash')
    .eq('id', user.id)
    .single();

  if (!me || !(await bcrypt.compare(currentPin, me.pin_hash))) {
    return res.status(401).json({ error: 'PIN actual incorrecto' });
  }

  // Check uniqueness
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, pin_hash')
    .eq('active', true)
    .eq('pin_set', true)
    .neq('id', user.id);

  const conflicts = await Promise.all(
    (allUsers || []).map(async (u) => bcrypt.compare(newPin, u.pin_hash))
  );
  if (conflicts.some(Boolean)) {
    return res.status(409).json({ error: 'Este PIN ya está en uso. Elige otro.' });
  }

  const hash = await bcrypt.hash(newPin, 10);
  await supabase
    .from('users')
    .update({ pin_hash: hash, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  res.json({ message: 'PIN cambiado correctamente' });
}
