# Contexto para cerebro Gato Dumas — Dashboard 5 Gatos Bucaramanga

> Documento de contexto ejecutivo. NO explica el cómo técnico. Sirve para que
> cualquier IA o persona que consulte el cerebro sepa qué es este dashboard,
> para qué existe, dónde vive, y qué integra.

---

## 1. Qué es

**Dashboard web privado** para que el cliente **5 Gatos** (dueños de la sede
Gato Dumas Bucaramanga) pueda ver en tiempo casi real cómo va la inversión
de pauta digital de sus cursos y programas en Meta Ads (Facebook + Instagram).

Es un **producto de agencia (CookMinds)** hecho a la medida para este cliente
específico, no una herramienta genérica.

---

## 2. Para quién es

- **5 Gatos** (socios dueños de Gato Dumas Bucaramanga) — audiencia principal.
- **Ruzmery Amaya** (`ramaya@gatodumas.com`) — mantiene datos y ve el dashboard.
- **CookMinds Agency** — Juan García (`juandgarcia1224@gmail.com`) es el
  operador técnico y responsable de la pauta.

**Correos con acceso hoy (6):**
1. `juandgarcia1224@gmail.com` — Juan (CookMinds)
2. `ramaya@gatodumas.com` — Ruzmery (Gato Dumas)
3. `gatodumasbucaramanga@gmail.com` — cuenta oficial 5 Gatos
4. `linazgm73@gmail.com` — Linaz (5 Gatos)
5. `plopezb94@gmail.com` — otra socia 5 Gatos
6. `adrianaduarte.loi@gmail.com` — Adriana (5 Gatos)

Cualquier otro correo que intente entrar cae en `/login-denegado`.

---

## 3. Qué muestra el dashboard

**URL pública (requiere login):** https://gato-dumas-dashboard.vercel.app/5gatos

### KPIs globales del mes
- **Inversión de pauta** (presupuesto planeado del mes en Meta)
- **Consumido hasta hoy** (gasto real + % del presupuesto + restante)
- **Leads** (con delta vs mes anterior)
- **CPL** — costo por lead (con delta)

### Bloques por campaña activa
Solo campañas con al menos un adset en estado ACTIVE. Cada bloque tiene:
- Nombre, objetivo, estado, adsets activos
- **Fecha de inicio de la pauta + días corridos + frecuencia** (Meta métrica de saturación)
- Tarjeta de presupuesto: planeado vs consumido + barra semáforo + ritmo diario
- KPIs de la campaña (impresiones, CTR, CPC, CPL, etc.)
- Tabla de adsets con **drill-down acordeón** — click en un adset expande sus anuncios (ads) con thumbnail, título, CTA, gasto, leads, CPL, frecuencia

### Desglose por Curso / Programa
Dos tablas gemelas al final: Cursos (cortos) y Programas (diplomados).
Cada fila es clickeable → acordeón muestra los adsets que componen ese curso.
Junto al nombre aparece un chip con la **fecha de fin del curso** que viene
del Excel oficial del cliente y su **estado** (POR ABRIR / INICIO / FINALIZO).

### Exportación
Botón "Descargar Excel" en el header → genera un XLSX con 4 hojas.

### Refresh
Los datos se sincronizan automáticamente cada **5 horas**. Hay un chip verde
en el header que muestra la hora exacta de la última sincronización.
El sistema evita saturar la API de Meta (que tiene rate limits estrictos).

---

## 4. Dónde vive todo

### Código fuente
- **Local (Mac de Juan):** `/Users/mac/gato-dumas-dashboard`
- **Repositorio GitHub:** https://github.com/juandgarcia1224/gato-dumas-dashboard-pauta
  - Rama activa: `main`
  - Rama histórica del desarrollo: `feature/bucaramanga-dashboard-5gatos`
- **Framework:** Next.js 15 + React 19 + TypeScript + Tailwind

### Hosting en producción
- **Vercel** (cuenta `juandgarcia1224s-projects`)
- Proyecto: `gato-dumas-dashboard`
- Dominio: `gato-dumas-dashboard.vercel.app`
- Plan: Hobby

