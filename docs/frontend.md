# Guía del Frontend - MerCarlos

El frontend de MerCarlos es una Single Page Application (SPA) construida con **React 19** y **Vite**, diseñada para ofrecer una experiencia de usuario fluida y reactiva.

## Estructura de la Aplicación

La aplicación utiliza un esquema de navegación basado en estados en lugar de rutas tradicionales de URL para las vistas principales, permitiendo transiciones suaves.

### Vistas Principales
- **Home (`home`)**: Catálogo de productos, filtros y búsqueda.
- **Perfil (`profile`)**: Gestión de datos del usuario y cierre de sesión.
- **Listas (`lists`)**: Listas de compras frecuentes guardadas por el usuario.
- **Órdenes (`orders`)**: Historial de pedidos realizados.
- **Admin (`admin`)**: Panel de administración (accesible vía `?mode=admin`).

## Componentes Clave

### `StoreSelector`
Es el componente más crítico. Se activa automáticamente en la primera visita.
- **Propósito**: Obliga al usuario a seleccionar una ciudad y una tienda antes de navegar.
- **Persistencia**: Guarda la selección en `localStorage` para futuras visitas.

### `ProductCard` & `ProductDetail`
- Muestran el precio regular y de promoción.
- Calculan visualmente el **Precio por Unidad de Medida (PUM)**.
- El detalle incluye una galería de imágenes.

### `Cart` (Canastilla)
- Gestiona los productos seleccionados.
- Calcula el total dinámicamente.
- Persiste los datos en el navegador para evitar pérdidas de información por recargas.

## Gestión de Estado y Persistencia

La aplicación utiliza `useState` y `useEffect` para la gestión de estado global a nivel de `App.jsx`.

| Dato | Almacenamiento | Persistencia |
| :--- | :--- | :--- |
| Carrito de Compras | `cartItems` state | `localStorage ('cart')` |
| Usuario Autenticado | `user` state | `localStorage ('user')` |
| Token JWT | N/A | `localStorage ('token')` |
| Tienda Seleccionada | `selectedStore` state | `localStorage ('selectedStore')` |

## Flujo de Navegación

1. **Entrada**: Si no hay tienda en `localStorage`, se muestra el `StoreSelector`.
2. **Navegación**: El usuario puede buscar productos o filtrar por categorías.
3. **Compra**: Los productos se añaden al carrito.
4. **Checkout**: 
   - Si no está autenticado, se abre el `AuthModal`.
   - Si está autenticado, se envía el pedido al backend y se vacía el carrito.

## Estilos y Diseño
Se utiliza **Vanilla CSS** con un enfoque moderno.
- **Layout**: Grid y Flexbox para responsividad.
- **Animaciones**: Micro-interacciones con `animate-fade-in`.
- **Iconos**: Utiliza la librería `lucide-react`.
