import { MarkdownToolbar } from "./MarkdownToolbar";

export function Editor({ content, updateContent, textareaRef, theme, copied, handleCopyClick, onUndo, onRedo, canUndo, canRedo }) {
    return (
        <div className={`flex flex-col h-full ${theme === 'dark' ? 'border-slate-800' : 'border-slate-300'
            }`}>
            <div className={`h-12 flex items-center justify-between px-4 border-b select-none relative z-20 ${theme === 'dark'
                ? 'text-slate-400 border-slate-800 bg-slate-950/50'
                : 'text-slate-600 border-slate-200 bg-slate-50/50'
                }`}>
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-70">
                        <path d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                    </svg>
                    <span className="text-xs font-medium tracking-wide uppercase opacity-90">Editor</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className={`w-fit px-2 py-1.5 rounded-lg flex items-center justify-center 
         transition-all duration-200 group relative ${theme === 'dark'
                                ? 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                                : 'bg-emerald-50 border border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50'
                            }`}
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
            </div>

            {/* Toolbar estático */}
            <MarkdownToolbar
                textareaRef={textareaRef}
                onUpdate={updateContent}
                theme={theme}
                onUndo={onUndo}
                onRedo={onRedo}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            <textarea
                ref={textareaRef}
                className={`flex-1 p-3 pb-10 text-sm font-mono outline-none resize-none transition-colors duration-200 overflow-auto
          ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`}
                value={content || ""}
                onChange={(e) => updateContent(e.target.value)}
                disabled={content === null}
            />
        </div>
    );
}
