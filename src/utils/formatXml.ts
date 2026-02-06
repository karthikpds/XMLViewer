/**
 * Formats an XML string with 2-space indentation using DOM parsing.
 */
export function formatXml(xml: string): string {
    try {
        const PADDING = '  '; // 2 spaces
        // Basic pre-cleaning to ensure we don't have weird spacing issues from minified sources
        // But rely mainly on DOM traversal

        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');

        if (doc.querySelector('parsererror')) {
            console.warn("XML pretty print failed: parser error. Returning original.");
            return xml;
        }

        let formatted = '';

        function recurse(node: Node, level: number) {
            const indent = PADDING.repeat(level);

            // Element Node
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                const hasChildren = el.hasChildNodes();

                let openTag = `<${el.tagName}`;
                // Attributes
                if (el.hasAttributes()) {
                    for (let i = 0; i < el.attributes.length; i++) {
                        const attr = el.attributes[i];
                        openTag += ` ${attr.name}="${attr.value}"`;
                    }
                }

                // Check if it has only one text child (simple value) to keep inline
                let isSimple = false;
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                    const textVal = el.childNodes[0].nodeValue?.trim();
                    if (textVal && textVal.length < 60 && !textVal.includes('\n')) {
                        isSimple = true;
                    }
                }

                if (isSimple) {
                    const val = el.textContent || '';
                    formatted += `${indent}${openTag}>${val}</${el.tagName}>\n`;
                } else if (!hasChildren) {
                    // Self closing or empty? 
                    // XML serializers usually just output <Tag></Tag> or <Tag/>
                    // Let's stick to valid XML
                    formatted += `${indent}${openTag}/>\n`;
                } else {
                    formatted += `${indent}${openTag}>\n`;

                    // Children
                    for (let i = 0; i < el.childNodes.length; i++) {
                        recurse(el.childNodes[i], level + 1);
                    }

                    formatted += `${indent}</${el.tagName}>\n`;
                }
            }
            // Text Node
            else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue?.trim();
                if (text) {
                    formatted += `${indent}${text}\n`;
                }
            }
            // Comment Node
            else if (node.nodeType === Node.COMMENT_NODE) {
                formatted += `${indent}<!--${node.nodeValue}-->\n`;
            }
            // CDATA
            else if (node.nodeType === Node.CDATA_SECTION_NODE) {
                formatted += `${indent}<![CDATA[${node.nodeValue}]]>\n`;
            }
        }

        // Start recursion from document element
        if (doc.documentElement) {
            // Check for XML declaration ? DOMParser usually strips it from documentElement properties.
            // We can just output the clean XML.
            formatted += '<?xml version="1.0" encoding="UTF-8"?>\n';
            recurse(doc.documentElement, 0);
        }

        return formatted.trim();
    } catch (e) {
        console.error("Format XML failed", e);
        return xml;
    }
}
