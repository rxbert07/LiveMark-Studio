import React from 'react';

/**
 * EasterEggsToggle Component
 * 
 * Botón toggle para activar/desactivar efectos especiales "Easter Eggs"
 * como el efecto rainbow text y otros efectos visuales/audio.
 * 
 * @param {Object} props
 * @param {boolean} props.enabled - Estado actual del toggle
 * @param {Function} props.onToggle - Callback para cambiar el estado
 * @param {string} props.theme - Tema actual ('light' | 'dark')
 */
export function EasterEggsToggle({ enabled, onToggle, theme }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition-all duration-200 ${
        theme === 'dark'
          ? enabled
            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            : 'text-slate-400 hover:bg-slate-700/50'
          : enabled
          ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
          : 'text-slate-600 hover:bg-slate-200'
      }`}
      title={enabled ? 'Desactivar Easter Eggs' : 'Activar Easter Eggs'}
      aria-label={enabled ? 'Desactivar Easter Eggs' : 'Activar Easter Eggs'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        {enabled ? (
          // Icono de estrella (activado)
          <>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </>
        ) : (
          // Icono de estrella outline (desactivado)
          <>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" />
          </>
        )}
      </svg>
    </button>
  );
}
