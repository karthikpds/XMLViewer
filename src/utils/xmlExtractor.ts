/**
 * Extracts values of all elements matching the given path hierarchy.
 * Returns an array of objects representing the extracted data.
 */
/**
 * Extracts values of all elements matching the given path hierarchy.
 * Returns an array of objects representing the extracted data.
 * @param fields Optional list of specific fields (XPaths or tag names) to extract.
 */
export function extractValuesByPath(xml: string, path: string[], fields?: string[]) {
    try {
        const parser = new DOMParser();
        let doc = parser.parseFromString(xml, "text/xml");

        // Check for parse error and retry with wrapper if needed (handles multi-root/fragments)
        if (doc.querySelector('parsererror')) {
            console.warn("Initial parse failed. Retrying with wrapper and sanitization.");

            // 1. Strip XML declaration
            let cleanXml = xml.replace(/<\?xml.*?\?>/g, '');

            // 2. Escape unescaped ampersands (common cause of "xmlParseEntityRef: no name")
            // Matches '&' that is NOT followed by a valid entity (amp, lt, gt, quot, apos, or decimal/hex char ref)
            cleanXml = cleanXml.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');

            doc = parser.parseFromString(`<__XML_Fragment_Root__>${cleanXml}</__XML_Fragment_Root__>`, "text/xml");

            if (doc.querySelector('parsererror')) {
                console.error("XML Parse Error (even with wrapper)");
                // Log the parser error text for debugging
                const err = doc.querySelector('parsererror')?.textContent;
                console.error("Parser Error Details:", err);
                return [];
            }
        }

        const results: Record<string, string>[] = [];
        const targetTag = path[path.length - 1];

        const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);
        let currentNode = walker.nextNode();

        while (currentNode) {
            const el = currentNode as Element;

            if (checkTagMatch(el.tagName, targetTag)) {
                // Verify Hierarchy
                // Walk up parents to see if they match the path stack (reversed)
                let parent = el.parentElement;
                let pathIdx = path.length - 2; // Start checking from parent of target
                let matchesPath = true;

                while (pathIdx >= 0 && parent) {
                    // Skip wrapper root if present
                    if (parent.tagName === '__XML_Fragment_Root__') {
                        parent = parent.parentElement;
                        continue;
                    }

                    if (!checkTagMatch(parent.tagName, path[pathIdx])) {
                        // Console warning temporarily removed to reduce noise once fixed, 
                        // but logic is now robust.
                        matchesPath = false;
                        break;
                    }
                    parent = parent.parentElement;
                    pathIdx--;
                }

                if (matchesPath && pathIdx < 0) {
                    // Match found

                    // 1. Search for parent "LINE" tag with ID
                    let lineId: string | null = null;
                    let p = el.parentElement;
                    while (p) {
                        if (p.tagName === 'LINE' && p.getAttribute('ID')) {
                            lineId = p.getAttribute('ID');
                            break;
                        }
                        p = p.parentElement;
                    }

                    // 2. Search for parent "TAX" tag and get "AUTHORITY_NAME" child
                    let authorityName: string | null = null;
                    let pTax = el.parentElement;
                    while (pTax) {
                        if (pTax.tagName === 'TAX') {
                            const authChild = Array.from(pTax.children).find(c => c.tagName === 'AUTHORITY_NAME');
                            if (authChild) {
                                authorityName = authChild.textContent;
                            }
                            break;
                        }
                        pTax = pTax.parentElement;
                    }

                    const rowData: Record<string, string> = {};
                    if (lineId) rowData['LINE_ID'] = lineId;
                    if (authorityName) rowData['AUTHORITY_NAME'] = authorityName;

                    if (fields && fields.length > 0) {
                        // Extract specific fields using robust path traversal
                        fields.forEach(field => {
                            rowData[field] = getChildValueByPath(el, field);
                        });
                        results.push(rowData);
                    } else {
                        // Default: Extract direct children
                        const children = Array.from(el.children);
                        if (children.length > 0) {
                            children.forEach(child => {
                                rowData[child.tagName] = child.textContent || '';
                            });
                            results.push(rowData);
                        } else {
                            // Simple Value
                            rowData['Value'] = el.textContent || '';
                            results.push(rowData);
                        }
                    }
                }
            }
            currentNode = walker.nextNode();
        }

        return results;

    } catch (e) {
        console.error("Extraction Failed", e);
        return [];
    }
}

