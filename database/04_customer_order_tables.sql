-- 1.4 Cliente, StatusOrden, Orden, DetalleOrden

CREATE TABLE Cliente (
    ClienteID INT PRIMARY KEY IDENTITY(1,1),
    Telefono NVARCHAR(20) UNIQUE NOT NULL,
    Nombre NVARCHAR(50),
    Apellido NVARCHAR(50),
    Email NVARCHAR(100),
    CodigoFidelizacion NVARCHAR(50),
    DefaultTiendaID INT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DefaultTiendaID) REFERENCES Tienda(TiendaID)
);

CREATE TABLE StatusOrden (
    StatusID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL -- e.g., 'Pendiente', 'Enviado', 'Entregado', 'Cancelado'
);

CREATE TABLE Orden (
    OrdenID INT PRIMARY KEY IDENTITY(1,1),
    ClienteID INT NOT NULL,
    TiendaID INT NOT NULL,
    StatusID INT NOT NULL,
    Total DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClienteID) REFERENCES Cliente(ClienteID),
    FOREIGN KEY (TiendaID) REFERENCES Tienda(TiendaID),
    FOREIGN KEY (StatusID) REFERENCES StatusOrden(StatusID)
);

CREATE TABLE DetalleOrden (
    DetalleID INT PRIMARY KEY IDENTITY(1,1),
    OrdenID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad DECIMAL(18,2) NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (OrdenID) REFERENCES Orden(OrdenID),
    FOREIGN KEY (ProductoID) REFERENCES ProductoMaestro(ProductoID)
);
