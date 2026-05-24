# PRIMERA CARGA — Runbook controlado (Bloque 2)

Secuencia exacta para conectar credenciales reales y hacer la primera carga
segura de Meta → Google Sheets. **No** contiene credenciales: Juan las llena
manualmente en `.env.local` (que está en `.gitignore` y nunca se commitea).

---

## Paso 1 — Llenar `.env.local`

```bash
cd gato-dumas-dashboard
cp .env.example .env.local   # si aún no existe
```

Edita `.env.local` y completa SOLO estos 4 valores (los demás ya vienen listos):

```
META_ACCESS_TOKEN=            # token temporal de Meta (ads_read)
GOOGLE_SHEET_ID=             # ID del Sheet (parte de la URL entre /d/ y /edit)
GOOGLE_SERVICE_ACCOUNT_EMAIL= # ...@...iam.gserviceaccount.com  (del JSON)
GOOGLE_PRIVATE_KEY=          # "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Cuentas Meta (ya prellenadas, NO tocar):
- Gato Colombia → `act_299121374587072`
- Gato Bucaramanga → `act_248616958293893`

Notas:
- `GOOGLE_PRIVATE_KEY` va **entre comillas**, con los `\n` literales tal como vienen en el JSON.
- El token de Graph Explorer caduca pronto; para uso recurrente usar System User token (ver `SEGURIDAD_TOKENS.md`).

## Paso 2 — Validar entorno

```bash
npm run validate:env
```
Debe mostrar ✅ en las 4 variables + cuentas. Si hay ❌, corrige esa variable.

## Paso 3 — Preparar el Sheet

**Antes:** comparte el Google Sheet con el `GOOGLE_SERVICE_ACCOUNT_EMAIL` como **Editor**.

```bash
npm run sheets:setup
```

Qué hace y garantías de seguridad:
- Crea las hojas faltantes (`00_Config` … `07_Update_Log`) y fija sus encabezados.
- Siembra `00_Config` con las 2 cuentas **solo si está vacía**.
- **No borra datos manuales:** `01_MediaPlan` nunca se sobrescribe; `00_Config` solo se siembra si no tiene filas; las demás solo reciben encabezados en la fila 1.
- Si el service account no tiene permiso, falla con un error claro tipo *"The caller does not have permission"* → vuelve a compartir el Sheet como Editor.

Verifica en el Sheet:
- [ ] Existen las 8 hojas.
- [ ] `00_Config` tiene las 2 filas (gato_colombia / gato_bucaramanga) con sus `act_...`.
- [ ] `01_MediaPlan` está lista para llenar (presupuestos del mes).

## Paso 4 — Prueba pequeña (yesterday)

```bash
npm run meta:update -- --range yesterday --updatedBy Juan
```

Verifica:
- [ ] Escribe en `02/03/04` (campaigns/adsets/ads), `05_Daily_Pacing`, `06_Alerts`.
- [ ] `07_Update_Log` registra **una fila por cuenta** con: started_at, finished_at, updated_by, platform, account_group, status, counts y error_message.
- [ ] Aparecen **ambas cuentas por separado** (Colombia y Bucaramanga).
- [ ] Si una cuenta falla, la otra igual queda registrada (la fallida con status=error y mensaje).

## Paso 5 — Carga del mes

Si la prueba salió bien:
```bash
npm run meta:update -- --range this_month --updatedBy Juan
```

## Paso 6 — Validación de data (reportar)

Con la carga `this_month`, revisar y reportar:

| # | Métrica |
|---|---|
| 1 | Campañas por cuenta |
| 2 | Adsets por cuenta |
| 3 | Ads por cuenta |
| 4 | Spend total por cuenta |
| 5 | Results detectados por cuenta |
| 6 | results_type dominante |
| 7 | Campañas sin results_type |
| 8 | Campañas con spend>0 y results null |
| 9 | Alertas generadas |
| 10 | Última actualización visible en el dashboard |

## Paso 7 — Ver el dashboard

```bash
npm run dev    # http://localhost:3000
```
La tarjeta "Última actualización" debe mostrar fecha, quién y estado por cuenta.

---

## Si algo falla
- Token caducado → `(#190) ... expired`: genera otro y reemplázalo en `.env.local`.
- Permiso Sheet → comparte como Editor con el email del service account.
- "Sin datos" en el dashboard → aún no corriste `meta:update`.
- Una cuenta falla pero la otra no → revisa `07_Update_Log` (columna `error_message`).
