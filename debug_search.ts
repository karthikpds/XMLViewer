
import fs from 'fs';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';

const zipPath = 'log_csv.zip';
const query = 'erp_';

async function debugSearch() {
    if (!fs.existsSync(zipPath)) {
        console.error("Zip file not found");
        return;
    }

    const data = fs.readFileSync(zipPath);
    const zip = new JSZip();
    const contents = await zip.loadAsync(data);

    // Polyfill DOMParser
    const dom = new JSDOM("");
    const DOMParser = dom.window.DOMParser;
    const Node = dom.window.Node;
    const NodeFilter = dom.window.NodeFilter;

    for (const [filename, file] of Object.entries(contents.files)) {
        if (!filename.endsWith('.xml') || file.dir) continue;

        const content = await file.async('string');
        console.log(`\nAnalyzing ${filename} (${content.length} chars)...`);

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/xml");

        const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
        let currentNode = walker.nextNode();

        let lastRawIndex = 0;
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();

        let matchCount = 0;

        while (currentNode) {
            let isMatch = false;
            let matchTargetStr = "";
            let matchType = "";

            if (currentNode.nodeType === Node.ELEMENT_NODE) {
                const el = currentNode;
                const tagName = el.tagName.toLowerCase();

                if (tagName.includes(lowerQuery)) {
                    isMatch = true;
                    matchTargetStr = "<" + el.tagName;
                    matchType = "TAG";
                } else if (el.hasAttributes()) {
                    for (let i = 0; i < el.attributes.length; i++) {
                        const attr = el.attributes[i];
                        if (attr.name.toLowerCase().includes(lowerQuery)) {
                            isMatch = true;
                            matchTargetStr = attr.name;
                            matchType = "ATTR_NAME";
                            break;
                        } else if (attr.value.toLowerCase().includes(lowerQuery)) {
                            isMatch = true;
                            matchTargetStr = attr.value;
                            matchType = "ATTR_VALUE";
                            break;
                        }
                    }
                }
            } else if (currentNode.nodeType === Node.TEXT_NODE) {
                const val = currentNode.nodeValue;
                if (val && val.toLowerCase().includes(lowerQuery)) {
                    isMatch = true;
                    matchTargetStr = val;
                    matchType = "TEXT";
                }
            }

            if (isMatch) {
                matchCount++;
                const searchStr = matchTargetStr.toLowerCase() || lowerQuery;
                const foundIndex = lowerContent.indexOf(searchStr, lastRawIndex);

                let actualStartIndex = -1;
                let status = "FAIL";
                let matchedSnippet = "";

                if (foundIndex !== -1) {
                    const queryIndex = lowerContent.indexOf(lowerQuery, foundIndex);
                    if (queryIndex !== -1) {
                        actualStartIndex = queryIndex;
                        lastRawIndex = queryIndex + 1;
                        status = "OK";

                        // Verify
                        matchedSnippet = content.substring(actualStartIndex, actualStartIndex + query.length);
                    } else {
                        status = "QUERY_NOT_FOUND_IN_BLOCK";
                        lastRawIndex = foundIndex + 1;
                    }
                } else {
                    status = "BLOCK_NOT_FOUND";
                    // Fallback attempt
                    const fallbackIndex = lowerContent.indexOf(lowerQuery, lastRawIndex);
                    if (fallbackIndex !== -1) {
                        actualStartIndex = fallbackIndex;
                        lastRawIndex = fallbackIndex + 1;
                        status = "FALLBACK_OK";
                        matchedSnippet = content.substring(actualStartIndex, actualStartIndex + query.length);
                    }
                }

                console.log(`Match #${matchCount} [${matchType}]: target="${matchTargetStr.substring(0, 20)}..."`);
                console.log(`   -> Index: ${actualStartIndex}, Status: ${status}, snippet: "${matchedSnippet}"`);

                if (matchedSnippet.toLowerCase() !== lowerQuery) {
                    console.error("   !!! MISMATCH !!!");
                }
            }
            currentNode = walker.nextNode();
        }
    }
}

debugSearch().catch(console.error);
