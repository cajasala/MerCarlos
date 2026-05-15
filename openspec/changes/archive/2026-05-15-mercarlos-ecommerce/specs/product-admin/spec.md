## ADDED Requirements

### Requirement: Bulk Price Loading via CSV
Administrators must be able to update product prices for a specific store by uploading a CSV file.

#### Scenario: Uploading a valid CSV
- **WHEN** an admin uploads a CSV file containing `SKU` and `NewPrice`.
- **THEN** the system updates the `ProductStorePrice` table for the target store and returns a success summary.

### Requirement: Product Image Gallery
Products must support multiple images, with one designated as the cover image.

#### Scenario: Viewing product details
- **WHEN** a user opens the product detail page.
- **THEN** an interactive gallery displays all associated images stored in Azure Blob Storage.
