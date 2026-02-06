import { X, Copy } from 'lucide-react';
import { useState } from 'react';

interface ExtractionModalProps {
    isOpen: boolean;
    onClose: () => void;
    path: string[];
    values: { value: string }[];
}

export function ExtractionModal({ isOpen, onClose, path, values }: ExtractionModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        const text = values.map(v => v.value).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#1e293b] border border-[var(--border-color)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--accent-color)]">Extraction Results</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                            Path: {path.join(' > ')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--surface-hover)] text-xs hover:text-[var(--accent-color)] transition-colors"
                        >
                            <Copy className="w-3 h-3" />
                            {copied ? 'Copied!' : 'Copy All'}
                        </button>
                        <button onClick={onClose} className="p-1 hover:text-white text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0">
                    {values.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-secondary)]">
                            No values found for this element.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[var(--text-secondary)] bg-[var(--bg-color)] sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium border-b border-[var(--border-color)] w-16 text-center">#</th>
                                    <th className="px-4 py-3 font-medium border-b border-[var(--border-color)]">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {values.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--surface-color)] group">
                                        <td className="px-4 py-2 text-center text-[var(--text-secondary)] font-mono text-xs select-none">{idx + 1}</td>
                                        <td className="px-4 py-2 font-mono text-[var(--text-primary)] break-all">{item.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex justify-between">
                    <span>{values.length} result{values.length !== 1 ? 's' : ''} found</span>
                </div>
            </div>
        </div>
    );
}
