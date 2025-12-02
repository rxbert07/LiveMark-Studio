import { useState, useRef, useEffect } from "react";

export function useHistory(initialContent = "") {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const historyTimeoutRef = useRef(null);
    const isUndoRedoRef = useRef(false);

    // Reset history when initialContent changes significantly (e.g. switching notes)
    // Note: This logic might need to be handled by the consumer to avoid resetting on every keystroke
    // For now, we'll expose a reset function.

    const captureHistory = (content, force = false) => {
        if (isUndoRedoRef.current) return;

        const now = Date.now();

        if (history.length === 0 || force) {
            const newHistory = [...history.slice(0, historyIndex + 1), { content, timestamp: now }];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            return;
        }

        if (historyTimeoutRef.current) {
            clearTimeout(historyTimeoutRef.current);
        }

        historyTimeoutRef.current = setTimeout(() => {
            setHistory(prev => {
                const newHistory = [...prev.slice(0, historyIndex + 1), { content, timestamp: Date.now() }];
                setHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        }, 1000);
    };

    const undo = (callback) => {
        if (historyIndex > 0) {
            isUndoRedoRef.current = true;
            const newIndex = historyIndex - 1;
            const previousState = history[newIndex];

            setHistoryIndex(newIndex);
            callback(previousState.content);

            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 50);
        }
    };

    const redo = (callback) => {
        if (historyIndex < history.length - 1) {
            isUndoRedoRef.current = true;
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];

            setHistoryIndex(newIndex);
            callback(nextState.content);

            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 50);
        }
    };

    const resetHistory = () => {
        setHistory([]);
        setHistoryIndex(-1);
        isUndoRedoRef.current = false;
        if (historyTimeoutRef.current) {
            clearTimeout(historyTimeoutRef.current);
        }
    };

    return {
        captureHistory,
        undo,
        redo,
        resetHistory,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
}
