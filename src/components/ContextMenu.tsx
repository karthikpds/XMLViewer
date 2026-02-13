import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, FileCode } from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onExtract: () => void;
    onExtractFields: () => void;
}

export function ContextMenu({ x, y, onClose, onExtract, onExtractFields }: ContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        // Use capture to handle events before others
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [onClose]);

    // Handle "Copy" - Basic implementation triggers browser copy if possible, 
    // or copies the selection manually if we have access to it.
    // Since we prevented default context menu, we need to replicate Copy.
    const handleCopy = () => {
        const selection = window.getSelection();
        if (selection) {
            navigator.clipboard.writeText(selection.toString());
        }
        onClose();
    };

    const menuStyle: React.CSSProperties = {
        top: y,
        left: x,
        position: 'fixed',
        zIndex: 9999, // Super high z-index
    };

    // Calculate position adjustment to stay on screen
    // We can do this with a ref callback or layout effect, but simple offset logic helps
    // Assume width 200px approx
    if (x + 200 > window.innerWidth) {
        menuStyle.left = x - 200;
    }
    if (y + 100 > window.innerHeight) {
        menuStyle.top = y - 100;
    }

    return createPortal(
        <div
            ref={ref}
            className="rounded-lg py-1 w-52 flex flex-col overflow-hidden"
            style={{
                ...menuStyle,
                backgroundColor: '#f8fafc', // Slate-50 (Light)
                border: '1px solid #cbd5e1', // Slate-300
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
                color: '#0f172a' // Slate-900
            }}
            onContextMenu={(e) => e.preventDefault()} // Prevent native menu on our menu
        >
            <button
                onClick={onExtract}
                className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-[#3b82f6] hover:text-white transition-colors"
                style={{ color: 'inherit' }}
            >
                <FileCode className="w-4 h-4" />
                Extract All
            </button>

            <button
                onClick={onExtractFields}
                className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-[#3b82f6] hover:text-white transition-colors"
                style={{ color: 'inherit' }}
            >
                <div className="w-4 h-4 flex items-center justify-center font-mono text-[10px] border border-current rounded bg-transparent">
                    {/* Manual icon for fields */}
                    fx
                </div>
                Extract Fields...
            </button>

            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

            <button
                onClick={handleCopy}
                className="w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 hover:bg-[#3b82f6] hover:text-white transition-colors"
                style={{ color: 'inherit' }}
            >
                <Copy className="w-4 h-4" />
                Copy Text
            </button>
        </div>,
        document.body
    );
}
