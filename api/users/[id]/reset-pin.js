import { supabase } from '../../_lib/supabase.js';
import { requireAdmin } from '../../_lib/auth.js';
import { generateInviteCode } from '../../_lib/codes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;
  const userId = parseInt(id);

  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from('users')
    .update({
      pin_hash: null,
      pin_set: false,
      invite_code: inviteCode,
    })
    .eq('id', userId)
    .select('id, name, invite_code')
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    message: `PIN reseteado. Nuevo código de acceso: ${inviteCode}`,
    invite_code: inviteCode,
  });
}
