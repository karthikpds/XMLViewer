
import { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import './index.css';
import { Sidebar } from './components/Sidebar';
import type { FileData } from './components/Sidebar';
import { FileViewer } from './components/FileViewer';
import { SearchPanel } from './components/SearchPanel';
import type { SearchResult } from './components/SearchPanel';
import { formatXml } from './utils/formatXml';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [highlightMatch, setHighlightMatch] = useState<{ index: number, length: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  // Helper to format attributes
  const formatAttributes = (el: Element) => {
    if (!el.hasAttributes()) return '';
    const attrs = Array.from(el.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ');
    return ` ${attrs}`;
  };

  const startResizing = useCallback(() => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'auto';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
      if (newWidth > 200 && newWidth < 800) {
        setRightSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const handleFileUpload = async (file: File) => {
    try {
      const loadedFiles: FileData[] = [];
      const timestamp = Date.now();

      if (file.name.endsWith('.xml')) {
        const content = await file.text();
        loadedFiles.push({
          id: `${timestamp}-${file.name}`,
          name: file.name,
          path: file.name,
          content: formatXml(content)
        });
      } else if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const filePromises: Promise<void>[] = [];

        let index = 0;
        contents.forEach((_, zipEntry) => {
          if (!zipEntry.dir && (zipEntry.name.endsWith('.xml') || zipEntry.name.endsWith('.html') || zipEntry.name.endsWith('.csv'))) {
            const promise = zipEntry.async('string').then((content) => {
              const isXml = zipEntry.name.endsWith('.xml');
              loadedFiles.push({
                id: `${timestamp}-${index++}-${zipEntry.name}`,
                name: zipEntry.name.split('/').pop() || zipEntry.name,
                path: zipEntry.name,
                content: isXml ? formatXml(content) : content
              });
            });
            filePromises.push(promise);
          }
        });
        await Promise.all(filePromises);
      } else {
        alert("Please upload a .zip or .xml file.");
        return;
      }

      loadedFiles.sort((a, b) => a.name.localeCompare(b.name));

      setFiles(prev => {
        // Append new files to existing ones
        // Optional: Check for duplicates if needed, but unique IDs allow multiples
        return [...prev, ...loadedFiles];
      });

      // Select the first of the *new* files if any
      if (loadedFiles.length > 0) setSelectedFile(loadedFiles[0]);
    } catch (error) {
      console.error("Failed to load file", error);
      alert("Failed to load content.");
    }
  };

  const handleSelectFile = (file: FileData) => {
    setSelectedFile(file);
    setHighlightMatch(null);
  };

  const handleRemoveFile = (fileToRemove: FileData) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileToRemove.id);
      return newFiles;
    });

    if (selectedFile?.id === fileToRemove.id) {
      setSelectedFile(null);
      setHighlightMatch(null);
    }
  };

  const handleSearch = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const results: SearchResult[] = [];
      const parser = new DOMParser();

      files.forEach((file) => {
        if (!file.name.endsWith('.xml')) return;

        try {
          const doc = parser.parseFromString(file.content, "text/xml");
          if (doc.querySelector('parsererror')) return;

          const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
          let currentNode = walker.nextNode();
          let fileMatchCount = 0;

          // Helper to find raw index
          let lastRawIndex = 0;
          const lowerContent = file.content.toLowerCase();
          const lowerQuery = query.toLowerCase();

          while (currentNode) {
            let isMatch = false;
            let matchContextNode: Element | null = null;
            let matchLineContent = "";
            let matchTargetStr = "";

            if (currentNode.nodeType === Node.ELEMENT_NODE) {
              const el = currentNode as Element;
              // Check Tag Name
              if (el.tagName.toLowerCase().includes(lowerQuery)) {
                isMatch = true;
                matchContextNode = el;
                matchTargetStr = "<" + el.tagName;

                // Show full line content if short
                if (el.textContent && el.textContent.length < 50 && el.childElementCount === 0) {
                  matchLineContent = `<${el.tagName}${formatAttributes(el)}>${el.textContent}</${el.tagName}>`;
                } else {
                  matchLineContent = `<${el.tagName}${formatAttributes(el)}>`;
                }
              }
              // Check Attributes
              else if (el.hasAttributes()) {
                for (let i = 0; i < el.attributes.length; i++) {
                  const attr = el.attributes[i];
                  if (attr.name.toLowerCase().includes(lowerQuery)) {
                    isMatch = true;
                    matchLineContent = `<${el.tagName}${formatAttributes(el)}>`;
                    matchContextNode = el;
                    matchTargetStr = attr.name;
                    break;
                  } else if (attr.value.toLowerCase().includes(lowerQuery)) {
                    isMatch = true;
                    matchLineContent = `<${el.tagName}${formatAttributes(el)}>`;
                    matchContextNode = el;
                    matchTargetStr = attr.value;
                    break;
                  }
                }
              }
            } else if (currentNode.nodeType === Node.TEXT_NODE) {
              const val = currentNode.nodeValue;
              if (val && val.toLowerCase().includes(lowerQuery)) {
                isMatch = true;
                matchContextNode = currentNode.parentElement;
                if (matchContextNode) {
                  matchLineContent = `<${matchContextNode.tagName}${formatAttributes(matchContextNode)}>${val}</${matchContextNode.tagName}>`;
                } else {
                  matchLineContent = val;
                }
                matchTargetStr = val;
              }
            }

            if (isMatch && matchContextNode) {
              // Find the specific match target in raw content
              let actualStartIndex = -1;
              const searchStr = matchTargetStr.toLowerCase() || lowerQuery;
              const foundIndex = lowerContent.indexOf(searchStr, lastRawIndex);

              if (foundIndex !== -1) {
                const queryIndex = lowerContent.indexOf(lowerQuery, foundIndex);
                if (queryIndex !== -1) {
                  actualStartIndex = queryIndex;
                  lastRawIndex = queryIndex + 1;
                } else {
                  lastRawIndex = foundIndex + 1;
                }
              } else {
                const fallbackIndex = lowerContent.indexOf(lowerQuery, lastRawIndex);
                if (fallbackIndex !== -1) {
                  actualStartIndex = fallbackIndex;
                  lastRawIndex = fallbackIndex + 1;
                }
              }

              const parent1 = matchContextNode.parentElement;
              const parent2 = parent1?.parentElement;

              const contextItems = [];
              if (parent2) {
                contextItems.push({
                  text: `<${parent2.tagName}${formatAttributes(parent2)}>`,
                  indent: 0
                });
              }
              if (parent1) {
                contextItems.push({
                  text: `<${parent1.tagName}${formatAttributes(parent1)}>`,
                  indent: parent2 ? 1 : 0
                });
              }
              contextItems.push({
                text: matchLineContent,
                indent: (parent2 ? 1 : 0) + (parent1 ? 1 : 0),
                isMatch: true
              });

              results.push({
                id: `${file.path}-${results.length}`,
                fileName: file.name,
                context: contextItems,
                startIndex: actualStartIndex,
                length: query.length,
                matchIndex: fileMatchCount
              });
              fileMatchCount++;
            }
            currentNode = walker.nextNode();
          }
        } catch (e) {
          console.error("Parse error", e);
        }
      });
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  }, [files]);

  const handleResultClick = (result: SearchResult & { matchIndex?: number }) => {
    const targetFile = files.find(f => f.name === result.fileName);

    if (targetFile) {
      setSelectedFile(targetFile);

      if (result.startIndex !== undefined && result.startIndex >= 0) {
        setHighlightMatch({ index: result.startIndex, length: result.length });
      } else {
        // Fallback
        const query = (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || "";
        if (query) {
          const indices: number[] = [];
          let i = -1;
          while ((i = targetFile.content.indexOf(query, i + 1)) !== -1) {
            indices.push(i);
          }
          const targetIndex = indices[result.matchIndex || 0];
          if (targetIndex !== undefined) {
            setHighlightMatch({ index: targetIndex, length: query.length });
          } else if (indices.length > 0) {
            setHighlightMatch({ index: indices[0], length: query.length });
          }
        }
      }
    }
  };

  return (
    <div
      className="app-layout bg-[var(--bg-color)]"
      style={{ gridTemplateColumns: `250px 1fr ${rightSidebarWidth}px` }}
    >
      <Sidebar
        files={files}
        onFileSelect={handleFileUpload}
        onSelectFile={handleSelectFile}
        onRemoveFile={handleRemoveFile}
        selectedFile={selectedFile}
      />
      <div className="h-full overflow-hidden relative border-r border-[var(--border-color)]">
        <FileViewer
          key={selectedFile?.path}
          content={selectedFile?.content || null}
          fileName={selectedFile?.name || null}
          highlightIndex={highlightMatch?.index}
          matchLength={highlightMatch?.length}
        />
      </div>

      {/* Resizer Handle */}
      <div
        className="glass-panel h-full overflow-hidden border-l border-[var(--border-color)] relative"
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            cursor: 'col-resize',
            zIndex: 100,
            backgroundColor: isResizing ? 'var(--accent-color)' : 'transparent',
            transition: 'background-color 0.2s'
          }}
          onMouseDown={startResizing}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.5)'}
          onMouseLeave={(e) => !isResizing && (e.currentTarget.style.backgroundColor = 'transparent')}
        />
        <SearchPanel
          onSearch={handleSearch}
          results={searchResults}
          onResultClick={handleResultClick}
          isSearching={isSearching}
        />
      </div>
    </div>
  );
}

export default App;
