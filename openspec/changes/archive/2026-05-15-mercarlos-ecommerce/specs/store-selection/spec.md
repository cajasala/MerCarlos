## ADDED Requirements

### Requirement: Mandatory Store Selection
The application must require users to select a city and a specific store (sector) before they can browse products or add items to the cart.

#### Scenario: First-time visitor
- **WHEN** a user accesses the application for the first time without a saved store preference.
- **THEN** a mandatory selection modal is displayed with a list of available cities and their corresponding stores.

#### Scenario: Persistent selection
- **WHEN** a user selects a store and refreshes the page or returns later.
- **THEN** the application remembers the selected store and displays products/prices for that specific location.

### Requirement: Geographic Filtering
Stores must be organized by city to facilitate easy selection for the user.

#### Scenario: Selecting a city
- **WHEN** a user selects a city in the onboarding modal.
- **THEN** only the stores (sectors) belonging to that city are shown.
