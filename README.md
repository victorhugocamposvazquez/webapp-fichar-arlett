# Arlett · Sistema de Fichaje

Sistema de registro de jornada laboral conforme al **Real Decreto-ley 8/2019** para Arlett Beauty & Health.  
Desplegable en **Vercel** con **Supabase** como base de datos.

## Características

- **Login con solo PIN** (4 dígitos): cada empleado ficha con un PIN único que solo él conoce.
- **Primer acceso con código de invitación**: el admin crea un empleado y le da un código. El empleado introduce el código, su nombre completo y elige su PIN.
- **El admin nunca ve los PINs**: máxima seguridad y cumplimiento RGPD.
- **Botón de entrada/salida**: gran botón circular animado, un toque para fichar.
- **Temporizador en tiempo real** durante la jornada activa.
- **Cambiar PIN**: cada empleado puede cambiar su propio PIN.
- **Backoffice de administración**:
  - Crear empleados (genera código de invitación automáticamente).
  - Resetear PIN (genera nuevo código de invitación).
  - Ver todos los registros de fichaje con filtros.
  - Exportar registros a CSV.
- **Diseño responsive**: mobile-first, optimizado para tablet y escritorio.
- **Tema dark** con acentos dorados (branding Arlett).
- **Sin scripts de instalación**: la primera vez que abres la app, te guía para crear el admin.

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

En Vercel (Settings → Environment Variables) o en un archivo `.env` local:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key
JWT_SECRET=un-secreto-largo-y-seguro
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Desarrollo local

```bash
npx vercel dev
```

Accede a **http://localhost:3000**

### 5. Desplegar en Vercel

```bash
npx vercel --prod
```

O conecta tu repositorio a Vercel.

## Primer uso

1. Abre la app → aparece la pantalla de **Configuración inicial**.
2. Introduce tu nombre y elige un PIN de 4 dígitos → se crea la cuenta de admin.
3. Ve al backoffice → **Empleados** → **Nuevo** → introduce el nombre del empleado.
4. Se genera un **código de invitación** (ej: `AB3K7N`). Comunícaselo al empleado.
5. El empleado abre la app → **Primer acceso** → introduce el código → su nombre completo → elige su PIN.
6. A partir de ahí, cada empleado solo necesita su PIN para fichar.

## Flujo de reseteo de PIN

1. Admin va a **Empleados** → pulsa el botón de reseteo en el empleado.
2. Se genera un **nuevo código de invitación**.
3. El empleado usa ese código en **Primer acceso** para configurar un PIN nuevo.

---

Desarrollado para **Arlett Beauty & Health** · Cumplimiento RD-ley 8/2019
