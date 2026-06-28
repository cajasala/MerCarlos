# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MerCarlos** is a multi-tenant supermarket e-commerce platform (Colombian regulations require per-unit price display). Three independent layers that must be kept in sync: React frontend, Azure Functions backend, and Azure SQL / SQL Server database.

## Common commands

Backend (`backend/`):
- `npm start` — runs `func start` (Azure Functions Core Tools v4, port 7071, base path `/api`).
- `npm test` — Jest suite (`backend/tests/*.test.js`). Note: `checkout.integration.test.js` is an integration test that calls the live API at `http://localhost:7073/api`; it requires a running Functions host and a populated DB.
- Single test: `npx jest tests/rbac.smoke.test.js` (run from `backend/`).
- The integration test (`checkout.integration.test.js`) targets port **7073**, not 7071 — run a second Functions host on that port when needed.

Frontend (`frontend/`):
- `npm run dev` — Vite dev server on port 5173. Admin panel at `http://localhost:5173/?mode=admin` (dev credentials: `admin` / `admin123`).
- `npm run build` / `npm run preview` / `npm run lint` (ESLint flat config).
- Vite proxies `/mng/*` → `http://localhost:7071`. All other API calls use `VITE_API_URL` (default `http://localhost:7071/api`).
- **Production base path is `/MerCarlos/`** (GitHub Pages). Vite sets this in `vite.config.js`; local dev uses `/`. Don't hardcode absolute paths in the frontend.

Database: SQL files in `database/` are applied **in numeric order** (`01_…` → `07_…`). Incremental migrations live in `database/migrations/` (e.g. `001_rolid_varchar3.sql`). There is no migration runner — apply manually against the target SQL Server instance.

