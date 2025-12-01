import { useState, useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar({
  notes,
  currentId,
  setCurrentId,
  searchQuery,
  setSearchQuery,
  createNote,
  deleteNote,
  renameNote,
  handleOpenFileClick,
  isSelectionMode,
  toggleSelectionMode,
  selectedNotes,
  toggleNoteSelection,
  deleteSelectedNotes,
  clearSelection,
  reorderNotes,
  theme,
  toggleTheme, // Add toggleTheme prop
  searchInputRef // Accepted as prop
}) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const fileInputRef = useRef(null);

  const filteredNotes = notes.filter(note => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
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

  return (
    <aside className={`w-64 border-r flex flex-col relative ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200'
      }`}>

      {/* Header inside Sidebar */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className={`font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>LiveMark Studio</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div className="px-4 py-4">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200
              ${theme === 'dark'
                ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-emerald-500/50'
                : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-emerald-500/50'
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
        <button
          onClick={createNote}
          className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-sm text-white transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] mb-3 font-medium flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Nueva nota
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleOpenFileClick}
            className={`flex-1 px-2 py-2 rounded-lg border text-xs transition-all duration-200 flex items-center justify-center gap-1 font-medium ${theme === 'dark'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
              : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-500/30'
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
            className={`flex-1 px-2 py-2 rounded-lg border text-xs transition-all duration-200 flex items-center justify-center gap-1 font-medium ${isSelectionMode
              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
              : theme === 'dark'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-500/30'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            Seleccionar
          </button>
        </div>
      </div>

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
            className={`px-3 py-3 cursor-pointer group 
              flex items-center justify-between transition-all duration-200 ease-in-out relative mb-1 mx-2 rounded-lg border
              ${theme === 'dark'
                ? (
                  selectedNotes.includes(note.id)
                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                    : note.id === currentId
                      ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1'
                )
                : (
                  selectedNotes.includes(note.id)
                    ? 'bg-emerald-50 border-emerald-500/50 text-emerald-600'
                    : note.id === currentId
                      ? 'bg-emerald-50 border-emerald-500/50 text-emerald-600'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
                )
              }
              ${draggedId === note.id ? "opacity-40 cursor-grabbing" : ""}
              ${dragOverId === note.id && draggedId !== note.id ? "border-t-2 border-t-emerald-500" : ""}
            `}
          >
            {isSelectionMode && (
              <input
                type="checkbox"
                checked={selectedNotes.includes(note.id)}
                onChange={() => toggleNoteSelection(note.id)}
                onClick={(e) => e.stopPropagation()}
                className="mr-2 w-4 h-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500"
              />
            )}

            {/* File Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`w-4 h-4 mr-2 ${note.id === currentId || selectedNotes.includes(note.id)
                ? 'text-inherit'
                : 'text-slate-500 group-hover:text-inherit'
                }`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>

            <span className="truncate flex-1 font-medium">{note.title}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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

      {isSelectionMode && selectedNotes.length > 0 && (
        <div className={`absolute bottom-0 left-0 right-0 p-2.5 border-t flex items-center justify-between ${theme === 'dark'
          ? 'bg-slate-950 border-slate-700'
          : 'bg-white border-slate-200'
          }`}>
          <span className="text-xs font-medium">
            {selectedNotes.length} seleccionada{selectedNotes.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={deleteSelectedNotes}
              className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs transition-all duration-200 shadow-sm hover:shadow flex items-center gap-1 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
              Eliminar
            </button>
            <button
              onClick={clearSelection}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-200 font-medium ${theme === 'dark'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-500/30'
                }`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
