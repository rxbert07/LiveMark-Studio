import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { MarkdownToolbar } from "./components/MarkdownToolbar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ThemeToggle } from "./components/ThemeToggle";
import html2pdf from "html2pdf.js";
import { Modal } from "./components/Modal";

import { html5Media } from "markdown-it-html5-media";

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
});

md.use(html5Media);

// Agregar soporte para resaltado de código
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const code = token.content;
  const lang = token.info.trim();

  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      return `
        <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
      `;
    } catch {
      /* empty */
    }
  }

  // fallback para lenguajes no reconocidos
  return `
    <pre><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>
  `;
};

const STORAGE_KEY = "livemark-notes-v1";

// Componente auxiliar para items de shortcut
function ShortcutItem({ keys, description, theme }) {
  return (
    <div className={`flex justify-between items-center p-2 rounded ${
      theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
    }`}>
      <span>{description}</span>
      <div className="flex gap-1">
        {keys.map(k => (
          <kbd key={k} className={`px-2 py-0.5 text-xs rounded border font-mono ${
            theme === 'dark' 
              ? 'bg-slate-800 border-slate-700 text-slate-300' 
              : 'bg-slate-100 border-slate-300 text-slate-600'
          }`}>
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export default App;function App() {
  const [notes, setNotes] = useState(() => {
    // Intentar cargar desde localStorage
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error("Error leyendo notas guardadas:", e);
        }
      }
    }

    // Si no hay nada guardado, crear una nota por defecto
    const first = {
      id: nanoid(),
      title: "Bienvenido 👋",
      content: `# Hola LiveMark

Empieza escribiendo Markdown aquí.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [first];
  });

  const [currentId, setCurrentId] = useState(() => notes[0]?.id ?? null);
  const current = notes.find((n) => n.id === currentId) || null;

  // Estado para autoguardado
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Estado para menú de descarga
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Estado mensaje de copiado
  const [copied, setCopied] = useState(false);

  // Estado para drag & drop de archivos externos
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  // Estado para tema claro/oscuro
  const [theme, setTheme] = useState(() => {
    // Intentar cargar desde localStorage
    const savedTheme = localStorage.getItem('livemark-theme');
    if (savedTheme) return savedTheme;
    // Si no hay guardado, usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Guardar tema en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('livemark-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Estado para búsqueda de notas
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);
  
  // Estado para modal de shortcuts
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Filtrar notas según la búsqueda
  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  // 🔹 Guardado automático en localStorage cada vez que cambian las notas
  useEffect(() => {
    // Evitar problemas si algún día se usa en SSR
    if (typeof window === "undefined") return;

    // Marcamos "Guardando..." en el siguiente microtask
    queueMicrotask(() => setIsSaving(true));

    // Guardar notas en localStorage
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

    // Simulamos un pequeño delay y luego mostramos "Cambios guardados ✔"
    const t = setTimeout(() => {
      setIsSaving(false);
      setLastSavedAt(new Date());
    }, 300);

    // Limpiar timeout si las notas cambian muy rápido o el componente se desmonta
    return () => clearTimeout(t);
  }, [notes]);

  // 🔹 Cerrar menú dropdown al hacer click fuera
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    // Agregar listener con un pequeño delay para evitar que se cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Helpers de descarga
  const downloadFile = (
    filename,
    content,
    type = "text/plain;charset=utf-8"
  ) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadTxt = () => {
    if (!current) return;
    downloadFile(
      `${current.title || "nota"}.txt`,
      current.content || "",
      "text/plain;charset=utf-8"
    );
  };

  const downloadMd = () => {
    if (!current) return;
    downloadFile(
      `${current.title || "nota"}.md`,
      current.content || "",
      "text/markdown;charset=utf-8"
    );
  };

  const downloadHtml = () => {
    if (!current) return;
    const body = md.render(current.content || "");
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${current.title || "Documento LiveMark"}</title>
</head>
<body>
${body}
</body>
</html>`;
    downloadFile(
      `${current.title || "nota"}.html`,
      html,
      "text/html;charset=utf-8"
    );
  };

  const downloadPdf = () => {
    if (!current) return;
    
    // Elemento a exportar (usamos el contenido renderizado)
    // Creamos un elemento temporal para no afectar la vista actual
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: ${theme === 'dark' ? '#000' : 'inherit'}">
        <h1 style="text-align: center; margin-bottom: 30px;">${current.title || "Documento"}</h1>
        ${md.render(current.content || "")}
      </div>
    `;

    // Opciones de configuración
    const opt = {
      margin:       1,
      filename:     `${current.title || "nota"}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generar PDF
    html2pdf().set(opt).from(element).save();
  };
  /*
  const copyToClipboard = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.content || "");
      alert("Contenido copiado al portapapeles ✅");
    } catch (e) {
      console.error(e);
      alert("No se pudo copiar al portapapeles.");
    }
  };
  */

  // Aviso de copiado
  const handleCopyClick = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.content || "");
      setCopied(true);
    } catch (e) {
      console.error("No se pudo copiar al portapapeles:", e);
    }

    setTimeout(() => {
      setCopied(false);
    }, 1000); // 1 segundo de “copiado”
  };
  // Estado para drag & drop de notas
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'delete' | 'rename'
    data: null,
    title: '',
    inputValue: '',
    message: '' // Added message for delete modal
  });

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  // History State (Undo/Redo)
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyTimeoutRef = useRef(null);
  const isUndoRedoRef = useRef(false);

  const reorderNotes = (fromId, toId) => {
    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === fromId);
      const toIndex = prev.findIndex((n) => n.id === toId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return prev;
      }

      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault(); // necesario para permitir drop
    if (draggedId && draggedId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    reorderNotes(draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // input de archivo para abrir notas existentes
  const fileInputRef = useRef(null);
  // Ref para el editor de texto (para toolbar y shortcuts)
  const textareaRef = useRef(null);

  const importFileAsNote = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result ?? "";

      const newNote = {
        id: nanoid(),
        title: file.name.replace(/\.[^/.]+$/, "") || file.name, // sin extensión
        content: String(text),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotes((prev) => [newNote, ...prev]);
      setCurrentId(newNote.id);
    };

    reader.onerror = () => {
      console.error("Error al leer el archivo");
      alert("No se pudo leer el archivo. Por favor, intenta con otro archivo.");
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importFileAsNote(file);
  };

  const handleOpenFileClick = () => {
    if (!fileInputRef.current) return;
    // reset para poder abrir el mismo archivo 2 veces seguidas si hace falta
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  // FUNCIONES

  const createNote = () => {
    const newNote = {
      id: nanoid(),
      title: "Nueva nota",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setCurrentId(newNote.id);
  };

  const deleteNote = (id) => {
    const noteToDelete = notes.find(n => n.id === id);
    setModalConfig({
      isOpen: true,
      type: 'delete',
      data: id,
      title: 'Eliminar nota',
      message: `¿Estás seguro de que quieres eliminar "${noteToDelete?.title}"? Esta acción no se puede deshacer.`
    });
  };

  const confirmDelete = () => {
    const id = modalConfig.data;
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    if (currentId === id) {
      setCurrentId(newNotes.length > 0 ? newNotes[0].id : null);
    }
    closeModal();
  };

  const renameNote = (id) => {
    const noteToRename = notes.find((n) => n.id === id);
    if (noteToRename) {
      setModalConfig({
        isOpen: true,
        type: 'rename',
        data: id,
        title: 'Renombrar nota',
        inputValue: noteToRename.title
      });
    }
  };

  const confirmRename = () => {
    const id = modalConfig.data;
    const newTitle = modalConfig.inputValue.trim();
    if (newTitle) {
      const newNotes = notes.map((note) =>
        note.id === id ? { ...note, title: newTitle } : note
      );
      setNotes(newNotes);
    }
    closeModal();
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Selection Mode Functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotes([]); // Clear selection when toggling mode
  };

  const toggleNoteSelection = (id) => {
    setSelectedNotes(prev => 
      prev.includes(id) 
        ? prev.filter(noteId => noteId !== id)
        : [...prev, id]
    );
  };

  const selectAllNotes = () => {
    setSelectedNotes(filteredNotes.map(note => note.id));
  };

  const clearSelection = () => {
    setSelectedNotes([]);
  };

  const deleteSelectedNotes = () => {
    setModalConfig({
      isOpen: true,
      type: 'delete',
      data: selectedNotes,
      title: 'Eliminar notas seleccionadas',
      message: `¿Estás seguro de que quieres eliminar ${selectedNotes.length} nota${selectedNotes.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    });
  };

  const confirmDeleteSelected = () => {
    const idsToDelete = modalConfig.data;
    const newNotes = notes.filter(note => !idsToDelete.includes(note.id));
    setNotes(newNotes);
    
    // If current note was deleted, select first remaining note
    if (idsToDelete.includes(currentId)) {
      setCurrentId(newNotes.length > 0 ? newNotes[0].id : null);
    }
    
    setSelectedNotes([]);
    setIsSelectionMode(false);
    closeModal();
  };


  // History Functions
  const captureHistory = (content, force = false) => {
    if (isUndoRedoRef.current) return;

    const now = Date.now();
    
    // Si es el primer cambio o forzado, guardar inmediatamente
    if (history.length === 0 || force) {
      const newHistory = [...history.slice(0, historyIndex + 1), { content, timestamp: now }];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return;
    }

    // Debounce: esperar a que el usuario deje de escribir
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = [...prev.slice(0, historyIndex + 1), { content, timestamp: Date.now() }];
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    }, 1000); // 1 segundo de inactividad para guardar snapshot
  };

  const undo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      
      setHistoryIndex(newIndex);
      updateContent(previousState.content, true); // true = skipHistory
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      
      setHistoryIndex(newIndex);
      updateContent(nextState.content, true); // true = skipHistory
      
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 50);
    }
  };

  const updateContent = (value, skipHistory = false) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === currentId
          ? { ...n, content: value, updatedAt: new Date().toISOString() }
          : n
      )
    );

    if (!skipHistory) {
      captureHistory(value);
    }
  };

  const wordCount = current?.content
    ? current.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const charCount = current?.content?.length || 0;

  // Texto de autoguardado
  let saveMessage = "Sin cambios";
  if (isSaving) {
    saveMessage = "Guardando...";
  } else if (lastSavedAt) {
    const time = lastSavedAt.toLocaleTimeString();
    saveMessage = `Cambios guardados ✔ (${time})`;
  }

  // 🔹 Helpers para shortcuts de formato
  const insertFormat = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const newText = text.substring(0, start) + before + selection + after + text.substring(end);
    
    updateContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        selection ? start + before.length + selection.length : start + before.length
      );
    }, 0);
  };

  // 🔹 Hook de shortcuts
  useKeyboardShortcuts({
    textareaRef,
    onNewNote: createNote,
    onSearchFocus: () => searchInputRef.current?.focus(),
    onBold: () => insertFormat('**', '**'),
    onItalic: () => insertFormat('*', '*'),
    onLink: () => insertFormat('[', '](url)'),
    onShowShortcuts: () => setShowShortcuts(true)
  });

  // Eventos para arrastrar y abrir archivos

  const handleGlobalDragEnter = (e) => {
    e.preventDefault();
    // Incrementar contador para detectar cuando entramos/salimos de elementos hijos
    dragCounterRef.current++;
    
    // Solo activar si se está arrastrando un archivo
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleGlobalDragLeave = (e) => {
    e.preventDefault();
    // Decrementar contador
    dragCounterRef.current--;
    
    // Solo desactivar cuando realmente salimos de la ventana
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleGlobalDrop = (e) => {
    e.preventDefault();
    // Resetear estado y contador
    setIsDraggingFile(false);
    dragCounterRef.current = 0;
    
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    importFileAsNote(file);
  };

  // Reset history when switching notes
  useEffect(() => {
    setHistory([]);
    setHistoryIndex(-1);
    isUndoRedoRef.current = false;
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }
  }, [currentId]);

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col relative transition-colors duration-200 ${theme} ${
        theme === 'dark' 
          ? 'bg-slate-900 text-slate-100' 
          : 'bg-slate-100 text-slate-900'
      }`}
      onDragEnter={handleGlobalDragEnter}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Modal de Shortcuts */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setShowShortcuts(false)}>
          <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 text-slate-800'
          }`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Atajos de Teclado</h2>
              <button onClick={() => setShowShortcuts(false)} className="text-slate-400 hover:text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-2">
              <ShortcutItem keys={['Ctrl', 'A']} description="Nueva nota" theme={theme} />
              <ShortcutItem keys={['Ctrl', 'F']} description="Buscar notas" theme={theme} />
              <ShortcutItem keys={['Ctrl', 'B']} description="Negrita" theme={theme} />
              <ShortcutItem keys={['Ctrl', 'I']} description="Cursiva" theme={theme} />
              <ShortcutItem keys={['Ctrl', 'K']} description="Insertar enlace" theme={theme} />
              <ShortcutItem keys={['Ctrl', '/']} description="Mostrar esta ayuda" theme={theme} />
            </div>
          </div>
        </div>
      )}

      {/* Overlay de drag & drop de archivos */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm 
                        flex items-center justify-center pointer-events-none
                        animate-in fade-in duration-200">
          <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 shadow-2xl ${
            theme === 'dark' 
              ? 'bg-slate-800 border-emerald-500 shadow-emerald-500/20' 
              : 'bg-white border-emerald-500 shadow-emerald-500/20'
          }`}>
            {/* Icono de archivo */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-20 h-20 text-emerald-400 animate-bounce"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            
            {/* Texto */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">
                Suelta el archivo aquí
              </h2>
              <p className="text-slate-400 text-sm">
                Se creará una nueva nota con el contenido del archivo
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Formatos compatibles: .md, .markdown, .txt
              </p>
            </div>
          </div>
        </div>
      )}
      {/* HEADER (Top Bar) */}
      <header className={`w-full h-14 px-4 border-b flex items-center justify-between ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h1 className="text-lg font-semibold">LiveMark Studio</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </header>

      {/* CONTENT WRAPPER (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`w-64 border-r flex flex-col relative ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200'
        }`}>

        <div className="px-4 py-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-sm rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors duration-200
                ${theme === 'dark' 
                  ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
                }`}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 mb-2">
          {/* Nueva nota button - full width */}
          <button
            onClick={createNote}
            className="w-full px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm text-white transition-colors duration-150 mb-2"
          >
            + Nueva nota
          </button>

          {/* Abrir and Seleccionar buttons - side by side */}
          <div className="flex gap-2">
            <button
              onClick={handleOpenFileClick}
              className={`flex-1 px-2 py-1.5 rounded border text-xs transition-colors duration-150 flex items-center justify-center gap-1 ${
                theme === 'dark'
                  ? 'border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
              </svg>
              Abrir
            </button>

            <button
              onClick={toggleSelectionMode}
              className={`flex-1 px-2 py-1.5 rounded border text-xs transition-colors duration-150 flex items-center justify-center gap-1 ${
                isSelectionMode
                  ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500'
                  : theme === 'dark'
                  ? 'border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Seleccionar
            </button>
          </div>
        </div>

          {/* input oculto para seleccionar archivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={handleFileInputChange}
          />

        <p className="px-4 text-[11px] text-slate-500 mb-1 flex justify-between">
          <span>{filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-600">Arrastra para ordenar</span>
        </p>

        <ul className="flex-1 overflow-auto text-sm pb-16">
          {filteredNotes.map((note) => (
            <li
              key={note.id}
              onClick={() => isSelectionMode ? toggleNoteSelection(note.id) : setCurrentId(note.id)}
              draggable={!isSelectionMode}
              onDragStart={() => !isSelectionMode && handleDragStart(note.id)}
              onDragOver={(e) => !isSelectionMode && handleDragOver(e, note.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => !isSelectionMode && handleDrop(note.id)}
              onDragEnd={handleDragEnd}
              className={`px-3 py-3 border-b cursor-pointer group 
    flex items-center justify-between transition-all duration-150 relative
    ${
      theme === 'dark'
        ? 'border-slate-900 ' + (
            selectedNotes.includes(note.id) 
              ? 'bg-emerald-900/30 border-l-4 border-l-emerald-500'
              : note.id === currentId 
                ? 'bg-slate-800' 
                : 'hover:bg-slate-900 text-slate-400'
          )
        : 'border-slate-200 ' + (
            selectedNotes.includes(note.id)
              ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
              : note.id === currentId 
                ? 'bg-white shadow-sm' 
                : 'hover:bg-slate-100 text-slate-600'
          )
    }
    ${draggedId === note.id ? "opacity-40 cursor-grabbing" : ""}
    ${dragOverId === note.id && draggedId !== note.id ? "border-t-2 border-t-emerald-500" : ""}
  `}
            >
              {/* Checkbox in selection mode */}
              {isSelectionMode && (
                <input
                  type="checkbox"
                  checked={selectedNotes.includes(note.id)}
                  onChange={() => toggleNoteSelection(note.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-2 w-4 h-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
                />
              )}
              
              <span className="truncate flex-1">{note.title}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                {/* editar (lápiz amarillo) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    renameNote(note.id);
                  }}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-yellow-400 transition-colors duration-150"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path d="M4 13.5V16h2.5l7.36-7.36-2.5-2.5L4 13.5zm11.71-7.79c.39-.39.39-1.02 0-1.41l-1.5-1.5a1 1 0 0 0-1.41 0l-1.29 1.29 2.5 2.5 1.7-1.38z" />
                  </svg>
                </button>

                {/* eliminar (X roja) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="p-1 rounded bg-red-700 hover:bg-red-600 text-white transition-colors duration-150"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="w-3 h-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 8.586l4.95-4.95 1.414 1.414L11.414 10l4.95 4.95-1.414 1.414L10 11.414l-4.95 4.95-1.414-1.414L8.586 10l-4.95-4.95L5.05 3.636 10 8.586z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}

          {notes.length === 0 && (
            <li className="px-4 py-2 text-xs text-slate-500">
              No hay notas. Crea una con “+ Nueva nota”.
            </li>
          )}
        </ul>

        {/* Batch Action Bar */}
        {isSelectionMode && selectedNotes.length > 0 && (
          <div className={`absolute bottom-0 left-0 right-0 p-2.5 border-t flex items-center justify-between ${
            theme === 'dark' 
              ? 'bg-slate-950 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-medium">
              {selectedNotes.length} seleccionada{selectedNotes.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={deleteSelectedNotes}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs transition-colors duration-150 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
                Eliminar
              </button>
              <button
                onClick={clearSelection}
                className={`px-2.5 py-1 rounded border text-xs transition-colors duration-150 ${
                  theme === 'dark'
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`w-1/2 flex flex-col border-r ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-300'
        }`}>
          <div className={`h-10 flex items-center justify-between px-3 text-xs border-b ${
            theme === 'dark' 
              ? 'text-slate-400 border-slate-800 bg-slate-950' 
              : 'text-slate-600 border-slate-200 bg-slate-50'
          }`}>
            <p>Editor (Markdown)</p>
            <button
              className="w-fit px-2 py-1 rounded flex items-center justify-center 
             hover:bg-emerald-500 hover:text-white 
             transition-colors duration-150 group relative"
              onClick={handleCopyClick}
              title={copied ? "Copiado" : "Copiar Markdown al portapapeles"}
            >
              {/* Icono de copiar con animación */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                stroke="currentColor"
                className={`w-5 h-5 transition-transform duration-150`}
              >
                <rect x="9" y="3" width="11" height="13" rx="2" />
                {/* hoja de atrás */}
                <rect
                  x="5"
                  y="7"
                  width="11"
                  height="13"
                  rx="2"
                  fill="currentColor"
                />
              </svg>

              {/* Check de “copiado” */}
              {copied && (
                <span
                  className="absolute -right-1 -top-1 
      bg-emerald-300 border-2 border-white text-white 
      rounded-full p-[2px] flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    />
                  </svg>
                </span>
              )}
            </button>
          </div>
          
          {/* Toolbar de formato */}
          <MarkdownToolbar textareaRef={textareaRef} onUpdate={updateContent} theme={theme} />
          
          <textarea
            ref={textareaRef}
            className={`flex-1 p-3 pb-10 text-sm font-mono outline-none resize-none transition-colors duration-200 overflow-auto
              ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`}
            value={current?.content || ""}
            onChange={(e) => updateContent(e.target.value)}
            disabled={!current}
          />
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Barra superior de preview + menú ⋮ */}
          <div className={`h-10 flex items-center px-3 text-xs border-b justify-between relative ${
            theme === 'dark' ? 'text-slate-400 border-slate-800 bg-slate-950' : 'text-slate-600 border-slate-200 bg-slate-50'
          }`}>
            <span>Vista previa</span>

            {/* Botón menú ⋮ */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 flex items-center gap-1 disabled:opacity-40"
              disabled={!current}
              title="Descargar / Exportar"
            >
              {/* Icono de descarga */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16.5v1.125c0 .621.504 1.125 
                  1.125 1.125h13.75c.621 0 1.125-.504 
                  1.125-1.125V16.5M7.5 10.5l4.5 4.5m0 
                  0l4.5-4.5m-4.5 4.5V3.75"
                />
              </svg>

              {/* Flechita hacia abajo */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown de acciones */}
            {isMenuOpen && current && (
              <div
                ref={menuRef}
                className={`absolute top-full right-0 mt-1 max-w-[16.875rem]
               border rounded shadow-lg w-fit min-w-[11.25rem] z-50 text-sm p-2
               ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 text-slate-800'}
               `}
              >
                <button
                  className="w-full text-left px-3 py-2 hover:text-white hover:bg-emerald-500  transition-colors duration-150 rounded"
                  onClick={() => {
                    downloadTxt();
                    setIsMenuOpen(false);
                  }}
                >
                  Descargar como .txt
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:text-white hover:bg-emerald-500 transition-colors duration-150 rounded"
                  onClick={() => {
                    downloadMd();
                    setIsMenuOpen(false);
                  }}
                >
                  Descargar como .md
                </button>
                <button
                  className="w-full text-left px-3 py-2 hover:text-white hover:bg-emerald-500 transition-colors duration-150 rounded"
                  onClick={() => {
                    downloadHtml();
                    setIsMenuOpen(false);
                  }}
                >
                  Exportar como HTML
                </button>

                <button
                  className="w-full text-left px-3 py-2 hover:text-white hover:bg-emerald-500 transition-colors duration-150 rounded"
                  onClick={() => {
                    downloadPdf();
                    setIsMenuOpen(false);
                  }}
                >
                  Exportar PDF
                </button>
              </div>
            )}
          </div>

          {/* Contenido de preview */}
          <div className={`flex-1 p-4 pb-10 overflow-auto text-sm leading-relaxed ${
            theme === 'dark' ? '' : 'bg-white'
          }`}>
            <div
              className={`
                [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4
                [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2
                [&>p]:mb-2
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-1
                [&>a]:text-emerald-400 [&>a]:underline

                [&>pre]:border [&>pre]:rounded [&>pre]:p-3 [&>pre]:mt-3 [&>pre]:mb-3
                [&>pre]:overflow-auto [&>pre]:text-sm [&>pre]:font-mono
                
                [&>pre_code]:bg-transparent [&>pre_code]:p-0 [&>pre_code]:m-0 [&>pre_code]:block

                [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-[.0625rem]
                [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:font-mono

                ${theme === 'dark' 
                  ? '[&>pre]:bg-slate-800 [&>pre]:border-slate-700 [&>pre_code]:text-slate-200 [&_code:not(pre_code)]:bg-slate-800' 
                  : '[&>pre]:bg-slate-100 [&>pre]:border-slate-200 [&>pre_code]:text-slate-800 [&_code:not(pre_code)]:bg-slate-100'}
              `}
              dangerouslySetInnerHTML={{
                __html: md.render(current?.content || ""),
              }}
            />
          </div>
        </div>

        {/* Barra de estado */}
        <footer
          className={`fixed bottom-0 left-64 right-0 h-8 border-t px-4 z-10
          text-xs flex items-center justify-between ${
            theme === 'dark' 
              ? 'bg-slate-950 border-slate-800 text-slate-400' 
              : 'text-slate-600 border-slate-200 bg-slate-50'
          }`}
        >
          <span>
            Palabras: <strong>{wordCount}</strong> • Caracteres:{" "}
            <strong>{charCount}</strong>
          </span>
          <span>{saveMessage}</span>
        </footer>
      </div>
      </main>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        theme={theme}
        confirmText={modalConfig.type === 'delete' ? 'Eliminar' : 'Guardar'}
        isDestructive={modalConfig.type === 'delete'}
        onConfirm={
          modalConfig.type === 'delete' 
            ? (Array.isArray(modalConfig.data) ? confirmDeleteSelected : confirmDelete)
            : confirmRename
        }
      >
        {(inputRef) => modalConfig.type === 'delete' ? (
          <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
            {modalConfig.message}
          </p>
        ) : (
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nombre de la nota
            </label>
            <input
              ref={inputRef}
              type="text"
              value={modalConfig.inputValue}
              onChange={(e) => setModalConfig(prev => ({ ...prev, inputValue: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
              }}
              className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
