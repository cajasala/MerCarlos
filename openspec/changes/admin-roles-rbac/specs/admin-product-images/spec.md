## ADDED Requirements

### Requirement: Image upload endpoint for product images
The system SHALL expose `POST /admin/products/{productId}/images` which accepts a multipart file upload. The endpoint SHALL verify the caller's role is `EDI` or `ADM` before processing. Only role `ADM` and `EDI` SHALL be authorized; `PED` SHALL receive HTTP 403 Forbidden.

#### Scenario: EDI uploads image for a product
- **WHEN** an admin with role `EDI` sends a multipart request containing an image file
- **THEN** the system SHALL store the image and create a `ProductoImagen` record referencing the returned URL

#### Scenario: PED is denied image upload
- **WHEN** an admin with role `PED` calls `POST /admin/products/{id}/images`
- **THEN** the system SHALL return HTTP 403 Forbidden

#### Scenario: Missing multipart file returns client error
- **WHEN** the request body contains no `image` file part
- **THEN** the system SHALL return HTTP 400 Bad Request

### Requirement: Mobile camera capture supported via HTML `capture` attribute
The image upload UI SHALL use `<input type="file" accept="image/*" capture>` so that mobile browsers offer the device camera as a direct capture source. The backend SHALL accept uploads from this input identically to file picker uploads.

#### Scenario: Mobile browser opens camera directly
- **WHEN** a user opens the image upload page on a mobile browser
- **THEN** the input field SHALL trigger the device's native camera interface without showing a file picker first

### Requirement: Product image cover flag supports single cover per product
A product SHALL have at most one image marked as cover (`EsPortada = 1`). When a new image is uploaded with `EsPortada = true`, the system SHALL set `EsPortada = false` on any previously existing cover image for the same product before inserting the new row.

#### Scenario: New cover automatically demotes old cover
- **WHEN** an image is uploaded with `EsPortada = true` for a product that already has one cover image
- **THEN** the system SHALL set `EsPortada = false` on the existing cover before creating the new one with `EsPortada = true`

### Requirement: Image removal authorized with same role gate
The system SHALL expose `DELETE /admin/products/{productId}/images/{imageId}` accessible only to roles `EDI` and `ADM`.

#### Scenario: EDI removes an image
- **WHEN** an admin with role `EDI` calls `DELETE` for an image belonging to the target product
- **THEN** the system SHALL remove the image and return HTTP 204 No Content
