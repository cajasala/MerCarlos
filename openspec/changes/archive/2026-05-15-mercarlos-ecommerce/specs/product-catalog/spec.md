## ADDED Requirements

### Requirement: Price Per Unit Transparency
Every product displayed in the catalog must show its "Price per Unit of Measure" alongside the total price, as per Colombian regulation.

#### Scenario: Displaying a product
- **WHEN** a product is rendered in the list or detail view.
- **THEN** the system calculates and displays the price per unit (e.g., "$100 per gram") based on the `StorePrice` and the `BaseUnitQuantity`.

### Requirement: Multi-level Categorization
The catalog must support a hierarchy of Categories and Subcategories to organize a large inventory.

#### Scenario: Filtering by subcategory
- **WHEN** a user selects a subcategory.
- **THEN** only products belonging to that subcategory and the currently selected store are displayed.

### Requirement: Simple Search
A text-based search bar must allow users to find products by name.

#### Scenario: Searching for a product
- **WHEN** a user enters a search term in the search bar.
- **THEN** the catalog filters the current view to show only products whose names match the search term.
