## ADDED Requirements

### Requirement: JWT Authentication for Locations and Catalog Endpoints
The system SHALL validate the user's JWT token on the locations and catalog endpoints in production.

#### Scenario: Unauthorized access in production
- **WHEN** a client sends a request to a secured endpoint without a valid token in the `Authorization` header and the backend is running in production.
- **THEN** the backend SHALL return status `401 Unauthorized`.

#### Scenario: Authorized access in production
- **WHEN** a client sends a request to a secured endpoint with a valid JWT token in the `Authorization` header.
- **THEN** the backend SHALL process the request normally and return status `200 OK` (or appropriate response).

### Requirement: Development Auth Bypass
The system SHALL bypass JWT authentication requirements for locations and catalog endpoints during local development to facilitate testing.

#### Scenario: Request without token in development mode
- **WHEN** a client sends a request to a secured endpoint without an `Authorization` header and `process.env.NODE_ENV` is set to `'development'`.
- **THEN** the backend SHALL mock the authentication context and return status `200 OK` (or appropriate response).

### Requirement: Mandatory Frontend Login
The frontend SHALL enforce authentication prior to allowing users to access catalog resources or select stores.

#### Scenario: Guest user enters application
- **WHEN** a user opens the application and has no JWT token saved in `localStorage`.
- **THEN** the frontend SHALL display the `AuthModal` in a mandatory configuration, preventing the user from closing the modal until they authenticate.

---

## Coordination

| Cambio | Capa | Afecta |
| :--- | :--- | :--- |
| Validar JWT en endpoints de ubicaciones y catálogo | Backend | `locations.js`, `catalog.js` |
| Implementar bypass de autenticación local | Backend | `utils/auth.js` |
| Obligar login inicial en la aplicación | Frontend | `App.jsx`, `AuthModal.jsx` |
| Propagar token en cabeceras de peticiones | Frontend | `App.jsx`, `StoreSelector.jsx`, `ProductDetail.jsx` |

## Endpoints and Tables Involved

### Endpoints
- `GET /api/cities` (`getCities`)
- `GET /api/stores/{cityId}` (`getStoresByCity`)
- `GET /api/categories` (`getCategories`)
- `GET /api/subcategories/{categoryId}` (`getSubCategories`)
- `GET /api/products/{storeId}` (`getProductsByStore`)
- `GET /api/product/{productId}/{storeId}` (`getProductDetail`)

### Database Tables (Reads)
- `Ciudad`
- `Tienda`
- `Categoria`
- `SubCategoria`
- `ProductoMaestro`
- `ProductoTienda`
- `ProductoImagen`
