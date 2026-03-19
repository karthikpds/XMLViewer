import { useEffect, useRef, useState } from 'react';
import { getPathAtIndex } from '../utils/xmlPathFinder';
import { extractValuesByPath, getUniqueKeys } from '../utils/xmlExtractor';
import { ContextMenu } from './ContextMenu';
import { ExtractionModal } from './ExtractionModal';
import { FieldSelectionModal } from './FieldSelectionModal';

interface FileViewerProps {
    content: string | null;
    fileName: string | null;
    highlightIndex?: number | null; // Start index of the match
    matchLength?: number;
    highlightNonce?: number; // Forces re-navigation when clicking the same result twice
}

export function FileViewer({ content, fileName, highlightIndex, matchLength, highlightNonce }: FileViewerProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Context Menu State
    const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
    const [targetPath, setTargetPath] = useState<string[] | null>(null);

    // Extraction Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [extractionData, setExtractionData] = useState<{ path: string[], values: Record<string, string>[] }>({ path: [], values: [] });

    // Field Selection State
    const [isFieldSelectOpen, setIsFieldSelectOpen] = useState(false);
    const [availableFields, setAvailableFields] = useState<string[]>([]);

    // Handle Right Click
    const handleContextMenu = (e: React.MouseEvent) => {
        if (!content) return;

        const textarea = textareaRef.current;
        if (textarea) {
            // Get cursor index from the click position
            // Note: selectionStart matches the click position usually for right click if not selecting range
            const index = textarea.selectionStart;

            // Normalize content to match textarea's behavior (LF only) to prevent index drift
            const normalizedContent = content.replace(/\r\n/g, '\n');

            // Find logic path
            const path = getPathAtIndex(normalizedContent, index);

            if (path) {
                e.preventDefault();
                setTargetPath(path);
                setMenuPos({ x: e.clientX, y: e.clientY });
            }
        }
    };

    const handleExtract = () => {
        if (content && targetPath) {
            const values = extractValuesByPath(content, targetPath);
            setExtractionData({ path: targetPath, values });
            setIsModalOpen(true);
            setMenuPos(null);
        }
    };

    const handleExtractFields = () => {
        if (content && targetPath) {
            const fields = getUniqueKeys(content, targetPath);
            setAvailableFields(fields);
            setIsFieldSelectOpen(true);
            setMenuPos(null);
        }
    };

    const executeFieldExtraction = (selectedFields: string[]) => {
        if (content && targetPath) {
            const values = extractValuesByPath(content, targetPath, selectedFields);
            setExtractionData({ path: targetPath, values });
            setIsFieldSelectOpen(false);
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        if (highlightIndex !== undefined && highlightIndex !== null && textareaRef.current && matchLength) {
            let cancelled = false;

            // Use a timeout to let React StrictMode complete its mount cycle
            // and ensure the textarea has been laid out by the browser.
            const doScroll = () => {
                if (cancelled) return;
                const textarea = textareaRef.current;
                if (!textarea) return;

                // If the textarea hasn't computed its layout yet (scrollHeight is too small),
                // retry after a short delay. This handles large files that take time to lay out.
                if (textarea.scrollHeight <= textarea.clientHeight) {
                    setTimeout(doScroll, 100);
                    return;
                }

                // Count newlines before the target to determine vertical position.
                const textBefore = textarea.value.substring(0, highlightIndex);
                const linesBefore = (textBefore.match(/\n/g) || []).length;
                const totalLines = (textarea.value.match(/\n/g) || []).length + 1;
                const pixelsPerLine = textarea.scrollHeight / totalLines;
                const targetPixel = linesBefore * pixelsPerLine;

                const targetScroll = Math.max(0, targetPixel - (textarea.clientHeight / 3));

                // Order matters: focus() resets scrollTop, so we must set scroll AFTER focus.
                textarea.focus();
                textarea.setSelectionRange(highlightIndex, highlightIndex + matchLength);
                textarea.style.scrollBehavior = 'auto';
                textarea.scrollTop = targetScroll;
            };
            const timer = setTimeout(doScroll, 50);

            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }
    }, [highlightIndex, matchLength, content, highlightNonce]);

    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-[var(--border-color)] bg-[var(--surface-color)] flex items-center justify-center" style={{ height: '60px', padding: '0 16px' }}>
                <h2 className="font-bold truncate text-center">{fileName || 'No file selected'}</h2>
            </div>
            <div className="flex-1 relative bg-[var(--bg-color)] h-full overflow-hidden">
                {content ? (
                    <textarea
                        ref={textareaRef}
                        readOnly
                        value={content}
                        onContextMenu={handleContextMenu}
                        className="w-full h-full resize-none bg-[var(--bg-color)] text-[var(--text-primary)] font-mono text-sm p-4 focus:outline-none border-none block"
                        spellCheck={false}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)] text-center p-4">
                        Select a file to view its content.
                    </div>
                )}
            </div>

            {/* Popups */}
            {menuPos && (
                <ContextMenu
                    x={menuPos.x}
                    y={menuPos.y}
                    onClose={() => setMenuPos(null)}
                    onExtract={handleExtract}
                    onExtractFields={handleExtractFields}
                />
            )}

            <ExtractionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                path={extractionData.path}
                values={extractionData.values}
            />

            <FieldSelectionModal
                isOpen={isFieldSelectOpen}
                onClose={() => setIsFieldSelectOpen(false)}
                onSubmit={executeFieldExtraction}
                availableFields={availableFields}
            />
        </div>
    );
}
