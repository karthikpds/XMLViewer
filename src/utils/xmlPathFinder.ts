/**
 * Determines the XML path at a specific index in the content.
 * Returns the stack of tag names leading to the cursor.
 */
export function getPathAtIndex(xml: string, index: number): string[] | null {
    // Naive state machine to track hierarchy up to index
    const stack: string[] = [];
    // Regex to match:
    // 1. Comments: <!-- ... -->
    // 2. CDATA: <![CDATA[ ... ]]>
    // 3. Processing Instructions: <? ... ?>
    // 4. Tags: < ... >
    // Using non-capturing groups so the tag groups remain distinguishable
    let regex = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<(\/?)([\w:.-]+)([^>]*?)(\/?)>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
        // If the match starts AFTER the index, stop.
        if (match.index > index) {
            break;
        }

        // Check if it's a comment, CDATA, or PI (tag groups will be undefined)
        if (match[0].startsWith('<!--') || match[0].startsWith('<![CDATA[') || match[0].startsWith('<?')) {
            continue;
        }

        const isClosing = match[1] === '/';
        const tagName = match[2];
        const isSelfClosing = match[4] === '/';

        if (!tagName) continue; // Should be covered by matching groups check

        // Check if cursor is INSIDE this tag definition
        const tagEndIndex = match.index + match[0].length;

        if (match.index < index && index < tagEndIndex) {
            // Cursor is inside the tag definition <...>
            if (isClosing) return [...stack, tagName];
            return [...stack, tagName];
        }

        if (isClosing) {
            if (stack.length > 0) {
                const top = stack[stack.length - 1];
                // Robust matching: Check exact, case-insensitive, or local name (strip namespace)
                const topLocal = top.includes(':') ? top.split(':')[1] : top;
                const tagLocal = tagName.includes(':') ? tagName.split(':')[1] : tagName;

                if (top === tagName ||
                    top.toLowerCase() === tagName.toLowerCase() ||
                    topLocal === tagLocal) {
                    stack.pop();
                }
            }
        } else if (!isSelfClosing) {
            stack.push(tagName);
        }
    }

    return stack.length > 0 ? stack : null;
}
