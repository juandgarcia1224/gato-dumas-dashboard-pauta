# Clasificación de sede y `08_Campaign_Mapping`

El dashboard separa Gato Colombia en **Bogotá** y **Barranquilla** infiriendo la
sede desde el **nombre de la campaña**. Cuando el nombre no permite determinarla,
la campaña queda **"sin clasificar"**: cuenta en *Consolidado* y *Gato Colombia*,
pero NO aparece en las vistas *Bogotá* / *Barranquilla* (no se inventa sede).

## Reglas de inferencia (automáticas)
Sobre el nombre (sin acentos, mayúsculas):
1. Cuenta **Gato Bucaramanga** → sede **Bucaramanga**.
2. Contiene `BAQ` o `BARRANQUILLA` → **Barranquilla** (gana sobre Bogotá).
3. Contiene `BOG` o `BOGOTA` → **Bogotá**.
4. Contiene términos de **ambas** → **ambigua** (se reporta).
5. Ninguno (ej. "CO", "Colombia", "posicionamiento") → **sin clasificar**.

> No se asume Bogotá por defecto. "CO"/"Colombia" NO clasifica como Bogotá.

## Hoja `08_Campaign_Mapping` (override manual)
Para clasificar (o corregir) una campaña que la inferencia no resuelve, agrega una
fila en la hoja **08_Campaign_Mapping** del Sheet PROD. El mapping **gana** sobre la
inferencia automática.

| Columna | Qué poner |
|---|---|
| `platform` | `Meta` |
| `account_group` | `gato_colombia` / `gato_bucaramanga` |
| `campaign_id` | ID de la campaña (lo ves en la tabla "Campañas pendientes por clasificar") |
| `campaign_name` | nombre (referencia para humanos) |
| `sede` | **`bogota`** / **`barranquilla`** / **`bucaramanga`** (en minúscula) |
| `program_type` | opcional (ej. Programas, Cursos cortos, Posicionamiento) |
| `notes` | opcional |

### Pasos
1. En el dashboard (modo Interno) mira el panel **"Campañas pendientes por clasificar"** y copia el `campaign_id`.
2. Abre `08_Campaign_Mapping` y agrega una fila con ese `campaign_id` y la `sede` correcta.
3. Recarga el dashboard. La campaña aparecerá en la sede asignada.
   *(No requiere token ni `meta:update`; el override se aplica al leer.)*

### Reglas anti-daño
- `sede` en minúscula exacta: `bogota`, `barranquilla`, `bucaramanga`.
- No borres filas de otras hojas. La hoja es aditiva.
- Si no estás seguro de la sede, **déjala sin mapear** (mejor "sin clasificar" que mal clasificada).

## Estado actual (mayo 2026)
- Bogotá: 10 campañas · Barranquilla: 3 · Sin clasificar: **2**
  - `Tráfico al perfil | posicionamiento| reels` (posicionamiento, sin sede)
  - `Ventas | Diplomado GMBR| CO| MAYO` ("CO" no es sede)
- Si quieres asignarles sede, agrégalas a `08_Campaign_Mapping`.
