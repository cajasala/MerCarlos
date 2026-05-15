-- 1.5 ListaCompra, AdminRole, Administrador

CREATE TABLE ListaCompra (
    ListaID INT PRIMARY KEY IDENTITY(1,1),
    ClienteID INT NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ClienteID) REFERENCES Cliente(ClienteID)
);

CREATE TABLE DetalleListaCompra (
    DetalleID INT PRIMARY KEY IDENTITY(1,1),
    ListaID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (ListaID) REFERENCES ListaCompra(ListaID),
    FOREIGN KEY (ProductoID) REFERENCES ProductoMaestro(ProductoID)
);

CREATE TABLE Rol (
    RolID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL -- e.g., 'Administracion', 'Consulta Pedido', 'Carga de Precio'
);

CREATE TABLE Administrador (
    AdminID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    RolID INT NOT NULL,
    NegocioID INT NOT NULL,
    FOREIGN KEY (RolID) REFERENCES Rol(RolID),
    FOREIGN KEY (NegocioID) REFERENCES Negocio(NegocioID)
);
