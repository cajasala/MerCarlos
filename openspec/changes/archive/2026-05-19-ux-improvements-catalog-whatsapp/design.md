## Context

El sistema actual de MerCarlos carga todos los productos en la página de inicio, lo que genera una carga innecesaria y dificulta al usuario encontrar ofertas. La navegación por categorías es insuficiente para un catálogo extenso, y el ícono de WhatsApp flotante afecta la usabilidad móvil y estética general.

## Goals / Non-Goals

**Goals:**
- Reducir la carga cognitiva en la Home mostrando solo promociones por defecto.
- Implementar un sistema de filtrado por subcategorías en el frontend.
- Centralizar la información de contacto en un nuevo componente `Footer`.
- Mejorar la estética y accesibilidad del enlace de WhatsApp.

**Non-Goals:**
- No se modificará el esquema de la base de datos (se usará lo existente).
- No se implementarán nuevas funcionalidades de administración en este cambio.
- No se cambiará la pasarela de pagos ni el flujo de checkout.

## Decisions

- **Filtrado en Home**: Se usará el parámetro `isPromotion` existente en la API de productos. La lógica se manejará en `App.jsx` dentro del efecto que carga los productos.
- **Navegación de Subcategorías**: Se optará por un modelo de selección secuencial en `CategoryBar.jsx`. Al seleccionar una categoría, se mostrarán sus subcategorías. Si no hay categoría seleccionada ("Todos"), se mostrarán las categorías principales.
- **Componente Footer**: Se creará `Footer.jsx` y `Footer.css` en `src/components/`. Se incluirá en `App.jsx` debajo del contenido principal pero arriba del `BottomNav` (que es fijo).
- **Estilo de WhatsApp**: Se usará un ícono SVG pequeño con el texto "Contáctanos por WhatsApp" en el Footer, siguiendo la paleta de colores de MerCarlos (verde `--primary`).

## Risks / Trade-offs

- **Visibilidad**: Los usuarios que buscaban productos específicos desde la Home sin navegar por categorías podrían sentir que "faltan productos". Se mitigará asegurando que el buscador y las categorías sean prominentes.
- **Subcategorías vacías**: Existe el riesgo de mostrar subcategorías que no tengan productos en stock para una tienda específica. Se manejará mostrando un mensaje amigable de "No hay productos disponibles".
