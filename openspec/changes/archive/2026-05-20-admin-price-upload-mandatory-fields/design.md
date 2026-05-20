## Context

### Background
MerCarlos es un sistema de gestión de supermercados que permite a los administradores cargar masivamente precios de productos mediante archivos CSV. Actualmente, la funcionalidad de carga masiva de precios (AdminPriceUpload) permite que algunos campos sean opcionales en el CSV, lo que puede llevar a inconsistencia en los datos y valores por defecto no intencionados en la tabla ProductoTienda.

### Cambio solicitado
Hacer que todos los campos en la carga masiva de precios sean obligatorios: SKU, PrecioRegular, PrecioPromocion y EsPromocion, eliminando la ambigüedad de campos opcionales y asegurando consistencia en los datos.

### Constraint de seguridad
- El endpoint `/mng/upload-csv` ya tiene validación de roles (ADM, PED, EDI) implementada en el backend
- La validación adicional de campos será implementada tanto en frontend (UX) como debe ser reforzada en backend para seguridad completa

## Goals / Non-Goals

**Goals:**
- Asegurar que todos los precios subidos mediante CSV tengan valores explícitos para todos los campos requeridos
- Eliminar valores por defecto no intencionados (NULL para PrecioPromocion, 0 para EsPromocion)
- Proveer retroalimentación inmediata al usuario mediante validación en el frontend
- Mantener la operación de actualización únicamente (no inserciones) en la tabla ProductoTienda

**Non-Goals:**
- Cambiar el comportamiento de actualización a inserción (mantener UPDATE-only)
- Modificar la estructura de la tabla ProductoTienda
- Afectar otras funcionalidades de carga masiva (como la de productos)

## Decisions

### 1. Validación en Frontend antes del envío
Implementar validación de columnas y tipos de datos en el componente AdminPriceUpload.jsx antes de enviar el FormData al backend.

**Rationale:** Proveer retroalimentación inmediata al usuario, reducir solicitudes fallidas al backend y mejorar la experiencia de usuario.

**Alternativas consideradas:**
- Solo validación en backend: llevaría a una mala experiencia de usuario con errores solo después del envío
- Validación solo en tipos de datos sin verificar columnas: no garantizaría la presencia de todos los campos requeridos

### 2. Mensajes de error específicos
Mostrar mensajes de error claros que indiquen exactamente qué columnas faltan o qué valores son inválidos.

**Rationale:** Ayudar al usuario a corregir rápidamente su CSV sin necesidad de adivinar qué está mal.

### 3. Mantener compatibilidad con el endpoint existente
No modificar el endpoint `/mng/upload-csv` ya que actualmente procesa correctamente los cuatro campos (aunque permite valores faltantes con defaults).

**Rationale:** Evitar cambios innecesarios en el backend cuando la lógica actual puede manejar los datos una vez que estén validados en el frontend. El endpoint ya tiene los accesos directos a los campos que lanzarían error si faltaran, pero actualmente usa defaults para algunos campos.

**Alternativa considerada:** Modificar el backend para requerir explícitamente todos los campos. Esto sería más seguro pero requeriría cambios en el backend que actualmente están funcionando.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| Usuarios con CSV existentes que faltan PrecioPromocion o EsPromocion tendrán que modificar sus archivos | Proveer una plantilla de ejemplo y mensaje claro sobre el formato requerido |
| Validación en frontend puede ser bypassed (no es seguridad completa) | El backend ya maneja los campos directamente y lanzaría error si faltaran; además, el JWT y validación de roles siguen presentes |
| Confusión si el backend se comporta diferente cuando campos faltan vs cuando están presentes | Documentar claramente que todos los campos son obligatorios y el backend requiere valores explícitos |

## Migration Plan

### Fase 1: Implementación frontend
1. Actualizar AdminPriceUpload.jsx para incluir validación de columnas requeridas
2. Actualizar AdminPriceUpload.jsx para incluir validación de tipos de datos
3. Modificar la pista (hint) de CSV para mostrar únicamente los cuatro campos obligatorios
4. Actualizar mensajes de estado para reflejar la nueva validación

### Fase 2: Pruebas
1. Proveer CSV válidos con todos los campos
2. Proveer CSV faltando cada uno de los campos requeridos
3. Proveer CSV con tipos de datos inválidos
4. Verificar que los mensajes de error sean apropiados
5. Verificar que los CSV válidos se procesen correctamente

### Fase 3: Deploy
1. Deploy del frontend actualizado
2. Comunicación a usuarios sobre el cambio en el formato requerido de CSV
3. Monitoreo inicial de reportes de errores

## Open Questions

- ¿Debería añadirse una capacidad de descargar una plantilla de CSV con el formato correcto desde la interfaz de carga de precios?
- ¿Se debería considerar hacer que el backend también valide explícitamente la presencia de todos los campos como capa adicional de seguridad?