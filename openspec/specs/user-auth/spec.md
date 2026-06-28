## MODIFIED Requirements

### Requirement: Respuesta de verify-otp incluye estado de usuario nuevo
El endpoint `POST /auth/verify-otp` SHALL incluir el campo `isNew: boolean` en su respuesta JSON para indicar si el usuario fue creado en esa llamada (`true`) o ya existía previamente (`false`).

#### Scenario: Usuario nuevo verifica OTP por primera vez
- **WHEN** se llama a `POST /auth/verify-otp` con un teléfono que no existe en `Cliente`
- **THEN** el sistema crea el registro en `Cliente` (con campos opcionales vacíos)
- **THEN** la respuesta incluye `isNew: true` junto al `token` y datos del usuario

#### Scenario: Usuario existente verifica OTP
- **WHEN** se llama a `POST /auth/verify-otp` con un teléfono ya registrado en `Cliente`
- **THEN** el sistema devuelve el registro existente sin modificarlo
- **THEN** la respuesta incluye `isNew: false` junto al `token` y datos del usuario

## Coordination

| Cambio | Capa | Afecta |
|--------|------|--------|
| Agregar `isNew` a la respuesta JSON | Backend | `src/functions/auth.js` — handler `verifyOTP` |
| Consumir `isNew` para mostrar paso 2 | Frontend | `AuthModal.jsx` |

**Endpoints involucrados**: `POST /auth/verify-otp`.

**Tablas involucradas**: `Cliente` (lectura para detectar existencia), `OTP` (validación) — sin cambios de esquema.
