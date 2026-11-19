import DOMPurify from 'dompurify'

// Les descriptions sont du HTML produit par Quill (images base64, attributs width, style
// d'alignement) : on garde la mise en forme mais on retire scripts et gestionnaires d'événements.
const VIDEO_HOSTS = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//

let hooked = false
function installHooks() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
    if (node.tagName === 'IFRAME' && !VIDEO_HOSTS.test(node.getAttribute('src') || '')) {
      node.remove()
    }
  })
}

export function sanitizeHtml(html) {
  if (!html) return ''
  installHooks()
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['target', 'allowfullscreen', 'frameborder'],
    ALLOW_DATA_ATTR: false,
  })
}

// Quill 2 (getSemanticHTML) remplace chaque espace par &nbsp;, ce qui empêche le retour à la
// ligne : on remet des espaces normales en gardant les suites d'espaces visibles.
export function restoreSpaces(html) {
  return html.replace(/(?:&nbsp;)+/g, (run) => {
    const n = run.length / 6
    return n === 1 ? ' ' : '&nbsp;'.repeat(n - 1) + ' '
  })
}

export function isEmptyHtml(html) {
  if (!html) return true
  if (/<(img|iframe|video)\b/i.test(html)) return false
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;|\s/g, '') === ''
}

export function byteSize(s) {
  return new Blob([s || '']).size
}
