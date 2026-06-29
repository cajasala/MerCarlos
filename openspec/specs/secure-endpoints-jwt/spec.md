# secure-endpoints-jwt Specification

## Purpose
JWT authentication is required for user-specific actions (orders and lists). Browsing the catalog and selecting stores is public and does not require authentication.

## Requirements

### Requirement: Public Catalog and Locations Endpoints
The system SHALL allow unauthenticated access to catalog and locations endpoints in all environments.

#### Scenario: Anonymous browsing in production
- **WHEN** a client sends a request to a catalog or locations endpoint without a valid token in the `Authorization` header and the backend is running in production.
- **THEN** the backend SHALL process the request normally and return status `200 OK` (or appropriate status).

#### Scenario: Anonymous browsing with token in production
- **WHEN** a client sends a request to a catalog or locations endpoint with a valid JWT token in the `Authorization` header.
- **THEN** the backend SHALL process the request normally and return status `200 OK` (or appropriate status).

### Requirement: Secured Orders and Lists Endpoints
The system SHALL validate the user's JWT token on the orders and lists endpoints in all environments.

#### Scenario: Unauthorized access to orders or lists
- **WHEN** a client sends a request to an orders or lists endpoint without a valid token in the `Authorization` header.
- **THEN** the backend SHALL return status `401 Unauthorized`.

#### Scenario: Authorized access to orders or lists
- **WHEN** a client sends a request to an orders or lists endpoint with a valid JWT token in the `Authorization` header.
- **THEN** the backend SHALL process the request normally and return status `200 OK` (or appropriate status).

### Requirement: Frontend AuthModal at Checkout Only
The frontend SHALL open the `AuthModal` only when the user attempts to create an order without an active token, or when the user manually triggers login.

#### Scenario: Guest user browses the catalog
- **WHEN** a user opens the application and has no JWT token saved in `localStorage`.
- **THEN** the frontend SHALL NOT display the `AuthModal` automatically.
- **THEN** the frontend SHALL open the `StoreSelector` if no store is saved.

#### Scenario: Guest user attempts checkout
- **WHEN** a user without a token presses "Hacer pedido".
- **THEN** the frontend SHALL open the `AuthModal` to authenticate the user before processing the order.

#### Scenario: 401 response from secured endpoint
- **WHEN** the frontend receives a `401 Unauthorized` response from an orders or lists endpoint.
- **THEN** the frontend SHALL clear the stored credentials silently without opening the `AuthModal`.

## Coordination

| Cambio | Capa | Afecta |
|--------|------|--------|
| Catalog endpoints become public | Backend | `backend/src/functions/catalog.js` |
| Locations endpoints become public | Backend | `backend/src/functions/locations.js` |
| Remove auto-open AuthModal on 401 | Frontend | `frontend/src/App.jsx` — 401 interceptor |

**Endpoints públicos**: `GET /cities`, `GET /stores/{cityId}`, `GET /categories`, `GET /subcategories/{categoryId}`, `GET /products/{storeId}`, `GET /product/{productId}/{storeId}`

**Endpoints seguros**: `GET /orders`, `POST /orders`, `GET /lists`, `POST /lists`, `DELETE /lists/{id}`

**Tablas involucradas**: ninguna (sin cambios de esquema).
