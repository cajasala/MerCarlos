-- Table for OTP (One-Time Password) management
CREATE TABLE OTP (
    ID INT PRIMARY KEY IDENTITY(1,1),
    Telefono NVARCHAR(20) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
