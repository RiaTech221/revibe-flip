/**
 * Nettoyage HTML côté client par liste blanche stricte (protection XSS).
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
  'a', 'img', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'class', 'target', 'rel']);

export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  const doc = new DOMParser().parseFromString(dirtyHtml, 'text/html');

  const cleanNode = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          el.remove();
          continue;
        }
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value.trim();
          if (!ALLOWED_ATTRS.has(name) || name.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }
          if ((name === 'href' || name === 'src') && /^(javascript:|vbscript:|data:text\/html)/i.test(val)) {
            el.removeAttribute(attr.name);
          }
        }
        if (tag === 'a' && el.getAttribute('target') === '_blank') {
          el.setAttribute('rel', 'noopener noreferrer');
        }
        cleanNode(el);
      }
    }
  };

  cleanNode(doc.body);
  return doc.body.innerHTML;
}
