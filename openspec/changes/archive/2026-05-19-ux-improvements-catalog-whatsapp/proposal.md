## Why

El catálogo de MerCarlos ha crecido significativamente, lo que dificulta la navegación de los usuarios en la página de inicio y la búsqueda de productos específicos. Además, el ícono de WhatsApp actual tiene una ubicación que interfiere con la interfaz de usuario y no se alinea con los estándares estéticos de la plataforma.

Esta propuesta busca:
- Mejorar la relevancia de la página de inicio mostrando exclusivamente promociones.
- Optimizar la navegación del catálogo permitiendo el filtrado por subcategorías.
- Refinar la experiencia de contacto moviendo y redimensionando el ícono de WhatsApp.

## What Changes

- **Página de Inicio**: Se modificará la lógica de carga inicial para mostrar solo productos marcados como promociones.
- **Navegación por Subcategorías**: Se actualizará la barra de categorías para permitir la selección y filtrado por subcategorías, facilitando el manejo de un gran volumen de productos.
- **Interfaz de WhatsApp**: Se eliminará el ícono flotante y se integrará un nuevo enlace de WhatsApp en el pie de página (Footer), con un tamaño adecuado y discreto.

## Capabilities

### New Capabilities
- `subcategory-navigation`: Permite a los usuarios navegar y filtrar productos basándose en subcategorías específicas para una búsqueda más precisa.
- `footer-contact`: Proporciona un espacio dedicado en el pie de página para información de contacto y enlaces de soporte, incluyendo WhatsApp.

### Modified Capabilities
- `catalog-management`: Se ajusta la lógica de visualización del catálogo para priorizar promociones en la vista principal y soportar filtros más granulares.

## Impact

- **Frontend**: `App.jsx`, `CategoryBar.jsx`, nuevos componentes `Footer.jsx` y `Footer.css`.
- **Backend**: El backend ya soporta estos filtros, por lo que el impacto es principalmente en el consumo de APIs desde el frontend.
