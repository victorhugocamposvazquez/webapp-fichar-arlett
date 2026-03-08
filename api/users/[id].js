import { supabase } from '../_lib/supabase.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;
  const userId = parseInt(id);

  if (req.method === 'PUT') {
    const { name, email, role, active } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, role, pin_set, active, created_at')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(data);
  }

  if (req.method === 'DELETE') {
    if (userId === user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    await supabase
      .from('users')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return res.json({ message: 'Usuario desactivado' });
  }

  res.status(405).json({ error: 'Método no permitido' });
}
