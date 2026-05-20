## 1. Database Migration — `RolID: INT → VARCHAR(3)`

- [x] 1.1 Backup `Administrador` and `Rol` tables before schema change
- [x] 1.2 Create migration SQL: rename `RolID` column on `Rol` to `VARCHAR(3) PRIMARY KEY` (no IDENTITY)
- [x] 1.3 Rebuild and rewrite `Administrador.RolID` INT→VARCHAR by joining to `Rol` on existing names, mapping to `'ADM'`, `'PED'`, `'EDI'`
- [x] 1.4 Seed `Rol` table with `'ADM'` / `'PED'` / `'EDI'`
- [x] 1.5 Add `TransicionEstado` table with migration approach table rows
- [x] 1.6 Update `StatusOrden` seed with exact names: `Recibido`, `Alistamiento`, `Despachado`, `Entregado`, `Cancelado`
- [x] 1.7 Add FK `Administrador.RolID → Rol.RolID`
- [x] 1.8 Add `CHECK (RolID IN ('ADM','PED','EDI'))` to `Rol` table
- [x] 1.9 Run migration against staging; validate no rows lost

## 2. Security Fix — Bcrypt password comparison

- [x] 2.1 Install `bcrypt` package in backend
- [x] 2.2 Replace plain-text `PasswordHash` query in `admin.js` login handler with `bcrypt.compare()`
- [x] 2.3 Add migration or seed script to hash existing plain-text passwords in `Administrador.PasswordHash` before casting to bcrypt hashes
- [x] 2.4 Add unit test to verify login rejects wrong password and accepts correct hash

## 3. Backend — RBAC Middleware / Guard

- [x] 3.1 Create `utils/adminAuth.js` middleware: extract JWT, verify, check role against allowed roles list per route
- [x] 3.2 Apply `rolesAllowed: ['ADM', 'PED']` guard to new order status endpoint
- [x] 3.3 Apply `rolesAllowed: ['ADM']` guard to admin role-creation endpoints (future)
- [x] 3.4 Ensure `generateToken` continues to store role correctly; no changes needed if just value type changed
- [x] 3.5 Update `mngLogin` endpoint to return role from `Rol.RolID` (now VARCHAR)

## 4. Backend — Order Status Endpoint

- [x] 4.1 Add `POST /admin/orders/{orderId}/status` handler
- [x] 4.2 Resolve `StatusID` from request body `statusName`; return 404 if state not found
- [x] 4.3 Fetch current status and check `TransicionEstado` row for `(current, target)` — if PED: require matching; if ADM: skip (skip)}
- [x] 4.4 Update `Orden.StatusID`, return 200 with updated order
- [x] 4.5 Add negocio scope filter: orders from administrator's negocio only

## 5. Backend — Bulk Product Master CSV Endpoint

- [x] 5.1 Add `POST /admin/upload-products-csv` handler (authorized: ADM, PED, EDI)
- [x] 5.2 Parse CSV required columns `SKU`, `Nombre`, `UnidadMedidaBase`, `CantidadUnidadBase`, `CategoriaID`; optional `Descripcion`, `SubCategoriaID`
- [x] 5.3 Upsert logic: find existing `ProductoMaestro` by SKU; update if found, create if new
- [x] 5.4 Handle Category and SubCategory FK lookups; return errors on missing FK references
- [x] 5.5 Wrap in transaction; return per-row error summary on partial failure
- [x] 5.6 Frontend: expose new nav item `"Carga Masiva de Maestro de Productos"` on `AdminDashboard.jsx`

## 6. Backend — Product Image Upload Endpoint

- [x] 6.1 Add `POST /admin/products/{productId}/images` handler (authorized: ADM, EDI only)
- [x] 6.2 Accept multipart image file; validate image mime type
- [x] 6.3 Store image bytes to blob; store returned blob URL in `ProductoImagen`
- [x] 6.4 Handle `EsPortada = true`: demote existing cover for same product first
- [x] 6.5 Add `DELETE /admin/products/{productId}/images/{imageId}` handler (authorized: ADM, EDI)
- [x] 6.6 Return 204 No Content on successful delete

## 7. Frontend — Admin Permissions UI

- [x] 7.1 Update `AdminDashboard.jsx` sidebar to conditionally render nav items by role (`role` in decoded JWT)
- [x] 7.2 Hidden from PED nav: Product Images, Product Bulk Upload
- [x] 7.3 Show to PED and ADM: Orders view
- [x] 7.4 Show to EDI and ADM: Product Images view
- [x] 7.5 Role-gate admin modal confirmation dialogs before deleting

## 8. Frontend — New Admin Views

- [x] 8.1 Create `AdminOrdersView.jsx`: table of negocio-scoped orders, status toggle dropdowns with valid transitions per `TransicionEstado`
- [x] 8.2 Wire up `StatusNombre` display; replace integer `StatusID` with friendly state names
- [x] 8.3 Handle cancellation: special styling for `Cancelado` state, confirm dialog
- [x] 8.4 Create `AdminProductImages.jsx`: list of product images, add button, delete button
- [x] 8.5 Wire up `<input type="file" accept="image/*" capture="environment">` for device camera on mobile
- [x] 8.6 Create `AdminProductUpload.jsx`: delimiter-choose CSV file input, required/optional CSV field reference, success/error response display

## 9. Frontend — Shared CSS

- [x] 9.1 Add styles for new `AdminOrdersView`, `AdminProductImages`, `AdminProductUpload`, `AdminDashboard` role nav in respective `.css` files
- [x] 9.2 Verify nav collapses gracefully on mobile

## 10. Integration Tests and Smoke Tests

- [x] 10.1 Test RBAC: three admin accounts (ADM/PED/EDI) can log in; each authorized request succeeds; unauthorized returns 403
- [x] 10.2 Test order status transitions: PED can advance one step at a time; PED cannot skip Despacheéd to Entregado; ADM can jump
- [x] 10.3 Test cancellation from each source state by ADM and PED
- [x] 10.4 Test negocio scope: PED in Negocio 1 only sees orders from Negocio 1
- [x] 10.5 Test bulk product upload: partial success returns per-row errors; full success commits all
- [x] 10.6 Test image upload: EDI succeeds; PED returns 403; `EsPortada` sets and demotes correctly
- [x] 10.7 Test frontend role nav: correct items visible for each role on login gated view
