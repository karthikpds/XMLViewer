import { Upload, FileCode, FileText, File, X } from 'lucide-react';
import React, { useRef } from 'react';

export interface FileData {
    id: string;
    name: string;
    path: string;
    content: string;
}

interface SidebarProps {
    files: FileData[];
    onFileSelect: (file: File) => void;
    onSelectFile: (file: FileData) => void;
    onRemoveFile: (file: FileData) => void;
    selectedFile: FileData | null;
}

export function Sidebar({ files, onFileSelect, onSelectFile, onRemoveFile, selectedFile }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
            // Reset value so we can select same file again if needed
            event.target.value = '';
        }
    };

    const getIcon = (name: string) => {
        if (name.endsWith('.xml')) return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
        if (name.endsWith('.html')) return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
        return <File className="w-4 h-4 text-gray-400 shrink-0" />;
    };

    return (
        <div className="glass-panel h-full flex flex-col border-r border-[var(--border-color)]">
            <div className="border-b border-[var(--border-color)] flex justify-between items-center" style={{ height: '60px', padding: '0 16px' }}>
                <h2 className="font-bold text-lg">Files</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleUploadClick}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors"
                        title="Upload File"
                    >
                        <Upload className="w-5 h-5 text-[var(--accent-color)]" />
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".zip,.xml"
                    onChange={handleFileChange}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {files.length === 0 ? (
                    <div className="text-[var(--text-secondary)] text-sm text-center mt-10 p-4">
                        Upload a .zip or .xml file to view contents.
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className={`group flex items-center justify-between p-2 rounded text-sm transition-colors cursor-pointer ${selectedFile?.id === file.id
                                    ? 'bg-[var(--accent-color)] text-[#0f172a] font-medium'
                                    : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                                    }`}
                                onClick={() => onSelectFile(file)}
                            >
                                <div className="flex items-center gap-2 truncate flex-1 block">
                                    {getIcon(file.name)}
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFile(file);
                                    }}
                                    className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${selectedFile?.id === file.id ? 'hover:bg-black/10' : 'hover:bg-white/10'}`}
                                    title="Close file"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
