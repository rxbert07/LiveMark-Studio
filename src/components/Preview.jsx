import { useState, useRef, useEffect } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { html5Media } from "markdown-it-html5-media";
import html2pdf from "html2pdf.js";

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

export function Preview({ content, title, theme, previewRef }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    downloadFile(
      `${title || "nota"}.txt`,
      content || "",
      "text/plain;charset=utf-8"
    );
  };

  const downloadMd = () => {
    downloadFile(
      `${title || "nota"}.md`,
      content || "",
      "text/markdown;charset=utf-8"
    );
  };

  const downloadHtml = () => {
    const body = md.render(content || "");
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title || "Documento LiveMark"}</title>
</head>
<body>
${body}
</body>
</html>`;
    downloadFile(
      `${title || "nota"}.html`,
      html,
      "text/html;charset=utf-8"
    );
  };

  const downloadPdf = () => {
    // Elemento a exportar (usamos el contenido renderizado)
    // Creamos un elemento temporal para no afectar la vista actual
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: ${theme === 'dark' ? '#000' : 'inherit'}">
        <h1 style="text-align: center; margin-bottom: 30px;">${title || "Documento"}</h1>
        ${md.render(content || "")}
      </div>
    `;

    // Opciones de configuración
    const opt = {
      margin: 1,
      filename: `${title || "nota"}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generar PDF
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* Barra superior de preview + menú ⋮ */}
      <div className={`h-12 flex items-center px-4 border-b justify-between relative select-none ${theme === 'dark' ? 'text-slate-400 border-slate-800 bg-slate-950/50' : 'text-slate-600 border-slate-200 bg-slate-50/50'
        }`}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-70">
            <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="text-xs font-medium tracking-wide uppercase opacity-90">Vista previa</span>
        </div>

        {/* Botón menú ⋮ */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 flex items-center gap-1 font-medium disabled:opacity-40 ${theme === 'dark'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30'
            : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-500/30'
            }`}
          disabled={!content && content !== ""}
          title="Descargar / Exportar"
        >
          {/* Icono de descarga */}
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
            className="w-3.5 h-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown de acciones */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className={`absolute top-full right-0 mt-1 max-w-[16.875rem]
           border rounded-lg shadow-xl w-fit min-w-[11.25rem] z-50 text-sm p-1.5
           ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 text-slate-800'}
           `}
          >
            <button
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 ${theme === 'dark'
                ? 'hover:bg-emerald-500/10 hover:text-emerald-400'
                : 'hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              onClick={() => {
                downloadTxt();
                setIsMenuOpen(false);
              }}
            >
              Descargar como .txt
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 ${theme === 'dark'
                ? 'hover:bg-emerald-500/10 hover:text-emerald-400'
                : 'hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              onClick={() => {
                downloadMd();
                setIsMenuOpen(false);
              }}
            >
              Descargar como .md
            </button>
            <button
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 ${theme === 'dark'
                ? 'hover:bg-emerald-500/10 hover:text-emerald-400'
                : 'hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              onClick={() => {
                downloadHtml();
                setIsMenuOpen(false);
              }}
            >
              Exportar como HTML
            </button>

            <button
              className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-150 ${theme === 'dark'
                ? 'hover:bg-emerald-500/10 hover:text-emerald-400'
                : 'hover:bg-emerald-50 hover:text-emerald-700'
                }`}
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
      <div className={`flex-1 p-4 pb-10 overflow-auto text-sm leading-relaxed ${theme === 'dark' ? '' : 'bg-white'
        }`}
        ref={previewRef}
      >
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
            __html: md.render(content || ""),
          }}
        />
      </div>
    </div>
  );
}
