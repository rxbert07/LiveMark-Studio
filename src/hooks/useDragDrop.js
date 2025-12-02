import { useState, useRef } from "react";

export function useDragDrop(onFileDrop) {
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const dragCounterRef = useRef(0);

    const handleGlobalDragEnter = (e) => {
        e.preventDefault();
        dragCounterRef.current++;

        if (e.dataTransfer?.types?.includes('Files')) {
            setIsDraggingFile(true);
        }
    };

    const handleGlobalDragOver = (e) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy";
        }
    };

    const handleGlobalDragLeave = (e) => {
        e.preventDefault();
        dragCounterRef.current--;

        if (dragCounterRef.current === 0) {
            setIsDraggingFile(false);
        }
    };

    const handleGlobalDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        dragCounterRef.current = 0;

        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        onFileDrop(file);
    };

    return {
        isDraggingFile,
        dragEvents: {
            onDragEnter: handleGlobalDragEnter,
            onDragOver: handleGlobalDragOver,
            onDragLeave: handleGlobalDragLeave,
            onDrop: handleGlobalDrop
        }
    };
}
