# DATA SCHEMA — Estructura del Google Sheet

Fuente única de verdad de columnas: [`src/lib/sheets/schema.ts`](../src/lib/sheets/schema.ts).
Si cambias una columna, cámbiala ahí y actualiza este documento.

Convenciones:
- `pulled_at`, `started_at`, `finished_at`: ISO 8601 (UTC).
- Fechas de negocio (`date_start`, etc.): `YYYY-MM-DD`.
- `account_group`: `gato_colombia` | `gato_bucaramanga`.
- `platform`: `meta` (Fase 1). TikTok añadirá `tiktok` (Fase 2).
- Montos en **COP** (moneda de ambas cuentas).
- `ctr`, `spend_delta_pct`: porcentajes (ej. `1.23` = 1.23%).

---

## 00_Config
Define qué cuentas existen. Editable, pero `setup-sheets` lo siembra si está vacío.

| Columna | Descripción |
|---|---|
| client_id | `gatodumas` |
| client_name | `Gato Dumas` |
| account_group | `gato_colombia` / `gato_bucaramanga` |
| platform | `meta` |
| ad_account_id | `act_...` |
| ad_account_name | Nombre legible de la cuenta |
| sede | Cobertura geográfica |
| active | `TRUE` / `FALSE` |
| notes | Notas internas |

Ejemplo:
```
gatodumas | Gato Dumas | gato_colombia    | meta | act_299121374587072 | Gato Colombia | Bogotá / Barranquilla     | TRUE
gatodumas | Gato Dumas | gato_bucaramanga | meta | act_248616958293893 | Gato Bucaramanga | Cinco Gatos / Bucaramanga | TRUE
```

---

## 01_MediaPlan
**Editable manualmente por Juan/Paola.** Alimenta el cálculo de pacing.

| Columna | Descripción |
|---|---|
| month | `YYYY-MM` |
| platform | `meta` |
| account_group | grupo de cuenta |
| campaign_name | nombre de la campaña planeada |
| sede | sede |
| objective | objetivo de la campaña |
| start_date / end_date | `YYYY-MM-DD` |
| planned_budget | presupuesto planeado (COP) — **se suma por mes/cuenta para pacing** |
| planned_result_type | tipo de resultado esperado |
| planned_results | cantidad de resultados esperados |
| planned_cpa | costo por resultado objetivo |
| notes | notas |

---

## 02_Meta_Campaigns_Raw
Datos crudos a nivel campaña. **Se sobrescribe** en cada `meta:update`.

`pulled_at, date_start, date_stop, platform, account_group, ad_account_id, ad_account_name, campaign_id, campaign_name, buying_type, objective, status, effective_status, spend, impressions, reach, frequency, clicks, inline_link_clicks, ctr, cpc, cpm, results_type, results, cost_per_result, actions_json, raw_json`

## 03_Meta_Adsets_Raw
Igual que campañas + `adset_id, adset_name, daily_budget, lifetime_budget`.

`pulled_at, date_start, date_stop, platform, account_group, ad_account_id, campaign_id, campaign_name, adset_id, adset_name, status, effective_status, daily_budget, lifetime_budget, spend, impressions, reach, frequency, clicks, inline_link_clicks, ctr, cpc, cpm, results_type, results, cost_per_result, actions_json, raw_json`

## 04_Meta_Ads_Raw
Nivel anuncio.

`pulled_at, date_start, date_stop, platform, account_group, ad_account_id, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, status, effective_status, spend, impressions, reach, frequency, clicks, inline_link_clicks, ctr, cpc, cpm, results_type, results, cost_per_result, actions_json, raw_json`

> `actions_json` guarda el array completo de `actions`; `raw_json` el insight crudo.
> Permite recalcular resultados sin volver a llamar a Meta.

---

## 05_Daily_Pacing
Comparación gasto real vs esperado por cuenta. **Se sobrescribe** cada corrida.

| Columna | Descripción |
|---|---|
| date | fecha de cálculo `YYYY-MM-DD` |
| month | `YYYY-MM` |
| platform / account_group | dimensiones |
| planned_monthly_budget | suma de `planned_budget` del mes (de 01_MediaPlan) |
| expected_spend_to_date | `planned * (día_del_mes / días_del_mes)` |
| actual_spend_to_date | gasto real acumulado |
| spend_delta | real − esperado |
| spend_delta_pct | % de desviación |
| pacing_status | `on_track` / `overpacing` / `underpacing` / `no_plan` |

---

## 06_Alerts
Alertas generadas en cada corrida. **Se sobrescribe.**

| Columna | Descripción |
|---|---|
| pulled_at | timestamp |
| platform / account_group | dimensiones |
| level | `info` / `warning` / `critical` |
| entity_type | `campaign` / `adset` / `ad` / `account` |
| entity_id / entity_name | entidad afectada |
| metric | `frequency` / `ctr` / `spend` / `cpc` / `cpm` / `pacing` |
| value | valor observado |
| threshold | umbral que disparó la alerta |
| message | mensaje legible |
| recommended_action | acción sugerida |

**Reglas de alerta (configurables en `src/lib/dashboard/alerts.ts`):**
- Frecuencia: ⚠️ ≥ 2.5 · 🔴 ≥ 4
- CTR: ⚠️ < 0.8% · 🔴 < 0.5%
- Campaña activa con `spend = 0` → ⚠️
- Sobreconsumo > +15% / Subconsumo < −20% (pacing)
- CPC/CPM altos: umbrales opcionales (desactivados por defecto)

---

## 07_Update_Log
Histórico de corridas. **Se añade** (no se borra). Una fila por cuenta por corrida.

| Columna | Descripción |
|---|---|
| run_id | id de la corrida (`run_<timestamp>`) |
| started_at / finished_at | inicio/fin ISO |
| updated_by | quién corrió (`--updatedBy`) |
| platform / account_group | dimensiones |
| status | `ok` / `error` |
| date_preset_or_range | rango consultado |
| campaigns_count / adsets_count / ads_count | conteos escritos |
| error_message | detalle si falló |
