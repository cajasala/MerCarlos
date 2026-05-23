## ADDED Requirements

### Requirement: Admin can view full order detail

The system SHALL allow an authenticated admin (roles ADM or PED) to view the complete details of a single order, including the order header, all line items with product information, customer data, and store information, scoped to the admin's negocio.

#### Scenario: Admin requests an order detail for own negocio

- **WHEN** an admin with role ADM or PED sends `GET /api/admin/orders/:orderId` with a valid JWT whose `negocioId` matches the order's store `NegocioID`
- **THEN** the system returns HTTP 200 with an object containing:
  - `OrdenID`, `ClienteID`, `TiendaID`, `Total`, `FechaOrden`, `CreatedAt`
  - `StatusNombre` (joined from StatusOrden)
  - `TiendaNombre`, `TelefonoWhatsApp` (joined from Tienda)
  - `Nombre`, `Apellido`, `Telefono`, `Email` (joined from Cliente)
  - `items`: array of objects, each with `ProductoID`, `ProductoNombre`, `Cantidad`, `PrecioUnitario`, `UnidadMedidaBase`

#### Scenario: Admin requests an order from a different negocio

- **WHEN** an admin sends `GET /api/admin/orders/:orderId` whose store belongs to a different `negocioId`
- **THEN** the system returns HTTP 404

#### Scenario: Unauthenticated request

- **WHEN** a request reaches `GET /api/admin/orders/:orderId` without a valid JWT
- **THEN** the system returns HTTP 401

#### Scenario: Role not allowed (EDI)

- **WHEN** a user with role EDI sends `GET /api/admin/orders/:orderId`
- **THEN** the system returns HTTP 403

#### Scenario: Order has no items

- **WHEN** a valid request is made for an order that has no items in DetalleOrden
- **THEN** the system returns HTTP 200 with `items: []` (empty array)

---

### Requirement: Admin can see order detail in a modal

The system SHALL present the order detail in a modal overlay when the admin clicks "Ver Detalle" in the orders table. The modal SHALL display all order data (header, items, customer info, store info), SHALL be dismissible via close button, and SHALL respect the admin's current view state.

#### Scenario: Admin clicks Ver Detalle

- **WHEN** the admin clicks the "Ver Detalle" button on any order row in `AdminOrdersView`
- **THEN** the modal opens centered on screen containing the full order detail for that order

#### Scenario: Admin closes the modal

- **WHEN** the admin clicks the close button (X) or the overlay backdrop
- **THEN** the modal closes and the order table remains visible without state loss

#### Scenario: Clicking outside the modal

- **WHEN** the admin clicks on the backdrop area outside the modal content
- **THEN** the modal closes

#### Scenario: Loading state

- **WHEN** the detail data is being fetched from the backend
- **THEN** the modal shows a loading spinner or text and does not display partial data

#### Scenario: Error loading detail

- **WHEN** the backend returns an error or the request fails
- **THEN** the modal shows an error message and a retry button

---

### Requirement: Admin can open WhatsApp conversation

The system SHALL provide an "Abrir WhatsApp" button in the modal that opens a new browser tab or window at `https://wa.me/<Telefono>` targeting the customer's phone number from `Cliente.Telefono`.

#### Scenario: Customer has valid phone number

- **WHEN** the admin clicks "Abrir WhatsApp" and the customer phone is a valid numeric string
- **THEN** the system opens `https://wa.me/<phone_without_special_chars>` in a new browser tab

#### Scenario: Customer phone has special characters

- **WHEN** the customer phone contains characters such as `+`, spaces, dashes, or parentheses
- **THEN** the system strips all non-numeric characters before constructing the URL

#### Scenario: Customer has no phone number

- **WHEN** the customer record has an empty or null `Telefono`
- **THEN** the "Abrir WhatsApp" button is disabled or hidden

#### Scenario: WhatsApp button included in copied text

- **WHEN** the admin uses the "Copiar mensaje" button
- **THEN** the copied text includes the store's WhatsApp number (`Tienda.TelefonoWhatsApp`)

---

### Requirement: Admin can copy order confirmation text to clipboard

The system SHALL provide a "Copiar mensaje WhatsApp" button that copies a pre-formatted text summary of the order to the clipboard using `navigator.clipboard.writeText()`.

#### Scenario: Successful clipboard copy

- **WHEN** the admin clicks "Copiar mensaje WhatsApp"
- **THEN** the system copies the formatted text to the clipboard and the button text changes to "¡Copiado!" for 2 seconds

#### Scenario: Clipboard API unavailable or denied

- **WHEN** `navigator.clipboard.writeText()` is unavailable or the browser denies permission
- **THEN** the system shows a toast or alert message: "No se pudo copiar automáticamente. Copialo manualmente."

#### Scenario: Copied text format

- **WHEN** the text is copied, it includes the following sections in order:
  - Order ID header with emoji prefix
  - Customer name (Nombre + Apellido from Cliente)
  - Customer phone (Telefono from Cliente)
  - Customer email (Email from Cliente) if present
  - Date (FechaOrden formatted dd/MM/yyyy HH:mm) and store name separated by divider
  - "ARTÍCULOS:" section with numbered line items (ProductoNombre x Cantidad = PrecioUnitario formatted) each on its own line, separated by divider
  - "TOTAL:" line with the order total formatted

#### Scenario: Copied text sample

- The copied text for the example below shall be:

```
🛒 PEDIDO #1234
👤 Cliente: María Gómez
📞 Teléfono: +57 3001234567
📧 Email: maria@email.com
───────────────────────────
FECHA: 23/05/2026 14:30
ESTADO: Recibido
TIENDA: MerCarlos Centro
───────────────────────────
ARTÍCULOS:
1. Arroz 1kg x2 = $8.000
2. Leche 1L x1 = $4.500
3. Pan x1 = $3.000
───────────────────────────
💰 TOTAL: $15.500
```

---

### Coordination

| Cambio | Capa | Afecta |
|--------|------|--------|
| Nuevo endpoint `GET /api/admin/orders/:orderId` | Backend | `functions/adminOrders.js`, `utils/adminAuth.js` (requireAdmin), `utils/db.js` |
| JS auth middleware: `authenticate` | [BE] | `utils/adminAuth.js` |

No hay modificaciones a especificaciones existentes — todas las tablas y endpoints son reutilización:</i>
- `Orden`, `DetalleOrden`, `ProductoMaestro`, `Cliente`, `Tienda`, `StatusOrden` — tablas existentes, sin cambios
- Endpoints existentes `GET /api/admin/orders` y `POST /api/admin/orders/{orderId}/status` — sin cambios (información solo)

