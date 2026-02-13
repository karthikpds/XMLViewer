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
}

export function FileViewer({ content, fileName, highlightIndex, matchLength }: FileViewerProps) {
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
            const textarea = textareaRef.current;

            // Strategy: Mirror Div Calculation with Delay
            // We wrap in timeout to ensure the new content is fully rendered and layout is stable
            // before we calculate the scroll position. 
            // This is critical when switching files (where content prop changes).

            setTimeout(() => {
                const mirror = document.createElement('div');
                const style = window.getComputedStyle(textarea);

                // Copy relevant styles
                Array.from(style).forEach((key) => {
                    mirror.style.setProperty(key, style.getPropertyValue(key));
                });

                // Overwrite specific layout styles
                mirror.style.position = 'absolute';
                mirror.style.top = '0';
                mirror.style.left = '-9999px';
                mirror.style.visibility = 'hidden';
                mirror.style.height = 'auto';
                mirror.style.width = style.width;
                mirror.style.maxWidth = style.maxWidth;
                mirror.style.overflow = 'hidden';
                mirror.style.whiteSpace = 'pre-wrap';
                mirror.style.wordWrap = 'break-word';

                const textBefore = textarea.value.substring(0, highlightIndex);
                mirror.textContent = textBefore;

                if (textBefore.endsWith('\n')) {
                    mirror.textContent += '\u200b';
                }

                document.body.appendChild(mirror);
                const targetHeight = mirror.offsetHeight;
                document.body.removeChild(mirror);

                const viewHeight = textarea.clientHeight;

                // Disable smooth scrolling temporarily for the jump
                textarea.style.scrollBehavior = 'auto';

                textarea.scrollTop = Math.max(0, targetHeight - (viewHeight / 3));

                // Restore smooth scrolling (optional, but let's keep it auto for now to ensure robustness)
                // textarea.style.scrollBehavior = originalBehavior;

                textarea.focus();
                textarea.setSelectionRange(highlightIndex, highlightIndex + matchLength);

                // Trigger blur/focus cycle
                textarea.blur();
                textarea.focus();
            }, 100);
        }
    }, [highlightIndex, matchLength, content]);

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
