-- 1.3 ProductoTienda, ProductoImagen

CREATE TABLE ProductoTienda (
    ProductoTiendaID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    TiendaID INT NOT NULL,
    PrecioRegular DECIMAL(18,2) NOT NULL,
    PrecioPromocion DECIMAL(18,2),
    EsPromocion BIT DEFAULT 0,
    Stock DECIMAL(18,2) DEFAULT 0,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductoID) REFERENCES ProductoMaestro(ProductoID),
    FOREIGN KEY (TiendaID) REFERENCES Tienda(TiendaID),
    UNIQUE (ProductoID, TiendaID)
);

CREATE TABLE ProductoImagen (
    ImagenID INT PRIMARY KEY IDENTITY(1,1),
    ProductoID INT NOT NULL,
    ImagenURL NVARCHAR(MAX) NOT NULL,
    EsPortada BIT DEFAULT 0,
    Orden INT DEFAULT 0,
    FOREIGN KEY (ProductoID) REFERENCES ProductoMaestro(ProductoID)
);
