# Guía de Configuración y Despliegue - MerCarlos

Siga estas instrucciones para configurar el entorno de desarrollo local o desplegar la plataforma en producción.

## Prerrequisitos

- **Node.js**: Versión 18 o superior.
- **Azure Functions Core Tools**: Versión 4.x (para ejecutar el backend localmente).
- **SQL Server / Azure SQL**: Una instancia de base de datos activa.
- **Git**: Para control de versiones.

## Configuración de la Base de Datos

Los scripts de inicialización se encuentran en la carpeta `/database`. Ejecútelos en orden secuencial en su servidor SQL:

1. `01_core_tables.sql`: Ciudades y Tiendas.
2. `02_catalog_tables.sql`: Categorías y Productos Maestros.
3. `03_pricing_media_tables.sql`: Precios por Tienda e Imágenes.
4. `04_customer_order_tables.sql`: Clientes y Órdenes.
5. `05_lists_admin_tables.sql`: Listas de compra y Administradores.
6. `06_otp_table.sql`: Tabla para códigos temporales.

## Configuración del Backend

1. Navegue a la carpeta `/backend`.
2. Instale las dependencias: `npm install`.
3. Cree un archivo `.env` basado en `.env.example`:
   ```env
   DB_SERVER=tu-servidor.database.windows.net
   DB_DATABASE=MerCarlosDB
   DB_USER=tu-usuario
   DB_PASSWORD=tu-password
   JWT_SECRET=tu-clave-secreta-para-tokens
   SMS_API_KEY=tu-api-key-de-sms
   ```
4. Inicie el servicio: `npm start`. El backend estará disponible en `http://localhost:7071/api`.

## Configuración del Frontend

1. Navegue a la carpeta `/frontend`.
2. Instale las dependencias: `npm install`.
3. (Opcional) Configure `VITE_API_URL` en un archivo `.env` si el backend no usa el puerto por defecto.
4. Inicie el servidor de desarrollo: `npm run dev`.
5. Acceda a `http://localhost:5173`.

## Despliegue en Azure

### Backend (Azure Functions)
1. Cree un **Function App** en el portal de Azure (Node.js stack).
2. Configure las variables de entorno en **Settings > Configuration** dentro del Function App.
3. Despliegue usando VS Code (Azure Extension) o Azure CLI:
   `func azure functionapp publish <nombre-de-tu-app>`

### Frontend (Static Web Apps)
1. Use **Azure Static Web Apps** para un despliegue optimizado.
2. Conecte su repositorio de GitHub.
3. Configure los build settings:
   - App location: `/frontend`
   - Output location: `dist`

### Base de Datos (Azure SQL)
1. Cree un **Azure SQL Database**.
2. Asegúrese de habilitar "Allow Azure services and resources to access this server" en el firewall.
3. Use la cadena de conexión proporcionada en las variables de entorno del backend.
