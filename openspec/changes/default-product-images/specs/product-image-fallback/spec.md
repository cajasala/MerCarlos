# Product Image Fallback Specification

## Coordination

| Cambio | Capa | Afecta |
| :--- | :--- | :--- |
| Crear default-product.svg | Frontend | Carpeta `public/` para almacenar el recurso SVG estático |
| Implementar fallback en tarjetas de catálogo | Frontend | Componente `ProductCard.jsx` para evitar imágenes rotas u omitidas |
| Implementar fallback en modal de detalle | Frontend | Componente `ProductDetail.jsx` para evitar imágenes rotas u omitidas |
| Implementar fallback en vista de canastilla | Frontend | Componente `Cart.jsx` para evitar imágenes rotas u omitidas |
| Implementar fallback en imágenes del administrador | Frontend | Componente `AdminProductImages.jsx` para evitar imágenes de portada rotas |

### Endpoints y Tablas Afectados
- **Endpoints**: Ninguno. El backend no cambia.
- **Tablas**: Ninguna. La base de datos no cambia.

## ADDED Requirements

### Requirement: Fallback local para productos sin imagen
El frontend SHALL mostrar el recurso local `default-product.svg` (resuelto dinámicamente según la base URL de la aplicación) cuando un producto no tenga definida una URL de imagen (`ImagenURL` es nulo, indefinido o vacío) en el catálogo, detalle, canastilla y panel de administración.

#### Scenario: Carga de producto sin imagen en catálogo
- **WHEN** el producto no tiene una URL de imagen definida
- **THEN** el componente `ProductCard` renderiza el atributo `src` con el path del recurso local resuelto con la base URL

#### Scenario: Carga de producto sin imagen en modal de detalle
- **WHEN** el producto no tiene un array de imágenes o está vacío
- **THEN** el componente `ProductDetail` renderiza la imagen principal con el path del recurso local resuelto con la base URL

#### Scenario: Carga de producto sin imagen en la canastilla
- **WHEN** el artículo en la canastilla no tiene una URL de imagen definida
- **THEN** el componente `Cart` renderiza el atributo `src` con el path del recurso local resuelto con la base URL

### Requirement: Manejo dinámico de errores de carga de imágenes
El frontend SHALL interceptar fallas de carga de imagen mediante el evento `onError` en las etiquetas `<img>` de productos y reemplazar la fuente de la imagen fallida dinámicamente con el recurso local `default-product.svg` resuelto con la base URL.

#### Scenario: Imagen rota en catálogo
- **WHEN** el navegador falla al descargar la URL de imagen en `ProductCard`
- **THEN** el evento `onError` se dispara y reemplaza el atributo `src` de la etiqueta `<img>` con el recurso local resuelto con la base URL

#### Scenario: Imagen rota en detalle de producto
- **WHEN** el navegador falla al descargar la URL de imagen principal o de miniatura en `ProductDetail`
- **THEN** el evento `onError` se dispara y reemplaza el atributo `src` de la etiqueta `<img>` con el recurso local resuelto con la base URL

#### Scenario: Imagen rota en la canastilla
- **WHEN** el navegador falla al descargar la URL de imagen en `Cart`
- **THEN** el evento `onError` se dispara y reemplaza el atributo `src` de la etiqueta `<img>` con el recurso local resuelto con la base URL

#### Scenario: Imagen de portada rota en panel de administración
- **WHEN** el navegador falla al descargar la URL de imagen en `AdminProductImages`
- **THEN** el evento `onError` se dispara y reemplaza el atributo `src` de la etiqueta `<img>` con el recurso local resuelto con la base URL
