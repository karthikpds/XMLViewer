
import { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface FieldSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fields: string[]) => void;
    availableFields: string[];
}

export function FieldSelectionModal({ isOpen, onClose, onSubmit, availableFields }: FieldSelectionModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFields([]);
            setInputValue('');
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
                maxWidth: '32rem',
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
                                justifyContent: 'space-between'
                            }}>
                                <span>Selected ({selectedFields.length})</span>
                                <button onClick={() => setSelectedFields([])} style={{
                                    color: 'var(--accent-color)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    background: 'transparent',
                                    border: 'none',
                                    textDecoration: 'underline'
                                }}>Clear All</button>
                            </div>
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
                                gridTemplateColumns: '1fr 1fr',
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
