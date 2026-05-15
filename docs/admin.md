# Guía de Administración - MerCarlos

El Módulo Administrativo permite a los gestores de la plataforma actualizar inventarios, precios y promociones de manera eficiente.

## Acceso al Panel

Para acceder al panel administrativo, debe añadir el parámetro `mode=admin` a la URL principal:
`http://localhost:5173/?mode=admin`

> [!NOTE]
> Se requieren credenciales de administrador para ingresar. Por defecto (en entorno de desarrollo), se utiliza `admin` / `admin123`.

## Carga Masiva de Precios

La funcionalidad principal es la actualización de productos mediante archivos CSV. Esto permite gestionar miles de artículos en segundos.

### Pasos para la carga:
1. Ingrese el **ID de la Tienda** que desea actualizar.
2. Seleccione el archivo CSV desde su computador.
3. Haga clic en **Iniciar Carga**.
4. Espere el mensaje de confirmación que indicará cuántos productos fueron actualizados.

### Especificación del Formato CSV

El archivo debe ser un CSV estándar con las siguientes columnas exactas:

| Columna | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `SKU` | Texto | Código único del producto | `PROD-001` |
| `PrecioRegular` | Decimal | Precio normal de venta | `2500.00` |
| `PrecioPromocion` | Decimal | Precio de oferta (opcional) | `1800.00` |
| `EsPromocion` | Binario | `1` si aplica oferta, `0` si no | `1` |

**Ejemplo de contenido de archivo:**
```csv
SKU,PrecioRegular,PrecioPromocion,EsPromocion
SKU123,5000,4500,1
SKU456,3200,,0
SKU789,12000,10000,1
```

## Gestión de Pedidos

El panel permite visualizar los pedidos realizados por los usuarios, incluyendo:
- ID del Pedido
- Cliente y Datos de contacto
- Total de la compra
- Estado actual (Recibido, En Preparación, Despachado, Entregado)

## Recomendaciones de Operación

- **Validación**: Asegúrese de que el SKU en el CSV coincida exactamente con el SKU registrado en la base de datos maestra.
- **Tiendas**: Verifique siempre el ID de la tienda antes de subir un archivo, ya que los precios pueden variar significativamente entre sectores geográficos.
- **Formato de Números**: Use punto `.` como separador decimal si es necesario, y evite separadores de miles en el archivo CSV.
