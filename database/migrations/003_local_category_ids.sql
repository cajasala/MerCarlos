-- Migration 003: Add LocalCategoriaID and LocalSubCategoriaID to catalog tables
-- Purpose: Allow bulk product upload to use source-system codes instead of internal DB IDs
-- Columns are nullable so existing rows are unaffected

-- 1. Add LocalCategoriaID to Categoria
ALTER TABLE Categoria
    ADD LocalCategoriaID VARCHAR(100) NULL;
GO

-- 2. Add LocalSubCategoriaID to SubCategoria
ALTER TABLE SubCategoria
    ADD LocalSubCategoriaID VARCHAR(100) NULL;
GO

-- 3. Unique index: LocalCategoriaID is unique per Negocio (excluding NULLs)
CREATE UNIQUE INDEX UQ_Categoria_LocalID_Negocio
    ON Categoria (LocalCategoriaID, NegocioID)
    WHERE LocalCategoriaID IS NOT NULL;
GO

-- 4. Unique index: LocalSubCategoriaID is unique per Categoria (excluding NULLs)
CREATE UNIQUE INDEX UQ_SubCategoria_LocalID_Categoria
    ON SubCategoria (LocalSubCategoriaID, CategoriaID)
    WHERE LocalSubCategoriaID IS NOT NULL;
GO
