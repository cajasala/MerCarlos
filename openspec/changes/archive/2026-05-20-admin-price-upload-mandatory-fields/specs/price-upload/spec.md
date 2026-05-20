## ADDED Requirements

### Requirement: Mandatory fields for price upload CSV
The system SHALL require all four fields (SKU, PrecioRegular, PrecioPromocion, EsPromocion) to be present in the CSV for bulk price uploads.

#### Scenario: CSV with all four fields present
- **WHEN** the user uploads a CSV containing the columns SKU, PrecioRegular, PrecioPromocion, and EsPromocion
- **THEN** the system processes the file and updates the ProductoTienda records accordingly

#### Scenario: CSV missing any of the four fields
- **WHEN** the user uploads a CSV that is missing one or more of the required fields (SKU, PrecioRegular, PrecioPromocion, EsPromocion)
- **THEN** the system rejects the upload and returns an error indicating which fields are missing

### Requirement: Data type validation for price upload fields
The system SHALL validate that the data types of the fields in the CSV are correct before processing.

#### Scenario: Valid numeric values in price fields
- **WHEN** the PrecioRegular and PrecioPromocion fields contain valid numeric values
- **THEN** the system accepts the values for database update

#### Scenario: Invalid numeric values in price fields
- **WHEN** the PrecioRegular or PrecioPromocion fields contain non-numeric values
- **THEN** the system rejects the upload and returns an error indicating invalid price values

#### Scenario: Valid values for EsPromocion field
- **WHEN** the EsPromocion field contains either 0 or 1
- **THEN** the system accepts the value for the EsPromocion database column

#### Scenario: Invalid values for EsPromocion field
- **WHEN** the EsPromocion field contains a value other than 0 or 1
- **THEN** the system rejects the upload and returns an error indicating invalid EsPromocion value

### Requirement: Client-side validation before upload
The system SHALL perform client-side validation of the CSV file before submitting to the backend to provide immediate feedback.

#### Scenario: Client-side validation catches missing fields
- **WHEN** the user selects a CSV file that is missing required fields
- **THEN** the system displays an error message and prevents the upload from being submitted

#### Scenario: Client-side validation catches invalid data types
- **WHEN** the user selects a CSV file with invalid data types in the fields
- **THEN** the system displays an error message and prevents the upload from being submitted