## Why

Securing catalog and location endpoints prevents unauthorized entities from scraping products, prices, and store locations. By requiring JWT authorization, we restrict access only to registered and logged-in clients, while keeping local development and testing fast and frictionless through a hybrid auth bypass.

## What Changes

- **Backend**:
  - Secure `/api/cities`, `/api/stores/{cityId}`, `/api/categories`, `/api/subcategories/{categoryId}`, `/api/products/{storeId}`, and `/api/product/{productId}/{storeId}` with JWT authentication.
  - Implement a development environment bypass in `utils/auth.js` to allow unauthorized access when running in local development mode (`process.env.NODE_ENV === 'development'`).
- **Frontend**:
  - Make login mandatory at the entry of the web app if no JWT token is stored, locking user navigation and forcing OTP verification before selecting stores or browsing the catalog.
  - Send the JWT token in the `Authorization` header for all requests to locations, catalog, lists, and orders endpoints.

## Capabilities

### New Capabilities
- `secure-endpoints-jwt`: Introduces authentication requirements for location and catalog endpoints, coupled with a developer-friendly bypass for local execution.

### Modified Capabilities
*(None)*

## Impact

- **Backend Endpoints Affected**:
  - `getCities` (`GET /api/cities`)
  - `getStoresByCity` (`GET /api/stores/{cityId}`)
  - `getCategories` (`GET /api/categories`)
  - `getSubCategories` (`GET /api/subcategories/{categoryId}`)
  - `getProductsByStore` (`GET /api/products/{storeId}`)
  - `getProductDetail` (`GET /api/product/{productId}/{storeId}`)
  - Exceptions: `/api/auth/*` (Login/OTP) and `/api/mng/login` (Admin Login) must remain public.
- **Database Tables Affected (Reads)**:
  - `Ciudad`, `Tienda`, `Categoria`, `SubCategoria`, `ProductoMaestro`, `ProductoTienda`, `ProductoImagen`.
- **Frontend Components Affected**:
  - `App.jsx` (coordinates mandatory authentication check on startup, routes state, and injects Authorization headers)
  - `StoreSelector.jsx` (requires Authorization header when requesting cities and stores)
  - `ProductDetail.jsx` (requires Authorization header when fetching details)
  - `AuthModal.jsx` (forces authentication by removing the close button when a session is not present)
- **Non-goals**:
  - Changing the authentication mechanism (will remain SMS/OTP-based JWT generation).
  - Securing public auth/handshake endpoints (`/api/auth/request-otp`, `/api/auth/verify-otp`, `/api/mng/login`).
  - Altering database table structures or migrating schemas.