/**
 * Scans the XML for the given path and returns all unique child tag names found.
 * Useful for populating the "Extract Fields" dropdown.
 */
export function getUniqueKeys(xml: string, path: string[]): string[] {
    // Re-use extraction logic to find nodes, but collecting keys instead of values.
    // This is a simplified version of extractValuesByPath
    try {
        const parser = new DOMParser();
        let doc = parser.parseFromString(xml, "text/xml");

        if (doc.querySelector('parsererror')) {
            let cleanXml = xml.replace(/<\?xml.*?\?>/g, '').replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/gi, '&amp;');
            doc = parser.parseFromString(`<__XML_Fragment_Root__>${cleanXml}</__XML_Fragment_Root__>`, "text/xml");
        }

        const keys = new Set<string>();
        const targetTag = path[path.length - 1];

        const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);
        let currentNode = walker.nextNode();

        while (currentNode) {
            const el = currentNode as Element;
            if (checkTagMatch(el.tagName, targetTag)) {
                // Verify Hierarchy
                let parent = el.parentElement;
                let pathIdx = path.length - 2;
                let matchesPath = true;
                while (pathIdx >= 0 && parent) {
                    if (parent.tagName === '__XML_Fragment_Root__') { parent = parent.parentElement; continue; }
                    if (!checkTagMatch(parent.tagName, path[pathIdx])) { matchesPath = false; break; }
                    parent = parent.parentElement;
                    pathIdx--;
                }

                if (matchesPath && pathIdx < 0) {
                    // Collect all descendant paths recursively
                    collectDescendantPaths(el, '', keys);
                }
            }
            currentNode = walker.nextNode();
        }
        return Array.from(keys).sort();
    } catch (e) {
        console.error("getUniqueKeys Failed", e);
        return [];
    }
}

function collectDescendantPaths(el: Element, currentPath: string, keys: Set<string>) {
    Array.from(el.children).forEach(child => {
        const fullPath = currentPath ? `${currentPath}/${child.tagName}` : child.tagName;
        keys.add(fullPath);
        collectDescendantPaths(child, fullPath, keys);
    });
}

/**
 * Traverses an element down a specific path (e.g. "Child/GrandChild") using lenient matching.
 * Only returns textContent for leaf elements (no child elements).
 */
function getChildValueByPath(root: Element, pathStr: string): string {
    const parts = pathStr.split('/');
    let current: Element | null = root;

    for (const part of parts) {
        if (!current) return '';
        const found: Element | undefined = Array.from(current.children).find(c => checkTagMatch(c.tagName, part));
        current = found || null;
    }

    if (!current) return '';

    // Only return textContent for leaf elements (no child elements)
    // For parent elements, return empty to avoid dumping all descendant text
    if (current.children.length === 0) {
        return current.textContent || '';
    }

    // For parent elements, collect only direct text nodes (not descendant text)
    let directText = '';
    current.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const trimmed = (node.textContent || '').trim();
            if (trimmed) directText += trimmed + ' ';
        }
    });
    return directText.trim();
}

/**
 * Helper to check if tags match loosely (case-insensitive, ignoring namespace prefix)
 */
function checkTagMatch(domTag: string, pathTag: string): boolean {
    if (domTag === pathTag) return true;
    if (domTag.toLowerCase() === pathTag.toLowerCase()) return true;

    // Check local name (strip namespace)
    const domLocal = domTag.includes(':') ? domTag.split(':')[1] : domTag;
    const pathLocal = pathTag.includes(':') ? pathTag.split(':')[1] : pathTag;

    return domLocal === pathLocal || domLocal.toLowerCase() === pathLocal.toLowerCase();
}
