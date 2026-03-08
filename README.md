# Arlett · Sistema de Fichaje

Sistema de registro de jornada laboral conforme al **Real Decreto-ley 8/2019** para Arlett Beauty & Health.  
Desplegable en **Vercel** con **Supabase** como base de datos.

## Características

- **Login con solo PIN**: cada empleado ficha con un PIN único de 4-6 dígitos. Sin IDs, sin contraseñas.
- **Botón de entrada/salida**: gran botón circular animado, un toque para fichar.
- **Temporizador en tiempo real** durante la jornada activa.
- **Cambiar PIN**: cada empleado puede cambiar su propio PIN desde el panel.
- **Backoffice de administración**:
  - Crear empleados con su PIN inicial.
  - Cambiar PINs olvidados.
  - Ver todos los registros de fichaje con filtros.
  - Exportar registros a CSV.
- **Diseño responsive**: mobile-first, optimizado para tablet y escritorio.
- **Tema dark** con acentos dorados (branding Arlett).

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS v4 + React Router + Lucide Icons |
| Backend | Vercel Serverless Functions (Node.js) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | JWT + bcrypt |

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto.
2. En **SQL Editor**, ejecuta el contenido de `supabase-schema.sql`.
3. Copia tu **Project URL** y **service_role key** (Settings → API).

### 2. Variables de entorno

Crea un archivo `.env` en la raíz (para desarrollo local):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJ...tu-service-role-key
JWT_SECRET=un-secreto-largo-y-seguro
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Crear admin inicial

```bash
node seed.js
```

Esto crea un administrador con PIN **0000** (cámbialo después del primer login).

### 5. Desarrollo local

```bash
npx vercel dev
```

Accede a **http://localhost:3000**

### 6. Desplegar en Vercel

```bash
npx vercel --prod
```

O conecta tu repositorio a Vercel y configura las variables de entorno:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`

## Flujo de uso

1. El admin entra con PIN **0000** y va al backoffice.
2. Crea empleados asignándoles un PIN.
3. Cada empleado introduce su PIN en la pantalla principal → queda identificado.
4. Pulsa el botón central para **iniciar** o **finalizar** la jornada.
5. Los registros quedan almacenados y accesibles desde el backoffice.

---

Desarrollado para **Arlett Beauty & Health** · Cumplimiento RD-ley 8/2019
