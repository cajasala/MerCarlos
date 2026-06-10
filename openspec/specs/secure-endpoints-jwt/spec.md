# secure-endpoints-jwt Specification

## Purpose
TBD - created by archiving change secure-endpoints-jwt. Update Purpose after archive.
## Requirements
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

