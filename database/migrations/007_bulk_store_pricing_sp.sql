-- Migration 007: Create stored procedure for bulk store price/stock upload
-- Purpose: Validate SKU ownership and MERGE pricing+stock into ProductoTienda

CREATE OR ALTER PROCEDURE sp_BulkUploadStorePrices
    @SessionID UNIQUEIDENTIFIER,
    @NegocioID INT,
    @TiendaID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Purge stale staging rows from previous uploads (> 1 hour)
    DELETE FROM TmpUploadProductoTienda
    WHERE CreatedAt < DATEADD(hour, -1, GETDATE());

    -- Collect per-row validation errors
    CREATE TABLE #Errors (
        RowIndex INT,
        SKU NVARCHAR(50),
        ErrorMessage NVARCHAR(255)
    );

    -- Validation: SKU must exist in ProductoMaestro and belong to NegocioID
    INSERT INTO #Errors (RowIndex, SKU, ErrorMessage)
    SELECT
        tmp.RowIndex,
        tmp.SKU,
        N'SKU "' + tmp.SKU + N'" not found in this negocio'
    FROM TmpUploadProductoTienda tmp
    LEFT JOIN ProductoMaestro pm ON pm.SKU = tmp.SKU AND pm.NegocioID = @NegocioID
    WHERE tmp.SessionID = @SessionID
      AND pm.ProductoID IS NULL;

    -- Capture MERGE actions
    DECLARE @Summary TABLE (Action NVARCHAR(10));

    -- MERGE valid rows into ProductoTienda
    MERGE ProductoTienda AS target
    USING (
        SELECT
            pm.ProductoID,
            tmp.TiendaID,
            tmp.PrecioRegular,
            tmp.PrecioPromocion,
            tmp.EsPromocion,
            tmp.Stock
        FROM TmpUploadProductoTienda tmp
        JOIN ProductoMaestro pm ON pm.SKU = tmp.SKU AND pm.NegocioID = @NegocioID
        WHERE tmp.SessionID = @SessionID
          AND tmp.RowIndex NOT IN (SELECT RowIndex FROM #Errors)
    ) AS source
    ON (target.ProductoID = source.ProductoID AND target.TiendaID = source.TiendaID)
    WHEN MATCHED THEN
        UPDATE SET
            PrecioRegular = source.PrecioRegular,
            PrecioPromocion = source.PrecioPromocion,
            EsPromocion = source.EsPromocion,
            Stock = source.Stock,
            UpdatedAt = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (ProductoID, TiendaID, PrecioRegular, PrecioPromocion, EsPromocion, Stock)
        VALUES (source.ProductoID, source.TiendaID, source.PrecioRegular, source.PrecioPromocion, source.EsPromocion, source.Stock)
    OUTPUT $action INTO @Summary;

    -- Return per-row errors
    SELECT RowIndex AS [row], SKU AS [sku], ErrorMessage AS [error]
    FROM #Errors
    ORDER BY RowIndex;

    -- Return insert/update counts
    SELECT
        SUM(CASE WHEN Action = 'INSERT' THEN 1 ELSE 0 END) AS InsertedCount,
        SUM(CASE WHEN Action = 'UPDATE' THEN 1 ELSE 0 END) AS UpdatedCount
    FROM @Summary;

    -- Purge this session's staging rows
    DELETE FROM TmpUploadProductoTienda WHERE SessionID = @SessionID;
END
GO
