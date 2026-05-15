## Why

MerCarlos needs a modern, scalable online supermarket platform that complies with Colombian pricing regulations and provides a seamless shopping experience across multiple stores and businesses. The current manual or fragmented processes for pricing and order management are inefficient and do not support the variable pricing model required for different physical store locations.

## What Changes

We will build a full-stack e-commerce solution comprising:
- A responsive React frontend for customers and administrators.
- A Node.js backend using Azure Functions for scalable, secure API endpoints.
- An Azure SQL Database structured for multi-tenancy and store-specific pricing.
- Integrated SMS authentication for secure user registration and login.
- Advanced administrative tools for bulk price management (CSV) and product media handling.

## Capabilities

### New Capabilities
- `store-selection`: Mandatory onboarding flow for selecting city and store sector before shopping.
- `product-catalog`: Browse products by category/subcategory with support for promotions, simple search, and mandatory price-per-unit indicators.
- `product-detail`: Interactive product view featuring a high-quality image gallery.
- `shopping-cart`: Real-time cart management with loyalty program integration.
- `user-auth`: Secure SMS-based authentication for customers and robust credentials for admins.
- `shopping-lists`: Create, edit, and convert reusable shopping lists to the active cart.
- `order-management`: Comprehensive order history with capabilities to re-order or convert past orders to lists.
- `admin-dashboard`: Role-based access control (Admin, Order Viewer, Price Loader) and store/business management.
- `product-admin`: Manage product maestros, gallery images, promotion flags, and bulk price updates via CSV.
- `multi-tenancy`: Core architecture support for multiple distinct businesses and their respective stores.

### Modified Capabilities
- None

## Impact

- **Frontend**: New React application with mobile-first design.
- **Backend**: Suite of Azure Functions (Node.js) for all CRUD and business logic.
- **Data**: New Azure SQL Database schema including tables for businesses, stores, products, prices, orders, and users.
- **Infrastructure**: Azure Blob Storage for product images and Azure Communication Services (or Twilio) for SMS.
