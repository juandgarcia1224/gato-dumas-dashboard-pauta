# Business Manager + System User — Token permanente Meta (sin NIT)

> **Objetivo:** Dejar de depender de tokens que expiran cada 60 días.
> Al final tendrás un token que **no expira** para leer datos de la cuenta
> `act_248616958293893` (Gato Bucaramanga) desde el dashboard de 5 Gatos.
>
> **No requiere NIT ni verificación de empresa.** Se hace con una cuenta
> personal de Facebook y toma unos 10 minutos.

---

## Por qué funciona sin NIT

Facebook / Meta permite crear un Business Manager con solo una cuenta personal.
La *verificación de empresa* (que sí pide NIT/registro mercantil) es **opcional**
y solo se necesita para:

- Publicar apps al público con permisos avanzados.
- Superar los límites altos de anuncios.
- Acceder a APIs comerciales como WhatsApp Business.

Para **solo leer datos de una ad account que ya administras**, un Business Manager
sin verificar es suficiente. El System User dentro de ese BM genera tokens que
no expiran mientras el BM siga activo.

---

> **Nota:** Meta renombró "Business Manager" a **"Business Portfolio"** en la UI.
> Los pasos son los mismos, solo cambia el nombre en pantalla.

## Paso 1 — Business Portfolio (YA EXISTE)

Ya tienes un Business Portfolio configurado:
- **Nombre:** `Gato Dumas Bucaramanga`
- **business_id:** `915796593203003`
- **Ad account `act_248616958293893` ya adentro.**

Salta directo al Paso 2. Verificado con lectura de tu propia sesión (2026-07-12).

---

## Paso 2 — Crear la app en developers.facebook.com

Tus 2 apps existentes están vinculadas a otros portfolios (CookMinds, Fancy Smiles).
Necesitas una app NUEVA vinculada específicamente a "Gato Dumas Bucaramanga".

1. Entra a <https://developers.facebook.com/apps> → **"Crear app"**.
2. **Detalles:** nombre `Dashboard 5 Gatos`, correo de contacto ya viene precargado
   → Siguiente.
3. **Casos de uso:** elige la opción relacionada con **anuncios / Marketing API**
   (u "Otro" si no aparece explícito) → Siguiente.
4. **Negocio (CRÍTICO):** selecciona explícitamente **`Gato Dumas Bucaramanga`**
   (no CookMinds ni Fancy Smiles) → Siguiente.
5. Completa "Requisitos" → Resumen → **Crear app**.
6. Dentro del panel: **Agregar producto → Marketing API → Configurar**.

> No necesitas pasar la app a modo "Live" ni pedir App Review. Con acceso estándar
> a `ads_read`/`read_insights` sobre TU propia cuenta, la app puede quedarse
> "En desarrollo" indefinidamente (confirmado con doc Meta mayo-2026).

---

## Paso 3 — Crear el System User

1. Entra a <https://business.facebook.com> → Configuración del negocio
   (con **Gato Dumas Bucaramanga** seleccionado arriba).
2. Menú lateral: **Usuarios → Usuarios del sistema** → botón **"+ Agregar"**.
3. Datos:
   - Nombre: `dashboard-5gatos`
   - **Rol: Empleado** (mínimo privilegio — no elijas Administrador; el admin
     del sistema debería reservarse para tareas administrativas, no para
     llamadas API de solo lectura).
4. Guardar.

---

## Paso 4 — Asignar la ad account al System User (solo lectura)

1. Clic en el nombre del system user recién creado → **"Asignar activos"**.
2. Pestaña **Cuentas publicitarias** → selecciona `act_248616958293893`.
3. Rol de acceso: **"Analista"** (solo lectura) — NO "Acceso total".
   Suficiente para el dashboard y evita permisos innecesarios.
4. Guardar.

---

## Paso 5 — Generar el token permanente

1. Sigue en la ficha del System User → **"Generar nuevo token"**.
2. **Selecciona la app** que creaste en el Paso 2 (`Dashboard 5 Gatos`).
3. **Vencimiento del token: "Nunca"**.
4. Permisos a marcar:
   - `ads_read` ✅
   - `read_insights` ✅
   - `business_management` ✅
5. **Generar token → COPIAR EL TOKEN INMEDIATAMENTE.** Meta no lo vuelve a
   mostrar completo después. Empieza con `EAAB...` o `EAAG...`.

> ⚠️ Este token es sensible. No lo pegues en Slack, ni email, ni Notion.
> Lo guardaremos solo en Vercel (variables de entorno cifradas).

---

## Paso 6 — Guardar el token en Vercel

Cuando el dashboard esté desplegado en Vercel, entras a:

`Project settings → Environment Variables`

Agregar:

```
Nombre:  META_ACCESS_TOKEN_5GATOS
Valor:   EAAB...(el token del paso 5)
Environment: Production, Preview, Development
```

Aplicar en los 3 entornos. Luego redeploy.

Mientras el dashboard aún no está en Vercel, el token vive **solo en tu
`.env.local`** (nunca commiteado — el `.gitignore` ya lo cubre).

---

## Paso 7 — Verificar que funciona

Desde tu terminal en `/Users/mac/gato-dumas-dashboard`:

```bash
curl -s "https://graph.facebook.com/v22.0/act_248616958293893?fields=name,account_status&access_token=EAAB..." | jq
```

Debe responder algo como:

```json
{
  "name": "Gato Dumas Bucaramanga",
  "account_status": 1,
  "id": "act_248616958293893"
}
```

Si sale `error → OAuthException code 190`: el token no quedó bien; repite el
paso 5. Si sale `code 100 subcode 33`: no diste acceso a la ad account (paso 4).

---

## Qué pasa si algún día el token deja de funcionar

Casos posibles:

1. **Cambiaste la contraseña de Facebook.** No afecta al System User.
2. **Alguien borró el System User o el token.** Repite paso 3-5.
3. **La app quedó en modo desarrollo y expiró.** En
   <https://developers.facebook.com/apps/> → tu app → Configuración → Básico
   → asegúrate de que el modo esté "Live" (aunque sea sin App Review; para
   solo `ads_read` no hace falta review).
4. **Meta suspendió el Business Manager.** Muy raro. Se recupera pidiendo
   verificación en el propio BM.

En el 99% de los casos: **el token dura años sin tocar nada.**

---

## Checklist final

- [ ] Business Manager creado o reutilizado.
- [ ] Ad account `act_248616958293893` dentro del BM.
- [ ] System User `dashboard-5gatos` creado.
- [ ] System User tiene permiso "Ver rendimiento" sobre la ad account.
- [ ] Token generado con `ads_read`, `read_insights`, caducidad "Nunca".
- [ ] Token guardado en Vercel como `META_ACCESS_TOKEN_5GATOS`.
- [ ] `curl` de verificación devuelve el nombre de la cuenta.

Cuando termines los 7 pasos, avísame y sigo con el resto del deploy.