### Fuentes de datos
1. **Meta Ads API v22** — cuenta publicitaria `act_248616958293893` (Gato
   Dumas Bucaramanga, moneda COP).
2. **Google Sheet propio de mapeo** (Ruzmery lo edita):
   - Nombre: `Mapeo_Cursos_5Gatos_Bucaramanga`
   - ID: `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs`
   - URL: https://docs.google.com/spreadsheets/d/1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs/edit
   - Dueño: `cookmindsagency@gmail.com`
   - Contenido: reglas que asocian nombre de adset ↔ curso o programa.
3. **Excel oficial del cliente** (Ruzmery lo mantiene):
   - Nombre: `PROGRAMAC CURSOS CORTOS Y DIP 2026 BGA.xlsx`
   - ID Drive: `1cX7gHcuogtsZuKRYdm3XKB-5wNcgL406`
   - Dueño: `ramaya@gatodumas.com`
   - Contenido: programación mensual de cursos con fechas, precios, estado,
     inscritos, valor Groupon.
   - Es un archivo Excel (.xlsx) nativo, no Google Sheet.

### Sheet PROD de snapshot histórico
- ID: `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k`
- Nombre: `DB_Dashboard_Gato_Dumas_Meta_Ads_PROD`
- Sirve para guardar snapshots diarios del cron.

---

## 5. Integraciones y accesos

### Meta / Facebook Business
- **Business Portfolio:** `Gato Dumas Bucaramanga` (business_id `915796593203003`)
- **NO verificado empresarialmente** (Gato Buc no tiene NIT registrado aún).
- **App Meta:** `Dashboard 5 Gatos` (App ID `1039929148547583`)
- **System User:** `dashboard-5gatos` (ID `61592010805228`, rol Empleado)
- **Ad account asignada al System User:** `act_248616958293893` con rol Analista
  (solo lectura).
- **Token de acceso:** permanente (no expira), vive en Vercel como
  `META_ACCESS_TOKEN_5GATOS`. Se generó tras aprobación de segundo admin
  de Gato Buc (política nueva Meta 2026 para tokens que no expiran).

### Google Cloud
- **Proyecto OAuth (login):** `5gatos-dashboard-auth` (bajo cuenta
  `cookmindsagency@gmail.com`), independiente del proyecto de contabilidad.
- **Proyecto Service Account (Sheets):** `cookminds-dashboards` (número
  `284881347761`), APIs habilitadas: Google Sheets API + Google Drive API.
- **Service Account:** `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com`
  — lee/escribe Sheets y lee el Excel del cliente.

### Google Calendar
- Sin integración activa (se eliminó el recordatorio del segundo admin
  cuando se resolvió el token permanente).

---

## 6. Automatizaciones

- **Cron diario** en Vercel a las **6:00 AM hora Bogotá** — llama a
  `/api/cron/refresh-5gatos` que trae los últimos 90 días de Meta y hace
  snapshot en el Sheet PROD.
- **Cache en vivo:** cuando alguien entra al dashboard, los datos se sirven
  de un cache de **5 horas** (para no golpear la API de Meta de más).

---

## 7. Estado actual

Fecha del último audit: 2026-07-21.

- ✅ Dashboard 100% funcional en producción.
- ✅ Token Meta permanente sano (tipo SYSTEM_USER, no expira).
- ✅ Sin errores en logs recientes.
- ✅ Sheets vivos leyéndose.
- ✅ 3 campañas ACTIVE detectadas.
- ✅ Login + allowlist funcionando.
- ✅ Diseño limpio admin sobrio (blanco + acento grafito, sans humanista).

### Pendientes conocidos
1. **Hoja de "Presupuesto Pauta Programas" dentro del Excel del cliente**
   → Ruzmery/el cliente la agregará; cuando esté lista, se conecta al
   dashboard para que el KPI "Inversión de pauta" refleje también el
   presupuesto de programas (Meta solo reporta budget de cursos).
