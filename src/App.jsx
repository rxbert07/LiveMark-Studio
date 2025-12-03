import { useState, useEffect, useRef } from "react";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotes } from "./hooks/useNotes";
import { useHistory } from "./hooks/useHistory";
import { useTheme } from "./hooks/useTheme";
import { useDragDrop } from "./hooks/useDragDrop";

import { Sidebar } from "./components/Sidebar";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { DragOverlay } from "./components/DragOverlay";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { Modal } from "./components/Modal";

function App() {
  // Custom Hooks
  const {
    notes,
    currentId,
    setCurrentId,
    isSaving,
    lastSavedAt,
    createNote,
    deleteNote: deleteNoteFromStore,
    renameNote: renameNoteInStore,
    updateNoteContent,
    reorderNotes,
    importNote,
    isSelectionMode,
    toggleSelectionMode,
    selectedNotes,
    toggleNoteSelection,
    deleteSelectedNotes: deleteSelectedNotesFromStore
  } = useNotes();

  const { theme, toggleTheme } = useTheme();
  const { captureHistory, undo, redo, resetHistory, canUndo, canRedo } = useHistory();

  const handleUndo = () => {
    undo((content) => updateContent(content, true));
  };

  const handleRedo = () => {
    redo((content) => updateContent(content, true));
  };

  // Derived state
  const current = notes.find((n) => n.id === currentId) || null;
  const wordCount = current?.content
    ? current.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = current?.content?.length || 0;

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFlash, setShowFlash] = useState(false); // Estado para el efecto flash
  const [showChinazo, setShowChinazo] = useState(false);
  const [showKanye, setShowKanye] = useState(false); // Estado para el efecto chinazo

  // Easter Eggs state with localStorage persistence
  const [easterEggsEnabled, setEasterEggsEnabled] = useState(() => {
    const saved = localStorage.getItem('livemark-easter-eggs');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('livemark-easter-eggs', JSON.stringify(easterEggsEnabled));
  }, [easterEggsEnabled]);

  // Efecto flash al cambiar a tema claro (solo con Easter Eggs activado)
  // Efecto flash al cambiar a tema claro (solo con Easter Eggs activado)
  // Refs
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const flashAudioRef = useRef(null); // Ref para audio de flash
  const chinazioAudioRef = useRef(null); // Ref para audio de chinazo
  const kanyeAudioRef = useRef(null); // Ref para audio de Kanye
  const previewRef = useRef(null);
  const isScrolling = useRef(false);
  const prevThemeRef = useRef(theme); // Ref para trackear el tema anterior

  // Efecto flash al cambiar a tema claro (solo con Easter Eggs activado)
  useEffect(() => {
    // Solo activar si:
    // 1. Easter Eggs están activados
    // 2. El tema actual es 'light'
    // 3. El tema ANTERIOR era 'dark' (es decir, acabamos de cambiar)
    if (easterEggsEnabled && theme === 'light' && prevThemeRef.current === 'dark') {
      setShowFlash(true);
      
      // Reproducir audio light-mode
      if (flashAudioRef.current) {
        flashAudioRef.current.currentTime = 0;
        flashAudioRef.current.play().catch(err => console.log('Flash audio prevented:', err));
      }

      // Ocultar el flash después de 7 segundos
      const timer = setTimeout(() => {
        setShowFlash(false);
      }, 7000);
      
      // Actualizar tema anterior
      prevThemeRef.current = theme;
      
      return () => clearTimeout(timer);
    } else {
      // Si no se cumple la condición de transición, asegurarnos de que el flash esté apagado
      // y actualizar el tema anterior
      if (theme !== prevThemeRef.current) {
        prevThemeRef.current = theme;
        setShowFlash(false);
      }
    }
  }, [theme, easterEggsEnabled]);

  // Chinazo Trigger
  const handleChinazoTrigger = () => {
    if (!easterEggsEnabled) return;
    
    setShowChinazo(true);
    
    // Reproducir audio chinazo
    if (chinazioAudioRef.current) {
      chinazioAudioRef.current.currentTime = 0;
      chinazioAudioRef.current.play().catch(err => console.log('Chinazo audio prevented:', err));
    }
    
    // Ocultar después de 4 segundos (2s fade in + 2s fade out)
    setTimeout(() => {
      setShowChinazo(false);
    }, 4000);
  };

  // Kanye Trigger
  const handleKanyeTrigger = () => {
    if (!easterEggsEnabled) return;
    
    // Reproducir audio kanye
    if (kanyeAudioRef.current) {
      kanyeAudioRef.current.currentTime = 0;
      kanyeAudioRef.current.play().catch(err => console.log('Kanye audio prevented:', err));
    }

    // Mostrar imagen
    setShowKanye(true);
    setTimeout(() => {
      setShowKanye(false);
    }, 4000);
  };

  // Stop Kanye
  const handleStopKanye = () => {
    if (kanyeAudioRef.current) {
      kanyeAudioRef.current.pause();
      kanyeAudioRef.current.currentTime = 0;
    }
    setShowKanye(false);
  };

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'delete' | 'rename'
    data: null,
    title: '',
    inputValue: '',
    message: ''
  });

  // Resizer State
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e) => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (isResizing) {
      const newWidth = (e.clientX - 256) / (window.innerWidth - 256) * 100; // 256 is sidebar width
      if (newWidth > 20 && newWidth < 80) {
        setEditorWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Synchronized Scrolling
  useEffect(() => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;

    if (!textarea || !preview) return;

    const handleEditorScroll = () => {
      if (isScrolling.current) return;
      isScrolling.current = true;

      const percentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);

      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    };

    const handlePreviewScroll = () => {
      if (isScrolling.current) return;
      isScrolling.current = true;

      const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      textarea.scrollTop = percentage * (textarea.scrollHeight - textarea.clientHeight);

      setTimeout(() => {
        isScrolling.current = false;
      }, 50);
    };

    textarea.addEventListener('scroll', handleEditorScroll);
    preview.addEventListener('scroll', handlePreviewScroll);

    return () => {
      textarea.removeEventListener('scroll', handleEditorScroll);
      preview.removeEventListener('scroll', handlePreviewScroll);
    };
  }, []);

  // History management
  useEffect(() => {
    resetHistory();
  }, [currentId]);

  const updateContent = (value, skipHistory = false) => {
    if (!current) return;
    updateNoteContent(current.id, value);
    if (!skipHistory) {
      captureHistory(value);
    }
  };

  // Drag & Drop
  const { isDraggingFile, dragEvents } = useDragDrop((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result ?? "";
      importNote(file.name.replace(/\.[^/.]+$/, "") || file.name, String(text));
    };
    reader.readAsText(file);
  });

  // File Input
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result ?? "";
      importNote(file.name.replace(/\.[^/.]+$/, "") || file.name, String(text));
    };
    reader.readAsText(file);
  };

  const handleOpenFileClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  // Modal Handlers
  const requestDeleteNote = (id) => {
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
    deleteNoteFromStore(id);
    closeModal();
  };

  const requestRenameNote = (id) => {
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
      renameNoteInStore(id, newTitle);
    }
    closeModal();
  };

  const requestDeleteSelected = () => {
    setModalConfig({
      isOpen: true,
      type: 'delete',
      data: selectedNotes,
      title: 'Eliminar notas seleccionadas',
      message: `¿Estás seguro de que quieres eliminar ${selectedNotes.length} nota${selectedNotes.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    });
  };

  const confirmDeleteSelected = () => {
    const ids = modalConfig.data;
    deleteSelectedNotesFromStore(ids);
    closeModal();
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Copy Handler
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
    }, 1000);
  };

  // Shortcuts Helper
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

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    textareaRef,
    onNewNote: createNote,
    onSearchFocus: () => searchInputRef.current?.focus(),
    onBold: () => insertFormat('**', '**'),
    onItalic: () => insertFormat('*', '*'),
    onBold: () => insertFormat('**', '**'),
    onItalic: () => insertFormat('*', '*'),
    onLink: () => insertFormat('[', '](url)'),
    onStopKanye: handleStopKanye,
    onShowShortcuts: () => setShowShortcuts(true)
  });

  // Save Message
  let saveMessage = "Sin cambios";
  if (isSaving) {
    saveMessage = "Guardando...";
  } else if (lastSavedAt) {
    const time = lastSavedAt.toLocaleTimeString();
    saveMessage = `Cambios guardados ✔ (${time})`;
  }

  return (
    <div
      className={`h-screen overflow-hidden flex flex-col relative transition-colors duration-200 ${theme} ${easterEggsEnabled ? 'easter-eggs-enabled' : ''} ${theme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : 'bg-slate-100 text-slate-900'
        }`}
      {...dragEvents}
    >
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} theme={theme} />
      <DragOverlay isDragging={isDraggingFile} theme={theme} />

      {/* Flash Effect - Overlay blanco que se desvanece */}
      {showFlash && (
        <div
          className="fixed inset-0 bg-white pointer-events-none z-[9999]"
          style={{
            animation: 'flashFadeOut 7s ease-out forwards'
          }}
        />
      )}
      
      {/* Chinazo Effect - Imagen centrada */}
      {showChinazo && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
          <img 
            src="/chinazo.png" 
            alt="Chinazo" 
            className="w-auto h-auto min-w-[80vw] min-h-[80vh] max-w-full max-h-full object-contain"
            style={{
              animation: 'chinazoFade 4s linear forwards'
            }}
          />
        </div>
      )}

      {/* Kanye Overlay */}
      {showKanye && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-none">
          <img 
            src="/kanye.png" 
            alt="Kanye" 
            className="w-auto h-auto min-w-[80vw] min-h-[80vh] max-w-full max-h-full object-contain"
            style={{
              animation: 'chinazoFade 4s linear forwards'
            }}
          />
        </div>
      )}
      
      {/* Audio oculto para efecto flash */}
      <audio ref={flashAudioRef} src="/light-mode.mp3" preload="auto" />
      <audio ref={chinazioAudioRef} src="/chinazo-sound.mp3" preload="auto" />
      <audio ref={kanyeAudioRef} src="/kanye.mp3" preload="auto" />

      {/* Header removed */}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          notes={notes}
          currentId={currentId}
          setCurrentId={setCurrentId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          createNote={createNote}
          deleteNote={requestDeleteNote}
          renameNote={requestRenameNote}
          handleOpenFileClick={handleOpenFileClick}
          isSelectionMode={isSelectionMode}
          toggleSelectionMode={toggleSelectionMode}
          selectedNotes={selectedNotes}
          toggleNoteSelection={toggleNoteSelection}
          deleteSelectedNotes={requestDeleteSelected}
          clearSelection={() => toggleSelectionMode()} // Or clearSelection from hook if exposed, but toggle handles it
          reorderNotes={reorderNotes}
          theme={theme}
          toggleTheme={toggleTheme}
          searchInputRef={searchInputRef}
          easterEggsEnabled={easterEggsEnabled}
          setEasterEggsEnabled={setEasterEggsEnabled}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex overflow-hidden relative">
            <div style={{ width: `${editorWidth}%` }} className="h-full">
              <Editor
                content={current?.content ?? null}
                updateContent={updateContent}
                textareaRef={textareaRef}
                theme={theme}
                copied={copied}
                handleCopyClick={handleCopyClick}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>

            {/* Resizer */}
            <div
              className="absolute top-0 bottom-0 w-4 -ml-2 cursor-col-resize z-50 flex items-center justify-center group"
              style={{ left: `${editorWidth}%` }}
              onMouseDown={startResizing}
              onDoubleClick={() => setEditorWidth(50)}
            >
              {/* Visual Line */}
              <div className={`w-0.5 h-full flex items-center justify-center transition-colors duration-200
                ${theme === 'dark' ? 'bg-slate-700 hover:bg-emerald-500/50' : 'bg-slate-300 hover:bg-emerald-500/50'}
                ${isResizing ? '!bg-emerald-500' : ''}
              `}>
                {/* Pill */}
                <div className={`w-1 h-8 rounded-full transition-colors duration-200
                  ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}
                  ${isResizing || 'group-hover:bg-emerald-400'}
                `} />
              </div>
            </div>

            <div style={{ width: `${100 - editorWidth}%` }} className="h-full">
              <Preview
                content={current?.content}
                title={current?.title}
                theme={theme}
                previewRef={previewRef}
                easterEggsEnabled={easterEggsEnabled}
                onChinazoTrigger={handleChinazoTrigger}
                onKanyeTrigger={handleKanyeTrigger}
              />
            </div>
          </div>

          <footer
            className={`fixed bottom-0 left-64 right-0 h-8 border-t px-4 z-10
            text-xs flex items-center justify-between ${theme === 'dark'
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
        </main>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={handleFileInputChange}
      />

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
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              Nombre de la nota
            </label>
            <input
              ref={inputRef}
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-white border-slate-300 text-slate-900'
                }`}
              value={modalConfig.inputValue}
              onChange={(e) =>
                setModalConfig((prev) => ({ ...prev, inputValue: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
              }}
              autoFocus
            />
          </div>
        )}
      </Modal>
    </div >
  );
}

export default App;
