## 1. Database Implementation

- [x] 1.1 [DB] Create migration script `004_bulk_upload_staging.sql` to define the staging table `TmpUploadProductMaestro`
- [x] 1.2 [DB] Create migration script `005_bulk_upload_sp.sql` to define the stored procedure `sp_BulkUploadProducts`
- [x] 1.3 [DB] Apply migration scripts to the database environment

## 2. Backend Implementation

- [x] 2.1 [BE] Refactor `backend/src/functions/adminBulk.js` to build `sql.Table` schema and insert CSV records in-bulk using `request.bulk()`
- [x] 2.2 [BE] Update the query transaction block to execute the `sp_BulkUploadProducts` stored procedure with the generated `SessionID`
- [x] 2.3 [BE] Format the stored procedure's outputs (error collection and count summary) to match the existing JSON response format

## 3. Verification

- [x] 3.1 [BE+DB] Execute smoke tests and upload a CSV file with valid and invalid categories to verify bulk update/insert counts and error reporting
