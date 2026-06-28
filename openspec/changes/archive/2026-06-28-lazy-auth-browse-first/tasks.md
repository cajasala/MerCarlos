## 1. Backend — verify-otp retorna isNew [BE]

- [x] 1.1 En `backend/src/functions/auth.js`, handler `verifyOTP`: capturar si el usuario fue creado en esta llamada y agregar `isNew: boolean` a la respuesta JSON (true cuando se ejecutó el INSERT, false cuando ya existía).

## 2. Frontend — eliminar AuthModal bloqueante al inicio [FE]

- [x] 2.1 En `App.jsx`, en el `useEffect` de inicialización: eliminar la rama que abre `isAuthOpen = true` cuando no hay token. El portal debe arrancar sin requerir autenticación.
- [x] 2.2 En `App.jsx`: asegurarse de que `StoreSelector` con `mandatory={true}` se abra si no hay `selectedStore` en localStorage, independientemente de si hay token o no.

## 3. Frontend — AuthModal condicional en checkout [FE]

- [x] 3.1 En `App.jsx` (o en el handler de "Hacer pedido"): antes de ejecutar el POST a `/orders`, verificar si hay token; si no hay, abrir `AuthModal` y guardar el intento de pedido como estado pendiente.
- [x] 3.2 En `App.jsx`: al completarse la autenticación desde el checkout, retomar el pedido pendiente automáticamente (ejecutar el POST con el token recién obtenido).

## 4. Frontend — AuthModal muestra paso 2 solo para usuarios nuevos [FE]

- [x] 4.1 En `AuthModal.jsx`: recibir y usar el campo `isNew` de la respuesta de `verify-otp` para decidir si mostrar el paso de nombre/apellido/email.
- [x] 4.2 En `AuthModal.jsx`: si `isNew === false`, cerrar el modal directamente tras validar el OTP sin mostrar el formulario de datos personales.
- [x] 4.3 En `AuthModal.jsx`: si `isNew === true`, mostrar el formulario de nombre/apellido/email antes de cerrar (comportamiento actual para registro nuevo).

## 5. Verificación [FE+BE]

- [x] 5.1 Verificar flujo completo: visitante nuevo → selecciona tienda → navega catálogo → agrega al carrito → hace pedido → ingresa teléfono → OTP → (si nuevo) completa datos → pedido creado.
- [x] 5.2 Verificar flujo usuario existente: sin token → hace pedido → teléfono → OTP → pedido creado (sin paso de datos).
- [x] 5.3 Verificar que el flujo de admin (`?mode=admin`) no se vea afectado.
