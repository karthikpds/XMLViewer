/**
 * Determines the XML path at a specific index in the content.
 * Returns the stack of tag names leading to the cursor.
 */
export function getPathAtIndex(xml: string, index: number): string[] | null {
    // Naive state machine to track hierarchy up to index
    const stack: string[] = [];
    let regex = /<(\/?)([\w:.-]+)([^>]*?)(\/?)>/g;
    let match;

    // Limit search to substrings before index? 
    // Actually we need to walk the string up to the index to know the state.

    // Optimization: We only care about tags STARTING before the index.
    // But we must process them in order.

    while ((match = regex.exec(xml)) !== null) {
        // If the tag starts AFTER the index, stop. 
        // We might be "inside" this tag's content, so we should consider the previous state.
        if (match.index > index) {
            break;
        }

        const isClosing = match[1] === '/';
        const tagName = match[2];
        const isSelfClosing = match[4] === '/';

        // Check if cursor is INSIDE this tag definition
        const tagEndIndex = match.index + match[0].length;

        if (match.index < index && index < tagEndIndex) {
            // Cursor is inside the tag definition <...>
            // If it's a closing tag </foo>, we are technically in 'foo's parent scope effectively, 
            // but user probably wants to query 'foo'.
            // Let's assume selecting the tag name means "this tag".
            if (isClosing) return [...stack, tagName];
            return [...stack, tagName]; // Opening or Self-closing
        }

        if (isClosing) {
            if (stack.length > 0 && stack[stack.length - 1] === tagName) {
                stack.pop();
            }
        } else if (!isSelfClosing) {
            stack.push(tagName);
        }
    }

    return stack.length > 0 ? stack : null;
}
