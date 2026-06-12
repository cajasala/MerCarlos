-- Migration 005: Create stored procedure for bulk product upload validation and merging
-- Purpose: Process staging table records in bulk, perform relational validation, and merge into ProductoMaestro

CREATE OR ALTER PROCEDURE sp_BulkUploadProducts
    @SessionID UNIQUEIDENTIFIER,
    @NegocioID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Limpieza de registros huérfanos de cargas anteriores (> 1 hora)
    DELETE FROM TmpUploadProductMaestro 
    WHERE CreatedAt < DATEADD(hour, -1, GETDATE());

    -- Tabla temporal para recolectar errores de validación
    CREATE TABLE #Errors (
        RowIndex INT,
        SKU NVARCHAR(50),
        ErrorMessage NVARCHAR(255)
    );

    -- Validación 1: LocalCategoriaID no existe para este negocio
    INSERT INTO #Errors (RowIndex, SKU, ErrorMessage)
    SELECT 
        tmp.RowIndex,
        tmp.SKU,
        N'LocalCategoriaID "' + tmp.LocalCategoriaID + N'" not found for this negocio'
    FROM TmpUploadProductMaestro tmp
    LEFT JOIN Categoria c ON c.LocalCategoriaID = tmp.LocalCategoriaID AND c.NegocioID = @NegocioID
    WHERE tmp.SessionID = @SessionID AND c.CategoriaID IS NULL;

    -- Validación 2: LocalSubCategoriaID no existe dentro de la categoría resuelta
    INSERT INTO #Errors (RowIndex, SKU, ErrorMessage)
    SELECT 
        tmp.RowIndex,
        tmp.SKU,
        N'LocalSubCategoriaID "' + tmp.LocalSubCategoriaID + N'" not found under LocalCategoriaID "' + tmp.LocalCategoriaID + '"'
    FROM TmpUploadProductMaestro tmp
    JOIN Categoria c ON c.LocalCategoriaID = tmp.LocalCategoriaID AND c.NegocioID = @NegocioID
    LEFT JOIN SubCategoria sc ON sc.LocalSubCategoriaID = tmp.LocalSubCategoriaID AND sc.CategoriaID = c.CategoriaID
    WHERE tmp.SessionID = @SessionID
      AND sc.SubCategoriaID IS NULL
      AND tmp.RowIndex NOT IN (SELECT RowIndex FROM #Errors);

    -- Capturar acciones del MERGE
    DECLARE @Summary TABLE (
        Action NVARCHAR(10)
    );

    -- MERGE solo para filas válidas
    MERGE ProductoMaestro AS target
    USING (
        SELECT 
            tmp.SKU,
            tmp.Nombre,
            tmp.Descripcion,
            sc.SubCategoriaID,
            tmp.UnidadMedidaBase,
            tmp.CantidadUnidadBase,
            tmp.NegocioID
        FROM TmpUploadProductMaestro tmp
        JOIN Categoria c ON c.LocalCategoriaID = tmp.LocalCategoriaID AND c.NegocioID = @NegocioID
        JOIN SubCategoria sc ON sc.LocalSubCategoriaID = tmp.LocalSubCategoriaID AND sc.CategoriaID = c.CategoriaID
        WHERE tmp.SessionID = @SessionID
          AND tmp.RowIndex NOT IN (SELECT RowIndex FROM #Errors)
    ) AS source
    ON (target.SKU = source.SKU)
    WHEN MATCHED THEN
        UPDATE SET 
            Nombre = source.Nombre,
            Descripcion = source.Descripcion,
            SubCategoriaID = source.SubCategoriaID
    WHEN NOT MATCHED THEN
        INSERT (SKU, Nombre, Descripcion, SubCategoriaID, UnidadMedidaBase, CantidadUnidadBase, NegocioID)
        VALUES (source.SKU, source.Nombre, source.Descripcion, source.SubCategoriaID, source.UnidadMedidaBase, source.CantidadUnidadBase, source.NegocioID)
    OUTPUT $action INTO @Summary;

    -- Retornar errores al backend
    SELECT RowIndex AS [row], ErrorMessage AS [error], SKU AS [sku]
    FROM #Errors
    ORDER BY RowIndex;

    -- Retornar conteo de operaciones
    SELECT 
        SUM(CASE WHEN Action = 'INSERT' THEN 1 ELSE 0 END) AS InsertedCount,
        SUM(CASE WHEN Action = 'UPDATE' THEN 1 ELSE 0 END) AS UpdatedCount
    FROM @Summary;

    -- Limpieza de la carga actual
    DELETE FROM TmpUploadProductMaestro WHERE SessionID = @SessionID;
END
GO
