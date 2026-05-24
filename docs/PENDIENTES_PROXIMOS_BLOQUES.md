# Pendientes y próximos bloques — Dashboard Gato Dumas

Estado a 2026-05-24 tras QA visual (Bloque 7).

## 🔴 Urgente / seguridad
- [ ] **Revocar el token de Meta** que se pegó en el chat en el Bloque 5 (quedó en el transcripto). Generar uno nuevo solo al actualizar.

## 🟠 Operativo (desbloquea funcionalidad)
- [ ] **Confirmar presupuesto mensual Meta de Gato Bucaramanga** (mayo) y cargarlo en `01_MediaPlan` (fila `gato_bucaramanga` / `2026-05`). El canon $14.4M es **anual/período sin confirmar** y excluye cursos cortos → no se puede usar como mensual. Tras cargarlo: `npm run pacing:recompute -- 2026-05`.
- [ ] (Opcional) Confirmar **metas de resultados / CPA mensuales** por cuenta para `planned_results` / `planned_cpa` (hoy informativos).

## 🟡 Cierre con Juan
- [ ] **Pasada visual final con Juan** en navegador (desktop/tablet/mobile, Interno/Cliente, claro/oscuro) con data real. *(Limitación actual: la QA de este bloque fue por código + datos reales, sin navegador.)*

## 🟢 Despliegue (cuando se apruebe)
- [ ] **Subir a GitHub privado** (repo ya inicializado localmente; nunca incluir `.env.local` ni la key JSON).
- [ ] **Preparar Vercel:** configurar variables de entorno en el panel (Google Sheets), definir cómo se ejecutará `meta:update` (no corre en build; es manual/cron aparte). Revisar que el token Meta NUNCA quede como env permanente.

## 🔵 Mejoras futuras (no urgentes)
- [ ] **Export CSV** de tablas (hoy el botón está deshabilitado).
- [ ] **Limpiar RESULT_PRIORITY "fantasma":** el `#1` `messaging_conversation_started_7d` (sin prefijo) nunca matchea (lo cubre el `#2` con prefijo). Eliminarlo es cosmético; no cambia resultados. *(No tocar sin bloque dedicado.)*
- [ ] **Historial diario de pacing:** hoy la curva real es interpolación lineal declarada; persistir snapshots diarios daría la curva real.
- [ ] **TikTok (Fase 2):** arquitectura ya modular (dimensión `platform`). Implementar capa `tiktok/` análoga a `meta/` cuando se decida.

## Notas
- Backend, schemas de Sheets y RESULT_PRIORITY **estables** desde Fase 1.
- `recharts` removido (el chart de pacing es SVG inline).
- Lectura de Sheets usa `UNFORMATTED_VALUE` (fix locale es-CO para decimales).
