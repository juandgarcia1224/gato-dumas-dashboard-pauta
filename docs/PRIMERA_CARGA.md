# PRIMERA CARGA — Runbook controlado

Modelo operativo: **Google fijo en `.env.local` · token de Meta temporal por
corrida** (el token no se guarda nunca). Ver [`SEGURIDAD_TOKENS.md`](SEGURIDAD_TOKENS.md).

---

## Paso 1 — Configurar Google en `.env.local` (una sola vez)

```bash
cd gato-dumas-dashboard
cp .env.example .env.local   # si aún no existe
```

Completa SOLO lo de Google (las cuentas y el Sheet ya vienen prellenados):

```
GOOGLE_SHEET_ID=1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k   # PROD (ya puesto)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com    # del JSON
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Deja `META_ACCESS_TOKEN=` **vacío** (es temporal, se entrega por corrida).

- Sheet oficial PROD: **DB_Dashboard_Gato_Dumas_Meta_Ads_PROD**
  - ID: `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k`
  - Ruta: CookMinds / Clientes / Gato Dumas / Dashboard Pauta
  - Owner: `cookmindsagency@gmail.com`
- **Comparte el Sheet PROD como Editor** con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## Paso 2 — Validar la base

```bash
npm run validate:env
```
Debe pasar con Google + cuentas en ✅. **Pasa aunque el token esté vacío** (es lo esperado).

## Paso 3 — Preparar el Sheet PROD

```bash
npm run sheets:setup
```
- Crea/valida las 8 hojas (`00_Config` … `07_Update_Log`).
- Siembra `00_Config` solo si está vacía. **No borra datos manuales.**
- `01_MediaPlan` queda lista para llenar (presupuestos del mes).
- Si falla por permisos → comparte el Sheet como Editor con el service account.

## Paso 4 — Prueba pequeña (con token temporal)

Forma A (oficial):
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range yesterday --updatedBy Juan
```
Forma B (interactiva, no muestra el token):
```bash
npm run meta:update:manual -- --range yesterday --updatedBy Juan
```

Verifica:
- [ ] Escribe en `02/03/04`, `05_Daily_Pacing`, `06_Alerts`.
- [ ] `07_Update_Log`: una fila por cuenta (started/finished/updatedBy/status/counts) — **sin token**.
- [ ] Ambas cuentas por separado (Colombia y Bucaramanga).
- [ ] Si una cuenta falla, la otra igual queda registrada.

## Paso 5 — Carga del mes

```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range this_month --updatedBy Juan
```

## Paso 6 — Validación de data (reportar)
Campañas / adsets / ads por cuenta · spend por cuenta · results y results_type ·
campañas sin results · campañas con spend>0 y results 0 · alertas · última actualización.

## Paso 7 — Ver el dashboard
```bash
npm run dev   # http://localhost:3000
```
El dashboard lee de Sheets: **funciona sin token**. El token solo se usa al sincronizar.

---

## Reglas del token
- No lo guardes en `.env.local`. No lo pegues en ChatGPT, Claude, WhatsApp, Notion ni documentos.
- Solo va en tu terminal, al correr `meta:update` / `meta:update:manual`.
- Si caducó (`(#190) ... expired`), genera otro y repite el comando.
