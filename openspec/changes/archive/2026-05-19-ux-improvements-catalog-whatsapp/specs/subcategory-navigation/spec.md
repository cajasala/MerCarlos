## ADDED Requirements

### Requirement: Navegación por Subcategorías
El sistema debe permitir a los usuarios filtrar productos por subcategorías dentro de una categoría seleccionada para mejorar la precisión de la búsqueda.

#### Scenario: Selección de subcategoría
- **WHEN** el usuario selecciona una categoría principal.
- **THEN** el sistema debe mostrar una lista de subcategorías asociadas.
- **AND** al seleccionar una subcategoría, se deben cargar únicamente los productos que pertenecen a esa subcategoría para la tienda actual.
