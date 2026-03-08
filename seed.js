/**
 * Seed script: crea el usuario administrador inicial en Supabase.
 *
 * Uso:
 *   1. Copia .env.example a .env y rellena tus credenciales de Supabase
 *   2. Ejecuta: node seed.js
 *
 * Admin por defecto: PIN 0000
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

// Load .env manually (no dotenv needed at root for seed)
try {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
} catch {
  // .env might not exist
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Configura SUPABASE_URL y SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Comprobando si ya existe un admin...');

  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (admins && admins.length > 0) {
    console.log('Ya existe un administrador (ID: %d). No se crea otro.', admins[0].id);
    return;
  }

  const pinHash = await bcrypt.hash('0000', 10);

  const { data, error } = await supabase
    .from('users')
    .insert({
      name: 'Administrador',
      email: 'admin@arlett.com',
      pin_hash: pinHash,
      pin_set: true,
      role: 'admin',
      active: true,
    })
    .select('id, name, role')
    .single();

  if (error) {
    console.error('Error al crear admin:', error.message);
    process.exit(1);
  }

  console.log('Admin creado correctamente:');
  console.log('  ID:   %d', data.id);
  console.log('  Name: %s', data.name);
  console.log('  PIN:  0000');
  console.log('\n¡Cambia el PIN desde el panel después del primer login!');
}

seed().catch(console.error);
