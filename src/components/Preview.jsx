import { useState, useRef, useEffect } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { html5Media } from "markdown-it-html5-media";
import html2pdf from "html2pdf.js";
import mermaid from "mermaid";
import katex from "katex";
import "katex/dist/katex.min.css";
import markdownItKatex from "markdown-it-katex";

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  html: true,
});

md.use(html5Media);
md.use(markdownItKatex);

// Agregar soporte para resaltado de código y diagramas Mermaid
const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const code = token.content;
  const lang = token.info.trim();

  // Mermaid diagrams
  if (lang === 'mermaid') {
    return `<div class="mermaid" style="white-space: pre-wrap">${md.utils.escapeHtml(code)}</div>`;
  }

  // Syntax highlighting
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

// Custom Image Renderer to support YouTube embeds
const defaultImageRenderer = md.renderer.rules.image || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src');
  const alt = token.content;
  
  if (src) {
    // YouTube Detection
    const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return `
        <div class="video-wrapper my-4 relative w-full" style="padding-bottom: 56.25%; height: 0;">
          <iframe 
            class="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            src="https://www.youtube.com/embed/${videoId}" 
            title="${alt || 'YouTube video player'}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
    }
  }

  return defaultImageRenderer(tokens, idx, options, env, self);
};

// Función para aplicar efecto rainbow a palabras específicas
const applyRainbowEffect = (html, enabled) => {
  if (!enabled) return html;
  
  // Palabras que activan el efecto rainbow
  const triggerWords = ['gai', 'gei', 'gey', 'gay', 'homo'];
  
  // Crear un patrón regex que busque estas palabras (case insensitive)
  // Usamos word boundaries (\b) para evitar coincidencias parciales
  const pattern = new RegExp(`\\b(${triggerWords.join('|')})\\b`, 'gi');
  
  // Reemplazar las palabras encontradas con un span que tenga la clase rainbow-text
  // Evitamos reemplazar dentro de tags HTML usando un enfoque más seguro
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Función recursiva para procesar nodos de texto
  const processTextNodes = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (pattern.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(pattern, '<span class="rainbow-text">$1</span>');
        node.parentNode.replaceChild(span, node);
        // Normalizar para combinar nodos de texto adyacentes
        span.parentNode.normalize();
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'CODE' && node.tagName !== 'PRE') {
      // No procesar dentro de bloques de código
      Array.from(node.childNodes).forEach(processTextNodes);
    }
  };
  
  processTextNodes(tempDiv);
  return tempDiv.innerHTML;
};


export function Preview({ content, title, theme, previewRef, easterEggsEnabled, onChinazoTrigger, onKanyeTrigger }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'paper'
  const menuRef = useRef(null);
  const containerRef = useRef(null);
  const contentRef = useRef(null); // Ref para el div de contenido (renderizado HTML)
  const rainbowAudioRef = useRef(null); // Ref para el audio del efecto rainbow
  const previousContentRef = useRef(''); // Ref para trackear contenido anterior


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

  // 🔹 Manejar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) setViewMode('full'); // Resetear al salir
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 🔹 Inicializar Mermaid con configuración de tema
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, [theme]);

  // 🔹 Actualizar HTML del preview manualmente (evita destruir SVGs de Mermaid)
  useEffect(() => {
    if (contentRef.current && content !== undefined) {
      const renderedHtml = md.render(content || "");
      const processedHtml = applyRainbowEffect(renderedHtml, easterEggsEnabled);
      contentRef.current.innerHTML = processedHtml;
      
      if (easterEggsEnabled) {
        // --- RAINBOW AUDIO LOGIC ---
        // Función para contar cuántas palabras rainbow hay
        const countRainbowWords = (html) => {
          const matches = html.match(/class="rainbow-text"/g);
          return matches ? matches.length : 0;
        };
        
        // Contar palabras rainbow en contenido anterior y actual
        const previousRendered = md.render(previousContentRef.current || "");
        const previousProcessed = applyRainbowEffect(previousRendered, true);
        const previousCount = countRainbowWords(previousProcessed);
        const currentCount = countRainbowWords(processedHtml);
        
        // Reproducir audio si hay MÁS palabras rainbow que antes
        if (currentCount > previousCount) {
          setTimeout(() => {
            if (rainbowAudioRef.current) {
              rainbowAudioRef.current.currentTime = 0;
              rainbowAudioRef.current.play().catch(err => {
                console.log('Audio playback prevented by browser:', err);
              });
            }
          }, 100);
        }

        // --- CHINAZO LOGIC ---
        // Lista expandida de chinazos y groserías
        const countChinazoWords = (text) => {
          if (!text) return 0;
          // Regex con todas las palabras trigger
          const matches = text.match(/dick|pene|pipe|dildo|guebo|guevo|huevo|ñema|pito|bolas|boludo|pinga|verga|totón|chocha|cuca|papaya|bollo|güevo|mondongo|culo|culito|trasero|coño|carajo|mierda|joder|mamarracho|maldito|cabrón|desgraciado|mamón|mamona|idiota|imbécil|marico|marica|estúpido|baboso|bobo|gafo|pajúo|zángano|ladilla|mamahuevo|mojón|cagada|cagón|cagar|cagarte|pedo|mearse|meado|nigga|negro|nut|venirse|vengo|cum|cummear|cumear|leche/gi);
          return matches ? matches.length : 0;
        };

        const prevChinazoCount = countChinazoWords(previousContentRef.current);
        const currChinazoCount = countChinazoWords(content);

        // Si hay más palabras chinazo que antes, activar trigger
        if (currChinazoCount > prevChinazoCount && onChinazoTrigger) {
          onChinazoTrigger();
        }

        // --- KANYE LOGIC ---
        const countKanyeWords = (text) => {
          if (!text) return 0;
          const matches = text.match(/kanye/gi);
          return matches ? matches.length : 0;
        };

        const prevKanyeCount = countKanyeWords(previousContentRef.current);
        const currKanyeCount = countKanyeWords(content);

        if (currKanyeCount > prevKanyeCount && onKanyeTrigger) {
          onKanyeTrigger();
        }
      }
      
      // Actualizar el contenido anterior para la próxima comparación
      previousContentRef.current = content || '';
    }
  }, [content, easterEggsEnabled, onChinazoTrigger, onKanyeTrigger]);

  // 🔹 Renderizar diagramas Mermaid cuando cambia el contenido
  useEffect(() => {
    let timeoutId;
    if (content) {
      timeoutId = setTimeout(async () => {
        try {
          const mermaidDivs = document.querySelectorAll('.mermaid');
          if (mermaidDivs.length > 0) {
            await mermaid.run({
              nodes: Array.from(mermaidDivs),
              suppressErrors: true
            });
          }
        } catch (err) {
          console.error('Error rendering Mermaid diagrams:', err);
        }
      }, 300);
    }
    return () => clearTimeout(timeoutId);
  }, [content]);

  // 🔹 Re-renderizar Mermaid al cambiar tema (para actualizar colores)
  useEffect(() => {
    const mermaidDivs = document.querySelectorAll('.mermaid');
    if (mermaidDivs.length > 0 && content && contentRef.current) {
      const renderedHtml = md.render(content);
      const processedHtml = applyRainbowEffect(renderedHtml, easterEggsEnabled);
      contentRef.current.innerHTML = processedHtml;
      setTimeout(async () => {
        const freshNodes = document.querySelectorAll('.mermaid');
        if (freshNodes.length > 0) {
          try {
            await mermaid.run({ nodes: Array.from(freshNodes), suppressErrors: true });
          } catch (err) {
            console.error('Error re-rendering Mermaid on theme change:', err);
          }
        }
      }, 100);
    }
  }, [theme, easterEggsEnabled]);


  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

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
    <div
      ref={containerRef}
      className={`relative flex flex-col overflow-hidden h-full transition-colors duration-300 ${isFullscreen
        ? theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'
        : ''
        }`}
    >
      {/* Barra superior de preview + menú ⋮ */}
      <div className={`h-12 flex items-center px-4 border-b justify-between absolute top-0 left-0 right-0 z-10 select-none transition-colors duration-300 
        ${theme === 'dark'
          ? `text-slate-400 border-slate-800 ${isFullscreen ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-slate-950/80 backdrop-blur-md'}`
          : `text-slate-600 border-slate-200 ${isFullscreen ? 'bg-slate-50/80 backdrop-blur-md' : 'bg-slate-50/80 backdrop-blur-md'}`
        }`}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-70">
            <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="text-xs font-medium tracking-wide uppercase opacity-90">Vista previa</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Controles de vista (solo en pantalla completa) */}
          {isFullscreen && (
            <div className={`flex items-center gap-1 mr-2 pr-2 border-r ${theme === 'dark' ? 'border-slate-700' : 'border-slate-300'}`}>
              <button
                onClick={() => setViewMode('full')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'full'
                  ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  : 'opacity-50 hover:opacity-100'
                  }`}
                title="Vista completa"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('paper')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'paper'
                  ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  : 'opacity-50 hover:opacity-100'
                  }`}
                title="Vista documento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </button>
            </div>
          )}

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className={`px-2 py-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center ${theme === 'dark'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
              : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50'
              }`}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            )}
          </button>

          {/* Botón menú ⋮ */}
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1 font-medium disabled:opacity-40 ${theme === 'dark'
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
              : 'bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100/50'
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
              className="w-5 h-5"
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
        </div>

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
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isFullscreen && viewMode === 'paper'
        ? 'pt-20 px-8 pb-8 flex justify-center bg-transparent'
        : 'pt-16 px-4 pb-10'
        } ${theme === 'dark' ? '' : isFullscreen ? '' : 'bg-white'}`}
        ref={previewRef}
      >
        <div
          ref={contentRef}
          className={`h-fit
            transition-all duration-300
            ${isFullscreen && viewMode === 'paper'
              ? `max-w-3xl w-full mx-auto shadow-2xl rounded-xl p-12 min-h-[calc(100vh-8rem)] ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`
              : 'w-full max-w-none h-fit'
            }
            [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:border-b [&>h1]:pb-2
            [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h2]:border-b [&>h2]:pb-2
            [&>h3]:border-b [&>h3]:pb-1
            [&>p]:mb-2
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-1
            [&>a]:text-emerald-400 [&>a]:underline

            [&>pre]:border [&>pre]:rounded [&>pre]:p-3 [&>pre]:mt-3 [&>pre]:mb-3
            [&>pre]:overflow-auto [&>pre]:text-sm [&>pre]:font-mono
            
            [&>pre_code]:bg-transparent [&>pre_code]:p-0 [&>pre_code]:m-0 [&>pre_code]:block

            [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-[.0625rem]
            [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:font-mono

            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
            [&_th]:border [&_th]:px-4 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-left
            [&_td]:border [&_td]:px-4 [&_td]:py-2

            [&>blockquote]:border-l-4 [&>blockquote]:pl-4 [&>blockquote]:my-4 [&>blockquote]:italic

            ${theme === 'dark'
              ? '[&>pre]:bg-slate-800 [&>pre]:border-slate-700 [&>pre_code]:text-slate-200 [&_code:not(pre_code)]:bg-slate-800 [&>h1]:border-slate-700 [&>h2]:border-slate-700 [&>h3]:border-slate-700 [&_th]:border-slate-700 [&_th]:bg-slate-800 [&_td]:border-slate-700 [&>blockquote]:border-slate-600 [&>blockquote]:text-slate-400'
              : '[&>pre]:bg-slate-100 [&>pre]:border-slate-200 [&>pre_code]:text-slate-800 [&_code:not(pre_code)]:bg-slate-100 [&>h1]:border-slate-200 [&>h2]:border-slate-200 [&>h3]:border-slate-200 [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_td]:border-slate-200 [&>blockquote]:border-slate-300 [&>blockquote]:text-slate-600'}
          `}
        />
      </div>

      {/* Audio para efecto rainbow (oculto) */}
      <audio ref={rainbowAudioRef} src="/rainbow-effect.mp3" preload="auto" />
    </div>
  );
}
