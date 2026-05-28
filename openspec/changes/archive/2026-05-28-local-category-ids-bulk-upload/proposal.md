## Why

El sistema de carga masiva de productos exige que el operador conozca los IDs internos (`CategoriaID`, `SubCategoriaID`) generados por la base de datos, lo que crea fricción cuando la fuente de datos original (ERP, hoja de cálculo, sistema legacy) usa sus propios códigos. Al agregar `LocalCategoriaID` y `LocalSubCategoriaID` a las tablas de catálogo, el operador puede usar los códigos de su fuente original sin necesidad de hacer mapeo manual.

## What Changes

- **BREAKING** — La columna `CategoriaID` desaparece de la plantilla CSV de carga masiva; es reemplazada por `LocalCategoriaID` (texto).
- **BREAKING** — La columna `SubCategoriaID` desaparece de la plantilla CSV; es reemplazada por `LocalSubCategoriaID` (texto), y pasa de opcional a **obligatoria**.
- **BREAKING** — La columna `Descripcion` pasa de opcional a **obligatoria** en la plantilla CSV.
- Se agrega columna `LocalCategoriaID VARCHAR(100)` a la tabla `Categoria` (nullable, unique por negocio).
- Se agrega columna `LocalSubCategoriaID VARCHAR(100)` a la tabla `SubCategoria` (nullable, unique por categoría).
- La lógica de validación FK en `adminBulk.js` cambia de lookup por ID entero a lookup por código local de texto, resolviendo al ID interno antes del upsert.
- La UI de `AdminProductUpload.jsx` actualiza los hints de columnas requeridas/opcionales.

## Capabilities

### New Capabilities
- `local-category-ids`: Soporte de identificadores locales en tablas de catálogo (`Categoria` y `SubCategoria`) para permitir carga masiva con códigos de la fuente original sin mapeo manual de IDs internos.

### Modified Capabilities
- (ninguna — el cambio introduce una nueva capacidad, no modifica specs existentes)

## Impact

**Database:**
- Tabla `Categoria`: nueva columna `LocalCategoriaID VARCHAR(100) NULL`, índice único `(LocalCategoriaID, NegocioID)`.
- Tabla `SubCategoria`: nueva columna `LocalSubCategoriaID VARCHAR(100) NULL`, índice único `(LocalSubCategoriaID, CategoriaID)`.
- Nueva migración: `database/migrations/003_local_category_ids.sql`.

**Backend:**
- `backend/src/functions/adminBulk.js`: reemplaza validación FK por lookup de texto con resolución a ID interno. Nuevas columnas requeridas: `LocalCategoriaID`, `LocalSubCategoriaID`, `Descripcion`.
- `backend/tests/rbac.smoke.test.js`: actualizar CSV de prueba en test 10.5.

**Frontend:**
- `frontend/src/components/AdminProductUpload.jsx`: actualizar sección de hints con las nuevas columnas obligatorias y eliminar referencias a `CategoriaID`/`SubCategoriaID`.

**Non-goals:**
- No se modifican los endpoints de catálogo (`catalog.js`) ni la navegación por categorías en el frontend (`CategoryBar.jsx`).
- No se crea UI para administrar `LocalCategoriaID`/`LocalSubCategoriaID` directamente (se gestionan cargando categorías vía scripts o migración manual).
- No se migran datos existentes: las categorías ya existentes quedan con `LocalCategoriaID = NULL`.
