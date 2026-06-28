## ADDED Requirements

### Requirement: Navegación sin autenticación
El sistema SHALL permitir a cualquier visitante ver el catálogo de productos y agregar ítems al carrito sin requerir cuenta ni número de celular.

#### Scenario: Primer acceso sin token
- **WHEN** un usuario accede al portal por primera vez (sin token en localStorage)
- **THEN** el sistema NO abre el AuthModal automáticamente
- **THEN** el sistema abre el StoreSelector con `mandatory={true}` si no hay tienda guardada

#### Scenario: Catálogo disponible tras seleccionar tienda
- **WHEN** el usuario selecciona una tienda en el StoreSelector
- **THEN** el sistema carga y muestra el catálogo de productos de esa tienda
- **THEN** el usuario puede navegar categorías y ver precios sin autenticarse

#### Scenario: Carrito accesible de forma anónima
- **WHEN** un usuario sin cuenta agrega un producto al carrito
- **THEN** el carrito se guarda en localStorage normalmente
- **THEN** el sistema NO solicita autenticación en ese momento

#### Scenario: Visita con token existente
- **WHEN** un usuario accede al portal con token válido en localStorage
- **THEN** el sistema restaura la sesión normalmente y muestra el catálogo

## Coordination

| Cambio | Capa | Afecta |
|--------|------|--------|
| Eliminar apertura automática de AuthModal | Frontend | `App.jsx` — `useEffect` de inicialización |
| StoreSelector se abre sin depender de auth | Frontend | `App.jsx`, `StoreSelector.jsx` |
| Catálogo carga sin token | Frontend | `App.jsx`, componentes de catálogo |

**Endpoints involucrados**: `GET /cities`, `GET /stores/{cityId}`, `GET /catalog/{storeId}` — todos públicos, sin cambios.

**Tablas involucradas**: ninguna (solo lectura de endpoints ya existentes).
