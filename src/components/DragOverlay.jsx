export function DragOverlay({ isDragging, theme }) {
    if (!isDragging) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm 
                    flex items-center justify-center pointer-events-none
                    animate-in fade-in duration-200">
            <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 shadow-2xl ${theme === 'dark'
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
    );
}
