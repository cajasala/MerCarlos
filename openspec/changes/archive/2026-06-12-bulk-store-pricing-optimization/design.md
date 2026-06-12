## Context

The current `POST /api/mng/upload-csv` endpoint in `admin.js` processes price CSV rows one-by-one in a Node.js loop, issuing individual SQL `UPDATE` queries for each row. This is slow for large stores and does not support stock updates. The existing `adminBulk.js` already established a staging-table + stored-procedure pattern for product master uploads (`TmpUploadProductMaestro` + `sp_BulkUploadProducts`), which this change mirrors for store-level pricing and stock.

Current flow:
```
Client → POST /api/mng/upload-csv
           ↓
         parse CSV (csv-parser)
           ↓
         for each row → UPDATE ProductoTienda  ← N round-trips to Azure SQL
           ↓
         return { updated }
```

Target flow:
```
Client → POST /api/mng/upload-csv
           ↓
         parse CSV (csv-parser) + validate columns
           ↓
         request.bulk() → TmpUploadProductoTienda  ← 1 round-trip
           ↓
         EXEC sp_BulkUploadStorePrices(@TiendaID, @NegocioID, @SessionID)
           ↓
         SP: validate SKUs → MERGE into ProductoTienda → purge staging rows
           ↓
         return { inserted, updated, errors[] }
```

## Goals / Non-Goals

**Goals:**
- Reduce SQL round-trips from N (one per row) to 2 (bulk insert + SP call).
- Add `Stock` column support to the CSV upload contract.
- Reuse the established ETL pattern from `adminBulk.js` for consistency.
- Return per-row validation errors for invalid SKUs without aborting the whole batch.

**Non-Goals:**
- Modifying other admin upload endpoints (images, product master).
- Inventory history or stock movement tracking.
- Changing the `ProductoTienda` schema beyond adding/updating the `Stock` column.
- Client-side bulk validation before upload.

## Decisions

### 1. Staging table + SP instead of TVP or batch INSERT

**Decision**: Use a physical staging table `TmpUploadProductoTienda` (keyed by `SessionID`) + stored procedure, matching `adminBulk.js`.

**Alternatives considered**:
- *Table-valued parameters (TVP)*: cleaner but requires a user-defined type in SQL Server and more complex `mssql` driver setup.
- *Chunked batch INSERTs*: simpler but still multiple round-trips and no server-side validation isolation.

**Rationale**: Consistency with existing ETL pattern; `request.bulk()` is already proven in this codebase; the SP boundary isolates validation logic from Node.js and enables atomic MERGE.

### 2. SessionID scoping for staging rows

**Decision**: Generate a `uuid` per upload request as `SessionID`, pass it into the bulk insert and SP call. The SP purges rows matching that `SessionID` on completion and also purges stale rows older than 1 hour.

**Rationale**: Prevents concurrent uploads from different admins from colliding on the staging table. Matches `adminBulk.js` behavior.

### 3. Backward-compatible CSV contract

**Decision**: Add `Stock` as a required column; reject with 400 if absent.

**Rationale**: Making it optional would require a nullable `Stock` path through the SP. Requiring it keeps the SP simple and ensures admins update the template. The frontend hint is updated accordingly so admins know what to include.

### 4. SP returns error rows, not a hard failure

**Decision**: The SP accumulates per-row errors (invalid SKU, not belonging to `NegocioID`) and returns them as a result set. Node.js collects them and includes them in the 200 response.

**Rationale**: A single bad SKU should not abort the whole batch. Admins can fix and re-upload affected rows. Matches `sp_BulkUploadProducts` precedent.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Staging table grows if SP crashes before purge | SP purges stale rows (>1 hr) at the start of every call; a nightly cleanup job could be added later |
| `request.bulk()` batches have a row limit (~1000 default in mssql) | Use `options: { keepNulls: true }` and verify driver limit; add chunking if store CSVs exceed 1000 rows |
| Frontend sends old CSV without `Stock` column after deploy | 400 + descriptive error message guides admin to download updated template |
| SP `MERGE` race condition if two uploads share same `TiendaID` concurrently | `SessionID` scoping of staging rows isolates each upload; MERGE operates on `ProductoTienda` rows uniquely keyed by `(ProductoID, TiendaID)` — last-writer-wins is acceptable |
| DB layer failure leaves orphaned staging rows | `SessionID`-based TTL purge handles cleanup without manual intervention |

## Migration Plan

1. Apply `database/migrations/006_bulk_store_pricing_staging.sql` — creates `TmpUploadProductoTienda`.
2. Apply `database/migrations/007_bulk_store_pricing_sp.sql` — creates `sp_BulkUploadStorePrices`.
3. Deploy updated `backend/src/functions/admin.js` (refactored `mngUploadCSV`).
4. Deploy updated `frontend/src/components/AdminPriceUpload.jsx` (column hint).

**Rollback**: Re-deploy previous `admin.js`. The staging table and SP are additive and do not affect any other endpoint. Drop them if needed with `DROP TABLE TmpUploadProductoTienda; DROP PROCEDURE sp_BulkUploadStorePrices;`.

## Open Questions

- Does the current `ProductoTienda` table already have a `Stock` column, or does it need to be added via migration? (Check `database/04_customer_order_tables.sql` before writing the SP.)
- Should `EsPromocion` in the CSV be `0`/`1` or `true`/`false`? The SP must cast accordingly — confirm current parsing behavior in `admin.js`.
