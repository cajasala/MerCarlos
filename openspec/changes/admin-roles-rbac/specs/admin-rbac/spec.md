## ADDED Requirements

### Requirement: Three admin roles with discrete permissions
The system SHALL support three admin roles — `ADM`, `PED`, `EDI` — each mapped to a `RolID` of type `VARCHAR(3)` in the `Rol` table. Every admin account (`Administrador`) SHALL reference exactly one role.

#### Scenario: Admin login returns correct role in JWT
- **WHEN** an admin with role `PED` logs in successfully
- **THEN** the JWT payload SHALL contain `role: 'PED'` (not a numeric ID)

#### Scenario: Admin login returns correct role in JWT for EDI
- **WHEN** an admin with role `EDI` logs in successfully
- **THEN** the JWT payload SHALL contain `role: 'EDI'`

### Requirement: Backend endpoint authorization by role
The backend SHALL reject any request to an admin-scoped endpoint when the caller's JWT `role` does not match the roles allowed for that endpoint. Authorization SHALL be checked server-side before any business logic executes.

#### Scenario: PED denied access to product image endpoint
- **WHEN** an admin with role `PED` calls `POST /admin/products/{id}/images`
- **THEN** the SHALL return HTTP 403 Forbidden

#### Scenario: EDI denied access to order status endpoint
- **WHEN** an admin with role `EDI` calls `POST /admin/orders/{id}/status`
- **THEN** the SHALL return HTTP 403 Forbidden

#### Scenario: ADM allowed any admin endpoint
- **WHEN** an admin with role `ADM` calls any admin endpoint
- **THEN** the SHALL not reject the request based on role alone

### Requirement: Overlapping permissions between PED and EDI
Both `PED` and `EDI` roles SHALL be permitted to access the bulk price upload (`POST /admin/upload-csv`) and the bulk product-upload CSV endpoint (`POST /admin/upload-products-csv`). The roles are not mutually exclusive in capability.

#### Scenario: PED can upload price CSV
- **WHEN** an admin with role `PED` calls `POST /admin/upload-csv` with a valid CSV
- **THEN** the system SHALL process the upload successfully

#### Scenario: EDI can upload price CSV
- **WHEN** an admin with role `EDI` calls `POST /admin/upload-csv` with a valid CSV
- **THEN** the system SHALL process the upload successfully

### Requirement: Password comparison uses bcrypt, never plain text
The admin login endpoint SHALL compare the submitted password against the stored hash using `bcrypt.compare()`. Plain-text comparison SHALL be removed entirely.

#### Scenario: Wrong password rejected
- **WHEN** an admin submits a password that does not match the stored hash
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: Rol table seeded with fixed string values
The `Rol` table SHALL contain exactly three rows after migration: `'ADM'`, `'PED'`, `'EDI'`. The table SHALL enforce `RolID` as `VARCHAR(3)` with `PRIMARY KEY` — no `IDENTITY` or auto-increment.
