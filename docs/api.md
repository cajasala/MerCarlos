# Referencia de API - MerCarlos

Esta sección detalla los endpoints disponibles en el backend de Azure Functions. Todos los endpoints de la API base se encuentran bajo el prefijo `/api/`.

## Autenticación

### `POST /auth/request-otp`
Solicita un código de un solo uso (OTP) enviado por SMS.
- **Cuerpo**: `{ "telefono": "3001234567" }`
- **Respuesta**: `200 OK` con `{ "message": "OTP sent" }`

### `POST /auth/verify-otp`
Verifica el código OTP y realiza el login o registro automático.
- **Cuerpo**:
  ```json
  {
    "telefono": "3001234567",
    "code": "123456",
    "nombre": "Juan",
    "apellido": "Perez",
    "email": "juan@example.com",
    "codigoFidelizacion": "FID-123"
  }
  ```
- **Respuesta**: `200 OK` con `{ "token": "JWT_TOKEN", "user": { ... } }`

---

## Ubicaciones y Tiendas

### `GET /cities`
Obtiene la lista de ciudades disponibles.
- **Respuesta**: Lista de objetos `{ "CiudadID": int, "Nombre": string }`

### `GET /stores/{cityId}`
Obtiene las tiendas asociadas a una ciudad específica.
- **Respuesta**: Lista de objetos `{ "TiendaID": int, "Nombre": string, "TelefonoWhatsApp": string }`

---

## Catálogo de Productos

### `GET /categories`
Obtiene todas las categorías principales.

### `GET /subcategories/{categoryId}`
Obtiene subcategorías para una categoría dada.

### `GET /products/{storeId}`
Obtiene productos disponibles en una tienda específica con filtros opcionales.
- **Query Params**:
  - `search`: Filtro por nombre de producto.
  - `categoryId`: Filtro por ID de categoría.
  - `subCategoryId`: Filtro por ID de subcategoría.
  - `isPromotion`: `true` para ver solo ofertas.
- **Respuesta**: Lista de productos enriquecida con `PrecioPorUnidadMedida`.

### `GET /product/{productId}/{storeId}`
Obtiene el detalle completo de un producto en una tienda específica, incluyendo galería de imágenes.

---

## Pedidos y Listas

### `GET /orders`
Obtiene el historial de pedidos del usuario autenticado.
- **Headers**: `Authorization: Bearer <TOKEN>`

### `POST /orders`
Realiza el checkout y crea un nuevo pedido.
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Cuerpo**:
  ```json
  {
    "tiendaId": 1,
    "total": 55000,
    "items": [
      { "ProductoID": 10, "quantity": 2, "PrecioRegular": 2500, ... }
    ]
  }
  ```

---

## Administración

### `POST /api/admin/login`
Autenticación para usuarios administradores.
- **Cuerpo**: `{ "username": "admin", "password": "password" }`
- **Respuesta**: `{ "token": "JWT_TOKEN", "admin": { ... } }`

### `POST /api/admin/upload-csv`
Carga masiva de precios y promociones mediante un archivo CSV.
- **Headers**: `Content-Type: multipart/form-data`
- **Campos**:
  - `file`: Archivo .csv
  - `tiendaId`: ID de la tienda a actualizar.
- **Formato CSV**: `SKU, PrecioRegular, PrecioPromocion, EsPromocion`
