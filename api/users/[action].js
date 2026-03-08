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

async function handleUserById(req, res, userId, currentUser) {
  if (req.method === 'PUT') {
    const { name, email, role, active } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from('users').update(updates).eq('id', userId)
      .select('id, name, email, role, pin_set, active, created_at').single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(data);
  }

  if (req.method === 'DELETE') {
    if (userId === currentUser.id) return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    await supabase.from('users').update({ active: false, updated_at: new Date().toISOString() }).eq('id', userId);
    return res.json({ message: 'Usuario desactivado' });
  }

  if (req.method === 'POST' && req.query.op === 'reset-pin') {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from('users').update({ pin_hash: null, pin_set: false, invite_code: inviteCode })
      .eq('id', userId).select('id, name, invite_code').single();

    if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json({ message: 'PIN reseteado', invite_code: inviteCode });
  }

  res.status(405).json({ error: 'Método no permitido' });
}

export default async function handler(req, res) {
  const user = requireAdmin(req, res);
  if (!user) return;

  const { action } = req.query;

  if (action === 'list' && req.method === 'GET') return listUsers(req, res);
  if (action === 'create' && req.method === 'POST') return createUser(req, res);

  const userId = parseInt(action);
  if (!isNaN(userId)) return handleUserById(req, res, userId, user);

  res.status(404).json({ error: 'Ruta no encontrada' });
}
