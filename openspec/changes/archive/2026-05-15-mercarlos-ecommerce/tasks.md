## 1. Database & Schema

- [x] 1.1 Create SQL script for `Negocio`, `Ciudad`, and `Tienda` tables.
- [x] 1.2 Create SQL script for `ProductoMaestro`, `Categoria`, and `SubCategoria` tables.
- [x] 1.3 Create SQL script for `ProductoTienda` (pricing/stock) and `ProductoImagen` tables.
- [x] 1.4 Create SQL script for `Cliente`, `Orden`, `DetalleOrden`, and `StatusOrden` tables.
- [x] 1.5 Create SQL script for `ListaCompra` and `AdminRole` tables.

## 2. Backend Foundation (Azure Functions)

- [x] 2.1 Initialize Azure Functions project with Node.js.
- [x] 2.2 Configure SQL database connection pool and environment variables.
- [x] 2.3 Implement shared authentication middleware and JWT utility.
- [x] 2.4 Set up SMS service integration (Azure Communication Services or Twilio).

## 3. Core Catalog API

- [x] 3.1 Implement GET `/cities` and GET `/stores/:cityId` endpoints.
- [x] 3.2 Implement GET `/categories` and GET `/subcategories/:categoryId`.
- [x] 3.3 Implement GET `/products/:storeId` with category and text filters.
- [x] 3.4 Implement GET `/product/:productId` with image gallery data.

## 4. Frontend Foundation (React)

- [x] 4.1 Initialize React project with Vite and Vanilla CSS design system.
- [x] 4.2 Implement Responsive Navigation (Header/Footer/Bottom Nav).
- [x] 4.3 Build the Mandatory Store Selection Modal (City -> Sector).
- [x] 4.4 Implement state management for the selected Store and User.

## 5. User Shopping Experience

- [x] 5.1 Build the Home Page with "Promotions" section and Category grid.
- [x] 5.2 Build the Product List view with simple search and price-per-unit display.
- [x] 5.3 Build the Product Detail page with Image Gallery.
- [x] 5.4 Implement Shopping Cart logic (Add/Remove/Update Quantity).
- [x] 5.5 Integrate dynamic WhatsApp contact button based on selected store.

## 6. Authentication & Profile

- [x] 6.1 Implement SMS OTP request and verification endpoints.
- [x] 6.2 Build the Login/Registration flow in the frontend.
- [x] 6.3 Build the Profile page with default store update capability.

## 7. Shopping Lists & Order History

- [x] 7.1 Implement CRUD endpoints for Shopping Lists.
- [x] 7.2 Build the Shopping Lists page with "Add to Cart" functionality.
- [x] 7.3 Implement Order History endpoint and frontend view.
- [x] 7.4 Add "Re-order" (populate cart from history) and "Save as List" features.

## 8. Administration Module

- [x] 8.1 Implement Admin Login with secure credentials.
- [x] 8.2 Build the Order Monitoring dashboard for admins.
- [x] 8.3 Implement CSV parsing Function for bulk price updates.
- [x] 8.4 Build the Admin UI for CSV upload and Image Gallery management.

