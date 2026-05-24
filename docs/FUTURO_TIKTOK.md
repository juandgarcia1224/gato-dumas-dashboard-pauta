# FUTURO — Fase 2: TikTok Ads

TikTok **no** está implementado (Fase 1 = solo Meta). La arquitectura ya quedó
preparada para añadirlo sin reescribir el dashboard. Este documento describe el
plan.

## Qué ya está listo para TikTok

- `platform` es una dimensión en **todas** las hojas y tipos (`"meta" | "tiktok"`).
- `config/clients.ts` define grupos de cuenta con `platform`; basta agregar entradas TikTok.
- La capa `dashboard/` (metrics, alerts, pacing, contract) es **agnóstica de plataforma**: opera sobre filas normalizadas, no sobre Meta directamente.
- Las hojas RAW separan por `platform`, así que Meta y TikTok pueden convivir.

## Qué falta construir (Fase 2)

1. **`src/lib/tiktok/`** — espejo de `meta/`:
   - `client.ts` (TikTok Business API).
   - `insights.ts` (reportes por campaign/adgroup/ad).
   - `transform.ts` (mapear a las mismas columnas RAW; interpretar resultados de TikTok).
   - `types.ts`.
2. **Variables de entorno:**
   ```
   TIKTOK_ACCESS_TOKEN=
   TIKTOK_APP_ID=
   TIKTOK_ADVERTISER_GATO_COLOMBIA=
   TIKTOK_ADVERTISER_GATO_BUCARAMANGA=
   ```
3. **Cuentas en `config/clients.ts`:** agregar grupos con `platform: "tiktok"`.
4. **Script `update-tiktok.ts`** (o extender `update-meta.ts` a un `update.ts` multi-plataforma).
5. **Hojas:** reusar el esquema RAW (la columna `platform` distingue) o crear
   `08_TikTok_*_Raw` si se prefiere separar físicamente.
6. **UI:** añadir un selector de plataforma (Meta / TikTok / Todas) análogo al de cuenta. El contrato de datos ya soporta `platform` por fila.

## Equivalencias de nivel

| Meta | TikTok |
|---|---|
| campaign | campaign |
| adset | ad group |
| ad | ad |

## Decisión pendiente
Definir el mapeo de "resultado principal" de TikTok (ej. `on_web_order`,
`form`, `messaging`) con la misma lógica de prioridad que Meta
(`meta/transform.ts → RESULT_PRIORITY`).

## Estimación de impacto
Bajo en el dashboard (consume el mismo contrato); el trabajo se concentra en la
capa de ingesta `tiktok/` y el script de actualización.
