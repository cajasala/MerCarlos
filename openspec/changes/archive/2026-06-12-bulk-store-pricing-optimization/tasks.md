## 1. Database — Staging Table and Stored Procedure

- [x] 1.1 [DB] Verify whether `ProductoTienda` already has a `Stock` column; if not, add it via migration `006_add_stock_to_productotienda.sql`
- [x] 1.2 [DB] Create migration `006_bulk_store_pricing_staging.sql` — table `TmpUploadProductoTienda` with columns: `SessionID`, `SKU`, `PrecioRegular`, `PrecioPromocion`, `EsPromocion`, `Stock`, `NegocioID`, `TiendaID`, `CreatedAt`
- [x] 1.3 [DB] Create migration `007_bulk_store_pricing_sp.sql` — stored procedure `sp_BulkUploadStorePrices(@TiendaID, @NegocioID, @SessionID)` that: purges stale rows (>1 hr), validates SKU ownership against `ProductoMaestro` + `NegocioID`, MERGEs valid rows into `ProductoTienda`, returns result set of per-row errors and insert/update counts
- [x] 1.4 [DB] Test the SP manually against a dev database with valid and invalid SKUs

## 2. Backend — Refactor mngUploadCSV

- [x] 2.1 [BE] In `admin.js`, update the required-columns check to include `Stock` (alongside `SKU`, `PrecioRegular`, `PrecioPromocion`, `EsPromocion`); return 400 with descriptive message if missing
- [x] 2.2 [BE] Replace the per-row `UPDATE` loop with a `uuid`-based `SessionID` + `request.bulk()` insert into `TmpUploadProductoTienda`
- [x] 2.3 [BE] After bulk insert, call `EXEC sp_BulkUploadStorePrices` with `@TiendaID`, `@NegocioID` (from `auth.negocioId`), and `@SessionID`
- [x] 2.4 [BE] Parse the SP result set — collect error rows and counts; return `{ inserted, updated, errors }` in the response body
- [x] 2.5 [BE] Confirm `EsPromocion` CSV value (`0`/`1` vs `true`/`false`) and cast consistently before bulk insert

## 3. Frontend — Update AdminPriceUpload

- [x] 3.1 [FE] In `AdminPriceUpload.jsx`, add `Stock` to the required-columns hint text and CSV template description shown to the admin
- [x] 3.2 [FE] Display per-row errors returned by the endpoint (the `errors` array) in the upload result UI

## 4. Verification

- [x] 4.1 [BE+DB] Run Jest smoke tests (`npm test` in `backend/`) and confirm no regressions in `rbac.smoke.test.js`
- [x] 4.2 [FE+BE+DB] Upload a valid CSV with `Stock` column via the admin panel and confirm `inserted`/`updated` counts are correct
- [x] 4.3 [FE+BE+DB] Upload a CSV with an invalid SKU and confirm the error row is returned without aborting valid rows
- [x] 4.4 [BE] Upload a CSV missing the `Stock` column and confirm 400 response with descriptive message
