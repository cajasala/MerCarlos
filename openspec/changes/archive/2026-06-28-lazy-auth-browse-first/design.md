## Context

Hoy `App.jsx` tiene un `useEffect` que, al detectar ausencia de token en localStorage, abre `AuthModal` de forma bloqueante. Esto impide cualquier interacción con el portal hasta que el usuario se autentique. El `StoreSelector` solo aparece después de autenticarse.

El cambio invierte este orden: la tienda se selecciona primero (sin cuenta), el catálogo se vuelve navegable de forma anónima, y la autenticación se difiere al momento del checkout.

## Goals / Non-Goals

**Goals:**
- Visitante nuevo llega al catálogo tras seleccionar tienda, sin registrarse.
- El `AuthModal` se abre solo cuando se intenta crear un pedido sin token.
- Usuarios existentes: OTP → JWT → pedido (sin paso de nombre/email).
- Usuarios nuevos: OTP → JWT + paso de datos personales → pedido.
- El backend indica `isNew` en la respuesta de `verify-otp`.

**Non-Goals:**
- Persistencia del carrito anónimo en el servidor.
- Sincronización de carrito anónimo con cuenta existente al autenticarse.
- Cambios al flujo de admin.

## Decisions

### 1. `StoreSelector` como única pantalla bloqueante inicial

**Decisión**: Si no hay `selectedStore` en localStorage, abrir `StoreSelector` con `mandatory={true}` independientemente del token.

**Alternativa descartada**: Mostrar el catálogo vacío y pedir tienda solo al navegar. Descartada porque sin tienda no hay precios ni productos — la app literalmente no funciona.

### 2. `isNew` en la respuesta de `verify-otp`

**Decisión**: El backend agrega `isNew: boolean` a la respuesta. El frontend lo usa para mostrar u omitir el step 2 del `AuthModal`.

**Alternativa descartada**: Detectar usuario nuevo en el frontend comparando campos vacíos del perfil retornado. Frágil — un usuario existente podría tener nombre vacío legítimamente.

### 3. Apertura del `AuthModal` desde el checkout

**Decisión**: El componente de checkout (o `App.jsx`) verifica token antes de ejecutar el pedido. Si no hay token, abre `AuthModal` con una callback que, al completarse, reintenta el pedido.

**Alternativa descartada**: Redirigir a una ruta de login. El proyecto no usa react-router para navegación de vistas; mantener el patrón de modales es coherente.

### 4. El carrito anónimo persiste en localStorage

El carrito ya se guarda en localStorage sin necesidad de cuenta. Al autenticarse en checkout, el carrito existente se envía directamente al `POST /orders`. No hay migración de estado necesaria.

## Flujo de datos

```
VISITA SIN CUENTA
─────────────────
App carga
    │
    ├─ token en localStorage? NO
    │
    ▼
¿selectedStore en localStorage?
    ├─ SÍ → carga catálogo directamente
    └─ NO → [StoreSelector mandatory]
                   │
                   ▼
            Catálogo visible
            Carrito en localStorage

"Hacer pedido"
    │
    ├─ token? SÍ ──────────────────────────────→ POST /orders
    │
    NO
    ▼
[AuthModal: paso 1 — teléfono]
    │
POST /auth/request-otp  →  OTP por SMS
    │
[AuthModal: paso 2 — código OTP]
    │
POST /auth/verify-otp
    │
    ├─ isNew: false → guarda token → POST /orders
    │
    └─ isNew: true  → [paso 3 — nombre/apellido/email]
                              │
                        guarda token → POST /orders


VISITA CON CUENTA (token válido en localStorage)
─────────────────────────────────────────────────
App carga → restaura token → carga tienda/catálogo → flujo normal
```

## Risks / Trade-offs

**[Frontend] El `useEffect` de inicialización tiene múltiples ramas** → Riesgo de regresión al reorganizar el orden de apertura de modales. Mitigación: extraer la lógica de "qué modal mostrar al inicio" a una función pura testeable.

**[Frontend] Carrito anónimo vs. carrito de usuario existente** → Si un usuario con cuenta previa borra su token y navega como anónimo, luego se autentica, su carrito local se envía como si fuera nuevo. Esto es aceptable para el alcance actual (no hay carrito en servidor).

**[Backend] `isNew` expone información de existencia de cuenta** → Un actor podría probar teléfonos y detectar si tienen cuenta por la respuesta. Riesgo bajo en contexto de e-commerce con OTP; no se agrega mitigación adicional.

**[BE] `nombre`/`apellido`/`email` quedan vacíos para usuarios nuevos que abandonen antes del paso 3** → El registro queda incompleto en `Cliente`. Mitigación: el perfil del usuario puede completarse después desde la vista de perfil.
