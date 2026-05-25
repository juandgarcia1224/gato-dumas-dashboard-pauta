# Rutina semanal — Dashboard Gato Dumas (para Paola / Juan)

Guía simple para **actualizar** y **revisar** el dashboard sin tocar código.

---

## 1. ¿Qué es el dashboard?
Un panel web que muestra cómo va la pauta de **Meta Ads** de Gato Dumas
(inversión, resultados, costo por resultado, pacing y alertas). Lee los datos
desde un Google Sheet que funciona como base de datos.

## 2. ¿Qué link abro?
👉 **https://gato-dumas-dashboard-pauta.vercel.app/**
(El dashboard **no** llama a Meta solo: muestra lo último que se haya
**sincronizado** con el comando de la rutina.)

## 3. ¿Qué significa cada Vista?
- **Consolidado:** todo junto (Colombia + Bucaramanga).
- **Gato Colombia:** la cuenta de Colombia = Bogotá + Barranquilla + lo que no se pudo clasificar por sede.
- **Bogotá:** solo campañas identificadas como Bogotá.
- **Barranquilla:** solo campañas identificadas como Barranquilla.
- **Gato Bucaramanga:** la cuenta de Bucaramanga (Cinco Gatos), aparte.

## 4. ¿Qué significa cada Rango?
- **Mes actual:** el mes en curso (lo más usado).
- **Marzo / Abril / Mayo:** ese mes completo (aparecen como chips si tienen datos).
- **Últimos 7 días:** la última semana.
- **Hoy:** solo hoy.
- **Personalizado:** tú eliges fecha inicio y fin (mini calendario).

> El gasto se filtra por fecha. Los **resultados/CPR exactos** aparecen si ese
> rango fue **sincronizado** (ver rutina). Si no, verás "Resultados pendientes".

---

## 5. Rutina semanal (cómo actualizar)

> El **token** de Meta lo generas en
> [Graph API Explorer](https://developers.facebook.com/tools/explorer/) (permiso `ads_read`).
> Es temporal y **NO se guarda**: se pega solo al correr el comando, en tu terminal.
> Nunca lo pegues en chats, WhatsApp ni documentos.

Abre la terminal en la carpeta del proyecto (`/Users/mac/gato-dumas-dashboard`) y corre:

### A. Actualización normal del mes actual (lo de cada semana)
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range this_month --updatedBy Paola
```
- Actualiza el **gasto diario** del mes.
- Actualiza los **resultados y CPR exactos** del mes.
- **No borra** histórico. **No duplica** datos.

### B. Revisar últimos 7 días con resultados exactos
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range last_7d --updatedBy Paola
```

### C. Revisar un rango personalizado
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-05-10 --dateStop 2026-05-20 --updatedBy Paola
```

### D. Solo refrescar resultados/CPR exactos de un mes ya cargado (más liviano)
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-05-01 --dateStop 2026-05-31 --updatedBy Paola --summaryOnly
```
> `--summaryOnly` NO re-carga el gasto diario; solo actualiza resultados/CPR del rango.

*(Alternativa que oculta el token al teclear: `npm run meta:update:manual -- --range this_month --updatedBy Paola`.)*

---

## 6. Qué revisar después de actualizar (en el dashboard)
- **Última actualización** (arriba): que diga hoy.
- **Inversión** total del rango.
- **Resultados** y **CPR** (costo por resultado).
- **Pacing** (gasto real vs presupuesto del mes).
- **Alertas críticas** (rojas).
- **Frecuencia alta** (riesgo de fatiga) y **CTR bajo**.
- **Campañas sin clasificar** (panel interno).
- Cambiar la **Vista** a Bogotá / Barranquilla / Bucaramanga y revisar cada una.

## 7–10. Mensajes que puedes ver
- **"Sin plan mensual":** esa cuenta/mes no tiene presupuesto cargado en el plan, así que no se calcula pacing. (Hoy aplica a **Bucaramanga** y a los meses sin presupuesto.) No es un error.
- **"Resultados exactos":** los resultados/CPR de ese rango son los reales de Meta (rango sincronizado). ✅
- **"Resultados pendientes de sincronización exacta":** el gasto está, pero los resultados de ese rango aún no se sincronizaron. Corre el comando que aparece (o el del punto 5D) para ese rango.
- **"snapshot_only":** hay un resumen viejo pero no histórico diario. Corre una actualización normal (punto 5A).

## 11. Si un rango aparece sin datos
Significa que ese rango no está sincronizado. Sincronízalo con el comando que el
dashboard sugiere (o el del punto 5), y recarga la página. **No inventes números.**

## 12. Si Vercel no muestra el cambio
1. Recarga la página.
2. Fuerza recarga: **Cmd + Shift + R** (o abre en ventana incógnita).
3. Si hubo un cambio de código (push), espera 1–2 min al redeploy.
4. Verifica el **footer**: dice la versión actual del dashboard.

## 13. Qué NO tocar
- ❌ Hojas **RAW** (`02/03/04`), `05`, `06`, `07` (se llenan solas).
- ❌ **`10_Meta_Range_Summaries`** a mano.
- ❌ `.env.local` ni el **JSON** del service account.
- ❌ Nombres de columnas / encabezados de las hojas.
- ❌ Scripts/código sin pedir ayuda.
- ✅ Sí puedes editar **`01_MediaPlan`** (presupuestos) y **`08_Campaign_Mapping`** (clasificar sede de campañas). Ver `MEDIAPLAN_GATO_DUMAS.md` y `CAMPAIGN_MAPPING_GATO_DUMAS.md`.

---

## 14. Mini checklist semanal
- [ ] Actualizar **mes actual** (punto 5A).
- [ ] Revisar **Consolidado**.
- [ ] Revisar **Gato Colombia**.
- [ ] Revisar **Bogotá**.
- [ ] Revisar **Barranquilla**.
- [ ] Revisar **Gato Bucaramanga**.
- [ ] Revisar **alertas** (críticas / frecuencia / CTR).
- [ ] Revisar **pacing** (¿vamos sobre o bajo presupuesto?).
- [ ] Enviar hallazgos a Juan (formato abajo).

## 15. Formato de reporte semanal
```
Fecha de actualización:
Rango revisado:
Inversión total:
Results:
CPR:
Campañas con mejor desempeño:
Campañas con alerta:
Recomendación de optimización:
Dudas o pendientes:
```

---

> ⚠️ Recordatorio de seguridad: **revoca el token** de Meta después de cada
> actualización (o usa uno nuevo cada vez). No se guarda en ningún lado.
