import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'arlett-fichaje-default-secret';

function verifyToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Token requerido o inválido' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
    return null;
  }
  return user;
}

function generateInviteCode(length = 6) {
  const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

async function listUsers(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, pin_set, invite_code, active, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Error al obtener usuarios', detail: error.message });
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
    return res.status(500).json({ error: 'Error al crear empleado', detail: error.message });
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

    const permanent = req.query.permanent === '1' || req.query.permanent === 'true';
    if (permanent) {
      await supabase.from('time_records').delete().eq('user_id', userId);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) return res.status(500).json({ error: 'Error al eliminar usuario', detail: error.message });
      return res.json({ message: 'Usuario eliminado definitivamente' });
    }

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
  try {
    const user = requireAdmin(req, res);
    if (!user) return;

    const { action } = req.query;

    if (action === 'list' && req.method === 'GET') {
      await listUsers(req, res);
      return;
    }
    if (action === 'create' && req.method === 'POST') {
      await createUser(req, res);
      return;
    }

    const userId = parseInt(action);
    if (!isNaN(userId)) {
      await handleUserById(req, res, userId, user);
      return;
    }

    res.status(404).json({ error: 'Ruta no encontrada' });
  } catch (err) {
    console.error('Users handler error:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
}
