-- ============================================================
-- Migration: StatusOrden seed + TransicionEstado table
-- ============================================================

-- --------------------------------------------------------------------------
-- 1. StatusOrden — exact five states
-- We handle existing que puede tener ya datos.
-- Si la tabla ya tiene los cinco estados, INSERT ignora los duplicados.
-- --------------------------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM StatusOrden WHERE Nombre = 'Recibido')
    INSERT INTO StatusOrden (Nombre) VALUES ('Recibido');

IF NOT EXISTS (SELECT 1 FROM StatusOrden WHERE Nombre = 'Alistamiento')
    INSERT INTO StatusOrden (Nombre) VALUES ('Alistamiento');

IF NOT EXISTS (SELECT 1 FROM StatusOrden WHERE Nombre = 'Despachado')
    INSERT INTO StatusOrden (Nombre) VALUES ('Despachado');

IF NOT EXISTS (SELECT 1 FROM StatusOrden WHERE Nombre = 'Entregado')
    INSERT INTO StatusOrden (Nombre) VALUES ('Entregado');

IF NOT EXISTS (SELECT 1 FROM StatusOrden WHERE Nombre = 'Cancelado')
    INSERT INTO StatusOrden (Nombre) VALUES ('Cancelado');

-- Eliminar estados legacy si existen
DELETE FROM StatusOrden WHERE Nombre IN ('Pendiente', 'Enviado', 'Anulado');

-- Verify
SELECT * FROM StatusOrden ORDER BY StatusID;

-- --------------------------------------------------------------------------
-- 2. TransicionEstado — allowed state transitions per role
-- Permite PED y ADM por defecto; cancelar desde cualquier estado
-- --------------------------------------------------------------------------

-- Ensure table exists
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TransicionEstado')
BEGIN
    CREATE TABLE TransicionEstado (
        EstadoOrigen    NVARCHAR(50)  NOT NULL,
        EstadoDestino   NVARCHAR(50)  NOT NULL,
        RolesPermitidos VARCHAR(MAX)  NOT NULL,
        PRIMARY KEY (EstadoOrigen, EstadoDestino)
    );
END

-- --------------------------------------------------------------------------
-- Rows: (Origen, Destino, RolesPermitidos)
-- Roles: ADM puede todo | PED solo progresión lineal + cancelar
-- --------------------------------------------------------------------------

-- Recibido → Alistamiento
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Recibido' AND EstadoDestino='Alistamiento')
INSERT INTO TransicionEstado VALUES ('Recibido',  'Alistamiento', '["ADM","PED"]');

-- Alistamiento → Despachado
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Alistamiento' AND EstadoDestino='Despachado')
INSERT INTO TransicionEstado VALUES ('Alistamiento','Despachado', '["ADM","PED"]');

-- Despachado → Entregado
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Despachado' AND EstadoDestino='Entregado')
INSERT INTO TransicionEstado VALUES ('Despachado', 'Entregado',   '["ADM","PED"]');

-- Cancelado reachable from any state (PED can cancel, ADM can cancel)
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Recibido'   AND EstadoDestino='Cancelado')
INSERT INTO TransicionEstado VALUES ('Recibido',   'Cancelado',    '["ADM","PED"]');

IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Alistamiento' AND EstadoDestino='Cancelado')
INSERT INTO TransicionEstado VALUES ('Alistamiento','Cancelado',  '["ADM","PED"]');

IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Despachado'  AND EstadoDestino='Cancelado')
INSERT INTO TransicionEstado VALUES ('Despachado',  'Cancelado',  '["ADM","PED"]');

IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Entregado'   AND EstadoDestino='Cancelado')
INSERT INTO TransicionEstado VALUES ('Entregado',   'Cancelado',   '["ADM","PED"]');

-- ADM can jump freely — explicit rows per PED constraint table
--    Recibido  → Despachado  (PED skips Alist)
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Recibido'  AND EstadoDestino='Despachado')
INSERT INTO TransicionEstado VALUES ('Recibido',   'Despachado',  '["ADM"]');

--    Recibido  → Entregado   (PED skips both)
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Recibido'   AND EstadoDestino='Entregado')
INSERT INTO TransicionEstado VALUES ('Recibido',   'Entregado',   '["ADM"]');

--    Alistamiento → Entregado  (PED skips Despachado)
IF NOT EXISTS (SELECT 1 FROM TransicionEstado WHERE EstadoOrigen='Alistamiento' AND EstadoDestino='Entregado')
INSERT INTO TransicionEstado VALUES ('Alistamiento', 'Entregado', '["ADM"]');

-- Verify
SELECT * FROM TransicionEstado ORDER BY EstadoOrigen, EstadoDestino;
