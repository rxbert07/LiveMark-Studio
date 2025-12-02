import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

const STORAGE_KEY = "livemark-notes-v1";

export function useNotes() {
  const [notes, setNotes] = useState(() => {
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

    const first = {
      id: nanoid(),
      title: "Bienvenido 👋",
      content: `# Hola LiveMark\n\nEmpieza escribiendo Markdown aquí.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [first];
  });

  const [currentId, setCurrentId] = useState(() => notes[0]?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  // Auto-save
  useEffect(() => {
    if (typeof window === "undefined") return;

    queueMicrotask(() => setIsSaving(true));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));

    const t = setTimeout(() => {
      setIsSaving(false);
      setLastSavedAt(new Date());
    }, 300);

    return () => clearTimeout(t);
  }, [notes]);

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
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    if (currentId === id) {
      setCurrentId(newNotes.length > 0 ? newNotes[0].id : null);
    }
  };

  const renameNote = (id, newTitle) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, title: newTitle } : note
      )
    );
  };

  const updateNoteContent = (id, content) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, content, updatedAt: new Date().toISOString() }
          : n
      )
    );
  };

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

  const importNote = (title, content) => {
    const newNote = {
      id: nanoid(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setCurrentId(newNote.id);
  };

  // Selection helpers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotes([]);
  };

  const toggleNoteSelection = (id) => {
    setSelectedNotes(prev => 
      prev.includes(id) 
        ? prev.filter(noteId => noteId !== id)
        : [...prev, id]
    );
  };

  const deleteSelectedNotes = (ids) => {
    const newNotes = notes.filter(note => !ids.includes(note.id));
    setNotes(newNotes);
    
    if (ids.includes(currentId)) {
      setCurrentId(newNotes.length > 0 ? newNotes[0].id : null);
    }
    
    setSelectedNotes([]);
    setIsSelectionMode(false);
  };

  return {
    notes,
    currentId,
    setCurrentId,
    isSaving,
    lastSavedAt,
    createNote,
    deleteNote,
    renameNote,
    updateNoteContent,
    reorderNotes,
    importNote,
    isSelectionMode,
    toggleSelectionMode,
    selectedNotes,
    setSelectedNotes,
    toggleNoteSelection,
    deleteSelectedNotes
  };
}
