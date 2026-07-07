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

## Paso 1 — Crear el Business Manager

1. Entra a <https://business.facebook.com/overview> con la cuenta personal de
   Facebook que ya administra la ad account `act_248616958293893`.
2. Botón **"Crear cuenta"** (arriba a la derecha).
3. Datos:
   - **Nombre de la empresa:** `CookMinds Agency` (o el que prefieras — es
     interno, no lo ve el cliente).
   - **Tu nombre:** el tuyo.
   - **Email empresarial:** `juandgarcia1224@gmail.com` (o el que uses para
     temas de trabajo — llegan notificaciones aquí).
4. **Siguiente → Enviar.**

> Si ya tienes un Business Manager creado (por tu cuenta o por CookMinds),
> úsalo. No hace falta crear uno nuevo. Salta al paso 2.

---

## Paso 2 — Agregar la ad account al Business Manager

1. En Business Manager → menú lateral → **Configuración del negocio**
   (Business Settings) → engrane arriba a la izquierda.
2. **Cuentas** → **Cuentas publicitarias** → botón **Agregar**.
3. Elegir **"Agregar una cuenta publicitaria"** (NO "solicitar acceso" —
   solicitar es para cuentas de otros).
4. Pegar el ID: **`248616958293893`** (sin el prefijo `act_`).
5. Confirmar.

> Si sale error "esta cuenta ya pertenece a otro BM": es porque ya está en
> otro Business. Entra a **Configuración del negocio → Solicitar acceso** en
> vez de "agregar", y el dueño actual debe aprobarte. Si el dueño eres tú
> mismo desde otra cuenta, mueve la ad account primero.

---

## Paso 3 — Crear el System User

1. En **Configuración del negocio** → menú lateral **Usuarios** → **Usuarios
   del sistema** (System Users).
2. Botón **Agregar** → nombre: **`dashboard-5gatos`** → rol: **Admin**.
   - *Admin* es lo más simple. Si prefieres restringir, elige *Empleado*
     y en el paso 4 dale solo permisos de lectura de anuncios.
3. Guardar.

---

## Paso 4 — Dar acceso a la ad account al System User

1. Ya en la ficha del System User `dashboard-5gatos` → botón **Asignar
   activos** (Assign Assets).
2. Elegir **Cuentas publicitarias** → seleccionar `act_248616958293893`.
3. Permisos: activa **"Administrar campañas"** o mínimo **"Ver rendimiento"**.
   - Para el dashboard solo necesitamos **lectura**, activa "Ver rendimiento".
4. Guardar cambios.

---

## Paso 5 — Generar el token permanente

1. Sigue en la ficha del System User → botón **Generar nuevo token** (Generate
   New Token).
2. Selecciona la app:
   - Si no tienes una app: haz clic en el link que dice "crear una app". Elige
     tipo **Business**, nombre `Dashboard 5 Gatos`, categoría `Business`. No
     necesitas revisar la app.
   - Si ya tienes una app en <https://developers.facebook.com/apps/>, úsala.
3. Permisos a marcar:
   - `ads_read` ✅ (obligatorio)
   - `read_insights` ✅ (obligatorio)
   - `business_management` ✅ (recomendado)
4. **Caducidad del token:** elige **"Nunca"** (Never).
5. Copiar el token que aparece. **Empieza con `EAAB...` o `EAAG...`.**

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
