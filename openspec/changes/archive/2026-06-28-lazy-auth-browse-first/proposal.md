## Why

Actualmente el portal bloquea al visitante con un AuthModal obligatorio desde el primer instante, exigiendo número de celular antes de poder ver productos. Esto crea fricción innecesaria: el usuario no puede evaluar precios ni catálogo sin comprometerse con un registro. El número de celular solo es necesario al momento de hacer un pedido.

## What Changes

- El `StoreSelector` se convierte en la primera pantalla obligatoria para cualquier visitante (con o sin cuenta), reemplazando al `AuthModal` como bloqueante inicial.
- El catálogo y la navegación pasan a ser accesibles sin autenticación.
- El `AuthModal` se abre únicamente cuando el usuario intenta crear un pedido sin token activo.
- El backend de `verify-otp` agrega el campo `isNew` en su respuesta para indicar si el usuario fue registrado en esa sesión.
- El paso 2 del `AuthModal` (nombre, apellido, email) se muestra **solo si `isNew === true`**; usuarios existentes pasan directo al pedido tras el OTP.

## Capabilities

### New Capabilities

- `anonymous-browsing`: Navegación del catálogo sin cuenta. El visitante selecciona tienda y puede agregar al carrito sin autenticarse.
- `checkout-triggered-auth`: El flujo de autenticación/registro se inicia desde el checkout, con el paso de datos personales condicional al estado de usuario nuevo.

### Modified Capabilities

- `user-auth`: La respuesta de `verify-otp` ahora incluye `isNew: boolean`. El `AuthModal` usa ese campo para decidir si muestra el paso 2.

## Impact

**Backend**
- `src/functions/auth.js` — `verify-otp`: agregar `isNew` a la respuesta JSON.

**Frontend**
- `src/App.jsx`: eliminar la apertura automática del `AuthModal` en el `useEffect` de inicialización; abrir `StoreSelector` directamente si no hay tienda guardada.
- `src/components/AuthModal.jsx`: aceptar prop `onSuccess` con contexto de checkout; mostrar step 2 condicionalmente según `isNew`.
- Componente de checkout (o el punto donde se dispara `POST /orders`): verificar token antes de hacer el pedido; si no hay token, abrir `AuthModal` y continuar el pedido al cerrar.

**Database**: ningún cambio de esquema. La tabla `Cliente` ya acepta campos vacíos en `Nombre`, `Apellido`, `Email`.

**Non-goals**
- No se implementa sesión de invitado persistente en el servidor.
- No se sincroniza el carrito anónimo con una cuenta en el servidor.
- No se modifica el flujo de login del panel de administración.
