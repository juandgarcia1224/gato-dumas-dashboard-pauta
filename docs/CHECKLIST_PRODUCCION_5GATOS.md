# Checklist de producción — Dashboard 5 Gatos · Bucaramanga

Branch: `feature/bucaramanga-dashboard-5gatos`
Estado: código completo y probado en local. Faltan credenciales/pasos que
solo Juan puede hacer. Marca cada casilla en orden.

---

## 1. Token permanente de Meta ✅ RESUELTO 2026-07-14

Gato Buc aprobó el segundo admin y el token permanente quedó generado, subido
a Vercel (Production + Preview + Development) y sincronizado en `.env.local`.
El dashboard es 100% autónomo — el token no expira mientras la app, el System
User y la asignación de ad account sigan intactos.

**Rotación futura (solo si es necesario):** repetir Paso 5 del
`docs/BUSINESS_MANAGER_SETUP.md` para generar un nuevo token, luego:
```bash
cd /Users/mac/gato-dumas-dashboard
vercel env rm META_ACCESS_TOKEN_5GATOS production -y
printf '%s' 'EAA...token_nuevo' | vercel env add META_ACCESS_TOKEN_5GATOS production
# igual para preview
vercel --prod
```

### Registro histórico del bloqueo (referencia)

**Ya está listo:**
- App **"Dashboard 5 Gatos"** vinculada al portfolio Gato Dumas Bucaramanga
  (App ID `1039929148547583`).
- System User **`dashboard-5gatos`** (ID `61592010805228`) con rol Empleado.
- Ad account `act_248616958293893` asignada al System User con rol Analista
  (solo lectura).
- Producto **Marketing API** configurado en la app.

**Falta desbloquear:**
- [ ] Agregar segundo admin al portfolio Gato Dumas Bucaramanga (candidatas:
      Ruzmery `ramaya@gatodumas.com` o Adriana `adrianaduarteloi@gmail.com`).
      Requiere que tengan cuenta Facebook.
- [ ] Ese admin aprueba la solicitud de token desde su notificación.
- [ ] Copiar token, subir a Vercel como **`META_ACCESS_TOKEN_5GATOS`**:
      ```bash
      cd /Users/mac/gato-dumas-dashboard
      vercel env add META_ACCESS_TOKEN_5GATOS production
      vercel env add META_ACCESS_TOKEN_5GATOS preview
      vercel --prod
      ```
- [ ] Opcional: retirar al segundo admin después de aprobar (el token queda
      válido para siempre, no depende de que el admin siga).

**Mientras tanto:** `/5gatos` muestra "Estamos actualizando los datos" en la
sección Meta. Login, Sheet de mapeo, allowlist y export XLSX (estructura) SÍ
funcionan.

## 2. Sheet de mapeo curso↔ADSET (migrado 2026-07-12)

> **Modelo nuevo:** 1 adset = 1 curso o programa. El mapeo clasifica ADSETS
> (no campañas). Detalle completo en `docs/ADSET_MAPPING_5GATOS.md`.

El Sheet **ya existe, migrado al esquema adset**:

- Nombre: `Mapeo_Cursos_5Gatos_Bucaramanga`
- ID: `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs`
- URL: <https://docs.google.com/spreadsheets/d/1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs/edit>
- Dueño: `cookmindsagency@gmail.com` (quedó en su Drive)

Esquema hoja `Mapeo` (header fila 1):
`pattern_regex | adset_id_exacto | tipo | nombre_normalizado | activo | notas | legacy_campaign`

- `pattern_regex` regexea sobre el **nombre del ADSET** (case-insensitive).
- `adset_id_exacto` = match literal por id de adset (gana sobre el regex).
- `legacy_campaign=TRUE` → regla del modelo viejo (nombres de CAMPAÑA); el
  matcher la **ignora**. Las 8 reglas originales quedaron así marcadas (no se
  borró nada) y hay 13 reglas nuevas a nivel adset sembradas desde los
  nombres reales de la cuenta.
- Hoja `Sin_Clasificar` ahora registra adsets:
  `fecha_iso | adset_id | adset_name | campaign_id | campaign_name | account_id | status | notas`
- Hoja `README` (dentro del Sheet) documenta el esquema para Ruzmery.

Pendiente (desde la cuenta cookmindsagency, botón **Compartir**):

- [ ] Compartir como **Editor** con el service account:
      `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com`
      (sin esto la app usa el mapeo de respaldo `src/lib/mapping/fallback.json`
      y no puede escribir en `Sin_Clasificar`).
- [ ] Compartir como **Editor** con `juandgarcia1224@gmail.com`.
- [ ] Compartir como **Editor** con el correo de **Ruzmery** (ella mantiene
      la hoja `Mapeo`: agrega filas con regex o adset_id cuando aparezcan
      adsets nuevos; `Sin_Clasificar` se llena sola desde el dashboard).
