# Design: Admin Order Detail Modal

## Context

Actualmente el endpoint `GET /api/admin/orders` en `adminOrders.js` usa `requireAdmin` (RBAC ADM/PED) y trae `OrdenID`, `ClienteID`, `TiendaID`, `Total`, `StatusID`, `StatusNombre`, `TiendaNombre` pero **no** trae los items del pedido ni los datos del cliente. El frontend `AdminOrdersView.jsx` muestra una tabla sin interactividad por fila más allá del dropdown de estado.

Este diseño agrega el backend faltante + el componente modal flotante tipo `ProductDetail` (patrón ya establecido).

## Goals / Non-Goals

**Goals**
- Endpoint `GET /api/admin/orders/:orderId` authorize con `requireAdmin(['ADM','PED'])` que traiga en una respuesta: datos del pedido + items con nombre de producto + datos del cliente + teléfono WhatsApp de la tienda
- Componente `OrderDetailModal` reusable, estilo visual alineado con el admin (tarjetas, badges de estado, iconos Lucide)
- Botón WhatsApp abre `https://wa.me/<telefono_sin_caracteres_especiales>?text=<mensaje_url_encoded>`
- Botón copiar texto usa `navigator.clipboard.writeText` con feedback visual (texto del botón cambia breve)

**Non-Goals**
- Modificar `OrdersView` (vista de usuario)
- Sin envío asíncrono de mensajes desde el backend
- Sin historial de cambios de estado en modal

## Decisions

### 1. Endpoint en `adminOrders.js` vs archivo nuevo

**Decisión:** Agregarlo en `adminOrders.js` (mismo archivo).

**Rationale:** Ya está el patrón de endpoints de orden admin. `requireAdmin`, `negocioId`, joins con Tienda. Cohesión de código. No justifica archivo separado.

### 2. Formato del endpoint

```
GET /api/admin/orders/:orderId
```

Una sola consulta con todos los JOINs necesarios.

```
SELECT o.OrdenID, o.ClienteID, o.TiendaID, o.Total, o.FechaOrden, o.CreatedAt,
       c.Nombre, c.Apellido, c.Telefono, c.Email,
       s.Nombre AS StatusNombre,
       t.Nombre AS TiendaNombre, t.TelefonoWhatsApp,
       d.DetalleID, d.ProductoID, d.Cantidad, d.PrecioUnitario,
       pm.Nombre AS ProductoNombre, pm.UnidadMedidaBase, pm.CantidadUnidadBase
FROM Orden o
JOIN Cliente c  ON o.ClienteID = c.ClienteID
JOIN Tienda t   ON o.TiendaID = t.TiendaID
JOIN StatusOrden s ON o.StatusID = s.StatusID
JOIN DetalleOrden d ON d.OrdenID = o.OrdenID
JOIN ProductoMaestro pm ON d.ProductoID = pm.ProductoID
WHERE o.OrdenID = @orderId AND t.NegocioID = @negocioId
```

### 3. Modal vs página

**Decisión:** Modal flotante (overlay), componentizado como `OrderDetailModal.jsx`.

**Rationale:** Consistente con el patrón del proyecto (`ProductDetail` es modal). No se pierde contexto de tabla. Reactivo y desacoplado.

### 4. Posición del modal en el árbol

`OrderDetailModal` se importa en `App.jsx` y se renderiza condicionalmente cuando `selectedOrderId` no es nulo (patrón idéntico a `ProductDetail`).

### 5. WhatsApp: apertura vs llamada API

**Decisión:** Solo `window.open('https://wa.me/…')` y `navigator.clipboard.writeText`.

**Rationale:** Sin secretos ni API keys necesarias en el backend. Simplicidad. Cumple el objetivo de confirmación.

### 6. Formato del texto a copiar

Textos de ejemplo — ver detalles en spec `order-detail-modal`:

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
───────────────────────────
💰 TOTAL: $15.500
```

## Risks / Trade-offs

| Risk | Layer | Mitigation |
|------|-------|------------|
| Query SQL devuelve múltiples filas por item; hay que agregarlas en app | [FE] | Agrupar `items` en backend antes de devolver, o agrupar en frontend |
| `navigator.clipboard` no funciona en contextos no-seguros | [FE] | Manejar error y mostrar toast "No se pudo copiar, copialo manualmente" |
| El número de WhatsApp tiene caracteres no válidos (`+`, espacios) | [FE] | Limpiar teléfono con `.replace(/[^0-9]/g, '')` antes de construir URL |
| Admin agrega un pedido con muy pocos items —modal se ve vacío | [FE] | Mostrar estado vacío cuando `items.length === 0` |
| Backend DB falla: el modal queda en carga infinita | [FE] | Timeout + estado de error con botón reintentar |
| Orden no encontrada para el admin: acceso cruzado entre negocios | [BE] | El WHERE `t.NegocioID = @negocioId` protege contra acceso cruzado |

## Migration Plan

Sin migración de datos — solo cambios de código. Despliegue sin downtime.

### Rollback

1. Revertir backend: eliminar endpoint nuevo de `adminOrders.js`
2. Revertir frontend: eliminar import y renderizado de `OrderDetailModal`

## Open Questions

Ninguna pendiente — scope y formato están acordados.
