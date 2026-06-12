## Why

Currently, importing a large volume of products via CSV bulk upload is extremely slow. This is because the backend Node.js function performs sequential database queries for each row: resolving the CategoriaID and SubCategoriaID, checking if the product already exists by SKU, and then performing an individual INSERT or UPDATE. This O(N) sequential database round-trip pattern is a significant performance bottleneck.

By using a staging table and a stored procedure, we can ingest the CSV data using high-speed TDS Bulk Copy (`request.bulk()`) and then execute a set-based `MERGE` and validation within SQL Server. This reduces the DB interaction to exactly 2 round-trips regardless of the file size, making the upload process highly efficient.

## What Changes

- **Database**: 
  - Create a staging table `TmpUploadProductMaestro` to hold the raw CSV records during upload.
  - Create a stored procedure `sp_BulkUploadProducts` that performs set-based category and subcategory validation, executes a `MERGE` statement to upsert valid products into `ProductoMaestro`, and returns validation errors and counts of inserted/updated rows.
- **Backend (API)**:
  - Modify `uploadProductsCSV` (`backend/src/functions/adminBulk.js`) to parse the CSV and load the records in-bulk using the `mssql` package's `request.bulk()` method.
  - Call `sp_BulkUploadProducts` to run validation and insertion, and return the aggregated results.
- **Coordination**:
  - The frontend sends the CSV. Node.js parses it into a structured schema, performs a TDS Bulk Copy to the database, runs the SP, and returns the response in the exact same format as before (`{ upserted, errors, message }`), ensuring zero disruption to the user experience.

### Non-Goals
- Changing the CSV template column requirements or format.
- Adding product pricing or image/media uploading to the CSV flow.
- Modifying the frontend UI components or changing the roles required (`ADM`, `PED`, `EDI`) to upload products.

## Capabilities

### New Capabilities
*None*

### Modified Capabilities
- `local-category-ids`: Optimizing the CSV upload validation and insertion backend flow to run in-bulk via a database staging table and stored procedure instead of row-by-row queries.

## Impact

- **Frontend Component**: `AdminProductUpload.jsx` (will consume the endpoint which returns identical output but completes much faster).
- **Backend Endpoint**: `POST /api/admin/upload-products-csv` (handler logic in `backend/src/functions/adminBulk.js`).
- **Database Tables**: 
  - `ProductoMaestro` (target of bulk upsert).
  - `TmpUploadProductMaestro` (new staging table).
- **Database Stored Procedures**:
  - `sp_BulkUploadProducts` (new SP for validation and merging).
