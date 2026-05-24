# OPERACIÓN — Actualización de datos

Modelo: **Google fijo en `.env.local` · token de Meta temporal por corrida.**
La actualización es manual desde terminal. El token **no se guarda** (ver
[`SEGURIDAD_TOKENS.md`](SEGURIDAD_TOKENS.md)).

## Comando oficial (Forma A) — token en el momento

```bash
META_ACCESS_TOKEN="<TOKEN_DEL_DÍA>" npm run meta:update -- --range <rango> --updatedBy <nombre>
```

### Juan
```bash
META_ACCESS_TOKEN="EAAB..." npm run meta:update -- --range this_month --updatedBy Juan
```

### Paola
```bash
META_ACCESS_TOKEN="EAAB..." npm run meta:update -- --range last_7d --updatedBy Paola
```

## Comando interactivo (Forma B) — pide el token sin mostrarlo

```bash
npm run meta:update:manual -- --range this_month --updatedBy Paola
# Pega el token cuando lo pida (no se ve en pantalla, no se guarda).
```

### Rangos disponibles
| Rango | Uso |
|---|---|
| `this_month` | Mes en curso (recomendado para pacing). |
| `last_7d` | Últimos 7 días (tendencia reciente). |
| `today` / `yesterday` | Día puntual. |
| `--dateStart YYYY-MM-DD --dateStop YYYY-MM-DD` | Rango exacto. |

Ejemplo custom:
```bash
META_ACCESS_TOKEN="EAAB..." npm run meta:update -- --dateStart 2026-05-01 --dateStop 2026-05-24 --updatedBy Juan
```

## Qué hace cada corrida
1. Valida Google + cuentas y **exige el token solo en ese momento**.
2. Consulta las **dos cuentas** (Colombia y Bucaramanga) por separado.
3. Descarga insights campaña / conjunto / anuncio + estados.
4. Interpreta resultados (conversaciones, leads, etc.).
5. Sobrescribe hojas RAW (`02/03/04`), calcula `05_Daily_Pacing`, genera `06_Alerts`.
6. Añade filas a `07_Update_Log` (**sin token**).
7. Imprime resumen en consola (**sin token**).

## Tolerancia a fallos
- Si **una cuenta falla**, la otra se procesa igual; el error queda en `07_Update_Log`.
- Si **ambas fallan**, no se sobrescriben datos (se conserva la última carga buena).
- Si el token caducó: Meta responde `(#190) ... expired` → genera uno nuevo y vuelve a correr.

## Reglas del token (recordatorio)
- No lo guardes en `.env.local`.
- No lo pegues en ChatGPT, Claude, WhatsApp, Notion ni documentos.
- Solo va en tu terminal, al correr el comando.

## Ver resultados
```bash
npm run dev   # http://localhost:3000
```
La tarjeta "Última actualización" muestra cuándo y quién corrió la última carga.
El dashboard lee de Google Sheets: **funciona sin token** (el token solo se usa al sincronizar).
