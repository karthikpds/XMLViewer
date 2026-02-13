
import { useState, useEffect } from 'react';
import { X, Plus, Check, Save, FolderOpen, Trash2 } from 'lucide-react';

interface FieldSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fields: string[]) => void;
    availableFields: string[];
}

interface SavedPreset {
    name: string;
    fields: string[];
    createdAt: number;
}

const PRESETS_STORAGE_KEY = 'xmlviewer-field-presets';

function loadPresets(): SavedPreset[] {
    try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function savePresetsToStorage(presets: SavedPreset[]) {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export function FieldSelectionModal({ isOpen, onClose, onSubmit, availableFields }: FieldSelectionModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [presets, setPresets] = useState<SavedPreset[]>([]);
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [showPresets, setShowPresets] = useState(false);

    // Load presets + reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFields([]);
            setInputValue('');
            setPresets(loadPresets());
            setShowSaveInput(false);
            setPresetName('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddField = (field: string) => {
        if (field && !selectedFields.includes(field)) {
            setSelectedFields([...selectedFields, field]);
        }
        setInputValue('');
    };

    const handleRemoveField = (field: string) => {
        setSelectedFields(selectedFields.filter(f => f !== field));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddField(inputValue);
        }
    };

    const filteredAvailable = availableFields.filter(f =>
        f.toLowerCase().includes(inputValue.toLowerCase()) && !selectedFields.includes(f)
    );

    const handleExtract = () => {
        let fieldsToExtract = [...selectedFields];
        if (inputValue && !fieldsToExtract.includes(inputValue)) {
            fieldsToExtract.push(inputValue);
        }

        if (fieldsToExtract.length > 0) {
            onSubmit(fieldsToExtract);
        }
    };

    const handleSavePreset = () => {
        if (!presetName.trim() || selectedFields.length === 0) return;
        const newPreset: SavedPreset = {
            name: presetName.trim(),
            fields: [...selectedFields],
            createdAt: Date.now()
        };
        const updated = [...presets.filter(p => p.name !== newPreset.name), newPreset];
        setPresets(updated);
        savePresetsToStorage(updated);
        setShowSaveInput(false);
        setPresetName('');
    };

    const handleLoadPreset = (preset: SavedPreset) => {
        setSelectedFields([...preset.fields]);
        setShowPresets(false);
    };

    const handleDeletePreset = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = presets.filter(p => p.name !== name);
        setPresets(updated);
        savePresetsToStorage(updated);
    };

    const handleSaveKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSavePreset();
        }
        if (e.key === 'Escape') {
            setShowSaveInput(false);
            setPresetName('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            padding: '1rem'
        }}>
            <div style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                width: '100%',
                maxWidth: '56rem',
                height: '70vh',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                overflow: 'hidden'
            }}>

                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Select Fields to Extract
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Load Preset Button */}
                        {presets.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowPresets(!showPresets)}
                                    title="Load saved preset"
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        color: 'var(--accent-color)',
                                        cursor: 'pointer',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 500
                                    }}
                                >
                                    <FolderOpen style={{ width: '14px', height: '14px' }} />
                                    Presets ({presets.length})
                                </button>

                                {/* Presets Dropdown */}
                                {showPresets && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '4px',
                                        backgroundColor: 'var(--bg-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        zIndex: 10,
                                        minWidth: '280px',
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}>
                                        <div style={{
                                            padding: '8px 12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            borderBottom: '1px solid var(--border-color)'
                                        }}>
                                            Saved Presets
                                        </div>
                                        {presets.map(preset => (
                                            <div
                                                key={preset.name}
                                                onClick={() => handleLoadPreset(preset)}
                                                style={{
                                                    padding: '10px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--surface-color)')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                            >
                                                <div>
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-primary)'
                                                    }}>
                                                        {preset.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--text-secondary)',
                                                        marginTop: '2px'
                                                    }}>
                                                        {preset.fields.length} fields · {preset.fields.slice(0, 3).join(', ')}{preset.fields.length > 3 ? '...' : ''}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeletePreset(preset.name, e)}
                                                    title="Delete preset"
                                                    style={{
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        flexShrink: 0
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                                                >
                                                    <Trash2 style={{ width: '14px', height: '14px' }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={onClose} style={{
                            padding: '4px',
                            borderRadius: '50%',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            background: 'transparent',
                            border: 'none'
                        }}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body - scrollable */}
                <div style={{
                    padding: '1.5rem',
                    overflowY: 'auto',
                    minHeight: 0
                }}>

                    {/* Input */}
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Add Field or XPath
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g. ID, INVOICE/DATE..."
                                style={{
                                    flex: 1,
                                    backgroundColor: 'var(--bg-color)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                            <button
                                onClick={() => handleAddField(inputValue)}
                                disabled={!inputValue}
                                style={{
                                    backgroundColor: 'var(--bg-color)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    cursor: inputValue ? 'pointer' : 'default',
                                    opacity: inputValue ? 1 : 0.5
                                }}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Selected Fields */}
                    {selectedFields.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>Selected ({selectedFields.length})</span>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {/* Save as Preset button */}
                                    <button
                                        onClick={() => setShowSaveInput(!showSaveInput)}
                                        style={{
                                            color: 'var(--accent-color)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            background: 'transparent',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Save style={{ width: '12px', height: '12px' }} />
                                        Save Preset
                                    </button>
                                    <button onClick={() => setSelectedFields([])} style={{
                                        color: 'var(--accent-color)',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        background: 'transparent',
                                        border: 'none',
                                        textDecoration: 'underline'
                                    }}>Clear All</button>
                                </div>
                            </div>

                            {/* Save Preset Input */}
                            {showSaveInput && (
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem',
                                    padding: '0.5rem',
                                    backgroundColor: 'rgba(56, 189, 248, 0.05)',
                                    border: '1px solid rgba(56, 189, 248, 0.15)',
                                    borderRadius: '8px'
                                }}>
                                    <input
                                        type="text"
                                        value={presetName}
                                        onChange={(e) => setPresetName(e.target.value)}
                                        onKeyDown={handleSaveKeyDown}
                                        placeholder="Enter preset name..."
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'var(--bg-color)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            padding: '0.375rem 0.75rem',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSavePreset}
                                        disabled={!presetName.trim()}
                                        style={{
                                            backgroundColor: 'var(--accent-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.375rem 0.75rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            cursor: presetName.trim() ? 'pointer' : 'default',
                                            opacity: presetName.trim() ? 1 : 0.5
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => { setShowSaveInput(false); setPresetName(''); }}
                                        style={{
                                            color: 'var(--text-secondary)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0.375rem'
                                        }}
                                    >
                                        <X style={{ width: '14px', height: '14px' }} />
                                    </button>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {selectedFields.map(field => (
                                    <span key={field} style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                        color: 'var(--accent-color)',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        padding: '0.25rem 0.625rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.875rem'
                                    }}>
                                        {field}
                                        <button onClick={() => handleRemoveField(field)} style={{
                                            cursor: 'pointer',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'inherit',
                                            padding: 0
                                        }}>
                                            <X style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Fields */}
                    <div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Available Fields ({filteredAvailable.length})
                        </div>
                        {availableFields.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No child tags found.
                            </p>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '0.5rem'
                            }}>
                                {filteredAvailable.map(field => (
                                    <button
                                        key={field}
                                        onClick={() => handleAddField(field)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '8px',
                                            backgroundColor: 'var(--bg-color)',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.875rem',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <span style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={field}>{field}</span>
                                        <Plus style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - always visible */}
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            background: 'transparent',
                            border: 'none'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExtract}
                        disabled={selectedFields.length === 0 && !inputValue}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: (selectedFields.length === 0 && !inputValue) ? 'rgba(56, 189, 248, 0.5)' : 'var(--accent-color)',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: (selectedFields.length === 0 && !inputValue) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px rgba(56, 189, 248, 0.2)'
                        }}
                    >
                        <Check style={{ width: '16px', height: '16px' }} />
                        Extract Values
                    </button>
                </div>
            </div>
        </div>
    );
}
