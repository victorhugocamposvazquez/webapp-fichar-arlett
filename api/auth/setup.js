import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { inviteCode, name, pin } = req.body;

  if (!inviteCode) {
    return res.status(400).json({ error: 'El código de invitación es obligatorio' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre completo es obligatorio' });
  }
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'El PIN debe ser de exactamente 4 dígitos' });
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .eq('active', true)
    .eq('pin_set', false)
    .maybeSingle();

  if (!user) {
    return res.status(404).json({ error: 'Código de invitación inválido o ya utilizado' });
  }

  // Check PIN uniqueness
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, pin_hash')
    .eq('active', true)
    .eq('pin_set', true);

  const conflicts = await Promise.all(
    (allUsers || []).map(async (u) => bcrypt.compare(pin, u.pin_hash))
  );
  if (conflicts.some(Boolean)) {
    return res.status(409).json({ error: 'Este PIN ya está en uso. Elige otro.' });
  }

  const pinHash = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from('users')
    .update({
      name: name.trim(),
      pin_hash: pinHash,
      pin_set: true,
      invite_code: null,
    })
    .eq('id', user.id);

  if (error) {
    return res.status(500).json({ error: 'Error al configurar la cuenta' });
  }

  const token = signToken({ id: user.id, name: name.trim(), role: user.role });

  res.json({
    token,
    user: { id: user.id, name: name.trim(), role: user.role },
  });
}
