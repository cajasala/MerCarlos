## Context

Actualmente el endpoint `POST /api/admin/upload-products-csv` valida la existencia de categorías y subcategorías usando IDs enteros internos (`CategoriaID`, `SubCategoriaID`). Esto obliga al operador a conocer los IDs generados por la BD, que son distintos a los códigos manejados en la fuente de datos original del negocio (ERP, hojas de cálculo, sistemas legacy).

El cambio agrega columnas `LocalCategoriaID VARCHAR(100)` y `LocalSubCategoriaID VARCHAR(100)` a las tablas de catálogo, y modifica el flujo de carga masiva para resolver esos códigos locales al ID interno antes del upsert.

## Goals / Non-Goals

**Goals:**
- Permitir que la plantilla CSV use códigos locales de la fuente original del negocio.
- Mantener la integridad referencial interna (el INSERT sigue usando `CategoriaID`/`SubCategoriaID` internos).
- Garantizar unicidad de `LocalCategoriaID` por negocio y `LocalSubCategoriaID` por categoría.
- Hacer `Descripcion` y `LocalSubCategoriaID` obligatorias en la plantilla CSV.

**Non-Goals:**
- No se crea UI para gestionar `LocalCategoriaID`/`LocalSubCategoriaID`.
- No se migran datos de categorías existentes (quedan con `NULL`).
- No se modifican endpoints de lectura del catálogo ni la navegación frontend.

## Decisions

### D1 — Lookup por código local + resolución a ID interno (no almacenar código local en ProductoMaestro)

**Decisión:** El CSV trae `LocalCategoriaID` y `LocalSubCategoriaID`. El backend los resuelve a IDs enteros internos y usa esos IDs en el INSERT/UPDATE. `ProductoMaestro` no almacena los códigos locales.

**Alternativa descartada:** Almacenar el código local directamente en `ProductoMaestro`. Se descartó porque rompería la integridad referencial con FK integer y complicaría las queries del catálogo.

---

### D2 — Unicidad de LocalCategoriaID con filtro WHERE NOT NULL

**Decisión:** Índice único `(LocalCategoriaID, NegocioID) WHERE LocalCategoriaID IS NOT NULL` en `Categoria`. Para `SubCategoria`: índice único `(LocalSubCategoriaID, CategoriaID) WHERE LocalSubCategoriaID IS NOT NULL`.

**Razón:** Las categorías existentes quedan con `NULL` y no deben participar en el constraint. SQL Server soporta índices únicos filtrados.

---

### D3 — Lookup de SubCategoriaID validado contra la Categoría resuelta

**Decisión:** El lookup de `LocalSubCategoriaID` filtra además por el `CategoriaID` que se resolvió en el paso anterior (`WHERE LocalSubCategoriaID = @local AND CategoriaID = @catIdResuelto`).

**Razón:** Garantiza coherencia (una subcategoría de otra categoría no debe colarse) y aprovecha la unicidad por categoría definida en D2.

---

### D4 — Sin variables de entorno nuevas

Este cambio no introduce nuevos secrets ni variables de entorno. Opera con la misma conexión DB existente.

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Operador sube CSV con columnas:                                 │
│  SKU, Nombre, Descripcion, UnidadMedidaBase,                     │
│  CantidadUnidadBase, LocalCategoriaID, LocalSubCategoriaID       │
└────────────────────────┬─────────────────────────────────────────┘
                         │ POST /api/admin/upload-products-csv
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  adminBulk.js — por cada fila:                                   │
│                                                                  │
│  1. Validar columnas requeridas (incluyendo nuevas)              │
│                                                                  │
│  2. SELECT CategoriaID FROM Categoria                            │
│       WHERE LocalCategoriaID = @localCatId                       │
│         AND NegocioID = @negocioId                               │
│       → si no encontrado → error de fila, continuar             │
│       → si encontrado   → catIdResuelto                          │
│                                                                  │
│  3. SELECT SubCategoriaID FROM SubCategoria                      │
│       WHERE LocalSubCategoriaID = @localSubId                    │
│         AND CategoriaID = @catIdResuelto                         │
│       → si no encontrado → error de fila, continuar             │
│       → si encontrado   → subIdResuelto                          │
│                                                                  │
│  4. UPSERT en ProductoMaestro usando catIdResuelto, subIdResuelto│
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  DB: Categoria.CategoriaID / SubCategoria.SubCategoriaID         │
│  (IDs internos — sin cambios en ProductoMaestro)                 │
└──────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

**[DB] Categorías existentes sin LocalCategoriaID** → Si el operador sube un CSV y las categorías no tienen `LocalCategoriaID` configurado, todas las filas fallarán con "not found". Mitigación: documentar que antes de usar la nueva plantilla se deben poblar los `LocalCategoriaID` en las categorías existentes.

**[BE] Breaking change en plantilla** → Cualquier CSV existente con `CategoriaID` dejará de funcionar. Mitigación: el error de validación de columnas faltantes es explícito y describe las columnas esperadas.

**[DB] Índice filtrado (WHERE NOT NULL) en SQL Server** → Compatible con Azure SQL (SQL Server 2008+). No requiere cambio de versión.

**[FE] Ninguno** — El cambio es transparente para el frontend salvo el texto de ayuda actualizado.

## Migration Plan

1. Ejecutar migración `003_local_category_ids.sql` (ALTER TABLE + índices únicos filtrados).
2. Poblar `LocalCategoriaID` y `LocalSubCategoriaID` en las categorías existentes (operación manual por parte del negocio, fuera de scope de este cambio).
3. Desplegar backend con `adminBulk.js` actualizado.
4. Desplegar frontend con `AdminProductUpload.jsx` actualizado.

**Rollback:** Revertir backend y frontend a versión anterior; la columna `LocalCategoriaID`/`LocalSubCategoriaID` puede quedar en BD sin impacto (es nullable y no afecta otros flujos).

## Open Questions

- _(ninguna — todas las decisiones de diseño fueron confirmadas en exploración)_
