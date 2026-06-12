## Why

The current price upload process (`POST /api/mng/upload-csv`) iterates through CSV rows one-by-one in a Node.js loop, sending individual SQL update queries to Azure SQL. This causes significant performance bottlenecks for large stores. Additionally, store administrators need a way to upload product stock levels alongside prices, which is not supported by the current CSV upload template.

## What Changes

- **Database [DB]**:
  - Create a staging table `TmpUploadProductoTienda` to hold raw pricing and stock data.
  - Create a stored procedure `sp_BulkUploadStorePrices` to perform bulk validation (checking SKU ownership and store configuration) and execute a high-speed `MERGE` to update or insert records in `ProductoTienda`.
- **Backend [BE]**:
  - Refactor the `mngUploadCSV` function in `backend/src/functions/admin.js` to write the CSV data to the staging table in a single bulk operation (`request.bulk()`) and execute the stored procedure.
  - Validate the presence of the new `Stock` column in the CSV upload request.
- **Frontend [FE]**:
  - Update `AdminPriceUpload.jsx` to include the `Stock` column in the required columns hint and template description.

## Capabilities

### New Capabilities

- `bulk-store-pricing`: High-performance bulk ingestion of store pricing and stock levels using Azure SQL staging tables and MERGE.

### Modified Capabilities

*No existing spec-level capabilities are modified by this change.*

## Impact

- **API Endpoints**: `POST /api/mng/upload-csv` (contracts remain backward compatible but expect `Stock` column).
- **Database Tables**: `ProductoTienda` (modified) and `TmpUploadProductoTienda` (new staging table).
- **Frontend Components**: `AdminPriceUpload.jsx` (updated hint list).

## Non-goals

- Optimizing other admin upload endpoints (e.g., product image upload or bulk product master upload).
- Adding inventory tracking/history tables.
- Modifying store or product entity relations.
