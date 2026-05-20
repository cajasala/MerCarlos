## Why

El sistema de administración de MerCarlos creció con un rol único de administrador (`Administrador`) y sin autorización Granular (RBAC) en ningún layer — ni backend ni frontend. Se necesita:

1. **Tres roles diferenciados** con permisos específicos en el área admin
2. **Ajuste de tipo de dato** de `Rol.RolID` de `INT` a `VARCHAR(3)` para que los valores sean `'ADM'`, `'PED'`, `'EDI'` directamente legibles
3. **Control de acceso** que impida que un admin de rol PED (por ejemplo) ejecute operaciones de carga de productos
4. **Nuevas capacidades**:Carga Masiva de Maestro de Productos, gestión de imágenes de productos con captura desde cámara del dispositivo, seguimiento de estados de pedidos con cancelación
5. Endpoint de actualización de estado de órdenes que actualmente no existe
6. Corregir una deficiencia de seguridad: la contraseña de admin se compara como texto plano en el backend

---

## What Changes

### Roles definidos

```sql
-- Antes (INT identity)
CREATE TABLE Rol (
    RolID INT PRIMARY KEY IDENTITY(1,1),
    Nombre NVARCHAR(50) NOT NULL
);

-- Ahora (VARCHAR 3 fijo, sin identity)
CREATE TABLE Rol (
    RolID VARCHAR(3) PRIMARY KEY NOT NULL CHECK (RolID IN ('ADM', 'PED', 'EDI')),
    Nombre NVARCHAR(50) NOT NULL
);
```

### Status de órdenes se amplía

```sql
-- Antes: Pendiente, Enviado, Entregado, Cancelado (informales)
-- Ahora: explícitos y transaccionales pend inputs del business
-- Nuevos valores: Alistamiento, Despachado, Entregado, Cancelado
```

### Endpoint nuevo: actualización de status de orden

`POST /admin/orders/{orderId}/status` — solo accesible a PED y ADM, valida transiciones válidas.

### Nuevos endpoints admin (backend)

- `POST /admin/upload-products-csv` — Endpoint de Carga Masiva de Maestro de Productos
- `POST /admin/products/{productId}/images` — Subida de imagen de producto (con `capture` para cámara)

### Corrección de seguridad (backend)

`admin.js` login: reemplazo de comparación de contraseña en texto plano por hashing con `bcrypt`.

---

## Capabilities

### New Capabilities

- **admin-rbac**: Control de acceso basado en roles — valida que el rol del admin (ADM / PED / EDI) pueda acceder a cada endpoint admin, expone el rol en el JWT y en la respuesta de login
- **admin-products-bulk-upload**: Carga masiva del maestro de productos vía CSV por negocio/tienda — upsert de `ProductoMaestro` por SKU, incluyendo categorías y subcategorías
- **admin-product-images**: Subida de imágenes de productos individuales — acepta archivos y captura desde cámara del dispositivo (`<input type="file" accept="image/*" capture>`)
- **order-status-workflow**: Actualización de estados de órdenes con validación de transiciones permitidas — Pendiente→Alistamiento→Despachado→Entregado | Cancelado desde cualquier estado

### Modified Capabilities

*(No hay requisitos de specs preexistentes que cambien — el sistema no tiene specs registrados en `openspec/specs/` aún)*

---

## Impact

### Database — Cambios tipo
`RolID` cambia de `INT` a `VARCHAR(3)` afectando:

| Tabla | Columna |
|---|---|
| `Rol` | `RolID` → **PK**, nuevos valores sembrados |
| `Administrador` | `RolID` → **FK** pasa de INT a VARCHAR(3) |
| *(JWT token)* | Campo `role` pasa de número a string `'ADM'`/`'PED'`/`'EDI'` |

### Backend (Azure Functions)
| Archivo | Cambio |
|---|---|
| `utils/db.js` | Actualización de configuración de BD |
| `utils/auth.js` | Sin cambios estructurales |
| `src/functions/admin.js` | **BREAKING**: fix login (bcrypt), nuevos endpoints, middleware de role por ruta |
| `src/functions/orders.js` | Nuevo endpoint de actualización de status |
| `src/functions/catalog.js` | Potencialmente expandido con endpoint de imágenes |
| Migración SQL | Actualizar `RolID` tipo + sembrar roles |

### Frontend
| Archivo | Cambio |
|---|---|
| `AdminDashboard.jsx` | Nav items condicionados por rol, vistas de Pedidos y Carga Masiva Productos |
| `AdminLogin.jsx` | Sin cambios |
| `App.jsx` | Nuevo view state para gestión de pedidos admin |
| Nuevo: `AdminOrdersView.jsx` | Vista de pedidos con controles de cambio de estado, filtrada por rol |
| CSS files | Estilos para las nuevas vistas |

### Seguridad
- Backend aplica whitelist de rutas por rol tanto como frontend
- Contraseñas de admin comparadas con `bcrypt.compare()` (no texto plano)
