## 1. Footer y Contacto

- [x] 1.1 Crear el componente `Footer.jsx` en `frontend/src/components/`.
- [x] 1.2 Crear los estilos `Footer.css` para el pie de página.
- [x] 1.3 Integrar el `Footer` en `App.jsx` debajo del contenido principal.
- [x] 1.4 Mover el enlace de WhatsApp de `App.jsx` al `Footer` y ajustar su tamaño.
- [x] 1.5 Eliminar los estilos `.whatsapp-float` de `App.css`.

## 2. Promociones en Home

- [x] 2.1 Modificar la función `fetchProducts` en `App.jsx` para aceptar un parámetro opcional `isPromotion`.
- [x] 2.2 Actualizar el `useEffect` de carga inicial en `App.jsx` para invocar `fetchProducts` con `isPromotion: true`.
- [x] 2.3 Asegurar que al buscar o seleccionar una categoría se limpie el filtro de solo promociones.

## 3. Navegación por Subcategorías

- [x] 3.1 Actualizar `CategoryBar.jsx` para manejar el estado de subcategorías.
- [x] 3.2 Implementar la carga de subcategorías desde el backend al seleccionar una categoría.
- [x] 3.3 Modificar `App.jsx` para soportar el filtrado por `subCategoryId`.
- [x] 3.4 Ajustar la interfaz de `CategoryBar` para mostrar las subcategorías de forma intuitiva.

## 4. Verificación y Pulido

- [x] 4.1 Verificar la navegación responsiva en dispositivos móviles.
- [x] 4.2 Validar que el filtro de promociones no afecte las búsquedas directas.
- [x] 4.3 Comprobar que el enlace de WhatsApp funcione correctamente para diferentes tiendas.
