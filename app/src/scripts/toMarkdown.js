// Adapted from https://gist.github.com/Youwotma/1762527
// No license provided in original, so assume license of this repo.

export default function toMarkdown(node) {

    var markdownEscape = (text) => {
        return text ? text.replace(/\s+/g, " ").replace(/[\\\-*_>#]/g, "\\$&") : '';
    }

    var repeat = (str, times) => {
        return (new Array(times+1)).join(str);
    }

    var childsToMarkdown = (tree, mode) => {
        var res = "";
        for (var i = 0, l = tree.childNodes.length; i < l; i++) {
            res += nodeToMarkdown(tree.childNodes[i], mode);
        }
        return res;
    }

    var nodeToMarkdown = (tree, mode) => {
        var nl = "\n\n";
        if (tree.nodeType == 3) { // Text node
            return markdownEscape(tree.nodeValue);
        }
        else if (tree.nodeType == 1) {
            if (mode == "block") {
                switch (tree.tagName.toLowerCase()) {
                    case "br":
                        return nl;
                    case "hr":
                        return nl + "---" + nl;
                    // Block container elements
                    case "p":
                    case "div":
                    case "section":
                    case "address":
                    case "center":
                        return nl + childsToMarkdown(tree, "block") + nl;
                    case "ul":
                        return nl + childsToMarkdown(tree, "u") + nl;
                    case "ol":
                        return nl + childsToMarkdown(tree, "o") + nl;
                    case "pre":
                        return nl + "    " + childsToMarkdown(tree, "inline") + nl;
                    case "code":
                        if (tree.childNodes.length == 1) {
                            break; // use the inline format
                        }
                        return nl + "    " + childsToMarkdown(tree, "inline") + nl;
                    case "h1":
                    case "h2":
                    case "h3":
                    case "h4":
                    case "h5":
                    case "h6":
                        return nl + repeat("#", +tree.tagName[1]) + "  " + childsToMarkdown(tree, "inline") + nl;
                    case "blockquote":
                        return nl + "> " + childsToMarkdown(tree, "inline") + nl;
                }
            }
            if (/^[ou]+$/.test(mode)) {
                if (tree.tagName == "LI") {
                    return "\n" + repeat("  ", mode.length - 1) + (mode[mode.length-1]=="o"?"1. ":"- ") + childsToMarkdown(tree, mode+"l");
                }
                else{
                    console.log("[toMarkdown] - invalid element at this point " + mode.tagName);
                    return childsToMarkdown(tree, "inline");
                }
            }
            else if (/^[ou]+l$/.test(mode)) {
                if (tree.tagName == "UL") {
                    return childsToMarkdown(tree,mode.substr(0,mode.length-1)+"u");
                }
                else if (tree.tagName == "OL") {
                    return childsToMarkdown(tree,mode.substr(0,mode.length-1)+"o");
                }
            }

            // Inline tags
            switch (tree.tagName.toLowerCase()) {
                case "strong":
                case "b":
                    return "**" + childsToMarkdown(tree,"inline") + "**";
                case "em":
                case "i":
                    return "_" + childsToMarkdown(tree,"inline") + "_";
                case "code": // Inline version of code
                    return "`" + childsToMarkdown(tree,"inline") + "`";
                case "a":
                    return "[" + childsToMarkdown(tree,"inline") + "](" + tree.getAttribute("href") + ")";
                case "img":
                    return nl + "![: " + markdownEscape(tree.getAttribute("alt")) + "](" + tree.getAttribute("src") + ")" + nl;
                case "script":
                case "style":
                case "meta":
                    return "";
                default:
                    console.log("[toMarkdown] - undefined element " + tree.tagName);
                    return childsToMarkdown(tree,mode);
            }
        }
    }

    return nodeToMarkdown(node, "block").replace(/[\n]{2,}/g,"\n\n").replace(/^[\n]+/,"").replace(/[\n]+$/,"");
}
