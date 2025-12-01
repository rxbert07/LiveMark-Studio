import { useState } from "react";
import { MarkdownToolbar } from "./MarkdownToolbar";

export function Editor({ content, updateContent, textareaRef, theme, copied, handleCopyClick }) {
    return (
        <div className={`w-1/2 flex flex-col border-r ${theme === 'dark' ? 'border-slate-800' : 'border-slate-300'
            }`}>
            <div className={`h-10 flex items-center justify-between px-3 text-xs border-b ${theme === 'dark'
                ? 'text-slate-400 border-slate-800 bg-slate-950'
                : 'text-slate-600 border-slate-200 bg-slate-50'
                }`}>
                <p>Editor (Markdown)</p>
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

            {/* Toolbar de formato */}
            <MarkdownToolbar textareaRef={textareaRef} onUpdate={updateContent} theme={theme} />

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
