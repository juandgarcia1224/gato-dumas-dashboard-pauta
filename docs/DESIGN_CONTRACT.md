# DESIGN CONTRACT — Para Cloud Design

Este documento es la referencia para diseñar el dashboard **encima** de la
estructura ya construida. El diseño visual final lo hace Cloud Design; la
arquitectura técnica, los datos y los componentes ya existen.

> **No cambiar la forma de los datos sin coordinar.** El contrato de datos vive
> en [`src/lib/dashboard/contract.ts`](../src/lib/dashboard/contract.ts) (`DashboardPayload`).
> El diseño puede reorganizar, re-estilizar y recomponer libremente la UI.

---

## 1. Objetivo del dashboard

Centralizar el seguimiento de la **pauta digital de Gato Dumas** (un cliente,
dos cuentas de Meta) en un solo lugar, con:
- visión general consolidada,
- visión separada por cuenta (Gato Colombia vs Gato Bucaramanga),
- detección temprana de problemas (alertas y pacing),
- datos siempre **reales** (nunca inventados).

## 2. Secciones que debe tener

1. **Header** — `{clientName} — Centro de Seguimiento Digital` / subtítulo `Pauta digital · Meta Ads`.
2. **Filtro por cuenta** — Todas / Gato Colombia / Gato Bucaramanga.
3. **Última actualización** — fecha + quién + estado por cuenta.
4. **KPIs principales** (7 tarjetas).
5. **Resumen por cuenta** (tabla comparativa).
6. **Pacing de gasto** (real vs esperado).
7. **Panel de alertas** (operativas + avisos de estado).
8. **Tablas de detalle** — Campañas / Conjuntos / Anuncios.

## 3. Componentes disponibles (reemplazables)

| Componente | Archivo | Rol |
|---|---|---|
| DashboardShell | `components/DashboardShell.tsx` | Orquestador (fetch + filtro + layout) |
| DashboardHeader | `components/DashboardHeader.tsx` | Encabezado + botón actualizar |
| AccountSelector | `components/AccountSelector.tsx` | Filtro por cuenta |
| KpiCards | `components/KpiCards.tsx` | 7 KPIs |
| AccountSummaryTable | `components/AccountSummaryTable.tsx` | Comparativa por cuenta |
| PacingChart | `components/PacingChart.tsx` | Gráfico de pacing (Recharts) |
| AlertsPanel | `components/AlertsPanel.tsx` | Alertas + notices |
| CampaignTable / AdsetTable / AdsTable | `components/*.tsx` | Tablas de detalle |
| LastUpdateCard | `components/LastUpdateCard.tsx` | Última actualización |
| EmptyState | `components/EmptyState.tsx` | Estados vacíos |

Tokens visuales provisionales en `tailwind.config.ts` (`colors.brand`, `colors.status`).
**Cloud Design reemplaza estos tokens y el layout, no la lógica.**

## 4. Data disponible por componente (`DashboardPayload`)

```ts
GET /api/dashboard?account=all|gato_colombia|gato_bucaramanga
```

```ts
{
  generatedAt: string;
  client: { name: string; timezone: string };
  appliedAccountFilter: "all" | "gato_colombia" | "gato_bucaramanga";
  status: {
    metaReady: boolean;
    sheetsReady: boolean;
    accounts: { key, label, configured }[];
    notices: { level: "info"|"warning"|"critical", code, message }[];
  };
  lastUpdate: { finished_at, updated_by, date_preset_or_range, perAccount[] } | null;
  total:    Kpis;                 // KPIs del filtro aplicado
  accounts: AccountSummary[];     // KPIs por cada cuenta
  campaigns: CampaignRecord[];    // tabla de campañas (filtradas)
  adsets:    AdsetView[];         // tabla de conjuntos
  ads:       AdView[];            // tabla de anuncios
  alerts:    AlertView[];         // alertas operativas
  pacing:    PacingView[];        // pacing por cuenta
}

Kpis = {
  spend: number;
  results: number | null;
  costPerResult: number | null;
  avgFrequency: number | null;
  avgCtr: number | null;
  activeCampaigns: number;
  criticalAlerts: number;
}
```
Ver tipos exactos en `src/lib/dashboard/contract.ts` y `metrics.ts`.

