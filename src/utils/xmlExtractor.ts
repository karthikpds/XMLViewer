/**
 * Extracts values of all elements matching the given path hierarchy.
 * Returns an array of objects representing the extracted data.
 */
export function extractValuesByPath(xml: string, path: string[]) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");

        if (doc.querySelector('parsererror')) {
            console.error("XML Parse Error");
            return [];
        }

        const results: Record<string, string>[] = [];
        const targetTag = path[path.length - 1];

        const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, null);
        let currentNode = walker.nextNode();

        while (currentNode) {
            const el = currentNode as Element;

            if (el.tagName === targetTag) {
                // Verify Hierarchy
                // Walk up parents to see if they match the path stack (reversed)
                let parent = el.parentElement;
                let pathIdx = path.length - 2; // Start checking from parent of target
                let matchesPath = true;

                while (pathIdx >= 0 && parent) {
                    if (parent.tagName !== path[pathIdx]) {
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

                    // Check if it has child elements (structured data)
                    const children = Array.from(el.children);

                    if (children.length > 0) {
                        // Structured Object
                        const rowData: Record<string, string> = {};
                        if (lineId) {
                            rowData['LINE_ID'] = lineId;
                        }
                        if (authorityName) {
                            rowData['AUTHORITY_NAME'] = authorityName;
                        }
                        children.forEach(child => {
                            rowData[child.tagName] = child.textContent || '';
                        });
                        results.push(rowData);
                    } else {
                        // Simple Value
                        const rowData: Record<string, string> = {};
                        if (lineId) {
                            rowData['LINE_ID'] = lineId;
                        }
                        if (authorityName) {
                            rowData['AUTHORITY_NAME'] = authorityName;
                        }
                        rowData['Value'] = el.textContent || '';
                        results.push(rowData);
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
