# Tasks: Admin Order Detail Modal

## 1. [BE] Agregar endpoint `GET /api/admin/orders/:orderId`

- [x] 1.1 En `backend/src/functions/adminOrders.js`, agregar handler `getAdminOrderDetail` con método `GET`, ruta `api/admin/orders/{orderId}`, y nivel de auth `'anonymous'` (se valida internamente con `requireAdmin`)

- [x] 1.2 Implementar handler:
  - Extraer `orderId` de `request.params.orderId`
  - Ejecutar `requireAdmin(request, ['ADM', 'PED'])`; retornar 401/403 si no autorizado
  - Ejecutar la query SQL que haga JOIN de: `Orden o JOIN Cliente c ON o.ClienteID = c.ClienteID JOIN Tienda t ON o.TiendaID = t.TiendaID JOIN StatusOrden s ON o.StatusID = s.StatusID JOIN DetalleOrden d ON d.OrdenID = o.OrdenID JOIN ProductoMaestro pm ON d.ProductoID = pm.ProductoID WHERE o.OrdenID = @orderId AND t.NegocioID = @negocioId`
  - Extraer datos de cabecera del pedido (una sola fila) y consolidar items en un array `items` en el objeto de respuesta
  - Retornar 404 si `recordset.length === 0`
  - Retornar 200 con `{ OrdenID, ClienteID, TiendaID, Total, FechaOrden, CreatedAt, StatusNombre, TiendaNombre, TelefonoWhatsApp, Nombre, Apellido, Telefono, Email, items }`

- [x] 1.3 Commit `feat(backend): add GET /api/admin/orders/:orderId with items and customer data`

## 2. [BE+DB] Verificar que tablas y columnas usadas son correctas

- [x] 2.1 Confirmar que `Tienda.TelefonoWhatsApp` (columna `NVARCHAR(20)`) existe en la migración `03_pricing_media_tables.sql`

- [x] 2.2 Confirmar que la query devuelve `FechaOrden` de `Orden` (columna agregada en migración `04_customer_order_tables.sql`)

- [x] 2.3 Confirmar que `requireAdmin` devuelve `negocioId` para usar en el WHERE de la query (lo hace en `utils/adminAuth.js:47`)

## 3. [FE] Agregar botón "Ver Detalle" a `AdminOrdersView.jsx`

- [x] 3.1 En `AdminOrdersView.jsx`, agregar estado `const [selectedOrderId, setSelectedOrderId] = useState(null)`
- [x] 3.2 En la tabla de órdenes, agregar un ícono `ChevronRight` importado desde `lucide-react` y renderizar en la columna "Acciones" un botón/icono `[Ver Detalle]` para cada fila
- [x] 3.3 Sobrescribir la columna de acciones actual (dropdown de estado) — conservar el dropdown en otra columna o como acción secundaria

## 4. [FE] Crear componente `OrderDetailModal.jsx`

- [x] 4.1 Crear archivo `frontend/src/components/OrderDetailModal.jsx`
- [x] 4.2 Implementar props: `orderId`, `onClose`
- [x] 4.3 Implementar estado: `order`, `loading`, `error`
- [x] 4.4 Obtener datos con `axios.get(`${API_URL}/api/admin/orders/${orderId}`, …)`
- [x] 4.5 Renderizar estructura (patrón `ProductDetail`):
  - Overlay fullscreen + backdrop click cierra modal
  - Header con `# OrdenID` y `StatusNombre` badge
  - Sección `CLIENTE`: Nombre, Apellido, Teléfono, Email (si existe)
  - Sección `INFO PEDIDO`: Fecha formateada `dd/MM/yyyy HH:mm`, TiendaNombre, TelefonoWhatsApp
  - Sección `ARTÍCULOS`: lista numerada con `ProductoNombre x Cantidad = $PrecioUnitario`
  - Footer: `TOTAL: $Total` y botones WhatsApp + Copiar

- [x] 4.6 Botón WhatsApp: `window.open('https://wa.me/' + phone.replace(/[^0-9]/g, ''))`. Si `Telefono` vacío, deshabilitar u ocultar
- [x] 4.7 Botón Copiar mensaje: generar texto en el formato de spec, usar `navigator.clipboard.writeText()`, cambiar texto botón a `¡Copiado!` por 2 segundos, manejar error con `alert('No se pudo copiar automáticamente.')`
- [x] 4.8 Estados de carga y error: spinner/loading state mientras se obtiene data, mensaje de error + botón reintentar si falla

- [x] 4.9 Commit `feat(frontend): add OrderDetailModal component with WhatsApp actions`

## 5. [FE] Crear `OrderDetailModal.css`

- [x] 5.1 Crear archivo `frontend/src/components/OrderDetailModal.css`
- [x] 5.2 Estilos: `.order-detail-overlay`, `.order-detail-modal-content`, `.modal-header`, `.modal-section`, `.items-list`, `.modal-footer`, `.modal-actions`
- [x] 5.3 Alinear con estilos globales existentes: sombras del CSS de `index.css`, badge de estado, tipografía, botones

## 6. [FE] Integrar el modal en `AdminOrdersView.jsx`

- [x] 6.1 En `AdminOrdersView.jsx`, agregar renderizado condicional: `selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={...} />`
- [x] 6.2 El `onClose` del modal limpia `selectedOrderId`
- [x] 6.3 Verificar que el modal se cierra correctamente sin romper la tabla subyacente

## 7. [FE] Integrar el modal en `App.jsx`

- [x] 7.1 Opción A: Levantar el estado `selectedOrderId` a `AdminDashboard.jsx` o `AdminOrdersView.jsx` (opción A — más simple, el estado vive en `AdminOrdersView`)
- [x] 7.2 No hay cambio en `App.jsx` si el estado y renderizado del modal viven completamente en `AdminOrdersView` (confirmar que `App.jsx` no necesita modificación)

- [x] 7.3 Commit `feat(frontend): integrate OrderDetailModal in AdminOrdersView`
