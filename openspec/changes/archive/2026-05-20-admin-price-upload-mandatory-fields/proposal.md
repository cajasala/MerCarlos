## Why

The current AdminPriceUpload feature allows optional fields (PrecioPromocion and EsPromocion) in the CSV upload, leading to inconsistent data and potential silent defaults when these fields are missing. Requiring all four fields (SKU, PrecioRegular, PrecioPromocion, EsPromocion) ensures data consistency and prevents unintended default values in the ProductoTienda table.

## What Changes

- Update AdminPriceUpload frontend component to validate that all four fields are present in the CSV
- Modify CSV hint to display only the four required fields (no optional fields)
- Add client-side validation for data types and required fields before submitting to backend
- Update success/error messaging to reflect the new validation
- **BREAKING**: CSV uploads missing PrecioPromocion or EsPromocion will now be rejected (previously defaulted to null/0)

## Capabilities

### New Capabilities
- `price-upload`: Defines the requirements and behavior for the bulk price upload feature, including mandatory fields, validation, and database update semantics.

### Modified Capabilities
- None (no existing specs found for this feature)

## Impact

- Frontend: `frontend/src/components/AdminPriceUpload.jsx` and `frontend/src/components/AdminPriceUpload.css`
- Backend: No changes required to `backend/src/functions/admin.js:mngUploadCSV` as it already processes all four fields (though it currently allows missing fields with defaults)
- API Contract: The `/mng/upload-csv` endpoint now expects all four fields to be present in the CSV (client-side enforcement)
- Users: Must provide CSV with exactly four columns: SKU, PrecioRegular, PrecioPromocion, EsPromocion