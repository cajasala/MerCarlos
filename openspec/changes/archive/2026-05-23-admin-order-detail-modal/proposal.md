## Why

En la vista de **Gestión de Pedidos** del panel de administración (`AdminOrdersView`), actualmente los pedidos se listan en una tabla pero no existe forma de acceder al **detalle completo** de un pedido: items, datos del cliente, total y estado. El admin necesita poder visualizar toda la información relevante de un pedido antes de actualizar su estado, y necesita mecanismos para contactar al cliente o enviarle la confirmación por WhatsApp con el detalle de su pedido (productos, cantidades, precios y total).

## What Changes

- **Nuevo endpoint backend** `GET /api/admin/orders/:orderId` — devuelve el pedido con items, productos, datos del cliente y datos de la tienda en una sola consulta
- **Nuevo componente frontend** `OrderDetailModal` — modal flotante que muestra toda la información del pedido con botones para WhatsApp
- **Modificación de `AdminOrdersView`** — cada fila de la tabla de pedidos agrega un botón "Ver Detalle" que abre el modal
- **Botones nuevos en el modal**:
  - "Abrir WhatsApp" → abre `https://wa.me/<telefono>?text=<mensaje predefinido>`
  - "Copiar mensaje" → copia el texto de confirmación formateado al portapapeles

## Capabilities

### New Capabilities

- **order-detail-modal**: Vista modal de detalle de pedido para el panel de administración. Incluye datos del pedido, items, información del cliente, y acciones de WhatsApp (abrir chat + copiar mensaje). Genera `specs/order-detail-modal/spec.md`.

### Modified Capabilities

- (ninguna — no hay requisitos existentes que cambien)

## Impact

| Capa | Afectado |
|------|----------|
| **Backend** | `adminOrders.js` — nuevo endpoint `GET /api/admin/orders/:orderId`. JOINs: `Orden`, `DetalleOrden`, `ProductoMaestro`, `Cliente`, `Tienda`, `StatusOrden` |
| **Frontend** | Nuevo `OrderDetailModal.jsx` + `OrderDetailModal.css`. Modificación de `AdminOrdersView.jsx` (botón por fila + apertura de modal). Aprovecha estilos globales de `index.css` (`.btn`, `.card`, `.animate-fade-in`) |
| **Database** | Sin cambios — usa tablas existentes: `Orden`, `DetalleOrden`, `ProductoMaestro`, `Cliente`, `Tienda` |

### Non-goals

- No se modifica la vista de usuario `OrdersView` (solo vista admin)
- No se implementa envío automático de WhatsApp por backend (solo apertura de enlace)
- No se agrega trazabilidad de acciones del admin sobre pedidos (log de cambios)
- No se incorpora pasarela de pago ni cambio de método de pago
- No se permite editar pedidos — solo consultar y cambiar estado (que ya existe)
