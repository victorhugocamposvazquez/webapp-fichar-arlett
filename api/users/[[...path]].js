import { supabase } from '../_lib/supabase.js';
import { requireAdmin } from '../_lib/auth.js';
import { generateInviteCode } from '../_lib/codes.js';

async function listUsers(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, pin_set, invite_code, active, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Error al obtener usuarios' });
  return res.json(data);
}

async function createUser(req, res) {
  const { name, email, role } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

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
    if (error.code === '23505') return res.status(400).json({ error: 'El email ya está registrado' });
    return res.status(500).json({ error: 'Error al crear empleado' });
  }
  return res.status(201).json(data);
}

async function updateUser(req, res, userId) {
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

  if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(data);
}

async function deleteUser(req, res, userId, currentUserId) {
  if (userId === currentUserId) return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });

  await supabase
    .from('users')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return res.json({ message: 'Usuario desactivado' });
}

async function resetPin(req, res, userId) {
  const inviteCode = generateInviteCode();
  const { data, error } = await supabase
    .from('users')
    .update({ pin_hash: null, pin_set: false, invite_code: inviteCode })
    .eq('id', userId)
    .select('id, name, invite_code')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: `PIN reseteado`, invite_code: inviteCode });
}

export default async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  const pathParts = req.query.path || [];

  // GET/POST /api/users
  if (pathParts.length === 0) {
    if (req.method === 'GET') return listUsers(req, res);
    if (req.method === 'POST') return createUser(req, res);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const userId = parseInt(pathParts[0]);
  if (isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

  // POST /api/users/:id/reset-pin
  if (pathParts[1] === 'reset-pin') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    return resetPin(req, res, userId);
  }

  // PUT/DELETE /api/users/:id
  if (pathParts.length === 1) {
    if (req.method === 'PUT') return updateUser(req, res, userId);
    if (req.method === 'DELETE') return deleteUser(req, res, userId, user.id);
    return res.status(405).json({ error: 'Método no permitido' });
  }

  res.status(404).json({ error: 'Ruta no encontrada' });
}
