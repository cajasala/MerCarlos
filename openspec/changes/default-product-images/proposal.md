## Why

Algunos productos del catálogo no tienen asociada una imagen en la base de datos o sus enlaces (URLs) están rotos (errores de red, 404, etc.). Esto provoca que el frontend muestre iconos de imágenes rotas de forma nativa o que intente cargar dependencias de imágenes externas de terceros (`via.placeholder.com`) que pueden fallar, cargar lentamente o no coincidir con la estética del sitio. Este cambio implementará un marcador de posición (placeholder) SVG local y moderno que se renderizará automáticamente ante la falta de una imagen o cuando su carga falle.

## What Changes

- **Recurso local SVG**: Creación de un archivo SVG local y optimizado en `frontend/public/default-product.svg` que siga la paleta de colores de MerCarlos (Verde `#2e7d32` y Naranja `#fb8c00`).
- **Manejo de Errores Dinámico (`onError`)**: Se modificará el frontend para controlar los errores de carga en las etiquetas `<img>` de los productos. Si una URL en la base de datos falla al cargarse, se reemplazará dinámicamente en caliente por el recurso SVG local.
- **Fallbacks Estáticos**: Reemplazo de todas las referencias a `https://via.placeholder.com` por el nuevo recurso local `/default-product.svg`.
- **Coordinación entre Capas**: 
  - *Frontend*: Consume el SVG local y añade el control de carga.
  - *Backend/Base de Datos*: No se realizarán cambios estructurales en el backend ni en la base de datos para este cambio específico. La base de datos mantendrá sus registros normales y el backend seguirá sirviendo las URLs registradas; el frontend se encargará de interceptar y corregir los casos fallidos o nulos.

### Non-goals
- No se agregará una funcionalidad para que los clientes suban imágenes desde el frontend de usuario.
- No se realizarán migraciones de la base de datos para actualizar masivamente URLs de imágenes rotas existentes.
- No se modificará el comportamiento de subida de imágenes en el panel administrativo, excepto para proveer el mismo fallback visual de carga en su vista previa.

## Capabilities

### New Capabilities
- `product-image-fallback`: Implementación de una estrategia de fallback local para imágenes de productos nulas o rotas a lo largo de la experiencia del cliente y del administrador.

### Modified Capabilities
*(Ninguna)*

## Impact

### Frontend Components
- `frontend/src/components/ProductCard.jsx`: Modificar la fuente por defecto y añadir la directiva `onError`.
- `frontend/src/components/ProductDetail.jsx`: Modificar el array de imágenes por defecto y añadir la directiva `onError` en imagen principal y miniaturas.
- `frontend/src/components/Cart.jsx`: Modificar la imagen por defecto en la canastilla y añadir la directiva `onError`.
- `frontend/src/components/AdminProductImages.jsx`: Añadir la directiva `onError` en la grilla de imágenes del producto.

### Backend Endpoints
- Ninguno. No se modifican endpoints existentes.

### Database Tables
- Ninguna. Las tablas `ProductoMaestro` e `ImagenProducto` no cambian su esquema.
