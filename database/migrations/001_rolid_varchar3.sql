-- ============================================================
-- Migration: RolID INT → VARCHAR(3)
-- Rols siembra: ADM | PED | EDI
-- ============================================================

-- --------------------------------------------------------------------------
-- 0. Content verification before anything
-- Execute from SSMS / Azure Data Studio with admin rights
-- --------------------------------------------------------------------------

-- Verify existing Rol data
SELECT * FROM Rol;

-- Verify existing Administrador data
SELECT a.AdminID, a.Username, a.RolID, r.Nombre AS RolNombre
FROM Administrador a
LEFT JOIN Rol r ON a.RolID = r.RolID;

-- --------------------------------------------------------------------------
-- 1. Create new column on Administrador (VARCHAR 3)
-- --------------------------------------------------------------------------
ALTER TABLE Administrador ADD RolID_New VARCHAR(3);

-- --------------------------------------------------------------------------
-- 2. Map existing INT roles to VARCHAR codes using Nombre in Rol table
-- Mapping:
--   'Administracion'      → 'ADM'
--   'Consulta Pedido'     → 'PED'
--   'Carga de Precio'     → 'EDI'
-- Unmapped rows → NULL (flagged for review)
-- --------------------------------------------------------------------------
UPDATE a
SET a.RolID_New = CASE r.Nombre
    WHEN 'Administracion'  THEN 'ADM'
    WHEN 'Consulta Pedido' THEN 'PED'
    WHEN 'Carga de Precio' THEN 'EDI'
    ELSE NULL
END
FROM Administrador a
JOIN Rol r ON a.RolID = r.RolID;

-- Verify mapping is complete (no NULLs)
SELECT * FROM Administrador WHERE RolID_New IS NULL;
-- If NULLs exist, fix them manually before proceeding

-- --------------------------------------------------------------------------
-- 3. Drop FK constraint to old RolID column
-- --------------------------------------------------------------------------
-- Note: Run only if FK exists. Azure SQL generates a constraint name;
-- find it with: SELECT name FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('Administrador')
-- Example: ALTER TABLE Administrador DROP CONSTRAINT FK__Administr__RolID__XXXXXXXX;

-- --------------------------------------------------------------------------
-- 4. Drop old RolID column and rename new column
-- --------------------------------------------------------------------------
ALTER TABLE Administrador DROP COLUMN RolID;
EXEC sp_rename 'Administrador.RolID_New', 'RolID', 'COLUMN';

-- --------------------------------------------------------------------------
-- 5. Rebuild Rol table with VARCHAR(3) PK
-- --------------------------------------------------------------------------
TRUNCATE TABLE Rol;
INSERT INTO Rol (RolID, Nombre) VALUES
    ('ADM', 'Administrador'),
    ('PED', 'Gestor de Pedidos'),
    ('EDI', 'Editor de Productos');

-- --------------------------------------------------------------------------
-- 6. Recreate FK: Administrador.RolID → Rol.RolID
-- --------------------------------------------------------------------------
ALTER TABLE Administrador
ADD CONSTRAINT FK_Administrador_Rol
    FOREIGN KEY (RolID) REFERENCES Rol(RolID);

-- --------------------------------------------------------------------------
-- 7. Add CHECK enrichment to Rol (defense-in-depth — bad inserts rejected)
-- --------------------------------------------------------------------------
-- NOTE: SQL Server CHECK after seed — verify before adding:
ALTER TABLE Rol ADD CONSTRAINT CK_RolID_Valid CHECK (RolID IN ('ADM','PED','EDI'));

-- --------------------------------------------------------------------------
-- VERIFICATION
-- --------------------------------------------------------------------------
SELECT '--- Rol ---';
SELECT * FROM Rol ORDER BY RolID;

SELECT '--- Administrador ---';
SELECT a.AdminID, a.Username, a.RolID, r.Nombre AS RolNombre, a.NegocioID
FROM Administrador a
JOIN Rol r ON a.RolID = r.RolID
ORDER BY a.AdminID;
