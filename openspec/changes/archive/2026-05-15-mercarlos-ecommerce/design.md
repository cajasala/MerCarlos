## Context

MerCarlos is transitioning to a digital-first supermarket model. The platform must handle the complexity of multiple businesses, each with several physical stores that have unique pricing. The solution must be mobile-friendly, secure, and compliant with local regulations regarding price-per-unit transparency.

## Goals / Non-Goals

**Goals:**
- Implement a multi-tenant architecture to support multiple supermarket brands.
- Enable store-specific pricing via a centralized administrative dashboard.
- Provide a low-friction onboarding experience using SMS-based authentication.
- Automate bulk price updates using CSV file processing.
- Ensure the UI is highly responsive and optimized for mobile devices.

**Non-Goals:**
- Real-time inventory synchronization with physical POS systems (out of scope for initial phase).
- Integration with third-party delivery services (logistics handled internally or manually initially).
- native mobile apps (iOS/Android) - focus is on PWA/Web-responsive.

## Decisions

- **Database (Azure SQL)**: Chosen for its robust support for relational data and multi-tenancy partitioning using `BusinessID` and `StoreID` columns.
- **Backend (Azure Functions - Node.js)**: Utilizes a serverless architecture for cost-efficiency and horizontal scaling. Functions will be organized by domain (auth, catalog, admin).
- **Frontend (React)**: Provides the dynamic UI needed for the shopping cart and administrative dashboards.
- **Pricing Model**: A `ProductMaestro` table stores global attributes (name, base unit), while a `ProductStorePrice` table stores the `StorePrice` and `PromotionPrice`.
- **Authentication**: Using phone numbers as primary identifiers with OTP (One-Time Password) via SMS to minimize registration drop-offs.
- **CSV Processing**: Backend functions will use `csv-parser` or similar to process bulk updates asynchronously to avoid timeout issues with large files.
- **Storage**: Azure Blob Storage will host all product images, categorized by `BusinessID` and `ProductID`.

## Risks / Trade-offs

- **Risk**: SMS delivery failures can block user registration. 
  - **Mitigation**: Implement retry logic and potentially a fallback authentication method (email).
- **Risk**: Large CSV uploads could exceed Azure Function memory or timeout limits.
  - **Mitigation**: Use stream-based parsing and batch database inserts.
- **Trade-off**: Using a shared SQL database for multi-tenancy simplifies management but requires strict row-level filtering or query-level `BusinessID` enforcement to ensure data isolation.
