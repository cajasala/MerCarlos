## Context

### Background

MerCarlos es un sistema de supermercado multi-tenant operando sobre Azure SQL con funciones Azure como API. El área de administración actualmente tiene un solo rol de `Administrador` sin autorización Granular (RBAC) en ninguna capa.

### Cambio solicitado

Tres roles diferenciados (ADM, PED, EDI) con permisos específicos, cambio de tipo de dato en `Rol.RolID`, ampliación de estados de pedidos y dos nuevos endpoints admin (carga masiva de productos y gestión de imágenes).

### Constraint de seguridad
- RBAC validado SIEMPRE en backend. Frontend es UX solamente, NO garantía de seguridad.
- Las contraseñas de admin NUNCA se comparan como texto plano. Usar `bcrypt`.
- El JWT debe transportar el rol como string `'ADM'` / `'PED'` / `'EDI'` después de la migración.

---

## Goals / Non-Goals

**Goals:**
- Tres roles de admin con permisos diferenciados y mutuamente comprensibles
- Cambio no disruptivo del tipo de `RolID` (migración controlada)
- Validación de transiciones de estado de órdenes (no saltos arbitrarios)
- Nuevos endpoints admin con RBAC aplicado capa por capa

**Non-Goals:**
- Modificación del esquema de base de datos de la capa cliente o autoservicio
- Sistema de notificaciones de cambios de estado
- Multi-rol por admin en este scope (cada admin tiene un solo rol; si requieren dos crearían dos cuentas)
- Árbol de menús dinámico por rol en esta etapa (la UI condicional _por rol_ ya está en el alcance)

---

## Decisions

### 1. `RolID: VARCHAR(3)` con chequear constraint en vez de ENUM

```
RolID: VARCHAR(3) PRIMARY KEY
Valores: 'ADM', 'PED', 'EDI'
CHECK (RolID IN ('ADM', 'PED', 'EDI'))
NO identity — se siembran los valores explícitamente
```

**Rationale**: Más legible que INT en consultas raw, evita strings mágicos dispersos, el CHECK lo acota. Usar VARCHAR en vez de INT permite leer directamente el rol en logs y depuración sin JOIN adicional.

**Alternativas consideradas:**
- Mantener INT + lookup → agrega JOIN innecesario
- ENUM MySQL → no aplica, BD es Azure SQL (SQL Server)
- TABLA DE PERMISOS detallada con join-roles → sobre-diseño para requirements actuales

---

### 2. Escalamiento de permisos: `PED ⊆ ADM`, `EDI ⊆ ADM`

```
    Capabilidad               ADM   PED   EDI
    ─────────────────────────────────────────
    Cargar Masiva Precios        ✓    ✓    ✓
    Cargar Masiva Productos      ✓    ✓    ✓
    Subir/editar imágenes        ✓    ✗    ✓
    Ver pedidos / cambiar estado ✓    ✓    ✗
    Gestionar usuarios admin     ✓    ✗    ✗
    Acceso sin restricciones     ✓    ✗    ✗
```

PED y EDI tienen capabilities sobrelapadas deliberadamente — reflejan la necesidad real, no una aproximación teóricamente pura de separación de responsabilidades.

---

### 3. Orden: tabla nueva de transiciones válidas

Una tabla `TransicionEstado` define el grafo de transiciones permitidas, no hardcodeadas en el endpoint.

```sql
CREATE TABLE TransicionEstado (
    EstadoOrigen NVARCHAR(50) NOT NULL,
    EstadoDestino NVARCHAR(50) NOT NULL,
    RolesPermitidos VARCHAR(3) NOT NULL, -- JSON array: '["ADM","PED"]'
    PRIMARY KEY (EstadoOrigen, EstadoDestino)
);
```

**Rationale**: Añadir un nuevo estado o modificar un rol no requiere deploy de código, solo actualizar registros. El JSON en la columna permite expresar roles permitidos sin normalizar más la tabla.

**Alternativa considerada:** Validar en código con `if/else` → requiere redeploy en cada cambio de política.

