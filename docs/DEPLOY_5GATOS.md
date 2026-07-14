# Deploy 5 Gatos — estado y pasos restantes

## Estado actual (2026-07-07)

- Proyecto Vercel **creado y desplegado**: `juandgarcia1224s-projects/gato-dumas-dashboard`.
- URL: **<https://gato-dumas-dashboard.vercel.app>** (proyecto nuevo, sin dominio
  de cliente; la ruta `/` interna y `/5gatos` responden).
- Branch desplegado: `feature/bucaramanga-dashboard-5gatos` (deploy por CLI,
  el proyecto NO está conectado a GitHub — no hay auto-deploys).
- Nota: el CLI (`vercel --yes`) marcó este primer deploy como `production`
  del proyecto nuevo. No existía ninguna producción previa ni dominio, así
  que no se afectó nada existente. La vista interna de Cloud Design sigue
  viviendo donde siempre.

## Env vars YA cargadas en Vercel (Preview + Production)

`META_API_VERSION`, `META_AD_ACCOUNT_GATO_BUCARAMANGA`,
`META_AD_ACCOUNT_GATO_COLOMBIA`, `GOOGLE_SHEET_ID`,
`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SHEET_MAPEO_5GATOS_ID`,
`AUTH_ALLOWED_EMAILS` (por ahora solo juandgarcia1224@gmail.com),
`AUTH_SECRET`, `CRON_SECRET` (generados nuevos, léelos con `vercel env pull`),
`NEXT_PUBLIC_CLIENT_NAME`, `NEXT_PUBLIC_TIMEZONE`.

## Env vars que FALTAN (Juan — el sistema no me dejó subir secretos locales)

```bash
cd /Users/mac/gato-dumas-dashboard

# 1) Private key del service account (el mismo valor de .env.local, con los \n literales)
grep '^GOOGLE_PRIVATE_KEY=' .env.local | cut -d= -f2- | vercel env add GOOGLE_PRIVATE_KEY production
grep '^GOOGLE_PRIVATE_KEY=' .env.local | cut -d= -f2- | vercel env add GOOGLE_PRIVATE_KEY preview

# 2) Token permanente de Meta (System User — docs/BUSINESS_MANAGER_SETUP.md)
printf '%s' 'EAA...tu_token_permanente' | vercel env add META_ACCESS_TOKEN_5GATOS production
printf '%s' 'EAA...tu_token_permanente' | vercel env add META_ACCESS_TOKEN_5GATOS preview

# 3) OAuth de Google (docs/LOGIN_SETUP.md)
printf '%s' 'xxxx.apps.googleusercontent.com' | vercel env add AUTH_GOOGLE_ID production
printf '%s' 'GOCSPX-xxxx' | vercel env add AUTH_GOOGLE_SECRET production
# (repite con `preview` si quieres login en previews)

# 4) Ampliar la allowlist (borra y recrea la var, o edítala en el dashboard de Vercel)
vercel env rm AUTH_ALLOWED_EMAILS production
printf '%s' 'juandgarcia1224@gmail.com,ruzmery@...,socio@5gatos...' | vercel env add AUTH_ALLOWED_EMAILS production

# 5) Redeploy para aplicar
vercel --prod
```

## Cron

- `vercel.json` define `/api/cron/refresh-5gatos` **1 vez al día 11:00 UTC
  (6:00 a.m. Bogotá)**: el plan Hobby no permite más frecuencia.
  El requerimiento original era cada 3 horas → si pasan el proyecto a
  **Vercel Pro**, cambiar el schedule a `0 */3 * * *`.
- No es crítico: la página `/5gatos` consulta Meta en vivo (caché 10 min);
  el cron solo alimenta el histórico (`11_5Gatos_Snapshot` del Sheet PROD).
- Vercel envía solo el header `Authorization: Bearer $CRON_SECRET`.

## Deploys futuros

```bash
cd /Users/mac/gato-dumas-dashboard
vercel          # preview
vercel --prod   # producción
```

O conectar el repo GitHub en Vercel → Settings → Git para auto-deploys
(main → production, branches → preview).
