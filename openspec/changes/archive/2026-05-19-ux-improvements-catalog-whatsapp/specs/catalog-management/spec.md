## ADDED Requirements

### Requirement: Priorización de Promociones en Home
La página de inicio debe mostrar exclusivamente productos en promoción por defecto para captar la atención del usuario.

#### Scenario: Carga inicial de Home
- **WHEN** el usuario accede a la aplicación y selecciona una tienda.
- **THEN** el sistema debe cargar automáticamente solo los productos que tengan el indicador `EsPromocion` activo.
- **AND** el buscador y los filtros de categorías deben permitir acceder al catálogo completo cuando el usuario lo desee.
