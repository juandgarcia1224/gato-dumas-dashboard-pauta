# Login Google para /5gatos — Setup (Juan)

La vista cliente `/5gatos` y sus APIs (`/api/5gatos/*`) están protegidas con
Auth.js (next-auth v5) + Google Sign-In + allowlist de correos.
El código ya está completo y compila; solo faltan las credenciales OAuth.

## 1. Crear el OAuth Client en Google Cloud Console

1. Entra a <https://console.cloud.google.com/apis/credentials> (proyecto
   `cookminds-dashboards` u otro que prefieras).
2. **Create Credentials → OAuth client ID**.
3. Si pide configurar la *OAuth consent screen* primero:
   - User type: **External** · App name: `5 Gatos Dashboard` · Support email: tu correo.
   - Scopes: los default (openid, email, profile). No necesita verificación
     de Google porque solo pedimos email/perfil.
   - Publica la app (Publishing status: *In production*) para que no expire
     el acceso de testers.
4. Application type: **Web application**. Nombre: `5gatos-dashboard`.
5. **Authorized redirect URIs** (agrega TODAS):
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<TU-DOMINIO-VERCEL>.vercel.app/api/auth/callback/google`
     (la URL de producción del proyecto; agrega también la de preview si
     quieres probar login en previews)
6. Copia **Client ID** y **Client Secret**.

## 2. Variables de entorno

En `.env.local` (ya existe `AUTH_SECRET` generado) y en Vercel
(Settings → Environment Variables):

| Variable | Valor |
| --- | --- |
| `AUTH_SECRET` | `openssl rand -base64 32` (uno distinto para prod) |
| `AUTH_GOOGLE_ID` | Client ID del paso 1 |
| `AUTH_GOOGLE_SECRET` | Client Secret del paso 1 |
| `AUTH_ALLOWED_EMAILS` | CSV de correos permitidos, ej: `ruzmery@cookminds.com,socio1@5gatos.co,juandgarcia1224@gmail.com` |

Notas:
- La allowlist es **case-insensitive** y se lee en cada request: agregar un
  correo = editar la env var en Vercel + *Redeploy* (no hay que tocar código).
- Sin `AUTH_GOOGLE_ID/SECRET`, `/login` muestra un aviso de "acceso aún no
  habilitado" en lugar del botón (no rompe).

## 3. Probar

1. `npm run dev` → <http://localhost:3000/5gatos> → debe redirigir a `/login`.
2. "Entrar con Google" con un correo de la allowlist → entra a `/5gatos`.
3. Con un correo que NO esté en la lista → cae en `/login-denegado` con el
   mensaje "Solicita acceso a Juan".

## Cómo funciona (referencia)

- `src/auth.ts` — config Auth.js: Google provider, allowlist en el callback
  `signIn` (si el correo no está, redirige a `/login-denegado` sin crear sesión).
- `src/middleware.ts` — segunda barrera: exige sesión + allowlist en
  `/5gatos/:path*` y `/api/5gatos/:path*`. Las APIs devuelven 401/403 JSON;
  las páginas redirigen. La ruta interna `/` NO pasa por el middleware.
- `/api/cron/refresh-5gatos` no usa sesión: se protege con `CRON_SECRET`.
