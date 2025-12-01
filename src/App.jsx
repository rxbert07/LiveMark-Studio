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
  const { captureHistory, undo, redo, resetHistory } = useHistory();

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

  // Refs
  const textareaRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null, // 'delete' | 'rename'
    data: null,
    title: '',
    inputValue: '',
    message: ''
  });

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
    onLink: () => insertFormat('[', '](url)'),
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
      className={`h-screen overflow-hidden flex flex-col relative transition-colors duration-200 ${theme} ${theme === 'dark'
        ? 'bg-slate-900 text-slate-100'
        : 'bg-slate-100 text-slate-900'
        }`}
      {...dragEvents}
    >
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} theme={theme} />
      <DragOverlay isDragging={isDraggingFile} theme={theme} />

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
        />

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex overflow-hidden">
            <Editor
              content={current?.content ?? null}
              updateContent={updateContent}
              textareaRef={textareaRef}
              theme={theme}
              copied={copied}
              handleCopyClick={handleCopyClick}
            />
            <Preview
              content={current?.content}
              title={current?.title}
              theme={theme}
            />
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
    </div>
  );
}

export default App;