## 5. Estados vacíos (obligatorios)

Siempre que falte data, mostrar estado claro — **nunca** placeholders con cifras falsas:
- "Sin datos para este rango"
- "Sin campañas / conjuntos / anuncios"
- "Sin alertas operativas"
- "Sin datos de pacing"
- KPIs faltantes se muestran como `—`.

## 6. Estados de error / configuración (`status.notices`)

| code | Significado | Nivel sugerido |
|---|---|---|
| `token_missing` | Falta `META_ACCESS_TOKEN` | warning |
| `account_missing` | Falta el `act_...` de una cuenta | warning |
| `sheet_missing` | Falta `GOOGLE_SHEET_ID` o credenciales | critical |
| `read_error` | Error al leer Sheets | critical |
| `no_data` | Sheets OK pero sin filas (correr `meta:update`) | info |
| `no_last_update` | Aún no hay corridas registradas | info |

## 7. Filtros

- **Por cuenta**: `all` (default), `gato_colombia`, `gato_bucaramanga`.
- El backend ya filtra; el front solo pasa `?account=`.
- (Futuro) filtro por rango de fechas: hoy el rango lo fija `meta:update`.

## 8. Métricas principales

Inversión total (COP) · Resultados · Costo por resultado · Frecuencia promedio ·
CTR promedio · Campañas activas · Alertas críticas.

- CTR y frecuencia se promedian **ponderados por impresiones**.
- `costPerResult = spend / results`.
- "Resultado" se interpreta por prioridad de acción (mensajes → leads → registros → clics…), ver `meta/transform.ts`.

## 9. Reglas de visualización

- Moneda **COP** sin decimales (`formatCOP`).
- Porcentajes con 2 decimales (`formatPercent`).
- Estados de campaña: ACTIVE = verde, PAUSED = gris, otros = ámbar.
- Alertas por nivel: critical = rojo, warning = ámbar, info = azul.
- Pacing: on_track verde, overpacing rojo, underpacing ámbar, no_plan gris.
- Marcar visualmente la fuente: todo lo de Meta es API; `01_MediaPlan` es manual.
  **No mezclar manual y API sin distinguir el origen.**

## 10. Vista interna vs vista cliente

Hoy hay **una sola ruta** (`/`, vista interna). Está preparada para separar:

- `/dashboard/internal` — completa y técnica (campañas/adsets/ads, alertas detalladas).
- `/dashboard/client` — más limpia, menos técnica: KPIs, resumen por cuenta, pacing y un resumen de alertas. Sin IDs ni jerga.

`DashboardShell` recibe `view: "internal" | "client"`; usar ese prop para ocultar
secciones técnicas en la versión cliente. **Qué es interno vs cliente:**

| Sección | Interno | Cliente |
|---|---|---|
| KPIs principales | ✅ | ✅ |
| Resumen por cuenta | ✅ | ✅ |
| Pacing | ✅ | ✅ (simplificado) |
| Alertas | ✅ detalladas | ✅ resumen |
| Tabla de campañas | ✅ | opcional |
| Tablas de adsets / ads | ✅ | ❌ |
| IDs, raw_json, umbrales | ✅ | ❌ |

---

### Qué necesita Cloud Design para empezar
1. Este documento + `src/lib/dashboard/contract.ts` (forma de datos).
2. Los componentes en `src/components/` (puntos de reemplazo).
3. Tokens en `tailwind.config.ts` (color/tipografía a definir).
4. Respetar estados vacíos/error y la regla de "nunca inventar datos".
