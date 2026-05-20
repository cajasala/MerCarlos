## ADDED Requirements

### Requirement: Bulk product-upload CSV endpoint accessible to PED and EDI
The system SHALL expose `POST /admin/upload-products-csv` which accepts a multipart CSV file containing product master records. Roles `PED` and `EDI` SHALL be authorized to call this endpoint.

#### Scenario: Successful bulk upload of new products
- **WHEN** an admin with an authorized role uploads a CSV containing new products
- **THEN** the system SHALL upsert records into `ProductoMaestro` and navigate category/subcategory references for each row

#### Scenario: Partial success with some rows failing
- **WHEN** the CSV contains both valid and invalid rows
- **THEN** the system SHALL commit all valid rows and return a per-row error summary for invalid rows in the response

#### Scenario: EDI authorized to call bulk product upload
- **WHEN** an admin with role `EDI` calls `POST /admin/upload-products-csv`
- **THEN** the system SHALL accept the request

#### Scenario: Non-admin role denied
- **WHEN** an admin with a role not in `['ADM', 'PED', 'EDI']` calls the endpoint
- **OR** a customer user calls the endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden or 401 Unauthorized respectively

#### Scenario: Missing required CSV columns rejected
- **WHEN** the submitted CSV is missing required columns (`SKU`, `Nombre`, `UnidadMedidaBase`, `CantidadUnidadBase`, `CategoriaID`)
- **THEN** the system SHALL return HTTP 400 Bad Request listing the missing columns

### Requirement: CSV column schema for bulk product upload
The CSV SHALL support the following nullable and required columns:

Required columns: `SKU`, `Nombre`, `UnidadMedidaBase`, `CantidadUnidadBase`, `CategoriaID`
Optional columns: `Descripcion`, `SubCategoriaID`

#### Scenario: Minimal row creates product in most specific scope
- **WHEN** a CSV row supplies only the required columns
- **THEN** the system SHALL create or update the `ProductoMaestro` record without modifying optional fields

#### Scenario: Optional columns are preserved on update
- **WHEN** a CSV row has a `Descripcion` value
- **THEN** the system SHALL update the `Descripcion` field of the matching `ProductoMaestro`

### Requirement: Unique SKU deduplication in bulk upload
For rows referencing the same SKU: the system SHALL update the existing product's fields, not create a duplicate.

#### Scenario: Duplicate SKU in CSV shelves the last row
- **WHEN** two rows in a single CSV share the same SKU
- **THEN** the system SHALL apply the union of both rows' updates to one record (not create two records)
