import { useEffect } from 'react';

/**
 * useKeyboardShortcuts Hook
 * 
 * Hook personalizado para manejar atajos de teclado globales en la aplicación.
 * 
 * Atajos disponibles:
 * - Ctrl+A: Crear nueva nota
 * - Ctrl+S: Guardar (automático, da feedback visual)
 * - Ctrl+F: Enfocar búsqueda
 * - Ctrl+B: Negrita (solo en editor)
 * - Ctrl+I: Cursiva (solo en editor)
 * - Ctrl+I: Cursiva (solo en editor)
 * - Ctrl+U: Insertar enlace (solo en editor)
 * - Ctrl+K: Detener audio de Kanye
 * - Ctrl+/: Mostrar ayuda de atajos
 * 
 * @param {Object} handlers - Objeto con callbacks para cada atajo
 * @param {React.RefObject} handlers.textareaRef - Referencia al textarea del editor
 * @param {Function} handlers.onNewNote - Callback para crear nueva nota
 * @param {Function} handlers.onSearchFocus - Callback para enfocar búsqueda
 * @param {Function} handlers.onBold - Callback para aplicar negrita
 * @param {Function} handlers.onItalic - Callback para aplicar cursiva
 * @param {Function} handlers.onLink - Callback para insertar enlace
 * @param {Function} handlers.onStopKanye - Callback para detener audio de Kanye
 * @param {Function} handlers.onShowShortcuts - Callback para mostrar ayuda
 */

export function useKeyboardShortcuts(handlers) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignorar si el evento viene de un input que no sea el editor (excepto para atajos globales)
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            const isEditor = e.target === handlers.textareaRef?.current;

            // Ctrl/Meta + Key shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'a': // Nueva nota
                        e.preventDefault();
                        handlers.onNewNote?.();
                        break;

                    case 's': // Guardar (aunque es automático, da feedback visual)
                        e.preventDefault();
                        // El guardado es automático, pero podríamos mostrar un toast
                        break;

                    case 'e': // Toggle Preview (si existiera esa función)
                        // e.preventDefault();
                        // handlers.onTogglePreview?.();
                        break;

                    case 'f': // Buscar
                        if (!isEditor) { // Si ya estamos en el editor, dejamos que el navegador busque texto
                            e.preventDefault();
                            handlers.onSearchFocus?.();
                        }
                        break;

                    // Atajos de formato (solo si estamos en el editor)
                    case 'b': // Bold
                        if (isEditor) {
                            e.preventDefault();
                            handlers.onBold?.();
                        }
                        break;

                    case 'i': // Italic
                        if (isEditor) {
                            e.preventDefault();
                            handlers.onItalic?.();
                        }
                        break;

                    case 'u': // Link (Ctrl+U)
                        if (isEditor) {
                            e.preventDefault();
                            handlers.onLink?.();
                        }
                        break;

                    case 'k': // Stop Kanye (Ctrl+K)
                        e.preventDefault();
                        handlers.onStopKanye?.();
                        break;

                    case '/': // Ayuda / Shortcuts
                        e.preventDefault();
                        handlers.onShowShortcuts?.();
                        break;

                    default:
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
}
