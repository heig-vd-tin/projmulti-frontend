import Quill from 'quill'

// Image compatible avec les descriptions existantes (Quill 1 + quill-image-resize) :
// garde width/height/alt et le style d'alignement (display, float, margin) posé par l'ancien module.
const BaseImage = Quill.import('formats/image')
const ATTRIBUTES = ['alt', 'height', 'width', 'style']
const STYLE_PROPS = ['display', 'float', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']

function cleanStyle(node) {
  const parts = []
  for (const prop of STYLE_PROPS) {
    const v = node.style.getPropertyValue(prop)
    if (v) parts.push(`${prop}: ${v};`)
  }
  return parts.join(' ')
}

class CompatImage extends BaseImage {
  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attr) => {
      if (attr === 'style') {
        const style = cleanStyle(domNode)
        if (style) formats.style = style
      } else if (domNode.hasAttribute(attr)) {
        formats[attr] = domNode.getAttribute(attr)
      }
      return formats
    }, {})
  }

  format(name, value) {
    if (ATTRIBUTES.includes(name)) {
      if (value) this.domNode.setAttribute(name, value)
      else this.domNode.removeAttribute(name)
    } else {
      super.format(name, value)
    }
  }
}

let registered = false
export function setupQuill() {
  if (!registered) {
    Quill.register(CompatImage, true)
    registered = true
  }
  return Quill
}

// Styles d'alignement identiques à ceux de l'ancien module (contenus existants).
export const IMAGE_ALIGN_STYLES = {
  left: 'display: inline; float: left; margin: 0px 1em 1em 0px;',
  center: 'display: block; margin: auto;',
  right: 'display: inline; float: right; margin: 0px 0px 1em 1em;',
}

export const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block', 'link', 'image'],
  ['clean'],
]

// Libellés accessibles en français des boutons de la barre d'outils.
export const TOOLBAR_LABELS = {
  'ql-bold': 'Gras',
  'ql-italic': 'Italique',
  'ql-underline': 'Souligné',
  'ql-strike': 'Barré',
  'ql-script:sub': 'Indice',
  'ql-script:super': 'Exposant',
  'ql-list:ordered': 'Liste numérotée',
  'ql-list:bullet': 'Liste à puces',
  'ql-indent:-1': 'Diminuer le retrait',
  'ql-indent:+1': 'Augmenter le retrait',
  'ql-blockquote': 'Citation',
  'ql-code-block': 'Bloc de code',
  'ql-link': 'Lien',
  'ql-image': 'Insérer une image',
  'ql-clean': 'Effacer la mise en forme',
  'ql-header': 'Style de paragraphe',
  'ql-color': 'Couleur du texte',
  'ql-background': 'Couleur de fond',
  'ql-align': 'Alignement',
}
