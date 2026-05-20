-- 1.7 Seed data for admin accounts and core reference data
-- Run after 001_rolid_varchar3.sql migration

-- Ensure Negocio exists (required for admin NegocioID FK)
IF NOT EXISTS (SELECT 1 FROM Negocio WHERE NegocioID = 1)
BEGIN
    INSERT INTO Negocio (NegocioID, Nombre) VALUES (1, 'Demo Supermarket');
END

-- Insert admin users with bcrypt-hashed passwords
-- adm1: password 'admin123'
-- ped1: password 'gestor123'
-- edi1: password 'editor123'

INSERT INTO Administrador (Username, PasswordHash, RolID, NegocioID) VALUES
    ('adm1', '$2b$10$FuC5rajLv7WFJnDKpPAMS.I/R/dUuOXKY9wm4IeuLAB93urS5O2SO', 'ADM', 1),
    ('ped1', '$2b$10$gKqtvpnSSZXbcxG8xfVKLuMgbtJDK78P35Wp0wcr0iwAHir0/sBym', 'PED', 1),
    ('edi1', '$2b$10$ARLFe82qcmgg3VWNmPQFsOTkZMjhfj4WMcXGe0QEJ.nQuJyrd35V6', 'EDI', 1);