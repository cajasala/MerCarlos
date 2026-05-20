## ADDED Requirements

### Requirement: Order status updated via admin endpoint
The system SHALL expose `POST /admin/orders/{orderId}/status` which accepts a JSON body `{ "statusName": "<nuevo_estado>" }` and updates `Orden.StatusID` to match the target state. Only roles `ADM` and `PED` SHALL be authorized; `EDI` SHALL receive HTTP 403 Forbidden.

#### Scenario: PED transitions order from Recibido to Alistamiento
- **WHEN** a PED admin submits `{ "statusName": "Alistamiento" }` for an order currently in Recibido
- **THEN** the system SHALL validate the transition, update `StatusID`, and return HTTP 200 OK with the updated order

#### Scenario: ADM transitions order directly to Entregado
- **WHEN** an ADM admin submits `{ "statusName": "Entregado" }` for any order regardless of current status
- **THEN** the system SHALL update `StatusID` to Entregado without restricting intermediate states

#### Scenario: EDI is denied status update
- **WHEN** an admin with role `EDI` calls `POST /admin/orders/{orderId}/status`
- **THEN** the system SHALL return HTTP 403 Forbidden

#### Scenario: PED cannot update status with invalid transition
- **WHEN** a PED admin submits `Recibido` → `Entregado` (skipping Alistamiento and Despachado)
- **AND** the transition is not in the `TransicionEstado` table for `['ADM', 'PED']`
- **THEN** the system SHALL return HTTP 422 Unprocessable Entity with a descriptive error message

### Requirement: Cancelled status transition from any state
The `Cancelado` state SHALL be reachable from an order in any other current state by both ADM and PED. Transitioning to `Cancelado` SHALL not set an intermediate confirmation step.

#### Scenario: PED cancels an order in Alistamiento state
- **WHEN** a PED admin submits `{ "statusName": "Cancelado" }` for an order currently in Alistamiento
- **THEN** the system SHALL update `StatusID` to Cancelado immediately

#### Scenario: ADM cancels a delivered order
- **WHEN** an ADM admin submits `{ "statusName": "Cancelado" }` for an order in Entregado
- **THEN** the system SHALL update `StatusID` to Cancelado immediately (business validation of delivery reversal is out of scope for this spec)

### Requirement: Validated states enumerated in status table
The `StatusOrden` table SHALL seed with exactly: `Recibido`, `Alistamiento`, `Despachado`, `Entregado`, `Cancelado`. No other status names SHALL exist in the table.

#### Scenario: Unknown status name rejected
- **WHEN** any caller submits a `statusName` that does not match an existing `StatusOrden.Nombre`
- **THEN** the system SHALL return HTTP 404 Not Found (or 422 Unprocessable Entity)

### Requirement: Admin order list filtered by negocio scope
When an admin retrieves orders, the system SHALL filter results to only those orders whose store (`Tienda`) belongs to the admin's `NegocioID`. An admin SHALL never see orders from another negocio.

#### Scenario: PED sees only their business's orders
- **WHEN** an admin queries the order list and their `NegocioID` matches Tienda 1 and Tienda 2
- **THEN** the result SHALL include only orders placed at Tienda 1 and Tienda 2, not Tienda 3
