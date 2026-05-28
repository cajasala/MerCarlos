## ADDED Requirements

### Requirement: Columnas LocalCategoriaID y LocalSubCategoriaID en tablas de catálogo
La tabla `Categoria` SHALL tener una columna `LocalCategoriaID VARCHAR(100) NULL`. La tabla `SubCategoria` SHALL tener una columna `LocalSubCategoriaID VARCHAR(100) NULL`. Ambas columnas permiten registrar el identificador de la fuente original del negocio.

La combinación `(LocalCategoriaID, NegocioID)` en `Categoria` MUST ser única (índice único filtrado excluyendo NULL). La combinación `(LocalSubCategoriaID, CategoriaID)` en `SubCategoria` MUST ser única (índice único filtrado excluyendo NULL).

#### Scenario: LocalCategoriaID duplicado en el mismo negocio es rechazado
- **WHEN** se intenta insertar una Categoría con un `LocalCategoriaID` ya existente para el mismo `NegocioID`
- **THEN** la base de datos rechaza la operación con error de violación de índice único

#### Scenario: Mismo LocalCategoriaID en negocios distintos es permitido
- **WHEN** dos negocios distintos tienen categorías con el mismo `LocalCategoriaID` (ej: "001")
- **THEN** ambas filas coexisten sin conflicto

#### Scenario: Categoría existente sin LocalCategoriaID no es afectada
- **WHEN** la migración 003 se ejecuta sobre una BD con categorías existentes
- **THEN** esas categorías quedan con `LocalCategoriaID = NULL` y siguen funcionando normalmente

---

### Requirement: Plantilla CSV de carga masiva usa códigos locales
El endpoint `POST /api/admin/upload-products-csv` SHALL aceptar una plantilla CSV con las siguientes columnas **obligatorias**: `SKU`, `Nombre`, `Descripcion`, `UnidadMedidaBase`, `CantidadUnidadBase`, `LocalCategoriaID`, `LocalSubCategoriaID`.

Las columnas `CategoriaID` y `SubCategoriaID` (IDs internos enteros) NO SHALL ser parte de la plantilla.

#### Scenario: CSV con columnas correctas es procesado
- **WHEN** se sube un CSV con todas las columnas requeridas incluyendo `LocalCategoriaID` y `LocalSubCategoriaID`
- **THEN** el endpoint procesa cada fila y retorna `{ upserted, errors, message }`

#### Scenario: CSV con columna CategoriaID antigua es rechazado
- **WHEN** se sube un CSV que tiene la columna `CategoriaID` pero no `LocalCategoriaID`
- **THEN** el endpoint retorna HTTP 400 con mensaje indicando las columnas faltantes

#### Scenario: CSV sin columna Descripcion es rechazado
- **WHEN** se sube un CSV sin la columna `Descripcion`
- **THEN** el endpoint retorna HTTP 400 indicando que `Descripcion` es requerida

---

### Requirement: Lookup de LocalCategoriaID resuelve al ID interno
Para cada fila del CSV, el backend SHALL buscar la categoría por `LocalCategoriaID` y `NegocioID` del admin autenticado. Si la encuentra, usa el `CategoriaID` interno para el upsert. Si no la encuentra, registra un error de fila y continúa con la siguiente.

#### Scenario: LocalCategoriaID válido resuelve correctamente
- **WHEN** una fila del CSV tiene `LocalCategoriaID = "CAT-001"` y existe en `Categoria` para el negocio del admin
- **THEN** el backend resuelve el `CategoriaID` interno y procede al upsert del producto

#### Scenario: LocalCategoriaID inexistente genera error de fila
- **WHEN** una fila tiene `LocalCategoriaID = "CAT-999"` y no existe en `Categoria` para ese negocio
- **THEN** esa fila se agrega a la lista de errores con mensaje descriptivo y el proceso continúa con las demás filas

---

### Requirement: Lookup de LocalSubCategoriaID validado contra la categoría resuelta
Para cada fila del CSV, el backend SHALL buscar la subcategoría por `LocalSubCategoriaID` y el `CategoriaID` que fue resuelto en el paso anterior. Si la encuentra, usa el `SubCategoriaID` interno. Si no la encuentra, registra error de fila.

#### Scenario: LocalSubCategoriaID válido bajo la categoría correcta resuelve
- **WHEN** una fila tiene `LocalSubCategoriaID = "SUB-01"` y existe en `SubCategoria` con el `CategoriaID` resuelto
- **THEN** el backend resuelve el `SubCategoriaID` interno y procede al upsert

#### Scenario: LocalSubCategoriaID de otra categoría no es aceptado
- **WHEN** una fila tiene un `LocalSubCategoriaID` que existe pero pertenece a una categoría distinta a la resuelta
- **THEN** esa fila genera error de fila indicando que la subcategoría no fue encontrada para esa categoría

#### Scenario: LocalSubCategoriaID inexistente genera error de fila
- **WHEN** una fila tiene `LocalSubCategoriaID = "SUB-999"` y no existe para esa categoría
- **THEN** esa fila se agrega a errores y el proceso continúa

---

## Coordination

| Cambio | Capa | Afecta |
|---|---|---|
| Nueva columna `LocalCategoriaID` en `Categoria` | DB | Backend (`adminBulk.js`) |
| Nueva columna `LocalSubCategoriaID` en `SubCategoria` | DB | Backend (`adminBulk.js`) |
| Índices únicos filtrados | DB | Integridad referencial |
| Lookup por código local en lugar de ID entero | BE | `adminBulk.js` |
| Columnas requeridas actualizadas | BE | `adminBulk.js` validación + `rbac.smoke.test.js` |
| Texto de ayuda actualizado | FE | `AdminProductUpload.jsx` |

**Endpoints involucrados:** `POST /api/admin/upload-products-csv`
**Tablas involucradas:** `Categoria`, `SubCategoria`, `ProductoMaestro`
**Componentes frontend:** `AdminProductUpload.jsx`
