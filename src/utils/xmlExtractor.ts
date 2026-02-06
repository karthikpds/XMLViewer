/**
 * Extracts values of all elements matching the given path hierarchy.
 */
export function extractValuesByPath(xml: string, path: string[]) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");

        if (doc.querySelector('parsererror')) {
            console.error("XML Parse Error");
            return [];
        }

        // Convert path stack to a loose selector or traverse
        // Since XML tag names can contain colons (namespaces), CSS selectors need escaping.
        // Or we can use a TreeWalker for robust matching.

        const results: { value: string; line?: number }[] = [];
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
                    results.push({
                        value: el.textContent || ''
                    });
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
