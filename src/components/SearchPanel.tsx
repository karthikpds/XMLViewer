import { Search } from 'lucide-react';

export interface SearchResult {
    id: string;
    fileName: string;
    context: { text: string; indent: number; isMatch?: boolean }[];
    startIndex: number;
    length: number;
    matchIndex?: number;
}

interface SearchPanelProps {
    onSearch: (query: string) => void;
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
    isSearching: boolean;
}

export function SearchPanel({ onSearch, results, onResultClick, isSearching }: SearchPanelProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="border-b border-[var(--border-color)] flex items-center" style={{ height: '60px', padding: '0 16px' }}>
                <div className="relative w-full">
                    <Search
                        className="absolute h-4 w-4 text-[var(--text-secondary)]"
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search in XMLs..."
                        className="w-full rounded bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] text-sm"
                        style={{
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            paddingLeft: '16px',
                            paddingRight: '40px',
                            boxSizing: 'border-box',
                            height: '38px'
                        }}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                {isSearching && <div className="text-center text-sm text-[var(--text-secondary)]">Searching...</div>}

                {!isSearching && results.length === 0 ? (
                    <div className="text-[var(--text-secondary)] text-xs text-center">No results found</div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {results.map((result) => (
                            <button
                                key={result.id}
                                onClick={() => onResultClick(result)}
                                className="flex flex-col gap-1 p-3 rounded bg-[var(--surface-color)] border border-[var(--border-color)] hover:bg-[var(--surface-hover)] text-left group transition-all"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] uppercase tracking-wider text-[var(--accent-color)] font-bold truncate max-w-[150px]">
                                        {result.fileName}
                                    </span>
                                </div>

                                {/* Parent Context Tree */}
                                <div className="flex flex-col gap-1 text-xs text-[var(--text-secondary)] font-mono pl-2 border-l-2 border-[var(--border-color)] group-hover:border-[var(--accent-color)]">
                                    {result.context.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`truncate ${item.isMatch ? 'text-[var(--accent-color)] font-bold' : ''}`}
                                            style={{ paddingLeft: `${item.indent * 12}px` }}
                                            title={item.text}
                                        >
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
