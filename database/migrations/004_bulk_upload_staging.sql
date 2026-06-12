-- Migration 004: Create staging table for bulk product upload
-- Purpose: Ingest CSV records quickly into database staging before validation and merge
-- TmpUploadProductMaestro table definition

CREATE TABLE TmpUploadProductMaestro (
    SessionID UNIQUEIDENTIFIER NOT NULL,
    RowIndex INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    Nombre NVARCHAR(255) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    UnidadMedidaBase NVARCHAR(20) NOT NULL,
    CantidadUnidadBase DECIMAL(18,2) NOT NULL,
    LocalCategoriaID VARCHAR(100) NOT NULL,
    LocalSubCategoriaID VARCHAR(100) NOT NULL,
    NegocioID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (SessionID, RowIndex)
);
GO
