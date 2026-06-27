## Context

El catálogo de MerCarlos muestra imágenes de productos obtenidas de la base de datos a través del backend. Cuando un producto no tiene imagen, se utiliza un servicio externo (`via.placeholder.com`). Además, si una imagen existe en la base de datos pero el enlace físico está roto (retorna 404, DNS error o tiempo de espera agotado), el navegador muestra un cuadro de imagen rota nativo. Este documento diseña el mecanismo de fallback dinámico local en el cliente.

## Goals / Non-Goals

**Goals:**
- Centralizar un recurso visual local (`/default-product.svg`) como imagen por defecto.
- Interceptar fallas de red/404 al descargar imágenes de productos en el cliente y cambiarlas en caliente por el SVG local.
- Asegurar que no haya loops infinitos en el evento `onError` si el recurso local falla o es eliminado accidentalmente.

**Non-Goals:**
- Modificar el backend o base de datos para validar URLs de forma asíncrona en el servidor.
- Modificar otros componentes que no muestren directamente productos (como iconos de redes sociales o logotipos).

## Flow Diagram

```
[ Frontend Component ] ──► Muestra <img> 
       │
       ├──► Si `ImagenURL` es nulo/vacío ──► Carga local `/default-product.svg`
       │
       └──► Si `ImagenURL` es válido ─────► Intenta cargar URL externa
                                                 │
                                                 ▼
                                         [ Carga Exitosa ] ?
                                            ├── Sí ──► Muestra imagen
                                            └── No (onError) ──► Asigna `/default-product.svg`
```

## Decisions

### Decisión 1: Tipo de recurso y formato para el Placeholder
- **Opción seleccionada**: SVG local (`default-product.svg`) en la carpeta `/public/`, referenciado dinámicamente usando `${import.meta.env.BASE_URL}default-product.svg`.
- **Alternativas consideradas**:
  - *PNG/WebP*: Mayor peso, no escalable de forma óptima a diferentes tamaños (80x80 en carrito, 200x200 en tarjeta, 400x400 en detalle).
  - *Ruta absoluta dura (`/default-product.svg`)*: Falla cuando el proyecto Vite está configurado con un sub-path o base URL específico (como `/MerCarlos/` en este repositorio).
  - *Servicio externo (via.placeholder)*: Requiere acceso a internet, puede ser lento o inaccesible en entornos de red cerrados o restringidos.
- **Razón**: El SVG es vectorial y se escala perfectamente. El uso de `import.meta.env.BASE_URL` garantiza la resolución correcta del recurso independientemente del subdirectorio donde se despliegue la aplicación.

### Decisión 2: Prevención de bucles infinitos en onError
- **Opción seleccionada**: Limpiar el manejador de error antes de reasignar la fuente a la constante `defaultImage`:
  ```javascript
  const defaultImage = `${import.meta.env.BASE_URL}default-product.svg`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultImage;
  };
  ```
- **Alternativas consideradas**:
  - *Asignación directa sin limpiar `onerror`*: Si la imagen por defecto no se encuentra, se genera un bucle de llamadas infinitas al dispararse continuamente el evento `onError` en cada intento fallido de reasignación.
- **Razón**: Garantiza la estabilidad del navegador y previene loops infinitos de recarga ante recursos ausentes.

## Risks / Trade-offs

### Riesgos por Capa
- **Frontend (Cliente)**:
  - *Riesgo*: Si el archivo `default-product.svg` es eliminado de la carpeta `public`, el fallback no se cargará.
  - *Mitigación*: El código de limpieza `onerror = null` previene que esto cause un bucle infinito que bloquee el hilo de ejecución principal.
- **Backend**:
  - *Riesgo*: Si el backend falla y no retorna productos, el frontend mostrará estados de error normales de la aplicación.
  - *Mitigación*: Se mantiene intacta la lógica actual de control de errores y carga en los fetches de datos.
- **Base de Datos (DB)**:
  - *Riesgo*: Si la base de datos contiene URLs sintácticamente válidas pero físicamente rotas, el frontend las consultará, consumiendo un poco de ancho de banda hasta que falle la carga.
  - *Mitigación*: El evento `onError` captura estas fallas y corrige la visualización inmediatamente sin impacto notable.

### Secrets / Variables de Entorno
- No se introducen nuevos secrets ni variables de entorno en archivos `.env`.
