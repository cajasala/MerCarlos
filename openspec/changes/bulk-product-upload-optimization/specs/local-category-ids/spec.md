## ADDED Requirements

### Requirement: Tabla de staging y carga masiva optimizada
Para optimizar el rendimiento de la carga de lotes grandes de productos, el sistema SHALL utilizar una tabla de staging intermedia (`TmpUploadProductMaestro`) para insertar todos los registros de forma masiva (Bulk Copy) en una única transacción de red. Luego, el sistema SHALL invocar un procedimiento almacenado (`sp_BulkUploadProducts`) para realizar la validación de integridad referencial de categorías/subcategorías y el merge final en la tabla `ProductoMaestro` de forma masiva en base de datos.

#### Scenario: Carga masiva exitosa con un solo viaje de red y MERGE en bloque
- **WHEN** se inicia la carga masiva de un archivo CSV con 1000 productos
- **THEN** el backend inserta los 1000 registros mediante una operación Bulk Copy a la tabla de staging y ejecuta el procedimiento almacenado para procesarlos, reduciendo los round-trips a la base de datos a solo 2 llamados de red

#### Scenario: Limpieza de registros huérfanos anteriores
- **WHEN** se inicia una nueva carga masiva
- **THEN** el procedimiento almacenado elimina automáticamente registros de cargas previas de la tabla de staging que tengan más de una hora de antigüedad para evitar la acumulación de basura

## Coordination

| Cambio | Capa | Afecta |
|---|---|---|
| Nueva tabla de staging `TmpUploadProductMaestro` | DB | Proceso de importación |
| Nuevo procedimiento almacenado `sp_BulkUploadProducts` | DB | `backend/src/functions/adminBulk.js` |
| Ingesta masiva usando `request.bulk()` y ejecución del SP | BE | `backend/src/functions/adminBulk.js` |

**Endpoints involucrados:** `POST /api/admin/upload-products-csv`
**Tablas involucradas:** `ProductoMaestro`, `TmpUploadProductMaestro`, `Categoria`, `SubCategoria`
