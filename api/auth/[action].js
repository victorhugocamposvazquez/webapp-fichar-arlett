import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { signToken, requireAuth } from '../_lib/auth.js';

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'Se requiere el PIN' });

  const { data: users, error } = await supabase
    .from('users').select('*').eq('active', true).eq('pin_set', true);

  if (error) return res.status(500).json({ error: 'Error al consultar usuarios' });

  const matches = await Promise.all(
    users.map(async (u) => ({ user: u, match: await bcrypt.compare(pin, u.pin_hash) }))
  );
  const found = matches.find((m) => m.match);
  if (!found) return res.status(401).json({ error: 'PIN incorrecto' });

  const { user } = found;
  const token = signToken({ id: user.id, name: user.name, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}

async function handleInit(req, res) {
  if (req.method === 'GET') {
    const { count } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
    return res.json({ initialized: count > 0 });
  }

  if (req.method === 'POST') {
    const { count } = await supabase
      .from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
    if (count > 0) return res.status(400).json({ error: 'Ya existe un administrador.' });

    const { name, pin } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });

    const pinHash = await bcrypt.hash(pin, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ name: name.trim(), pin_hash: pinHash, pin_set: true, role: 'admin', active: true })
      .select('id, name, role').single();

    if (error) return res.status(500).json({ error: 'Error al crear administrador' });

    const token = signToken({ id: data.id, name: data.name, role: data.role });
    return res.status(201).json({ token, user: { id: data.id, name: data.name, role: data.role } });
  }

  res.status(405).json({ error: 'Método no permitido' });
}

async function handleSetup(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { inviteCode, name, pin } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'El código de invitación es obligatorio' });
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre completo es obligatorio' });
  if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });

  const { data: user } = await supabase
    .from('users').select('*')
    .eq('invite_code', inviteCode.toUpperCase()).eq('active', true).eq('pin_set', false)
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'Enlace inválido o ya utilizado' });

  const { data: allUsers } = await supabase
    .from('users').select('id, pin_hash').eq('active', true).eq('pin_set', true);

  const conflicts = await Promise.all(
    (allUsers || []).map(async (u) => bcrypt.compare(pin, u.pin_hash))
  );
  if (conflicts.some(Boolean)) return res.status(409).json({ error: 'Este PIN ya está en uso. Elige otro.' });

  const pinHash = await bcrypt.hash(pin, 10);
  const { error } = await supabase
    .from('users')
    .update({ name: name.trim(), pin_hash: pinHash, pin_set: true, invite_code: null })
    .eq('id', user.id);

  if (error) return res.status(500).json({ error: 'Error al configurar la cuenta' });

  const token = signToken({ id: user.id, name: name.trim(), role: user.role });
  res.json({ token, user: { id: user.id, name: name.trim(), role: user.role } });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const user = requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from('users').select('id, name, email, role, pin_set').eq('id', user.id).single();

  if (error || !data) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
}

async function handleChangePin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const user = requireAuth(req, res);
  if (!user) return;

  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) return res.status(400).json({ error: 'Se requiere el PIN actual y el nuevo' });
  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos' });

  const { data: me } = await supabase.from('users').select('pin_hash').eq('id', user.id).single();
  if (!me || !(await bcrypt.compare(currentPin, me.pin_hash))) {
    return res.status(401).json({ error: 'PIN actual incorrecto' });
  }

  const { data: allUsers } = await supabase
    .from('users').select('id, pin_hash').eq('active', true).eq('pin_set', true).neq('id', user.id);

  const conflicts = await Promise.all(
    (allUsers || []).map(async (u) => bcrypt.compare(newPin, u.pin_hash))
  );
  if (conflicts.some(Boolean)) return res.status(409).json({ error: 'Este PIN ya está en uso. Elige otro.' });

  const hash = await bcrypt.hash(newPin, 10);
  await supabase.from('users').update({ pin_hash: hash }).eq('id', user.id);
  res.json({ message: 'PIN cambiado correctamente' });
}

const routes = {
  login: handleLogin,
  init: handleInit,
  setup: handleSetup,
  me: handleMe,
  'change-pin': handleChangePin,
};

export default async function handler(req, res) {
  const { action } = req.query;
  const fn = routes[action];
  if (!fn) return res.status(404).json({ error: 'Ruta no encontrada' });
  return fn(req, res);
}
