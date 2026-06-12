-- Migration 006: Create staging table for bulk store price/stock upload
-- Purpose: Ingest CSV pricing rows quickly before SP validation and MERGE into ProductoTienda

CREATE TABLE TmpUploadProductoTienda (
    SessionID UNIQUEIDENTIFIER NOT NULL,
    RowIndex INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    PrecioRegular DECIMAL(18,2) NOT NULL,
    PrecioPromocion DECIMAL(18,2) NULL,
    EsPromocion BIT NOT NULL DEFAULT 0,
    Stock DECIMAL(18,2) NOT NULL DEFAULT 0,
    NegocioID INT NOT NULL,
    TiendaID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (SessionID, RowIndex)
);
GO
