## ADDED Requirements

### Requirement: Autenticación diferida al checkout
El sistema SHALL solicitar autenticación únicamente cuando el usuario intente crear un pedido sin token activo.

#### Scenario: Usuario sin token intenta hacer pedido
- **WHEN** un usuario sin token activo presiona "Hacer pedido"
- **THEN** el sistema abre el AuthModal antes de procesar el pedido
- **THEN** al completarse la autenticación, el sistema retoma el flujo de creación del pedido automáticamente

#### Scenario: Usuario con token hace pedido
- **WHEN** un usuario con token válido presiona "Hacer pedido"
- **THEN** el sistema envía el pedido directamente sin abrir el AuthModal

#### Scenario: Datos personales solo para usuario nuevo
- **WHEN** el OTP es validado y el backend retorna `isNew: true`
- **THEN** el AuthModal muestra el paso de nombre, apellido y email antes de cerrar
- **WHEN** el OTP es validado y el backend retorna `isNew: false`
- **THEN** el AuthModal se cierra inmediatamente y el pedido continúa sin paso adicional

#### Scenario: Carrito anónimo sobrevive la autenticación
- **WHEN** un usuario anónimo tiene ítems en el carrito y se autentica en el checkout
- **THEN** el carrito previo se conserva intacto en localStorage
- **THEN** el pedido se crea con los ítems que estaban en el carrito antes de autenticarse

## Coordination

| Cambio | Capa | Afecta |
|--------|------|--------|
| Verificar token antes de POST /orders | Frontend | Componente/handler de checkout en `App.jsx` |
| Abrir AuthModal desde checkout con callback | Frontend | `App.jsx`, `AuthModal.jsx` |
| Mostrar paso 2 condicionalmente según `isNew` | Frontend | `AuthModal.jsx` |
| Retomar pedido tras autenticación | Frontend | `App.jsx` — estado de pedido pendiente |

**Endpoints involucrados**: `POST /auth/verify-otp` (consume `isNew`), `POST /orders` (requiere JWT).

**Tablas involucradas**: `OTP`, `Cliente`, `Orden`, `DetalleOrden` — sin cambios de esquema.
