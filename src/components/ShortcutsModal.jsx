function ShortcutItem({ keys, description, theme }) {
    return (
        <div className={`flex justify-between items-center p-2 rounded ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
            }`}>
            <span>{description}</span>
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className={`px-2 py-0.5 text-xs rounded border font-mono ${theme === 'dark'
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

export function ShortcutsModal({ isOpen, onClose, theme }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}>
            <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 text-slate-800'
                }`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Atajos de Teclado</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-emerald-500">
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
    );
}