2. **Chat IA flotante** — se decidió no implementar por costo de API.
3. **2 de 3 campañas activas sin budget configurado en Meta** — hasta que
   el cliente los configure o llegue la hoja del punto 1, el KPI de
   inversión planeada muestra solo lo que Meta reporta directamente.

---

## 8. Historia breve (por qué se hizo)

Antes de este dashboard, cada mes Ruzmery le enviaba a los socios un correo
manual con un Excel resumen de inversión de pauta y campañas activas. Ese
proceso era lento, repetitivo y dependía de que ella recopilara los datos.

En julio 2026, CookMinds construyó este dashboard para que el cliente pudiera
consultar la misma información 24/7 sin intermediarios, con datos siempre
actualizados desde Meta Ads directamente.

El proyecto evolucionó en varias iteraciones de diseño:
1. Primera versión con paleta inventada por Fable (rechazada por Juan).
2. Migración a paleta Brand House oficial "The Lab" (retícula suiza,
   petróleo/teal/menta) — rechazada por el cliente por confusa.
3. Rediseño final: dashboard admin sobrio estilo Linear/Vercel/Stripe,
   con drill-down acordeón por niveles (campaña → adset → ad).

También se refinó la lógica: se eliminó un panel de "Alertas de programación"
que confundía al cliente. Solo se muestran datos directos, sin interpretaciones.

---

## 9. Cómo operarlo

### Para ver el dashboard
Cualquiera de los 6 correos autorizados entra a
`https://gato-dumas-dashboard.vercel.app/5gatos`, inicia sesión con Google
y ve los datos actuales.

### Para agregar / quitar correos autorizados
Se cambia la variable `AUTH_ALLOWED_EMAILS` en Vercel
(Settings → Environment Variables). CSV separado por comas. Redeploy y listo.

### Para modificar cómo se agrupan los adsets por curso
Ruzmery edita el Sheet `Mapeo_Cursos_5Gatos_Bucaramanga` (link arriba).
Los cambios se reflejan en el dashboard en un máximo de 5 horas (cache).

### Para actualizar precios / fechas / estado de cursos
Ruzmery edita el Excel oficial `PROGRAMAC CURSOS CORTOS Y DIP 2026 BGA`.
Los cambios se reflejan en el dashboard en un máximo de 5 horas.

### Para rotar el token de Meta (si algún día se necesita)
Se genera un nuevo token del System User `dashboard-5gatos` en
`business.facebook.com`, y se actualiza la variable `META_ACCESS_TOKEN_5GATOS`
en Vercel. Guía paso a paso en `docs/BUSINESS_MANAGER_SETUP.md` del repo.

---

## 10. Referencias cruzadas dentro del repo

- `docs/CHECKLIST_PRODUCCION_5GATOS.md` — checklist operativo completo.
- `docs/BUSINESS_MANAGER_SETUP.md` — cómo se creó el token permanente.
- `docs/LOGIN_SETUP.md` — cómo se configuró OAuth Google.
- `docs/DEPLOY_5GATOS.md` — cómo desplegar y rotar credenciales.
- `docs/ADSET_MAPPING_5GATOS.md` — cómo funciona el mapeo curso ↔ adset.
- `docs/PROGRAMACION_GATO_BGA_INTEGRACION.md` — cómo se integra el Excel
  del cliente.

---

## 11. Puntos clave de arquitectura (para tenerlos en cuenta)

- Es un **dashboard de solo lectura sobre Meta Ads**. Nunca modifica campañas,
  presupuestos ni creativos.
- La ruta interna `/` del mismo proyecto es una vista de Cloud Design para
  la cuenta de Colombia (`act_299121374587072`). El dashboard cliente vive
  bajo `/5gatos` y usa su propia credencial y su propio flujo.
- El **cliente NO tiene NIT** ni verificación empresarial en Meta. Esto
  limita el rate limit de la API pero no impide operar el dashboard.
- El proyecto Vercel está en el plan Hobby, por eso el cron es diario y
  no cada 3 horas. Pasar a Pro permitiría refrescar más seguido, pero el
  cache de 5 horas ya cubre el 99% de los casos de uso.
