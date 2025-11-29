import { useEffect } from 'react';

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

                    case 'k': // Link
                        if (isEditor) {
                            e.preventDefault();
                            handlers.onLink?.();
                        }
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
