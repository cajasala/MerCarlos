# MerCarlos - E-Commerce Supermarket Platform

MerCarlos es una plataforma de comercio electrónico multi-tienda diseñada para supermercados, cumpliendo con las regulaciones colombianas de exhibición de precios por unidad de medida.

## Documentación Detallada

- [🏗️ Arquitectura del Sistema](docs/architecture.md)
- [🔌 Referencia de API](docs/api.md)
- [💻 Guía del Frontend](docs/frontend.md)
- [⚙️ Guía de Administración](docs/admin.md)
- [🚀 Configuración y Despliegue](docs/setup.md)

## Tecnologías

- **Frontend**: React (Vite) + Vanilla CSS + Lucide Icons.
- **Backend**: Node.js (Azure Functions).
- **Base de Datos**: Azure SQL / SQL Server.
- **Autenticación**: SMS OTP (Mock) + JWT.

## Características Principales

- **Multi-tienda**: Selección obligatoria de ciudad y sector para mostrar precios específicos.
- **Catálogo Inteligente**: Búsqueda, filtros por categoría y ordenamiento por precio o precio por unidad.
- **Precios Regulatorios**: Cálculo automático del precio por unidad de medida (gramos, mililitros, etc).
- **Canastilla**: Gestión de carrito con persistencia local.
- **Listas de Compra**: Permite guardar listas frecuentes.
- **Perfil de Usuario**: Registro por celular y validación de identidad.
- **Módulo Admin**: Carga masiva de precios mediante archivos CSV.

## Cómo Ejecutar

### Backend
1. `cd backend`
2. `npm install`
3. Configurar archivo `.env` (usa `.env.example` como base).
4. `npm start` (requiere Azure Functions Core Tools).

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Acceder a `http://localhost:5173`.
5. Para acceder al panel admin: `http://localhost:5173/?mode=admin`.

## Formato CSV para Admin
El archivo debe tener las siguientes columnas:
`SKU, PrecioRegular, PrecioPromocion, EsPromocion`