---

### 4. Almacenamiento de imágenes: blob storage sin ruta en DB

Las imágenes se suben al blob store y solo se persiste la URL en `ProductoImagen`.

```
Frontend ──► POST /admin/products/{id}/images (multipart/form-data)
               │
               ▼
         Valida rol EDI|ADM │
               │           │
               ▼           │
         Guarda en Blob
               │
               ▼
         Guarda URL en ProductoImagen
               │
               ▼
         Devuelve URL
```

**Rationale**: No saturar BD con binarios. El `ProductoImagen` ya tiene `ImagenURL` — solo el backend cambia de recibir URL a recibir bytes.

---

### 5. Migración de `RolID: INT → VARCHAR(3)`: approach

```sql
-- Staging: crear nueva columna
ALTER TABLE Administrador ADD RolID_New VARCHAR(3);

-- Mapear INT → CHAR
UPDATE a SET RolID_New = CASE r.Nombre
  WHEN 'Administracion'      THEN 'ADM'
  WHEN 'Consulta Pedido'     THEN 'PED'
  WHEN 'Carga de Precio'     THEN 'EDI'
END
FROM Administrador a
JOIN Rol r ON a.RolID = r.RolID;

-- Reemplazar columna
ALTER TABLE Administrador DROP COLUMN RolID;
EXEC sp_rename 'Administrador.RolID_New', 'RolID', 'COLUMN';

-- Actualizar tabla Rol
TRUNCATE TABLE Rol;
INSERT INTO Rol (RolID, Nombre) VALUES
  ('ADM', 'Administrador'),
  ('PED', 'Gestor de Pedidos'),
  ('EDI', 'Editor de Productos');
```

---

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| JWT con rol como INT (viejo) vs VARCHAR (nuevo) → tokens vencidos desincronizados | Regenerar sesiones en validación: si JWT trae `typeof role === 'string'` OK, si `typeof role === 'number'` rechazar y pedir re-login |
| Existencia de datos con RolID entero en producción al momento del deploy | Backup completo de tabla `Administrador` antes de migración; feature flag de doble escritura en admin endpoints durante ventana |
| Esta tabla `Rol` tiene INT→VARCHAR pero podría haber clientes en producción con valores viejos | Montar un script de migración idempotente antes del deploy, no en el deploy mismo |
| DD (Δ) en cambio de rol de un admin mientras tiene sesión activa | El JWT tiene expiración de 7d. Forzar re-login o implementar GET /admin/me con revalidación |
| Input de precioPromocion null → orfandad en frontend en el formulario | El schema de validación en cada endpoint rechaza Promocion sin valor |

---

## Migration Plan

### Fase 1: DB schema + seed (sin timeout de app)
1. Ejecutar migración SQL en horario bajo de tráfico
2. Ejecutar seed de tabla `Rol` con `'ADM'`, `'PED'`, `'EDI'`
3. Actualizar tabla `TransicionEstado` con filas iniciales

### Fase 2: Backend deploy
1. Deploy de backend con nuevos endpoints y corrección de login
2. Smoke test de login admin, creación de productos, lectura de órdenes

### Fase 3: Frontend deploy
1. Deploy con vistas condicionadas por rol (cliente-side)
2. QA de acceso no autorizado por rol

### Rollback
- Revertir migración SQL y recolectar `JWT_SECRET` común para volver al flujo previo
- Primero restaurar BD (es la fuente de verdad), luego revertir código backend

---

## Open Questions

- **¿Rango de tienda:** Los beans EDI/PED que pertenecen a un negocio y operan sobre varias tiendas están contemplados. ¿O se necesita scoping por tienda dentro de negocio? → Pendiente con usuario

- **¿Qué hacer con los administradores ya existentes:** Asignar rol ADM por defecto a todos los Administrador existentes en producción → se hará en la migración SQL

- **¿Registros de auditoría:** ¿Se necesita una tabla `AdminActionLog` para trazabilidad? → Decision futura no decidida → fuera de alcance por ahora
