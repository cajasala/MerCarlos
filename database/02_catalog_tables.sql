-- 1.2 ProductoMaestro, Categoria, SubCategoria

CREATE TABLE Categoria (
    CategoriaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    NegocioID INT NOT NULL,
    -- LocalCategoriaID: source-system code from the business's ERP/legacy system (added by migration 003)
    -- Used for bulk product upload; unique per NegocioID (NULL allowed for existing rows)
    LocalCategoriaID VARCHAR(100) NULL,
    FOREIGN KEY (NegocioID) REFERENCES Negocio(NegocioID)
);

CREATE TABLE SubCategoria (
    SubCategoriaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(100) NOT NULL,
    CategoriaID INT NOT NULL,
    -- LocalSubCategoriaID: source-system code from the business's ERP/legacy system (added by migration 003)
    -- Used for bulk product upload; unique per CategoriaID (NULL allowed for existing rows)
    LocalSubCategoriaID VARCHAR(100) NULL,
    FOREIGN KEY (CategoriaID) REFERENCES Categoria(CategoriaID)
);

CREATE TABLE ProductoMaestro (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    SKU NVARCHAR(50) UNIQUE NOT NULL,
    Nombre NVARCHAR(255) NOT NULL,
    Descripcion NVARCHAR(MAX),
    SubCategoriaID INT NOT NULL,
    UnidadMedidaBase NVARCHAR(20) NOT NULL, -- e.g., 'gramos', 'unidades'
    CantidadUnidadBase DECIMAL(18,2) NOT NULL, -- e.g., 500 (if product is 500g)
    NegocioID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SubCategoriaID) REFERENCES SubCategoria(SubCategoriaID),
    FOREIGN KEY (NegocioID) REFERENCES Negocio(NegocioID)
);
