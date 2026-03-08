import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, pin_set, active, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Error al obtener usuarios' });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { name, email, role, pin } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!pin || pin.length < 4 || pin.length > 6) {
      return res.status(400).json({ error: 'El PIN debe tener entre 4 y 6 dígitos' });
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

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email || null,
        role: role || 'employee',
        pin_hash: pinHash,
        pin_set: true,
      })
      .select('id, name, email, role, pin_set, active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      return res.status(500).json({ error: 'Error al crear usuario' });
    }

    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Método no permitido' });
}
