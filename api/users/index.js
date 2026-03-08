import { supabase } from '../_lib/supabase.js';
import { requireAdmin } from '../_lib/auth.js';
import { generateInviteCode } from '../_lib/codes.js';

export default async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, pin_set, invite_code, active, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Error al obtener usuarios' });
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { name, email, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const inviteCode = generateInviteCode();

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email || null,
        role: role || 'employee',
        invite_code: inviteCode,
        pin_set: false,
      })
      .select('id, name, email, role, pin_set, invite_code, active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      return res.status(500).json({ error: 'Error al crear empleado' });
    }

    return res.status(201).json(data);
  }

  res.status(405).json({ error: 'Método no permitido' });
}
