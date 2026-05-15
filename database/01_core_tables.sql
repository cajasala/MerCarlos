-- Schema for MerCarlos Multi-tenant Supermarket

-- 1.1 Negocio, Ciudad, Tienda

CREATE TABLE Negocio (
    NegocioID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    LogoURL NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Ciudad (
    CiudadID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    NegocioID INT NOT NULL,
    FOREIGN KEY (NegocioID) REFERENCES Negocio(NegocioID)
);

CREATE TABLE Tienda (
    TiendaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL, -- Name of the sector/store
    CiudadID INT NOT NULL,
    Direccion NVARCHAR(255),
    TelefonoWhatsApp NVARCHAR(20),
    NegocioID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CiudadID) REFERENCES Ciudad(CiudadID),
    FOREIGN KEY (NegocioID) REFERENCES Negocio(NegocioID)
);
