# Bulk Store Pricing and Stock Upload

This specification defines the requirements for uploading store prices and stock levels in bulk.

## Coordination
| Cambio | Capa | Afecta |
|---|---|---|
| Ingesta masiva de precios y stock | DB | Creación de tabla temporal `TmpUploadProductoTienda` y procedimiento almacenado `sp_BulkUploadStorePrices` |
| Ingesta masiva en endpoint | BE | Refactorización de `POST /api/mng/upload-csv` en `admin.js` para usar `request.bulk()` y el stored procedure |
| Actualización de interfaz y columnas | FE | Actualización de `AdminPriceUpload.jsx` para requerir y guiar sobre la columna `Stock` en el archivo CSV |

## Interventions
- **Endpoints**: `POST /api/mng/upload-csv`
- **Tables**: `ProductoTienda`, `TmpUploadProductoTienda`

## ADDED Requirements

### Requirement: CSV Column Validation
The backend system SHALL validate that the uploaded CSV contains all required columns: `SKU`, `PrecioRegular`, `PrecioPromocion`, `EsPromocion`, and `Stock`. If any column is missing, the request MUST be rejected with a 400 Bad Request error.

#### Scenario: Missing CSV Columns
- **WHEN** the admin uploads a CSV file without the `Stock` column
- **THEN** the backend rejects the request with status code 400 and returns a descriptive error message indicating the missing columns.

### Requirement: Staging Ingestion and Database Validation
The backend system SHALL perform bulk insert of all parsed rows into the staging table `TmpUploadProductoTienda`. The database stored procedure `sp_BulkUploadStorePrices` SHALL validate that each SKU exists within `ProductoMaestro` under the target administrator's business (`NegocioID`). Any invalid SKU MUST generate a row-level error.

#### Scenario: Invalid SKUs in CSV Upload
- **WHEN** the admin uploads a CSV with a SKU that does not exist in `ProductoMaestro`
- **THEN** the system logs a validation error for that row, continues processing other rows, and returns the list of errors in the response.

### Requirement: Bulk Price and Stock Merge
The system SHALL upsert (insert or update) prices and stock levels for valid rows in the `ProductoTienda` table. If a record for the product and store already exists, it MUST be updated. If it does not exist, it MUST be inserted.

#### Scenario: Successful Upsert of Prices and Stock
- **WHEN** a valid CSV with both new and existing SKUs is uploaded
- **THEN** the database updates existing records and inserts new records in `ProductoTienda` and returns the counts of inserted and updated records.
