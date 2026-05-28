## 1. Base de Datos — Migración [DB]

- [x] 1.1 [DB] Crear `database/migrations/003_local_category_ids.sql` con `ALTER TABLE Categoria ADD LocalCategoriaID VARCHAR(100) NULL`
- [x] 1.2 [DB] Agregar `ALTER TABLE SubCategoria ADD LocalSubCategoriaID VARCHAR(100) NULL` a la migración 003
- [x] 1.3 [DB] Agregar índice único filtrado `CREATE UNIQUE INDEX UQ_Categoria_LocalID_Negocio ON Categoria (LocalCategoriaID, NegocioID) WHERE LocalCategoriaID IS NOT NULL`
- [x] 1.4 [DB] Agregar índice único filtrado `CREATE UNIQUE INDEX UQ_SubCategoria_LocalID_Categoria ON SubCategoria (LocalSubCategoriaID, CategoriaID) WHERE LocalSubCategoriaID IS NOT NULL`
- [x] 1.5 [DB] Actualizar comentario en `database/02_catalog_tables.sql` para documentar las nuevas columnas

## 2. Backend — Lógica de Carga Masiva [BE+DB]

- [x] 2.1 [BE] En `adminBulk.js`, reemplazar `requiredColumns` para incluir `LocalCategoriaID`, `LocalSubCategoriaID` y `Descripcion`; eliminar `CategoriaID` y `SubCategoriaID`
- [x] 2.2 [BE+DB] Reemplazar el bloque de validación FK de `CategoriaID` por lookup: `SELECT CategoriaID FROM Categoria WHERE LocalCategoriaID = @localCatId AND NegocioID = @negocioId`
- [x] 2.3 [BE+DB] Reemplazar el bloque de validación FK de `SubCategoriaID` por lookup: `SELECT SubCategoriaID FROM SubCategoria WHERE LocalSubCategoriaID = @localSubId AND CategoriaID = @catIdResuelto`
- [x] 2.4 [BE] Hacer `Descripcion` obligatoria: eliminar el manejo condicional `row.Descripcion ? ... : null` y usar siempre `String(row.Descripcion).trim()`
- [x] 2.5 [BE] Actualizar mensajes de error en el array `errors` para referenciar `LocalCategoriaID` y `LocalSubCategoriaID` en lugar de los IDs internos
- [x] 2.6 [BE] Actualizar comentario de cabecera del archivo (`// CSV columns req:`) con las nuevas columnas

## 3. Backend — Tests [BE]

- [x] 3.1 [BE] En `backend/tests/rbac.smoke.test.js` (línea 223), actualizar el CSV de prueba del test 10.5 para usar cabecera con `LocalCategoriaID` en lugar de `CategoriaID`

## 4. Frontend — UI de Carga [FE]

- [x] 4.1 [FE] En `AdminProductUpload.jsx`, actualizar el bloque de columnas obligatorias para mostrar: `SKU, Nombre, Descripcion, UnidadMedidaBase, CantidadUnidadBase, LocalCategoriaID, LocalSubCategoriaID`
- [x] 4.2 [FE] Eliminar `SubCategoriaID` de las columnas opcionales (ahora es obligatoria como `LocalSubCategoriaID`); ajustar o eliminar la sección de columnas opcionales si queda vacía
