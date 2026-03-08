import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { pin } = req.body;
  if (!pin) {
    return res.status(400).json({ error: 'Se requiere el PIN' });
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('active', true)
    .eq('pin_set', true);

  if (error) {
    return res.status(500).json({ error: 'Error al consultar usuarios' });
  }

  // Parallel bcrypt comparison for performance
  const matches = await Promise.all(
    users.map(async (u) => ({
      user: u,
      match: await bcrypt.compare(pin, u.pin_hash),
    }))
  );

  const found = matches.find((m) => m.match);
  if (!found) {
    return res.status(401).json({ error: 'PIN incorrecto' });
  }

  const { user } = found;
  const token = signToken({ id: user.id, name: user.name, role: user.role });

  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role },
  });
}
