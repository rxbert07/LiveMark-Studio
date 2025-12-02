# Guía de Re-implementación de Funcionalidades

Esta guía detalla paso a paso cómo volver a aplicar las funcionalidades desarrolladas recientemente sobre una versión anterior del proyecto.

## 1. Instalación de Dependencias

Ejecuta el siguiente comando para instalar las librerías necesarias para diagramas y matemáticas:

```bash
npm install mermaid katex markdown-it-katex
```

## 2. Configuración de Estilos (src/index.css)

Agrega/Modifica los siguientes estilos en `src/index.css`:

### Tablas y Scrollbars
Asegúrate de tener los estilos para las barras de desplazamiento (scrollbars) y agrega los estilos base para las tablas (aunque usamos Tailwind en el JSX, algunos estilos base ayudan).

### Efecto Rainbow Condicional
Modifica la clase `.rainbow-text` para que solo funcione cuando esté activado el modo "Easter Eggs".

```css
/* Antes era solo .rainbow-text */
.easter-eggs-enabled .rainbow-text {
  background: linear-gradient(to right, ...);
  /* ... resto de propiedades ... */
  animation: rainbow 2s linear infinite;
}
```

## 3. Lógica Principal (src/App.jsx)

### Importaciones
Agrega las nuevas importaciones al inicio del archivo:

```javascript
import mermaid from "mermaid";
import katex from "katex";
import "katex/dist/katex.min.css";
import markdownItKatex from "markdown-it-katex";
```

### Configuración de Markdown-it
Configura los plugins de KaTeX y Mermaid:

```javascript
md.use(markdownItKatex);

// Regla para bloques mermaid
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const lang = token.info.trim();
  if (lang === 'mermaid') {
    return `<div class="mermaid" style="white-space: pre-wrap">${md.utils.escapeHtml(token.content)}</div>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};
```

### Nuevos Estados
Agrega el estado para los "Easter Eggs" con persistencia:

```javascript
// Estado para Easter Eggs
const [easterEggsEnabled, setEasterEggsEnabled] = useState(() => {
  const saved = localStorage.getItem('livemark-easter-eggs');
  return saved ? JSON.parse(saved) : true;
});

useEffect(() => {
  localStorage.setItem('livemark-easter-eggs', JSON.stringify(easterEggsEnabled));
}, [easterEggsEnabled]);
```

### Lógica de Mermaid (Crucial)
Para evitar que los diagramas desaparezcan al cambiar de tema, usa este enfoque con `useRef`:

1.  Crea una referencia: `const previewRef = useRef(null);`
2.  **Elimina** el `dangerouslySetInnerHTML` del `div` del preview.
3.  Usa este `useEffect` para actualizar el contenido:

```javascript
// Renderizar diagramas Mermaid cuando cambia el contenido
useEffect(() => {
  let timeoutId;
  if (current?.content) {
    timeoutId = setTimeout(async () => {
      try {
        const mermaidDivs = document.querySelectorAll('.mermaid');
        if (mermaidDivs.length > 0) {
          await mermaid.run({
            nodes: Array.from(mermaidDivs),
            suppressErrors: true
          });
        }
      } catch (err) { console.error(err); }
    }, 300);
  }
  return () => clearTimeout(timeoutId);
}, [current?.content]); // Solo depende del contenido

// Actualizar HTML manualmente (evita destruir SVGs al cambiar tema)
useEffect(() => {
  if (previewRef.current && current?.content !== undefined) {
    previewRef.current.innerHTML = md.render(current?.content || "");
  }
}, [current?.content]);

// Re-renderizar Mermaid al cambiar tema (para actualizar colores)
useEffect(() => {
  const mermaidDivs = document.querySelectorAll('.mermaid');
  if (mermaidDivs.length > 0 && current?.content) {
    previewRef.current.innerHTML = md.render(current.content);
    setTimeout(async () => {
      const freshNodes = document.querySelectorAll('.mermaid');
      if (freshNodes.length > 0) {
        await mermaid.run({ nodes: Array.from(freshNodes), suppressErrors: true });
      }
    }, 100);
  }
}, [theme]);
```

### Modificación de Efectos (Flash y Rainbow)
Envuelve la lógica de activación de estos efectos con `if (easterEggsEnabled) { ... }`.

## 4. Interfaz de Usuario (src/App.jsx)

### Botón de Easter Eggs
En el `<header>`, agrega el botón antes del `ThemeToggle`:

```jsx
<div className="flex items-center gap-2">
  <button onClick={() => setEasterEggsEnabled(prev => !prev)} ... >
    {/* Icono de interrogación SVG */}
  </button>
  <ThemeToggle ... />
</div>
```

### Contenedor Principal
Agrega la clase condicional para el CSS del Rainbow:

```jsx
<div className={`... ${easterEggsEnabled ? 'easter-eggs-enabled' : ''}`}>
```

### Estilos de Tablas y Encabezados
En el `div` del preview, actualiza las clases de Tailwind para incluir estilos de tablas y bordes de encabezados:

```jsx
className={`
  ...
  [&>h1]:border-b [&>h1]:pb-2
  [&>h2]:border-b [&>h2]:pb-2
  [&>h3]:border-b [&>h3]:pb-1
  [&_table]:w-full [&_table]:border-collapse ...
  ...
`}
ref={previewRef} // IMPORTANTE: Usar ref en lugar de dangerouslySetInnerHTML
```

## 5. Barra de Herramientas (src/components/MarkdownToolbar.jsx)

Agrega el botón para insertar tablas:

```jsx
<button
  onClick={() => insertBlock(
    "| Encabezado 1 | Encabezado 2 |\n| -------- | -------- |\n| Celda 1 | Celda 2 |",
    "Tabla"
  )}
  // ... clases e icono ...
>
```
