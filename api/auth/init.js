import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { signToken } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    return res.json({ initialized: count > 0 });
  }

  if (req.method === 'POST') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count > 0) {
      return res.status(400).json({ error: 'Ya existe un administrador. No se puede volver a configurar.' });
    }

    const { name, pin } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'El PIN debe ser de exactamente 4 dígitos' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        pin_hash: pinHash,
        pin_set: true,
        role: 'admin',
        active: true,
      })
      .select('id, name, role')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Error al crear administrador' });
    }

    const token = signToken({ id: data.id, name: data.name, role: data.role });

    return res.status(201).json({
      token,
      user: { id: data.id, name: data.name, role: data.role },
    });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
