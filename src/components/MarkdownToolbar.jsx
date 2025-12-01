import React from 'react';

/**
 * MarkdownToolbar Component
 * 
 * Barra de herramientas para formateo de Markdown con botones interactivos.
 * 
 * Características:
 * - Formato de texto: Negrita, Cursiva, Código inline y bloques
 * - Encabezados: H1, H2, H3
 * - Listas y citas
 * - Inserción de enlaces, imágenes, video y audio
 * - Tooltips con atajos de teclado
 * - Soporte para tema claro/oscuro
 * 
 * @param {Object} props
 * @param {React.RefObject} props.textareaRef - Referencia al textarea del editor
 * @param {Function} props.onUpdate - Callback para actualizar el contenido
 * @param {string} props.theme - Tema actual ('light' | 'dark')
 */

export function MarkdownToolbar({ textareaRef, onUpdate, theme }) {
  if (!textareaRef) return null;

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selection = text.substring(start, end);

    const newText = text.substring(0, start) + before + selection + after + text.substring(end);

    // Actualizar contenido
    onUpdate(newText);

    // Restaurar foco y selección
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selection.length + after.length;
      textarea.setSelectionRange(
        start + before.length,
        selection ? start + before.length + selection.length : start + before.length
      );
    }, 0);
  };

  const insertBlock = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    // Encontrar el inicio de la línea actual
    let lineStart = text.lastIndexOf('\n', start - 1) + 1;

    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);

    onUpdate(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    }, 0);
  };

  const toolbarClass = theme === 'dark'
    ? 'border-slate-700/50 bg-slate-800/50'
    : 'border-slate-200 bg-slate-50';

  const separatorClass = theme === 'dark'
    ? 'bg-slate-700'
    : 'bg-slate-300';

  return (
    <div className={`flex items-center gap-1 p-2 border-b overflow-x-auto ${toolbarClass}`}>
      <ToolbarButton onClick={() => insertText('**', '**')} title="Negrita (Ctrl+B)" theme={theme}>
        <BIcon />
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('*', '*')} title="Cursiva (Ctrl+I)" theme={theme}>
        <IIcon />
      </ToolbarButton>
      <div className={`w-px h-4 mx-1 ${separatorClass}`} />

      <ToolbarButton onClick={() => insertBlock('# ')} title="Título 1" theme={theme}>H1</ToolbarButton>
      <ToolbarButton onClick={() => insertBlock('## ')} title="Título 2" theme={theme}>H2</ToolbarButton>
      <ToolbarButton onClick={() => insertBlock('### ')} title="Título 3" theme={theme}>H3</ToolbarButton>
      <div className={`w-px h-4 mx-1 ${separatorClass}`} />

      <ToolbarButton onClick={() => insertText('`', '`')} title="Código" theme={theme}>
        <CodeIcon />
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('```\n', '\n```')} title="Bloque de código" theme={theme}>
        <CodeBlockIcon />
      </ToolbarButton>
      <div className={`w-px h-4 mx-1 ${separatorClass}`} />

      <ToolbarButton onClick={() => insertBlock('- ')} title="Lista" theme={theme}>
        <ListIcon />
      </ToolbarButton>
      <ToolbarButton onClick={() => insertBlock('> ')} title="Cita" theme={theme}>
        <QuoteIcon />
      </ToolbarButton>
      <div className={`w-px h-4 mx-1 ${separatorClass}`} />

      <ToolbarButton onClick={() => insertText('[', '](url)')} title="Enlace (Ctrl+K)" theme={theme}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton onClick={() => insertText('![', '](url)')} title="Imagen" theme={theme}>
        <ImageIcon />
      </ToolbarButton>
    </div>
  );
}


function ToolbarButton({ onClick, children, title, theme }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const buttonRef = React.useRef(null);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });

  const btnClass = theme === 'dark'
    ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50';

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top - 35,
        left: rect.left + rect.width / 2
      });
      setShowTooltip(true);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={`p-1.5 rounded-lg transition-colors ${btnClass}`}
      >
        {children}
      </button>

      {/* Fixed Tooltip */}
      {showTooltip && (
        <div
          className={`fixed px-2 py-1 text-xs rounded whitespace-nowrap pointer-events-none transition-opacity duration-200 z-[9999] -translate-x-1/2 ${theme === 'dark'
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'bg-slate-700 text-white'
            }`}
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
        >
          {title}
          {/* Arrow */}
          <span
            className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${theme === 'dark' ? 'border-t-slate-800' : 'border-t-slate-700'
              }`}
          ></span>
        </div>
      )}
    </>
  );
}

// Iconos simples SVG
const BIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
);

const IIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
);

const CodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

const CodeBlockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

const QuoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