- [ ] Ruzmery: revisar las 8 filas `legacy_campaign=TRUE` — si el patrón
      también sirve para nombres de adset, cambiar a FALSE; si no, dejarla.
- [ ] Opcional: `npx tsx scripts/setup-mapping-sheet.ts` re-verifica hojas,
      headers y migración (idempotente).

Alternativa si prefieres que el Sheet lo posea el service account: habilitar
la **Google Drive API** en el proyecto `cookminds-dashboards`
(<https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=284881347761>)
y correr el script con `GOOGLE_SHEET_MAPEO_5GATOS_ID` vacío.

## 3. Variables de entorno en Vercel

El proyecto ya existe y está desplegado: **https://gato-dumas-dashboard.vercel.app**
(detalles y comandos exactos en `docs/DEPLOY_5GATOS.md`). La mayoría de las
vars ya están cargadas; faltan solo las secretas marcadas ⚠️:

Settings → Environment Variables (Production + Preview):

| Variable | Estado | Valor / dónde sale |
| --- | --- | --- |
| `META_ACCESS_TOKEN_5GATOS` | ✅ cargada | Token permanente System User (resuelto 2026-07-14) |
| `META_API_VERSION` | ✅ cargada | `v22.0` |
| `META_AD_ACCOUNT_GATO_BUCARAMANGA` | ✅ cargada | `act_248616958293893` |
| `META_AD_ACCOUNT_GATO_COLOMBIA` | ✅ cargada | `act_299121374587072` (vista interna `/`) |
| `GOOGLE_SHEET_ID` | ✅ cargada | `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k` (PROD existente) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ cargada | `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | ⚠️ FALTA | La key del service account (comando exacto en DEPLOY_5GATOS.md) |
| `GOOGLE_SHEET_MAPEO_5GATOS_ID` | ✅ cargada | `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs` |
| `CRON_SECRET` | ✅ cargada | Generado nuevo (léelo con `vercel env pull`) |
| `AUTH_SECRET` | ✅ cargada | Generado nuevo |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | ⚠️ FALTAN | `docs/LOGIN_SETUP.md` paso 1 |
| `AUTH_ALLOWED_EMAILS` | ✅ (solo tu correo) | Amplíala con 5 Gatos + Ruzmery |
| `NEXT_PUBLIC_BENCHMARK_CPL_5GATOS` | opcional | default 25000 (COP) |

## 4. OAuth Client de Google

- [ ] Crear el OAuth Client (guía completa en `docs/LOGIN_SETUP.md`).
- [ ] Agregar la redirect URI de la URL real de Vercel.

## 5. Probar login con una cuenta de 5 Gatos

- [ ] Agrega tu correo y uno de 5 Gatos a `AUTH_ALLOWED_EMAILS` → Redeploy.
- [ ] Abre `https://<url>/5gatos` en incógnito → login Google → dashboard.
- [ ] Prueba con un correo NO listado → debe caer en `/login-denegado`.
- [ ] Botón "Descargar Excel" → baja `5Gatos_Bucaramanga_YYYY-MM.xlsx`.

## 6. Verificar el cron

- [ ] Manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://<url>/api/cron/refresh-5gatos`
      → `{"ok":true,"nivel":"adset",...}` y filas en `13_5Gatos_Adsets_Snapshot`
      del Sheet PROD (la hoja 11, nivel campaña, queda como histórico legacy).
- [ ] El cron corre **1 vez al día (6:00 a.m. Bogotá)** — el plan Hobby de
      Vercel no permite más frecuencia. Con plan Pro, cambiar `vercel.json`
      a `"0 */3 * * *"` (cada 3 h, como se pidió originalmente). **Solo corre
      en producción**, no en previews.
- [ ] Si el token vence: a las 3 fallas seguidas el endpoint responde
      "CIRCUIT BREAKER 5GATOS" con la acción a tomar (ver `12_5Gatos_Cron_Log`).

## 7. Promover a producción

```bash
cd /Users/mac/gato-dumas-dashboard
git checkout main && git merge feature/bucaramanga-dashboard-5gatos && git push
# o desde el branch:
vercel --prod
```

- [ ] Verificar que `/` (vista interna Cloud Design) sigue intacta.
- [ ] Compartir la URL `/5gatos` con el cliente.

---

### Qué quedó probado en local (2026-07-07)

- Build limpio (`npm run build`), tests de mapeo 5/5.
- Pipeline completo de datos validado con Graph API simulada (agrupación por
  curso/programa, KPIs, deltas, semáforo CPL, sin-clasificar).
- Middleware: `/5gatos`→redirect a login, APIs → 401/403 JSON.
- Cron: auth por Bearer, creó `11_5Gatos_Snapshot`/`12_5Gatos_Cron_Log` en el
  Sheet PROD y registró la corrida fallida por token vencido (comportamiento
  esperado del log de errores).