Required backend env (`backend/.env` or `local.settings.json` Values): `DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `SMS_API_KEY`.

## Architecture

### Backend — Azure Functions v4 (programming model)
Every endpoint registers itself via `app.http(...)` at module load. The function file's location is irrelevant to routing — the `route:` field is the source of truth. `host.json` + `AzureWebJobsFeatureFlags: EnableWorkerIndexing` make Functions discover handlers by scanning `src/functions/*.js`.

Feature grouping (one file per concern in `src/functions/`):
- `auth.js` — public OTP flow (`/auth/request-otp`, `/auth/verify-otp`) → issues client JWT.
- `catalog.js`, `locations.js` — public read endpoints. `getProductsByStore` computes `PrecioPorUnidadMedida` (PUM) in SQL using `UnidadMedidaBase` + `CantidadUnidadBase`.
- `orders.js`, `lists.js` — authenticated client endpoints (use `authenticate()` from `utils/auth.js`).
- `admin.js` (`/mng/login` + CSV price upload), `adminBulk.js` (product master CSV), `adminImages.js`, `adminOrders.js` — back-office endpoints.

**DB access**: `utils/db.js` exports a singleton `poolPromise` (`mssql` pool). All handlers `await poolPromise` and use parameterized `.input(...)` queries — never string-concat user input. No ORM. Transactions use `new sql.Transaction(pool)` with explicit `begin/commit/rollback` (see `orders.js`).

**Authentication is two-tier**:
- Customer JWT: `utils/auth.js` — payload `{ id, role: 'user' }`, signed with `JWT_SECRET`, 7-day expiry. Use `authenticate(request)` in handlers.
- Admin JWT: `utils/adminAuth.js` — same secret but payload carries `role` as a **3-letter string** (`ADM`, `PED`, `EDI`) and a `negocioId` for multi-tenant scoping. Use `requireAdmin(request, ['ADM','PED'])`. `admin.js` defines a local `adminGate(...)` helper that duplicates this — both must agree.

**Legacy token guard**: both admin gates explicitly reject tokens whose `role` is numeric (`typeof decoded.role === 'number'`) with `401 Session expired`. Don't remove this — it forces re-login after the role migration.

**Tenant scoping**: admin endpoints filter by `auth.negocioId` (the admin's business). Customer-facing reads filter by `TiendaID` (city + store) passed from the URL. Do not cross these — an admin should never see another `Negocio`'s data, and product/price queries must always pin to a `TiendaID`.

### Database conventions
Despite what `openspec/config.yaml` says about snake_case, the actual schema is **PascalCase tables and columns** (`Negocio`, `Ciudad`, `Tienda`, `ProductoMaestro`, `ProductoTienda`, `Cliente`, `Orden`, `DetalleOrden`, `StatusOrden`, `OTP`). Match that style for any new SQL.

Key relations: `ProductoMaestro` (catalog) + `ProductoTienda` (price/stock per store) is the pricing model. `Categoria` → `SubCategoria` → `ProductoMaestro.SubCategoriaID`. Order status transitions go through `StatusOrden` (seeded by `database/migrations/002_status_orden_seed_transicion.sql`).

**Bulk upload ETL pattern** (`adminBulk.js` + migrations `004`/`005`): CSV → parse with `csv-parser` → bulk-insert rows into staging table `TmpUploadProductMaestro` (keyed by `SessionID`) → call `sp_BulkUploadProducts` which validates `LocalCategoriaID`/`LocalSubCategoriaID` against the calling `NegocioID`, then MERGEs into `ProductoMaestro`. The SP returns per-row validation errors and insert/update counts. Stale staging rows (>1 hour) are auto-purged by the SP. This is the only endpoint that uses a staging table + stored procedure instead of inline SQL.

### Frontend — React 19 + Vite
- **No client-side router for views.** `App.jsx` is the single source of truth. View switching is `currentView` state (`home | profile | lists | orders | admin`). `react-router-dom` is in `package.json` but app navigation goes through state, not routes.
- Admin mode is selected by query string (`?mode=admin`) on initial load — `App.jsx` reads it once in `useEffect` and sets `currentView`.
- **LocalStorage is the persistence layer** for: `cart`, `user`, `token`, `adminToken`, `selectedStore`. The store selector is **mandatory on first visit** — if `selectedStore` is absent, `StoreSelector` opens with `mandatory={true}` and the catalog won't load.
- API base URL comes from `VITE_API_URL`; checkout posts directly to `${API_URL}/orders` with `Authorization: Bearer <token>`.
- Styling is vanilla CSS — one `.css` per component, co-located. No CSS-in-JS, no Tailwind.

### Cross-layer coordination
Per `openspec/config.yaml`, any change should consider all three layers. Practically:
- New endpoint → identify (a) which `src/functions/*.js` file it belongs in, (b) which tables it reads/writes, (c) which frontend component consumes it.
- New table/column → grep for affected endpoints in `backend/src/functions/` and components in `frontend/src/components/`.
- Schema changes go in a new `database/migrations/00X_descripcion.sql` file, applied manually.

## Things to double-check before editing

- **Don't introduce a second `mssql` pool.** Always import `poolPromise` from `utils/db.js`.
- **Admin RBAC**: there are two helpers (`requireAdmin` in `utils/adminAuth.js`, `adminGate` in `admin.js`). New admin endpoints should prefer `requireAdmin`. Both check role-as-string; the numeric-role rejection branch is intentional.
- **SQL is parameterized via `request.input(...)`** — never interpolate user input into the query string.
- **Cart total is recomputed server-side** on the backend in `createOrder` (`item.EsPromocion ? PrecioPromocion : PrecioRegular`). The `total` sent from the client is currently trusted but should match — keep both formulas aligned.
- **Order date column is `FechaOrden`** (recent fix `7566c50` corrected a wrong column name). Verify column names against `database/04_customer_order_tables.sql` before adding new order queries.
- The repo has `.kilo/`, `.kilocode/`, `.agent/`, `.agents/`, and `openspec/` directories — those are tool/workflow configs, not application code. Ignore unless explicitly working on them.
